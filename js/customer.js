import { getState, getOrderingStatus, updateState, updateStateAsync, subscribe, escapeHtml, money, makeId, formatTime, isOrderable } from "./store.js";

const params = new URLSearchParams(location.search);
const requestedTable = Number(params.get("table") || 1);
const table = Number.isInteger(requestedTable) && requestedTable >= 1 && requestedTable <= 40 ? requestedTable : 1;
const tableLabel = `テーブル ${table}`;
const cart = [];
let checkoutRequestInProgress = false;
let selectedCategory = "すべて";
let modalItemId = null;
let itemModal;
let cartModal;
const foodIcons = ["🍛", "🍗", "🍺", "🍜", "🥟", "🍚", "🥗", "🍨", "🫓", "🍹"];

document.querySelector("#table-number").textContent = String(table).padStart(2, "0");
itemModal = new bootstrap.Modal(document.querySelector("#item-modal"));
cartModal = new bootstrap.Modal(document.querySelector("#cart-modal"));

function renderMenu(state = getState()) {
  const orderingPaused = getOrderingStatus(state).paused;
  const categories = ["すべて", ...new Set(state.menu.map((item) => item.category))];
  const categoriesRoot = document.querySelector("#categories");
  categoriesRoot.innerHTML = categories.map((category) => `<button class="category-chip ${selectedCategory === category ? "active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("");
  const query = document.querySelector("#menu-search").value.trim().toLowerCase();
  const visible = state.menu.filter((item) => (selectedCategory === "すべて" || item.category === selectedCategory)
    && (!query || `${item.name} ${item.category} ${window.ajimaruI18n.translate(item.name)} ${window.ajimaruI18n.translate(item.category)}`.toLowerCase().includes(query)));
  document.querySelector("#menu-list").innerHTML = visible.length ? visible.map((item) => {
    const canOrder = isOrderable(item);
    const index = Math.abs(item.id) % foodIcons.length;
    const hasMenuImage = item.image?.startsWith("data:image/jpeg;base64,") || false;
    const image = hasMenuImage ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">` : foodIcons[index];
    return `<article class="menu-card ${canOrder ? "" : "unavailable"}"><div class="menu-illustration ${hasMenuImage ? "has-menu-image" : ""}" ${hasMenuImage ? "" : 'aria-hidden="true"'}>${image}</div><div class="menu-card-body"><div><h3>${escapeHtml(item.name)}</h3><div class="muted">${escapeHtml(item.category)}</div></div><div class="menu-card-bottom"><div><span class="menu-price">${money(item.price)}</span>${item.stock < 5 && canOrder ? `<span class="stock-note"> 残りわずか</span>` : ""}${!canOrder ? `<span class="stock-note"> 欠品</span>` : ""}</div><button class="add-item" data-add-item="${item.id}" ${canOrder && !orderingPaused ? "" : "disabled"} aria-label="${escapeHtml(item.name)}を追加">+</button></div></div></article>`;
  }).join("") : `<div class="no-orders">該当するメニューがありません。</div>`;
}

function renderOrderingStatus(state = getState()) {
  const status = getOrderingStatus(state);
  const banner = document.querySelector("#ordering-status");
  banner.hidden = !status.paused;
  banner.classList.toggle("ordering-status-busy", status.automaticallyPaused);
  banner.classList.toggle("ordering-status-manual", !status.automaticallyPaused && status.manuallyPaused);
  if (status.automaticallyPaused) {
    banner.innerHTML = `<strong>キッチンが混み合っています。</strong><span>未会計・未提供の注文が <b>${status.activeOrders}</b> 件あるため、新しい注文を一時停止しています。</span>`;
  } else if (status.manuallyPaused) {
    banner.innerHTML = `<strong>キッチンが注文受付を一時停止しています。</strong><span>注文再開まで3分ほどお待ちください。</span>`;
  } else {
    banner.replaceChildren();
  }
  document.querySelectorAll("[data-add-item]").forEach((button) => { button.disabled ||= status.paused; });
  const sendOrderButton = document.querySelector("#send-order");
  if (sendOrderButton) sendOrderButton.disabled = status.paused;
}

function renderCartSummary() {
  const count = cart.reduce((total, line) => total + line.quantity, 0);
  const total = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  document.querySelector("#cart-count").textContent = String(count);
  document.querySelector("#cart-total").textContent = money(total);
}

