import { getState, updateState, updateStateAsync, subscribe, renderStaffShell, escapeHtml, money, makeId, formatTime, dateKey, todayDateInput, setPaperWidth, printDocument } from "./store.js";

renderStaffShell("register");
let selectedTable = 1;
let activeTab = "checkout";
let paymentInProgress = false;
const paperSelect = document.querySelector("#paper-width");
paperSelect.value = getState().settings.paperWidth || "80";
setPaperWidth(paperSelect.value);
todayDateInput(document.querySelector("#daily-date"));
todayDateInput(document.querySelector("#history-date"));

function tableOrders(state, table) {
  return state.orders.filter((order) => order.table === table && !order.paid);
}

function render(state = getState()) {
  renderCalls(state);
  renderTables(state);
  renderCheckout(state);
  renderDaily(state);
  renderHistory(state);
}

function renderCalls(state) {
  const calls = state.calls.filter((call) => !call.resolved);
  const root = document.querySelector("#register-calls");
  root.innerHTML = calls.length ? `<div class="panel-card"><strong>スタッフ呼び出し・お会計のお知らせ</strong><div class="d-flex flex-wrap gap-2 mt-2">${calls.map((call) => `<button class="btn btn-warning btn-sm" data-register-call="${escapeHtml(call.id)}">📣 テーブル ${call.table} ・ <span>${call.type === "checkout" ? "お会計に向かいます" : "スタッフ呼び出し"}</span> ・ ${formatTime(call.createdAt)}　対応済み</button>`).join("")}</div></div>` : "";
  root.querySelectorAll("[data-register-call]").forEach((button) => button.addEventListener("click", () => updateState((current) => {
    const call = current.calls.find((entry) => entry.id === button.dataset.registerCall);
    if (call) call.resolved = true;
  })));
}

function renderTables(state) {
  const root = document.querySelector("#table-picker");
  root.innerHTML = Array.from({ length: 40 }, (_, index) => {
    const table = index + 1;
    const count = tableOrders(state, table).length;
    const callCount = state.calls.filter((call) => call.table === table && !call.resolved).length;
    return `<button class="table-select ${table === selectedTable ? "active" : ""}" data-table="${table}">${callCount ? "📣 " : ""}${table}<small>${count ? `${count}件` : "空席"}</small></button>`;
  }).join("");
  root.querySelectorAll("[data-table]").forEach((button) => button.addEventListener("click", () => {
    selectedTable = Number(button.dataset.table);
    render(getState());
  }));
}

