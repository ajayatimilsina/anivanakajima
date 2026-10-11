import { getState, updateState, subscribe, renderStaffShell, escapeHtml, money, makeId, dateKey, todayDateInput } from "./store.js";

renderStaffShell("finance");
const expenseEditor = new bootstrap.Modal(document.querySelector("#expense-editor"));
const dateInput = document.querySelector("#finance-date");
todayDateInput(dateInput);

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function render(state = getState()) {
  renderSummary(state);
  renderChart(state);
  renderExpenses(state);
}

function renderSummary(state) {
  const isMonthly = document.querySelector("#finance-period").value === "month";
  const selected = new Date(`${dateInput.value || dateKey()}T12:00:00`);
  const key = isMonthly ? monthKey(selected) : dateKey(selected);
  const sales = state.payments.filter((payment) => (isMonthly ? monthKey(new Date(payment.paidAt)) : dateKey(payment.paidAt)) === key);
  const expenses = state.expenses.filter((expense) => (isMonthly ? expense.date.slice(0, 7) : expense.date) === key);
  const revenue = sales.reduce((sum, payment) => sum + payment.total, 0);
  const spent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const costByCategory = ["経費", "人件費", "その他"].map((category) => [category, expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0)]);
  document.querySelector("#finance-summary").innerHTML = `<div class="summary-card"><span>${isMonthly ? "月間売上" : "日次売上"}</span><strong>${money(revenue)}</strong></div><div class="summary-card"><span>支出合計</span><strong>${money(spent)}</strong></div><div class="summary-card"><span>差引損益</span><strong>${money(revenue - spent)}</strong></div><div class="summary-card"><span>会計件数 / 人件費</span><strong>${sales.length} 件 / ${money(costByCategory.find(([name]) => name === "人件費")[1])}</strong></div>`;
}

function renderChart(state) {
  const monthly = document.querySelector("#finance-period").value === "month";
  const anchor = new Date(`${dateInput.value || dateKey()}T12:00:00`);
  const buckets = Array.from({ length: monthly ? 12 : 7 }, (_, index) => {
    const date = new Date(anchor);
    if (monthly) date.setMonth(anchor.getMonth() - (11 - index), 1);
    else date.setDate(anchor.getDate() - (6 - index));
    return { date, key: monthly ? monthKey(date) : dateKey(date), label: monthly ? `${date.getMonth() + 1}月` : `${date.getMonth() + 1}/${date.getDate()}` };
  });
  const values = buckets.map((bucket) => {
    const revenue = state.payments.filter((payment) => (monthly ? monthKey(new Date(payment.paidAt)) : dateKey(payment.paidAt)) === bucket.key).reduce((sum, payment) => sum + payment.total, 0);
    const expense = state.expenses.filter((entry) => (monthly ? entry.date.slice(0, 7) : entry.date) === bucket.key).reduce((sum, entry) => sum + entry.amount, 0);
    return { ...bucket, revenue, expense };
  });
  const maximum = Math.max(1, ...values.flatMap((value) => [value.revenue, value.expense]));
  document.querySelector("#finance-chart").innerHTML = `<div class="chart-plot">${values.map((value) => `<div class="chart-column"><div class="chart-bars"><div class="chart-bar" title="売上 ${money(value.revenue)}" style="height:${value.revenue / maximum * 100}%"></div><div class="chart-bar expense" title="支出 ${money(value.expense)}" style="height:${value.expense / maximum * 100}%"></div></div><span>${value.label}</span></div>`).join("")}</div><div class="chart-legend"><span><i class="legend-dot"></i>売上</span><span><i class="legend-dot expense"></i>支出</span></div><div class="visually-hidden">${values.map((value) => `${value.label}: 売上 ${money(value.revenue)}, 支出 ${money(value.expense)}`).join(" / ")}</div>`;
}

function renderExpenses(state) {
  const expenses = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  document.querySelector("#expense-list").innerHTML = expenses.length ? expenses.map((expense) => `<div class="expense-row"><div><strong>${escapeHtml(expense.name)}</strong><small>${escapeHtml(expense.category)} ・ ${escapeHtml(expense.date)}</small></div><strong>${money(expense.amount)}</strong></div>`).join("") : `<p class="muted mb-0">支出の登録はありません。</p>`;
}

function showExpenseEditor() {
  document.querySelector("#expense-editor .modal-content").innerHTML = `<form id="expense-form"><div class="modal-header"><h2 class="modal-title fs-5">支出を記録</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button></div><div class="modal-body"><label class="form-label">内容</label><input name="name" class="form-control mb-3" maxlength="80" required placeholder="例：食材仕入れ"><label class="form-label">区分</label><select name="category" class="form-select mb-3"><option>経費</option><option>人件費</option><option>その他</option></select><label class="form-label">金額 (円)</label><input name="amount" class="form-control mb-3" type="number" min="1" step="1" required><label class="form-label">日付</label><input name="date" class="form-control" type="date" value="${dateInput.value || dateKey()}" required></div><div class="modal-footer"><button type="button" class="btn btn-outline-dark" data-bs-dismiss="modal">キャンセル</button><button class="btn btn-primary" type="submit">保存</button></div></form>`;
  document.querySelector("#expense-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const amount = Number(form.get("amount"));
    const date = String(form.get("date"));
    if (!name || !Number.isInteger(amount) || amount < 1 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      window.alert("内容、金額、日付を確認してください。");
      return;
    }
    updateState((state) => state.expenses.unshift({ id: makeId("expense"), name, category: String(form.get("category")), amount, date, createdAt: new Date().toISOString() }));
    expenseEditor.hide();
  });
  expenseEditor.show();
}

function exportCsv() {
  const state = getState();
  const monthly = document.querySelector("#finance-period").value === "month";
  const selected = dateInput.value || dateKey();
  const payments = state.payments.filter((payment) => (monthly ? dateKey(payment.paidAt).slice(0, 7) : dateKey(payment.paidAt)) === (monthly ? selected.slice(0, 7) : selected));
  const expenses = state.expenses.filter((entry) => (monthly ? entry.date.slice(0, 7) : entry.date) === (monthly ? selected.slice(0, 7) : selected));
  const rows = [["種別", "日付", "内容", "区分", "支払方法", "金額", "割引"]];
  payments.forEach((payment) => rows.push(["売上", dateKey(payment.paidAt), `テーブル ${payment.table}`, "会計", payment.method, String(payment.total), String(payment.discount)]));
  expenses.forEach((expense) => rows.push(["支出", expense.date, expense.name, expense.category, "", String(expense.amount), "0"]));
  const csv = `\uFEFF${rows.map((row) => row.map((field) => `"${String(field).replaceAll('"', '""')}"`).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `ajimaru-${monthly ? selected.slice(0, 7) : selected}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

document.querySelector("#finance-period").addEventListener("change", () => render(getState()));
dateInput.addEventListener("change", () => render(getState()));
document.querySelector("#add-expense").addEventListener("click", showExpenseEditor);
document.querySelector("#export-finance").addEventListener("click", exportCsv);
subscribe(render);
render();
