import { getState, getOrderingStatus, updateState, subscribe, renderStaffShell, escapeHtml, money, formatTime, makeId, printDocument, ORDER_PAUSE_DURATION_MS } from "./store.js";

renderStaffShell("kitchen");
const root = document.querySelector("#kitchen-orders");
let soundEnabled = getState().settings.sound;
let autoPrintEnabled = getState().settings.kitchenAutoPrint !== false;
const knownOrderIds = new Set(getState().orders.map((order) => order.id));
const soundToggle = document.querySelector("#sound-toggle");
soundToggle.checked = soundEnabled;
const autoPrintToggle = document.querySelector("#auto-print-toggle");
autoPrintToggle.checked = autoPrintEnabled;

function playTone() {
  if (!soundEnabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 740;
  gain.gain.value = 0.12;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.18);
  oscillator.onended = () => context.close();
}

function renderOrderingControls(state = getState()) {
  const status = getOrderingStatus(state);
  const summary = document.querySelector("#ordering-status-summary");
  const button = document.querySelector("#toggle-order-pause");
  if (status.automaticallyPaused) {
    summary.textContent = "自動停止中：注文数が上限に達しました（10件以上）。";
    button.textContent = "混雑のため自動停止中";
    button.disabled = true;
  } else if (status.manuallyPaused) {
    const seconds = Math.ceil((status.manualPauseUntil - Date.now()) / 1000);
    const remaining = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    summary.innerHTML = `注文受付を一時停止中です。<span>再開まで <strong>${remaining}</strong></span>`;
    button.textContent = "注文受付を再開";
    button.disabled = false;
  } else {
    summary.textContent = "注文受付中です。10件以上になると注文受付が自動停止します。";
    button.textContent = "5分間注文停止";
    button.disabled = false;
  }
}

function render(state = getState()) {
  const orders = state.orders.filter((order) => !order.paid && order.status !== "served");
  const calls = state.calls.filter((call) => !call.resolved);
  document.querySelector("#kds-count").textContent = `${orders.length} 件の注文${calls.length ? ` ・ 📣 呼び出し ${calls.length} 件` : ""}`;
  renderOrderingControls(state);
  root.innerHTML = orders.length ? orders.map((order) => `<article class="kitchen-ticket ${order.status}"><div class="ticket-top"><div><h2>テーブル ${order.table}</h2><span class="ticket-time">${formatTime(order.createdAt)} ・ ${escapeHtml({ pending: "受付", preparing: "調理中", ready: "できあがり" }[order.status] || order.status)}</span></div><button class="btn btn-sm btn-outline-dark print-ticket" data-print="${escapeHtml(order.id)}">印刷</button></div><div class="ticket-items">${order.items.map((item) => `<div class="ticket-item"><div><strong>${escapeHtml(item.name)}</strong>${item.optionLabel ? `<span class="ticket-note">${escapeHtml(item.optionLabel)}</span>` : ""}</div><strong>× ${item.quantity}</strong></div>`).join("")}${order.note ? `<p class="ticket-note mt-2 mb-0">メモ: ${escapeHtml(order.note)}</p>` : ""}</div><div class="ticket-actions">${order.status === "pending" ? `<button class="btn btn-primary" data-status="preparing" data-id="${escapeHtml(order.id)}">調理開始</button>` : ""}${order.status === "preparing" ? `<button class="btn btn-primary" data-status="ready" data-id="${escapeHtml(order.id)}">できあがり</button>` : ""}${order.status === "ready" ? `<button class="btn btn-success" data-status="served" data-id="${escapeHtml(order.id)}">提供済みにする</button>` : ""}<button class="btn btn-warning" data-call-order="${escapeHtml(order.id)}">📣 お客様を呼ぶ（声）</button></div></article>`).join("") : `<div class="no-orders">キッチンに注文はありません。</div>`;
  root.querySelectorAll("[data-call-order]").forEach((button) => button.addEventListener("click", () => {
    const order = getState().orders.find((entry) => entry.id === button.dataset.callOrder);
    if (!order) return;
    const message = `テーブル ${order.table}、料理が完了しました。カウンターまでお越しください。よろしくお願いいたします。`;
    speakJa(message);
    updateState((current) => current.announcements.push({
      id: makeId("announcement"),
      table: order.table,
      orderId: order.id,
      message,
      createdAt: new Date().toISOString()
    }));
    button.textContent = "✅ 呼び出しました";
    setTimeout(() => { button.textContent = "📣 お客様を呼ぶ（声）"; }, 2500);
  }));
  root.querySelectorAll("[data-status]").forEach((button) => button.addEventListener("click", () => {
    const order = getState().orders.find((entry) => entry.id === button.dataset.id);
    if (button.dataset.status === "ready" && order) {
      speakJa(`テーブル ${order.table}、料理が完了しました。カウンターまでお越しください。`);
    }
    updateState((current) => {
      const order = current.orders.find((entry) => entry.id === button.dataset.id);
      if (order) order.status = button.dataset.status;
    });
  }));
  root.querySelectorAll("[data-print]").forEach((button) => button.addEventListener("click", () => printOrder(button.dataset.print)));
  renderCalls(calls);
}