function renderCheckout(state) {
  const root = document.querySelector("#checkout-detail");
  const orders = tableOrders(state, selectedTable);
  const receipt = state.receipts[selectedTable];
  if (!orders.length) {
    root.innerHTML = `<div class="checkout-empty"><div><div style="font-size:2rem">🧾</div><strong>テーブル ${selectedTable}</strong><p class="mb-0 mt-2">未会計の注文はありません。</p>${receipt ? `<small>領収書宛名: ${escapeHtml(receipt.name)}</small>` : ""}</div></div>`;
    return;
  }
  const subtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);
  root.innerHTML = `<div class="panel-heading"><div><span class="eyebrow">CHECKOUT</span><h2>テーブル ${selectedTable}</h2></div><span class="badge text-bg-light">${orders.length}件の注文</span></div>${orders.map((order) => `<div class="checkout-line"><div><strong>${escapeHtml(order.items.map((item) => `${item.name} × ${item.quantity}`).join("、"))}</strong><small class="d-block muted">${formatTime(order.createdAt)} ・ ${escapeHtml({ pending: "受付済み", preparing: "調理中", ready: "できあがり", served: "提供済み" }[order.status] || order.status)}</small></div><strong>${money(order.subtotal)}</strong></div>`).join("")}<div class="discount-row"><span>割引</span><input id="discount-value" class="form-control" type="number" min="0" step="1" value="0"><select id="discount-mode" class="form-select" style="max-width:95px"><option value="yen">円</option><option value="percent">%</option></select><span class="muted">合計から値引き</span></div><div class="total-row"><span>お会計</span><strong id="checkout-total">${money(subtotal)}</strong></div><div id="cash-payment" class="cash-payment"><label for="cash-received" class="form-label">お預かり金額</label><input id="cash-received" class="form-control" type="number" min="0" step="1" value="${subtotal}"><div class="total-row"><span>お釣り</span><strong id="cash-change" aria-live="polite">${money(0)}</strong></div><p id="cash-shortage" class="feedback mb-0" role="status"></p></div><div class="payment-row"><select id="payment-method" class="form-select"><option value="現金">現金</option><option value="PayPay">PayPay</option><option value="クレジット">クレジット</option></select><button id="complete-payment" class="btn btn-primary">会計を完了</button></div>${receipt ? `<p class="feedback mt-3 mb-0">領収書宛名: ${escapeHtml(receipt.name)}</p>` : ""}`;
  const discountValue = root.querySelector("#discount-value");
  const discountMode = root.querySelector("#discount-mode");
  const paymentMethod = root.querySelector("#payment-method");
  const cashPayment = root.querySelector("#cash-payment");
  const cashReceived = root.querySelector("#cash-received");
  const completePayment = root.querySelector("#complete-payment");
  const calculate = () => {
    const raw = Math.max(0, Number(discountValue.value) || 0);
    const discount = Math.min(subtotal, discountMode.value === "percent" ? Math.floor(subtotal * Math.min(raw, 100) / 100) : Math.floor(raw));
    const total = subtotal - discount;
    root.querySelector("#checkout-total").textContent = money(total);
    const isCash = paymentMethod.value === "現金";
    cashPayment.classList.toggle("d-none", !isCash);
    const received = Number(cashReceived.value);
    const insufficientCash = isCash && (!Number.isInteger(received) || received < total);
    root.querySelector("#cash-change").textContent = insufficientCash ? "—" : money(received - total);
    root.querySelector("#cash-shortage").textContent = insufficientCash && Number.isInteger(received)
      ? `あと ${money(total - received)} 不足しています。`
      : "";
    completePayment.disabled = insufficientCash || paymentInProgress;
    return discount;
  };
  discountValue.addEventListener("input", calculate);
  discountMode.addEventListener("change", calculate);
  cashReceived.addEventListener("input", calculate);
  paymentMethod.addEventListener("change", calculate);
  calculate();
  completePayment.addEventListener("click", async () => {
    const discount = calculate();
    if (completePayment.disabled) return;
    const method = root.querySelector("#payment-method").value;
    const paidAt = new Date().toISOString();
    const payment = {
      id: makeId("payment"),
      table: selectedTable,
      paidAt,
      subtotal,
      discount,
      total: subtotal - discount,
      method,
      receiptName: state.receipts[selectedTable]?.name || "",
      orders: orders.map((order) => order.id),
      items: orders.flatMap((order) => order.items.map((item) => ({ ...item })))
    };
    paymentInProgress = true;
    completePayment.disabled = true;
    try {
      await updateStateAsync((current) => {
        for (const id of payment.orders) {
          const order = current.orders.find((entry) => entry.id === id && entry.table === payment.table);
          if (!order || order.paid) throw new Error("注文状態が更新されました。テーブルを選び直してください。");
          order.paid = true;
          order.paidAt = paidAt;
        }
        current.payments.unshift(payment);
        current.calls.forEach((call) => { if (call.table === payment.table) call.resolved = true; });
      });
    } catch (error) {
      console.error("Could not complete payment.", error);
      window.alert(error instanceof Error ? error.message : "会計を保存できませんでした。通信状況を確認してください。");
      return;
    } finally {
      paymentInProgress = false;
      render(getState());
    }
    showReceipt(payment);
  });
}

function showReceipt(payment, mode = "receipt") {
  const isInvoice = mode === "invoice";
  const receiptRoot = document.querySelector("#receipt-modal .modal-content");
  const heading = isInvoice ? "領収書" : mode === "reprint" ? "レシート再印刷" : "お会計完了";
  const nameBlock = isInvoice
    ? `<div class="mt-2 fs-5"><span id="invoice-name">${escapeHtml(payment.receiptName || "　　　　　　")}</span> 様</div><div class="fw-bold">領収書</div>`
    : payment.receiptName ? `<div class="mt-2">${escapeHtml(payment.receiptName)} 様</div><div>領収書</div>` : "";
  receiptRoot.innerHTML = `<div class="modal-header"><h2 class="modal-title fs-5">${heading}</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button></div><div class="modal-body receipt-layout" id="receipt-paper"><div class="text-center"><strong>ajimaru</strong><div class="muted">テーブル ${payment.table} ・ ${formatTime(payment.paidAt)}</div>${nameBlock}</div>${payment.items.map((item) => `<div class="checkout-line"><span>${escapeHtml(item.name)} × ${item.quantity}</span><span>${money(item.unitPrice * item.quantity)}</span></div>`).join("")}<div class="checkout-line"><span>小計</span><strong>${money(payment.subtotal)}</strong></div><div class="checkout-line"><span>割引</span><span>−${money(payment.discount)}</span></div><div class="total-row"><span>合計</span><strong>${money(payment.total)}</strong></div>${isInvoice ? `<div class="text-center mt-3">但し お飲食代として<br>上記正に領収いたしました</div>` : ""}<div class="text-center muted mt-3">${escapeHtml(payment.method)} ・ ${dateKey(payment.paidAt)}</div></div><div class="modal-footer"><button class="btn btn-outline-dark" data-bs-dismiss="modal">閉じる</button><button id="print-receipt" class="btn btn-primary">${isInvoice ? "領収書を印刷" : "レシートを印刷"}</button></div>`;
  const modal = new bootstrap.Modal(document.querySelector("#receipt-modal"));
  if (isInvoice) {
    const field = document.createElement("div");
    field.className = "px-3 pt-3 no-print";
    field.innerHTML = `<label class="form-label small">宛名（領収書に記載）</label><input id="invoice-input" class="form-control" value="${escapeHtml(payment.receiptName || "")}" placeholder="例: 株式会社〇〇">`;
    receiptRoot.querySelector(".modal-header").after(field);
    field.querySelector("input").addEventListener("input", (event) => {
      receiptRoot.querySelector("#invoice-name").textContent = event.target.value.trim() || "　　　　　　";
    });
    field.querySelector("input").addEventListener("change", (event) => {
      const name = event.target.value.trim();
      updateState((current) => { const target = current.payments.find((entry) => entry.id === payment.id); if (target) target.receiptName = name; });
    });
  }
  modal.show();
  receiptRoot.querySelector("#print-receipt").addEventListener("click", () => {
    setPaperWidth(paperSelect.value);
    printDocument();
  });
}

