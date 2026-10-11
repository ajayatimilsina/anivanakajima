import { getState, updateState, subscribe, escapeHtml, money, makeId, formatTime, isOrderable } from "./store.js";

const params = new URLSearchParams(location.search);
const requestedTable = Number(params.get("table") || 1);
const table = Number.isInteger(requestedTable) && requestedTable >= 1 && requestedTable <= 40 ? requestedTable : 1;
const tableLabel = `テーブル ${table}`;
const cart = [];
let selectedCategory = "すべて";
let modalItemId = null;
let itemModal;
let cartModal;
const foodIcons = ["🍛", "🍗", "🍺", "🍜", "🥟", "🍚", "🥗", "🍨", "🫓", "🍹"];

document.querySelector("#table-number").textContent = String(table).padStart(2, "0");
itemModal = new bootstrap.Modal(document.querySelector("#item-modal"));
cartModal = new bootstrap.Modal(document.querySelector("#cart-modal"));

function renderMenu(state = getState()) {
  const categories = ["すべて", ...new Set(state.menu.map((item) => item.category))];
  const categoriesRoot = document.querySelector("#categories");
  categoriesRoot.innerHTML = categories.map((category) => `<button class="category-chip ${selectedCategory === category ? "active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("");
  const query = document.querySelector("#menu-search").value.trim().toLowerCase();
  const visible = state.menu.filter((item) => (selectedCategory === "すべて" || item.category === selectedCategory)
    && (!query || `${item.name} ${item.category}`.toLowerCase().includes(query)));
  document.querySelector("#menu-list").innerHTML = visible.length ? visible.map((item) => {
    const canOrder = isOrderable(item);
    const index = Math.abs(item.id) % foodIcons.length;
    return `<article class="menu-card ${canOrder ? "" : "unavailable"}"><div class="menu-illustration" aria-hidden="true">${foodIcons[index]}</div><div class="menu-card-body"><div><h3>${escapeHtml(item.name)}</h3><div class="muted">${escapeHtml(item.category)}</div></div><div class="menu-card-bottom"><div><span class="menu-price">${money(item.price)}</span>${item.stock < 5 && canOrder ? `<span class="stock-note"> 残りわずか</span>` : ""}${!canOrder ? `<span class="stock-note"> 欠品</span>` : ""}</div><button class="add-item" data-add-item="${item.id}" ${canOrder ? "" : "disabled"} aria-label="${escapeHtml(item.name)}を追加">+</button></div></div></article>`;
  }).join("") : `<div class="no-orders">該当するメニューがありません。</div>`;
}

function renderCartSummary() {
  const count = cart.reduce((total, line) => total + line.quantity, 0);
  const total = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  document.querySelector("#cart-count").textContent = String(count);
  document.querySelector("#cart-total").textContent = money(total);
}

function showItem(item) {
  modalItemId = item.id;
  const choices = item.options.map((group, groupIndex) => `<fieldset class="mb-3"><legend class="form-label">${escapeHtml(group.name)}</legend>${group.choices.map((choice, choiceIndex) =>
    `<label class="option-choice"><input type="radio" name="item-option-${groupIndex}" value="${choiceIndex}" ${choiceIndex === 0 ? "checked" : ""}> ${escapeHtml(choice.name)} ${choice.price ? `(+${money(choice.price)})` : ""}</label>`).join("")}</fieldset>`).join("");
  document.querySelector("#item-modal .modal-content").innerHTML = `<div class="modal-header"><div><span class="eyebrow">${escapeHtml(item.category)}</span><h2 class="modal-title fs-5">${escapeHtml(item.name)}</h2></div><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button></div><div class="modal-body"><p class="mb-2">基本価格 <strong>${money(item.price)}</strong></p>${choices || `<p class="muted mb-0">オプションはありません。</p>`}<label class="form-label mt-3">数量</label><input id="item-quantity" class="form-control" type="number" min="1" max="${Math.min(20, item.stock)}" value="1"></div><div class="modal-footer"><button id="add-to-cart" class="btn btn-primary">カートに追加</button></div>`;
  document.querySelector("#add-to-cart").addEventListener("click", () => {
    const state = getState();
    const fresh = state.menu.find((menuItem) => menuItem.id === modalItemId);
    if (!fresh || !isOrderable(fresh)) {
      itemModal.hide();
      renderMenu(state);
      window.alert("この商品は現在注文できません。");
      return;
    }
    const quantity = Number(document.querySelector("#item-quantity").value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > fresh.stock) {
      window.alert(`数量は1〜${fresh.stock}で入力してください。`);
      return;
    }
    const selections = fresh.options.map((group, groupIndex) => {
      const choiceIndex = Number(document.querySelector(`[name="item-option-${groupIndex}"]:checked`)?.value || 0);
      const choice = group.choices[choiceIndex];
      return choice ? { group: group.name, name: choice.name, price: choice.price } : null;
    }).filter(Boolean);
    const label = selections.map((selection) => `${selection.group}: ${selection.name}`).join(" / ");
    const unitPrice = fresh.price + selections.reduce((sum, selection) => sum + selection.price, 0);
    const existing = cart.find((line) => line.itemId === fresh.id && line.optionLabel === label);
    if (existing) existing.quantity += quantity;
    else cart.push({ itemId: fresh.id, name: fresh.name, category: fresh.category, optionLabel: label, options: selections, unitPrice, quantity });
    renderCartSummary();
    itemModal.hide();
  });
  itemModal.show();
}

function renderCart() {
  const content = document.querySelector("#cart-modal .modal-content");
  if (!cart.length) {
    content.innerHTML = `<div class="modal-header"><h2 class="modal-title fs-5">カート</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button></div><div class="modal-body text-center py-5 muted">商品を選んでください。</div>`;
    return;
  }
  const total = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  content.innerHTML = `<div class="modal-header"><div><span class="eyebrow">${tableLabel}</span><h2 class="modal-title fs-5">ご注文内容</h2></div><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button></div><div class="modal-body">${cart.map((line, index) => `<div class="checkout-line"><div><strong>${escapeHtml(line.name)}</strong><div class="muted">${escapeHtml(line.optionLabel || "")}</div><div class="quantity-control mt-2"><button data-cart-qty="${index}" data-delta="-1" aria-label="減らす">−</button><span>${line.quantity}</span><button data-cart-qty="${index}" data-delta="1" aria-label="増やす">＋</button></div></div><strong>${money(line.unitPrice * line.quantity)}</strong></div>`).join("")}<label class="form-label mt-3" for="order-note">注文メモ（任意）</label><input id="order-note" class="form-control" maxlength="120" placeholder="例：辛さ控えめ"></div><div class="modal-footer justify-content-between"><strong>合計 ${money(total)}</strong><button id="send-order" class="btn btn-primary">注文を送信</button></div>`;
  content.querySelectorAll("[data-cart-qty]").forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.dataset.cartQty);
    cart[index].quantity += Number(button.dataset.delta);
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    renderCartSummary();
    renderCart();
  }));
  document.querySelector("#send-order").addEventListener("click", () => {
    const state = getState();
    const lines = cart.map((line) => {
      const fresh = state.menu.find((item) => item.id === line.itemId);
      return { ...line, stock: fresh?.stock ?? 0, available: fresh ? isOrderable(fresh) : false };
    });
    const invalid = lines.find((line) => !line.available || line.quantity > line.stock);
    if (invalid) {
      window.alert(`${invalid.name}の在庫が不足しています。カートを確認してください。`);
      renderMenu(state);
      return;
    }
    const now = new Date().toISOString();
    const order = {
      id: makeId("order"),
      table,
      createdAt: now,
      status: "pending",
      note: document.querySelector("#order-note").value.trim(),
      items: cart.map(({ stock, available, ...line }) => ({ ...line })),
      subtotal: cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
    };
    updateState((next) => {
      for (const line of order.items) {
        const item = next.menu.find((menuItem) => menuItem.id === line.itemId);
        if (!item || !isOrderable(item) || item.stock < line.quantity) throw new Error(`${line.name}の在庫が不足しています。`);
        item.stock -= line.quantity;
      }
      next.orders.unshift(order);
    });
    cart.splice(0, cart.length);
    renderCartSummary();
    renderMenu();
    renderTableOrders();
    cartModal.hide();
  });
}

function statusLabel(status) {
  return ({ pending: "受付済み", preparing: "調理中", ready: "できあがり（カウンターへ）", served: "提供済み" })[status] || status;
}

function renderTableOrders(state = getState()) {
  const ownOrders = state.orders.filter((order) => order.table === table && !order.paid);
  const announcement = state.announcements.at(-1);
  const root = document.querySelector("#table-orders");
  const readyBanner = ownOrders.some((order) => order.status === "ready")
    ? `<div class="no-orders" style="background:#fff3cd;color:#664d03;font-size:1.2rem;font-weight:700;border:2px solid #e0a800">🍛 お料理ができあがりました。カウンターまでお越しください。</div>`
    : "";
  if (announcement && Date.now() - new Date(announcement.createdAt).getTime() < 30_000) {
    root.innerHTML = readyBanner + `<div class="no-orders" style="background:#e8f1eb;color:#254c3c;font-size:1.1rem;font-weight:700">${escapeHtml(announcement.message)}</div>` + (ownOrders.length ? ownOrders.map(orderCard).join("") : "");
    return;
  }
  root.innerHTML = ownOrders.length ? readyBanner + ownOrders.map(orderCard).join("") : `<div class="no-orders">まだご注文はありません。メニューを選んでご注文ください。</div>`;
}

function orderCard(order) {
  return `<article class="order-status-card"><div class="d-flex justify-content-between gap-2"><h3>${formatTime(order.createdAt)} のご注文</h3><span class="badge text-bg-light">${statusLabel(order.status)}</span></div><p>${order.items.map((item) => `${escapeHtml(item.name)} × ${item.quantity}`).join("、")}</p><strong>${money(order.subtotal)}</strong></article>`;
}

document.querySelector("#categories").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (button) {
    selectedCategory = button.dataset.category;
    renderMenu();
  }
});
document.querySelector("#menu-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-item]");
  if (!button) return;
  const item = getState().menu.find((entry) => entry.id === Number(button.dataset.addItem));
  if (item) showItem(item);
});
document.querySelector("#menu-search").addEventListener("input", () => renderMenu());
document.querySelector("#open-cart").addEventListener("click", () => { renderCart(); cartModal.show(); });
document.querySelector("#call-staff").addEventListener("click", () => {
  updateState((state) => state.calls.unshift({ id: makeId("call"), table, createdAt: new Date().toISOString(), resolved: false }));
  window.alert("スタッフを呼びました。少々お待ちください。");
});
document.querySelector("#receipt-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#receipt-name").value.trim();
  if (!name) {
    document.querySelector("#receipt-feedback").textContent = "宛名を入力してください。";
    return;
  }
  updateState((state) => { state.receipts[table] = { name, updatedAt: new Date().toISOString() }; });
  document.querySelector("#receipt-feedback").textContent = "宛名を保存しました。お会計時に反映されます。";
});

renderMenu();
renderTableOrders();
renderCartSummary();
subscribe((state) => { renderMenu(state); renderTableOrders(state); });