function renderCalls(calls) {
  const old = document.querySelector("#staff-calls");
  if (old) old.remove();
  if (!calls.length) return;
  const container = document.createElement("section");
  container.id = "staff-calls";
  container.className = "panel-card mb-3";
  container.innerHTML = `<strong>スタッフ呼び出し</strong><div class="d-flex flex-column gap-2 mt-2">${calls.map((call) => `<div class="d-flex flex-wrap gap-2"><button class="btn btn-warning btn-sm" data-resolve-call="${escapeHtml(call.id)}">テーブル ${call.table} ・ ${formatTime(call.createdAt)}　対応済み</button><button class="btn btn-outline-dark btn-sm" data-voice-call="${call.table}">📣 カウンターへ呼ぶ（声）</button></div>`).join("")}</div>`;
  document.querySelector(".staff-content").insertBefore(container, document.querySelector(".kds-toolbar"));
  container.querySelectorAll("[data-voice-call]").forEach((button) => button.addEventListener("click", () => {
    const table = Number(button.dataset.voiceCall);
    const message = `テーブル ${table}、カウンターまでお越しください。よろしくお願いいたします。`;
    speakJa(message);
    updateState((state) => state.announcements.push({
      id: makeId("announcement"),
      table,
      message,
      createdAt: new Date().toISOString()
    }));
    button.textContent = "✅ 呼び出しました";
  }));
  container.querySelectorAll("[data-resolve-call]").forEach((button) => button.addEventListener("click", () => updateState((state) => {
    const call = state.calls.find((entry) => entry.id === button.dataset.resolveCall);
    if (call) call.resolved = true;
  })));
}

function printOrder(orderId) {
  const order = getState().orders.find((entry) => entry.id === orderId);
  if (!order) return;
  document.documentElement.style.setProperty("--receipt-width", `${getState().settings.paperWidth || 80}mm`);
  const printRoot = document.createElement("div");
  printRoot.className = "print-only";
  printRoot.innerHTML = order.items.flatMap((item) => Array.from({ length: item.quantity }, () => `<section class="kitchen-ticket print-ticket-page"><div class="ticket-top"><div><h2>テーブル ${order.table}</h2><span>${formatTime(order.createdAt)}</span></div></div><div class="ticket-items"><div class="ticket-item"><strong>${escapeHtml(item.name)}</strong>${item.optionLabel ? `<span class="ticket-note">${escapeHtml(item.optionLabel)}</span>` : ""}</div></div>${order.note ? `<p>メモ: ${escapeHtml(order.note)}</p>` : ""}</section>`)).join("");
  document.body.append(printRoot);
  printDocument();
  printRoot.remove();
}

subscribe((state) => {
  const newOrders = state.orders.filter((order) => !knownOrderIds.has(order.id));
  newOrders.forEach((order) => knownOrderIds.add(order.id));
  if (newOrders.length) {
    playTone();
    if (soundEnabled && "speechSynthesis" in window) {
      newOrders.forEach((order) => {
        const items = order.items.map((item) => `${item.name} ${item.quantity}`).join("、");
        const utterance = new SpeechSynthesisUtterance(`テーブル ${order.table}、${items}`);
        utterance.lang = "ja-JP";
        window.speechSynthesis.speak(utterance);
      });
    }
    if (autoPrintEnabled) {
      newOrders.forEach((order) => {
        let shouldPrint = false;
        updateState((current) => {
          current.printedKitchenOrderIds ||= [];
          if (!current.printedKitchenOrderIds.includes(order.id)) {
            current.printedKitchenOrderIds.push(order.id);
            shouldPrint = true;
          }
        });
        if (shouldPrint) printOrder(order.id);
      });
    }
  }
  render(state);
});
render();
window.setInterval(() => renderOrderingControls(), 1000);
document.querySelector("#toggle-order-pause").addEventListener("click", () => {
  updateState((state) => {
    const status = getOrderingStatus(state);
    if (status.automaticallyPaused) return;
    state.settings.orderingPausedUntil = status.manuallyPaused ? 0 : Date.now() + ORDER_PAUSE_DURATION_MS;
  });
});
document.querySelector("#enable-sound").addEventListener("click", async () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (AudioContextClass) {
    const context = new AudioContextClass();
    await context.resume();
    await context.close();
  }
  soundEnabled = true;
  soundToggle.checked = true;
  updateState((state) => { state.settings.sound = true; });
});
soundToggle.addEventListener("change", () => {
  soundEnabled = soundToggle.checked;
  updateState((state) => { state.settings.sound = soundEnabled; });
});
autoPrintToggle.addEventListener("change", () => {
  autoPrintEnabled = autoPrintToggle.checked;
  updateState((state) => { state.settings.kitchenAutoPrint = autoPrintEnabled; });
});
document.querySelector("#announce-welcome").addEventListener("click", () => setAnnouncement("いらっしゃいませ。ごゆっくりお楽しみください。"));
document.querySelector("#announce-thanks").addEventListener("click", () => setAnnouncement("ありがとうございました。またお越しください。"));
document.querySelector("#call-customer").addEventListener("click", () => {
  const tableNo = document.querySelector("#call-table").value.trim();
  if (!tableNo) return;
  setAnnouncement(`テーブル ${tableNo}、料理完了しました。カウンターまでお越しください。`, tableNo);
});
// iPad Safari needs speak() called synchronously in the tap and an explicit ja voice
function speakJa(message) {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  synth.resume();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = "ja-JP";
  const voice = synth.getVoices().find((v) => v.lang && v.lang.replace("_", "-").startsWith("ja"));
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}
function setAnnouncement(message, tableNo) {
  speakJa(message);
  updateState((state) => state.announcements.push({ id: makeId("announcement"), message, ...(tableNo ? { table: Number(tableNo) || tableNo } : {}), createdAt: new Date().toISOString() }));
}