function renderDaily(state) {
  const key = document.querySelector("#daily-date").value || dateKey();
  const payments = state.payments.filter((payment) => dateKey(payment.paidAt) === key);
  const sales = payments.reduce((sum, payment) => sum + payment.total, 0);
  const discounts = payments.reduce((sum, payment) => sum + payment.discount, 0);
  const orderCount = payments.reduce((sum, payment) => sum + payment.orders.length, 0);
  document.querySelector("#daily-summary").innerHTML = `<div class="summary-cards register-daily-grid"><div class="summary-card"><span>売上</span><strong>${money(sales)}</strong></div><div class="summary-card"><span>会計件数</span><strong>${payments.length} 件</strong></div><div class="summary-card"><span>注文品数</span><strong>${orderCount} 点</strong></div><div class="summary-card"><span>割引</span><strong>${money(discounts)}</strong></div></div><div class="panel-card"><strong>支払方法別</strong><div class="mt-2">${["現金", "PayPay", "クレジット"].map((method) => `<div class="checkout-line"><span>${method}</span><strong>${money(payments.filter((payment) => payment.method === method).reduce((sum, payment) => sum + payment.total, 0))}</strong></div>`).join("")}</div></div>`;
}

function renderHistory(state) {
  const key = document.querySelector("#history-date").value || dateKey();
  const payments = state.payments.filter((payment) => dateKey(payment.paidAt) === key);
  const methods = ["現金", "PayPay", "クレジット"];
  const historyRoot = document.querySelector("#payment-history");
  historyRoot.innerHTML = payments.length ? payments.map((payment) => `<div class="history-row flex-wrap gap-2"><div><strong>テーブル ${payment.table} ・ ${escapeHtml(payment.method)}</strong><small>${formatTime(payment.paidAt)}${payment.receiptName ? ` ・ 宛名 ${escapeHtml(payment.receiptName)}` : ""}</small></div><strong class="ms-auto">${money(payment.total)}</strong><div class="d-flex flex-wrap gap-1 w-100"><button class="btn btn-sm btn-outline-dark" data-reprint="${escapeHtml(payment.id)}">再印刷</button><button class="btn btn-sm btn-outline-dark" data-invoice="${escapeHtml(payment.id)}">領収書印刷</button><select class="form-select form-select-sm" style="width:auto" data-method-for="${escapeHtml(payment.id)}">${methods.map((method) => `<option value="${method}"${method === payment.method ? " selected" : ""}>${method}</option>`).join("")}</select><button class="btn btn-sm btn-outline-primary" data-change-method="${escapeHtml(payment.id)}">支払方法を変更</button></div></div>`).join("") : `<p class="muted mb-0">この日の会計履歴はありません。</p>`;
  const find = (id) => getState().payments.find((payment) => payment.id === id);
  historyRoot.querySelectorAll("[data-reprint]").forEach((button) => button.addEventListener("click", () => showReceipt(find(button.dataset.reprint), "reprint")));
  historyRoot.querySelectorAll("[data-invoice]").forEach((button) => button.addEventListener("click", () => {
    const payment = find(button.dataset.invoice);
    if (!payment) return;
    showReceipt(payment, "invoice");
  }));
  historyRoot.querySelectorAll("[data-change-method]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.changeMethod;
    const method = historyRoot.querySelector(`[data-method-for="${id}"]`).value;
    updateState((current) => { const target = current.payments.find((entry) => entry.id === id); if (target) target.method = method; });
  }));
}

document.querySelectorAll("[data-register-tab]").forEach((button) => button.addEventListener("click", () => {
  activeTab = button.dataset.registerTab;
  document.querySelectorAll("[data-register-tab]").forEach((tab) => tab.classList.toggle("active", tab === button));
  document.querySelector("#checkout-pane").classList.toggle("d-none", activeTab !== "checkout");
  document.querySelector("#daily-pane").classList.toggle("d-none", activeTab !== "daily");
  document.querySelector("#history-pane").classList.toggle("d-none", activeTab !== "history");
}));
document.querySelector("#daily-date").addEventListener("change", () => renderDaily(getState()));
document.querySelector("#history-date").addEventListener("change", () => renderHistory(getState()));
paperSelect.addEventListener("change", () => setPaperWidth(paperSelect.value));
subscribe(render);
render();