function showItem(item) {
  if (getOrderingStatus().paused) {
    renderOrderingStatus();
    return;
  }
  modalItemId = item.id;
  const choices = item.options.map((group, groupIndex) => `<fieldset class="mb-3"><legend class="form-label">${escapeHtml(group.name)}</legend>${group.choices.map((choice, choiceIndex) =>
    `<label class="option-choice"><input type="radio" name="item-option-${groupIndex}" value="${choiceIndex}" ${choiceIndex === 0 ? "checked" : ""}> ${escapeHtml(choice.name)} ${choice.price ? `(+${money(choice.price)})` : ""}</label>`).join("")}</fieldset>`).join("");
  document.querySelector("#item-modal .modal-content").innerHTML = `<div class="modal-header"><div><span class="eyebrow">${escapeHtml(item.category)}</span><h2 class="modal-title fs-5">${escapeHtml(item.name)}</h2></div><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button></div><div class="modal-body"><p class="mb-2">基本価格 <strong>${money(item.price)}</strong></p>${choices || `<p class="muted mb-0">オプションはありません。</p>`}<label class="form-label mt-3">数量</label><input id="item-quantity" class="form-control" type="number" min="1" max="${Math.min(20, item.stock)}" value="1"></div><div class="modal-footer"><button id="add-to-cart" class="btn btn-primary">カートに追加</button></div>`;
  document.querySelector("#add-to-cart").addEventListener("click", () => {
    const state = getState();
    if (getOrderingStatus(state).paused) {
      renderOrderingStatus(state);
      itemModal.hide();
      return;
    }
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
  renderOrderingStatus();
  content.querySelectorAll("[data-cart-qty]").forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.dataset.cartQty);
    cart[index].quantity += Number(button.dataset.delta);
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    renderCartSummary();
    renderCart();
  }));
  document.querySelector("#send-order").addEventListener("click", async () => {
    const state = getState();
    if (getOrderingStatus(state).paused) {
      renderOrderingStatus(state);
      return;
    }
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
    try {
      await updateStateAsync((next) => {
        if (getOrderingStatus(next).paused) throw new Error("注文受付を一時停止中です。時間をおいて再度お試しください。");
        for (const line of order.items) {
          const item = next.menu.find((menuItem) => menuItem.id === line.itemId);
          if (!item || !isOrderable(item) || item.stock < line.quantity) throw new Error(`${line.name}の在庫が不足しています。`);
          item.stock -= line.quantity;
        }
        next.orders.unshift(order);
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      console.error("Could not submit customer order.", error);
      renderOrderingStatus();
      window.alert(error.message);
      return;
    }
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
  renderCheckoutRequest(state);
  const ownOrders = state.orders.filter((order) => order.table === table && !order.paid);
  const announcement = state.announcements.filter((entry) => !entry.table || entry.table === table).at(-1);
  const root = document.querySelector("#table-orders");
  const readyBanner = ownOrders.some((order) => order.status === "ready")
    ? `<div class="no-orders" style="background:#fff3cd;color:#664d03;font-size:1.2rem;font-weight:700;border:2px solid #e0a800">🍛 テーブル ${table}、お料理ができあがりました。カウンターまでお越しください。</div>`
    : "";
  if (announcement && Date.now() - new Date(announcement.createdAt).getTime() < 30_000) {
    root.innerHTML = readyBanner + `<div class="no-orders" style="background:#e8f1eb;color:#254c3c;font-size:1.1rem;font-weight:700">${escapeHtml(announcement.message)}</div>` + (ownOrders.length ? ownOrders.map(orderCard).join("") : "");
    return;
  }
  root.innerHTML = ownOrders.length ? readyBanner + ownOrders.map(orderCard).join("") : `<div class="no-orders">まだご注文はありません。メニューを選んでご注文ください。</div>`;
}

function renderCheckoutRequest(state = getState()) {
  const orders = state.orders.filter((order) => order.table === table && !order.paid);
  const requested = state.calls.some((call) => call.table === table && call.type === "checkout"
    && call.orderIds?.some((id) => orders.some((order) => order.id === id)));
  document.querySelector("#checkout-request").hidden = !orders.length;
  const button = document.querySelector("#request-checkout");
  button.disabled = checkoutRequestInProgress || requested || !orders.length;
  button.textContent = requested ? "お会計の通知済み" : checkoutRequestInProgress ? "送信中…" : "お会計に行きます";
  document.querySelector("#checkout-request-feedback").textContent = requested
    ? "キッチンとレジにお知らせしました。テーブルのQRコード用紙をレジへお持ちください。" : "";
}

document.querySelector("#request-checkout").addEventListener("click", async () => {
  if (checkoutRequestInProgress) return;
  const orderIds = getState().orders.filter((order) => order.table === table && !order.paid).map((order) => order.id);
  if (!orderIds.length) {
    renderCheckoutRequest();
    return;
  }
  checkoutRequestInProgress = true;
  renderCheckoutRequest();
  const request = { id: makeId("call"), table, type: "checkout", orderIds, createdAt: new Date().toISOString(), resolved: false };
  try {
    await updateStateAsync((state) => {
      if (orderIds.some((id) => !state.orders.some((order) => order.id === id && order.table === table && !order.paid))) {
        throw new Error("注文状態が更新されました。画面を確認して再度お試しください。");
      }
      const requested = state.calls.some((call) => call.table === table && call.type === "checkout"
        && call.orderIds?.some((id) => orderIds.includes(id)));
      if (!requested) state.calls.unshift(request);
    });
  } catch (error) {
    console.error("Could not request checkout.", error);
    window.alert(error instanceof Error ? error.message : "お会計の通知を送信できませんでした。通信状況を確認してください。");
  } finally {
    checkoutRequestInProgress = false;
    renderCheckoutRequest();
  }
});

function orderNumber(order) {
  return Date.parse(order.createdAt);
}

function readyMessage(order) {
  return `テーブル ${order.table}、料理が完了しました。カウンターまでお越しください。よろしくお願いいたします。注文 #${orderNumber(order)}`;
}

function orderCard(order) {
  const ready = order.status === "ready" ? `<div style="background:#fff3cd;color:#664d03;font-weight:700;border-radius:8px;padding:8px 10px;margin:8px 0">🍛 ${escapeHtml(readyMessage(order))}</div>` : "";
  return `<article class="order-status-card"><div class="d-flex justify-content-between gap-2"><h3>${formatTime(order.createdAt)} のご注文 <small>#${orderNumber(order)}</small></h3><span class="badge text-bg-light">${statusLabel(order.status)}</span></div>${ready}<p>${order.items.map((item) => `${escapeHtml(item.name)} × ${item.quantity}`).join("、")}</p><strong>${money(order.subtotal)}</strong></article>`;
}

const alertBox = document.createElement("div");
alertBox.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2500;display:none;background:#ffc107;color:#3d2e00;padding:16px;font-size:1.15rem;font-weight:800;text-align:center;box-shadow:0 4px 14px #0004";
alertBox.innerHTML = `<div class="alert-text"></div><button type="button" class="btn btn-dark btn-sm mt-2">OK</button>`;
alertBox.querySelector("button").addEventListener("click", () => {
  localStorage.setItem(`ajimaru-dismissed-${table}`, alertBox.dataset.key || "");
  alertBox.style.display = "none";
});
document.body.append(alertBox);

function updateAlertBanner(state) {
  const readyOrder = state.orders.find((order) => order.table === table && !order.paid && order.status === "ready");
  const call = state.announcements.filter((entry) => entry.table === table).at(-1);
  const callFresh = call && Date.now() - new Date(call.createdAt).getTime() < 10 * 60_000;
  const dismissed = localStorage.getItem(`ajimaru-dismissed-${table}`);
  const candidates = [];
  if (callFresh) candidates.push({ key: call.id, text: call.message });
  if (readyOrder) candidates.push({ key: `ready-${readyOrder.id}`, text: readyMessage(readyOrder) });
  const active = candidates.find((entry) => entry.key !== dismissed);
  if (!active) {
    alertBox.style.display = "none";
    return;
  }
  alertBox.dataset.key = active.key;
  alertBox.querySelector(".alert-text").textContent = "🍛 " + active.text;
  alertBox.style.display = "block";
}

let knownAnnouncementIds = null;
function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  window.speechSynthesis.speak(utterance);
}

function announceReadyOrders(state) {
  updateAlertBanner(state);
  const targeted = state.announcements.filter((entry) => entry.table === table);
  if (knownAnnouncementIds) {
    targeted.filter((entry) => !knownAnnouncementIds.has(entry.id) && Date.now() - new Date(entry.createdAt).getTime() < 60_000)
      .forEach((entry) => speakText(entry.message));
  }
  knownAnnouncementIds = new Set(targeted.map((entry) => entry.id));
}

const voiceButton = document.createElement("button");
voiceButton.className = "btn btn-outline-dark btn-sm mb-2";
voiceButton.textContent = "🔊 音声のお知らせをオンにする";
voiceButton.addEventListener("click", () => {
  speakText("音声のお知らせをオンにしました。");
  voiceButton.textContent = "🔊 音声のお知らせ：オン";
});
document.querySelector("#table-orders").before(voiceButton);

document.querySelector("#categories").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (button) {
    selectedCategory = button.dataset.category;
    renderMenu();
  }
});
document.querySelector("#menu-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-item]");
  if (!button || button.disabled || getOrderingStatus().paused) {
    renderOrderingStatus();
    return;
  }
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
announceReadyOrders(getState());
let wasOrderingPaused = getOrderingStatus().paused;
renderOrderingStatus();
subscribe((state) => {
  announceReadyOrders(state);
  renderMenu(state);
  renderTableOrders(state);
  renderOrderingStatus(state);
  wasOrderingPaused = getOrderingStatus(state).paused;
});
window.setInterval(() => {
  const state = getState();
  const paused = getOrderingStatus(state).paused;
  renderOrderingStatus(state);
  if (paused !== wasOrderingPaused) renderMenu(state);
  wasOrderingPaused = paused;
}, 1000);
