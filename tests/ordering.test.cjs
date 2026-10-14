const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const read = (name) => readFileSync(path.join(__dirname, "..", "js", name), "utf8").replaceAll("\r\n", "\n");
const ordering = vm.createContext({ Intl });
vm.runInContext(read("ordering.js").replaceAll("export ", ""), ordering);
const businessStatus = ordering.getBusinessHoursStatus;
const { ensureCustomerSession } = ordering;

test("Japan business hours include opening and exclude closing on all seven days", () => {
  for (let day = 12; day <= 18; day++) {
    const date = `2026-10-${day}`;
    const closingHour = day >= 17 ? 23 : 15;
    for (const [time, open] of [
      ["10:59:59", false], ["11:00:00", true],
      [`${closingHour - 1}:59:59`, true], [`${closingHour}:00:00`, false],
      ["23:59:59", false], ["00:00:00", false]
    ]) {
      assert.equal(businessStatus(Date.parse(`${date}T${time}+09:00`)).open, open, `${date} ${time}`);
    }
  }
  assert.equal(businessStatus(Date.parse("2026-10-12T02:00:00Z")).open, true);
});

test("existing queue limit and manual pause compose with business hours", () => {
  const source = read("store.js");
  const fn = source.slice(source.indexOf("export function getOrderingStatus"), source.indexOf("export function updateState("));
  const context = vm.createContext({ getBusinessHoursStatus: businessStatus, ORDER_QUEUE_LIMIT: 10 });
  vm.runInContext(fn.replace("export ", ""), context);
  const now = Date.parse("2026-10-12T12:00:00+09:00");
  const state = { orders: [], settings: {} };
  assert.equal(context.getOrderingStatus(state, now).paused, false);
  state.settings.orderingPausedUntil = now + 1000;
  assert.equal(context.getOrderingStatus(state, now).paused, true);
  assert.equal(context.getOrderingStatus(state, now + 1000).paused, false);
  state.settings.orderingPausedUntil = 0;
  state.orders = Array.from({ length: 10 }, () => ({ paid: false, status: "pending" }));
  assert.equal(context.getOrderingStatus(state, now).automaticallyPaused, true);
  state.orders[0].paid = true;
  assert.equal(context.getOrderingStatus(state, now).paused, false);
  assert.equal(context.getOrderingStatus(state, Date.parse("2026-10-12T15:00:00+09:00")).outsideBusinessHours, true);
});

test("customer sessions survive reload and rotate only after checkout", () => {
  const state = { sessions: [], orders: [] };
  const first = ensureCustomerSession(state, 3, "session-first", 1000);
  state.orders.push({ id: "order", table: 3, sessionId: first.sessionId, paid: false });
  const reload = ensureCustomerSession(state, 3, "session-unused", 700000);
  assert.equal(reload.sessionId, "session-first");
  assert.equal(state.orders[0].sessionId, "session-first");
  assert.equal(state.sessions.length, 1);

  state.orders[0].paid = true;
  reload.status = "Completed";
  reload.completedAt = "2026-10-12T02:00:00.000Z";
  const next = ensureCustomerSession(state, 3, "session-second", 800000);
  assert.equal(next.sessionId, "session-second");
  assert.equal(next.status, "Active");
  assert.equal(state.sessions.length, 2);
  assert.equal(state.sessions[0].status, "Completed");
});

test("customer session adopts legacy unpaid table orders", () => {
  const state = { orders: [{ id: "legacy", table: 3, paid: false }] };
  const session = ensureCustomerSession(state, 3, "session-migrated", 1000);
  assert.equal(session.sessionId, "session-migrated");
  assert.equal(state.orders[0].sessionId, "session-migrated");
});

test("order transaction rechecks the active session and business hours before changing stock", () => {
  const source = read("customer.js");
  const callback = source.split("await updateStateAsync((next) => {")[1].split("\n      });")[0];
  const order = { sessionId: "active", items: [{ itemId: 1, quantity: 1 }] };
  const context = vm.createContext({
    order, table: 3, customerSession: { sessionId: "active" }, BUSINESS_HOURS_LABEL: "hours", isOrderable: () => true,
    getCustomerOrderingStatus: () => ({ paused: false, outsideBusinessHours: false })
  });
  vm.runInContext(`function submit(next) { ${callback} }`, context);
  const state = { menu: [{ id: 1, stock: 2 }], orders: [], sessions: [{ table: 3, sessionId: "active", status: "Completed" }] };
  assert.throws(() => context.submit(state), /会計は完了/);
  assert.equal(state.menu[0].stock, 2);
  state.sessions[0].status = "Active";
  state.sessions[0].sessionId = "new-session";
  assert.throws(() => context.submit(state), /セッション/);
  assert.equal(state.menu[0].stock, 2);
  state.sessions[0].sessionId = "active";
  context.getCustomerOrderingStatus = () => ({ outsideBusinessHours: true });
  assert.throws(() => context.submit(state));
  context.getCustomerOrderingStatus = () => ({ paused: false });
  context.submit(state);
  assert.equal(state.menu[0].stock, 1);
  assert.equal(state.orders.length, 1);
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
      orders: [{ id: "order", items: [], sessionId: "session" }],
      sessions: [{ table: 3, sessionId: "session", status: "Active" }],
      payments: [],
      calls: []
    };
    const button = { disabled: false, addEventListener: (event, callback) => { handler = callback; } };
    const context = vm.createContext({
      Date, Error, completePayment: button, selectedTable: 3, subtotal: 100,
      orders: state.orders, state, sessionId: "session", makeId: () => "payment",
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
    assert.equal(state.sessions[0].status, fail ? "Active" : "Completed");
    assert.equal(receipts.length, fail ? 0 : 1);
    assert.equal(alerts.length, fail ? 1 : 0);
    assert.equal(vm.runInContext("paymentInProgress", context), false);
  }
});
