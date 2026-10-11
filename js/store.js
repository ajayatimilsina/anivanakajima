import menuSeed from "../data/menu.json" with { type: "json" };

const STORAGE_KEY = "ajimaru-pos-demo-v1";
const CHANNEL_NAME = "ajimaru-pos-demo";
const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
const subscribers = new Set();

function initialState() {
  return {
    version: 1,
    menu: structuredClone(menuSeed),
    orders: [],
    payments: [],
    expenses: [],
    calls: [],
    receipts: {},
    announcements: [],
    settings: { paperWidth: "80", sound: false, kitchenAutoPrint: true },
    printedKitchenOrderIds: []
  };
}

export function getState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const state = initialState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }
  try {
    const state = JSON.parse(stored);
    if (state.version !== 1 || !Array.isArray(state.menu) || !Array.isArray(state.orders)) {
      throw new Error("Unsupported ajimaru demo data version.");
    }
    return state;
  } catch (error) {
    console.error("Could not read saved ajimaru demo data.", error);
    throw new Error("保存データを読み込めません。ブラウザの保存データを確認してください。", { cause: error });
  }
}

export function updateState(mutator) {
  const state = getState();
  const result = mutator(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  channel?.postMessage({ type: "state-updated" });
  subscribers.forEach((listener) => listener(state));
  return result;
}

export function subscribe(listener) {
  subscribers.add(listener);
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) listener(getState());
  };
  if (!channel) window.addEventListener("storage", onStorage);
  return () => {
    subscribers.delete(listener);
    if (!channel) window.removeEventListener("storage", onStorage);
  };
}

if (channel) {
  channel.addEventListener("message", (event) => {
    if (event.data?.type === "state-updated") {
      const state = getState();
      subscribers.forEach((listener) => listener(state));
    }
  });
}

export function makeId(prefix = "id") {
  const value = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${value}`;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

export function money(value) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value || 0);
}

export function dateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatTime(value) {
  return new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function isOrderable(item) {
  return item.available && item.stock > 0;
}

export function renderStaffShell(activePage) {
  const root = document.querySelector("#staff-root");
  if (!root) return;
  const links = [
    ["kitchen.html", "キッチン", "kitchen"],
    ["register.html", "レジ・会計", "register"],
    ["menu.html", "メニュー管理", "menu"],
    ["inventory.html", "在庫管理", "inventory"],
    ["finance.html", "収支管理", "finance"],
    ["tables-1-to-40-qr.html", "テーブルQR", "qr"]
  ];
  root.innerHTML = `<aside class="staff-nav"><a class="brand" href="index.html"><span class="brand-mark">あ</span><span>ajimaru<small>STAFF CONSOLE</small></span></a><div class="nav-label">OPERATIONS</div><nav class="staff-links">${links.map(([href, label, key]) => `<a href="${href}" class="${key === activePage ? "active" : ""}">${label}</a>`).join("")}</nav><div class="nav-footer">QR ORDER + POS<br>ローカルデモ / 同じ端末のタブ間同期</div></aside>`;
}

export function todayDateInput(input) {
  input.value = dateKey();
  return input.value;
}

export function setPaperWidth(width) {
  document.documentElement.dataset.paperWidth = width === "58" ? "58" : "80";
  document.documentElement.style.setProperty("--receipt-width", `${document.documentElement.dataset.paperWidth}mm`);
  updateState((state) => { state.settings.paperWidth = document.documentElement.dataset.paperWidth; });
}

export function printDocument() {
  window.print();
}
