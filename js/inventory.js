import { getState, updateState, subscribe, renderStaffShell, escapeHtml, money, isOrderable } from "./store.js";

renderStaffShell("inventory");

function render(state = getState()) {
  const items = state.menu;
  const out = items.filter((item) => item.stock === 0).length;
  const low = items.filter((item) => item.stock > 0 && item.stock < 5).length;
  const active = items.filter(isOrderable).length;
  document.querySelector("#inventory-summary").innerHTML = `<div class="summary-card"><span>登録商品</span><strong>${items.length} 品</strong></div><div class="summary-card"><span>販売中</span><strong>${active} 品</strong></div><div class="summary-card"><span>残りわずか</span><strong>${low} 品</strong></div><div class="summary-card"><span>在庫切れ</span><strong>${out} 品</strong></div>`;
  const query = document.querySelector("#inventory-filter").value.trim().toLowerCase();
  const visible = items.filter((item) => `${item.name} ${item.category} ${window.ajimaruI18n.translate(item.name)} ${window.ajimaruI18n.translate(item.category)}`.toLowerCase().includes(query));
  document.querySelector("#inventory-list").innerHTML = visible.map((item) => `<tr><td><strong>${escapeHtml(item.name)}</strong><div class="muted">#${item.id}</div></td><td>${escapeHtml(item.category)}</td><td>${item.stock} 個</td><td><input class="form-control inventory-count" type="number" min="0" step="1" value="${item.stock}" data-count-id="${item.id}" aria-label="${escapeHtml(item.name)}の棚卸実数"></td><td data-difference-for="${item.id}">±0</td><td><span class="inventory-state ${item.stock === 0 ? "out" : item.stock < 5 ? "low" : ""}">${item.stock === 0 ? "欠品" : item.stock < 5 ? "残りわずか" : item.available ? "販売中" : "販売停止"}</span></td></tr>`).join("");
  document.querySelectorAll("[data-count-id]").forEach((input) => input.addEventListener("input", () => {
    const item = state.menu.find((entry) => entry.id === Number(input.dataset.countId));
    const count = Number(input.value);
    const difference = input.value === "" || !Number.isInteger(count) || count < 0 ? "—" : `${count - (item?.stock || 0) > 0 ? "+" : ""}${count - (item?.stock || 0)}`;
    document.querySelector(`[data-difference-for="${input.dataset.countId}"]`).textContent = difference;
  }));
}

document.querySelector("#inventory-filter").addEventListener("input", () => render(getState()));
document.querySelector("#confirm-stocktake").addEventListener("click", () => {
  const counts = [...document.querySelectorAll("[data-count-id]")].map((input) => ({ id: Number(input.dataset.countId), stock: Number(input.value) }));
  const invalid = counts.find((count) => !Number.isInteger(count.stock) || count.stock < 0);
  if (invalid) {
    document.querySelector("#inventory-feedback").textContent = "棚卸実数は0以上の整数で入力してください。";
    return;
  }
  const changed = counts.filter((count) => getState().menu.find((item) => item.id === count.id)?.stock !== count.stock).length;
  if (!changed) {
    document.querySelector("#inventory-feedback").textContent = "差異はありません。";
    return;
  }
  if (!window.confirm(`${changed}商品の在庫数を実数に合わせて更新します。よろしいですか？`)) return;
  updateState((state) => counts.forEach((count) => {
    const item = state.menu.find((entry) => entry.id === count.id);
    if (item) item.stock = count.stock;
  }));
  document.querySelector("#inventory-feedback").textContent = `${changed}商品の棚卸を確定しました。`;
});
subscribe(render);
render();
