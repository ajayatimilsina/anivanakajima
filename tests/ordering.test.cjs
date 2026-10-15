const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const read = (name) => readFileSync(path.join(__dirname, "..", "js", name), "utf8").replaceAll("\r\n", "\n");

test("manual pause and queue limit control ordering regardless of time", () => {
  const source = read("store.js");
  const fn = source.slice(source.indexOf("export function getOrderingStatus"), source.indexOf("export function updateState("));
  const context = vm.createContext({ ORDER_QUEUE_LIMIT: 10 });
  vm.runInContext(fn.replace("export ", ""), context);
  const state = { orders: [], settings: {} };
  for (const time of ["2026-10-12T02:00:00Z", "2026-10-12T12:00:00+09:00", "2026-10-12T23:30:00+09:00"]) {
    const status = context.getOrderingStatus(state, Date.parse(time));
    assert.equal(status.paused, false, time);
    assert.equal("outsideBusinessHours" in status, false);
  }
  const now = Date.parse("2026-10-12T12:00:00+09:00");
  state.settings.orderingPausedUntil = now + 1000;
  assert.equal(context.getOrderingStatus(state, now).paused, true);
  assert.equal(context.getOrderingStatus(state, now + 1000).paused, false);
  state.settings.orderingPausedUntil = 0;
  state.orders = Array.from({ length: 10 }, () => ({ paid: false, status: "pending" }));
  assert.equal(context.getOrderingStatus(state, now).automaticallyPaused, true);
  state.orders[0].paid = true;
  assert.equal(context.getOrderingStatus(state, now).paused, false);
});

test("legacy session fields are discarded when shared data is normalized", () => {
  const source = read("store.js");
  const normalize = source.slice(source.indexOf("function normalizeState"), source.indexOf("\nasync function connectRemote"));
  const context = vm.createContext({ initialState: () => ({}) });
  vm.runInContext(`${normalize}\nthis.normalizeState = normalizeState;`, context);
  const state = context.normalizeState({
    version: 1,
    menu: [],
    orders: [{ table: 6, sessionId: "old-session", items: [] }],
    sessions: [{ table: 6, sessionId: "old-session", status: "Active" }],
    payments: [{ table: 6, sessionId: "old-session", items: [], orders: [] }]
  });
  assert.equal("sessions" in state, false);
  assert.equal("sessionId" in state.orders[0], false);
  assert.equal("sessionId" in state.payments[0], false);
});

test("orders are submitted per table and still respect ordering pauses", () => {
  const source = read("customer.js");
  const callback = source.split("await updateStateAsync((next) => {")[1].split("\n      });")[0];
  const order = { table: 3, items: [{ itemId: 1, quantity: 1 }] };
  let paused = false;
  const context = vm.createContext({
    order, table: 3, isOrderable: () => true,
    getOrderingStatus: () => ({ paused })
  });
  vm.runInContext(`function submit(next) { ${callback} }`, context);
  const state = { menu: [{ id: 1, stock: 2 }], orders: [] };
  paused = true;
  assert.throws(() => context.submit(state), /一時停止/);
  assert.equal(state.menu[0].stock, 2);
  paused = false;
  context.submit(state);
  assert.equal(state.menu[0].stock, 1);
  assert.equal(state.orders.length, 1);
  assert.equal(state.orders[0].table, 3);
  assert.equal("sessionId" in state.orders[0], false);
});

test("kitchen deduplicates committed payments, waits ten seconds, and speaks twice one second apart", () => {
  const source = read("kitchen.js");
  const audio = source.slice(source.indexOf("function playNextPaymentNotification"), source.indexOf("\nrender();\nwindow.setInterval"));
  const spoken = [], timers = [];
  let now = 0;
  class FakeDate extends Date {
    static now() { return now; }
  }
  let subscriber;
  const context = vm.createContext({
    console, Date: FakeDate, SpeechSynthesisUtterance: function (text) { this.text = text; },
    window: {
      speechSynthesis: { getVoices: () => [], resume() {}, speak: (utterance) => spoken.push(utterance) },
      setTimeout: (callback, delay) => { timers.push({ callback, delay }); return timers.length; },
      alert: () => assert.fail("Unexpected speech error")
    },
    subscribe: (callback) => { subscriber = callback; }, render() {}
  });
  vm.runInContext(`
    let soundEnabled = true, paymentAudioBusy = false, paymentAudioTimer = null;
    const paymentAudioQueue = [], knownPaymentIds = new Set(["old"]), knownOrderIds = new Set();
    ${audio}
  `, context);
  const old = { id: "old", paidAt: "2026-10-12T02:00:00Z" };
  const first = { id: "first", paidAt: "2026-10-12T02:01:00Z" };
  const second = { id: "second", paidAt: "2026-10-12T02:02:00Z" };
  subscriber({ payments: [second, first, old], orders: [] });
  assert.equal(spoken.length, 0);
  assert.equal(timers[0].delay, 10000);
  now += 10000;
  timers.shift().callback();
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].text, "\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3057\u305f\u3002");
  subscriber({ payments: [second, first, old], orders: [] });
  assert.equal(spoken.length, 1);
  spoken[0].onend();
  assert.equal(timers[0].delay, 1000);
  now += 1000;
  timers.shift().callback();
  assert.equal(spoken.length, 2);
  assert.equal(spoken[1].text, spoken[0].text);
  spoken[1].onend();
  assert.equal(spoken.length, 2);
  assert.equal(timers[0].delay, 0);
});

test("checkout waits for persistence, blocks repeat clicks, and reports save failure", async () => {
  const source = read("register.js");
  const listener = source.slice(source.indexOf('  completePayment.addEventListener("click", async'), source.indexOf("\n}\n\nfunction showReceipt"));
  for (const fail of [false, true]) {
    let handler, resolveSave, rejectSave;
    const save = new Promise((resolve, reject) => { resolveSave = resolve; rejectSave = reject; });
    const receipts = [], alerts = [];
    const state = {
      receipts: {},
      orders: [{ id: "order", table: 3, items: [] }],
      payments: [],
      calls: []
    };
    const button = { disabled: false, addEventListener: (event, callback) => { handler = callback; } };
    const context = vm.createContext({
      Date, Error, completePayment: button, selectedTable: 3, subtotal: 100,
      orders: state.orders, state, makeId: () => "payment",
      root: { querySelector: () => ({ value: "PayPay" }) },
      calculate: () => { button.disabled = vm.runInContext("paymentInProgress", context); return 0; },
      updateStateAsync: async (mutator) => { await save; mutator(state); },
      render() {}, getState: () => state, showReceipt: (payment) => receipts.push(payment),
      window: { alert: (message) => alerts.push(message) }, console: { error() {} }
    });
    vm.runInContext(`let paymentInProgress = false; ${listener}`, context);
    const pending = handler();
    assert.equal(receipts.length, 0);
    await handler();
    assert.equal(state.payments.length, 0);
    if (fail) rejectSave(new Error("save failed")); else resolveSave();
    await pending;
    assert.equal(state.payments.length, fail ? 0 : 1);
    assert.equal(state.orders[0].paid === true, !fail);
    if (!fail) assert.equal("sessionId" in state.payments[0], false);
    assert.equal(receipts.length, fail ? 0 : 1);
    assert.equal(alerts.length, fail ? 1 : 0);
    assert.equal(vm.runInContext("paymentInProgress", context), false);
  }
});
