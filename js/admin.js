import { getState, updateState, subscribe, renderStaffShell, escapeHtml, money, makeId, isOrderable } from "./store.js";
import { MENU_LABELS, renderMenuLabels } from "./menu-labels.js";

renderStaffShell("menu");
const editor = new bootstrap.Modal(document.querySelector("#menu-editor"));

function render(state = getState()) {
  renderCategories(state);
  renderItems(state);
}

function renderCategories(state) {
  const categories = [...new Set(state.menu.map((item) => item.category))];
  document.querySelector("#category-availability").innerHTML = categories.map((category) => {
    const items = state.menu.filter((item) => item.category === category);
    const soldOut = items.filter((item) => !isOrderable(item)).length;
    const allDisabled = items.every((item) => !item.available);
    return `<div class="category-stock"><strong>${escapeHtml(category)}</strong><div class="muted mb-2">欠品 ${soldOut}/${items.length}</div><div class="d-flex gap-2"><button class="btn btn-sm btn-outline-danger" data-category-availability="${escapeHtml(category)}" data-available="false">まとめて欠品</button><button class="btn btn-sm btn-outline-success" data-category-availability="${escapeHtml(category)}" data-available="true" ${allDisabled ? "" : ""}>販売再開</button></div></div>`;
  }).join("");
  document.querySelectorAll("[data-category-availability]").forEach((button) => button.addEventListener("click", () => {
    const category = button.dataset.categoryAvailability;
    const available = button.dataset.available === "true";
    updateState((current) => current.menu.forEach((item) => { if (item.category === category) item.available = available; }));
  }));
}

function renderItems(state) {
  const query = document.querySelector("#menu-filter").value.trim().toLowerCase();
  const items = state.menu.filter((item) => `${item.name} ${item.category} ${window.ajimaruI18n.translate(item.name)} ${window.ajimaruI18n.translate(item.category)}`.toLowerCase().includes(query));
  document.querySelector("#menu-item-count").textContent = `${items.length} 商品`;
  document.querySelector("#menu-admin-list").innerHTML = items.map((item) => `<tr><td>${item.image?.startsWith("data:image/jpeg;base64,") ? `<img class="menu-admin-thumbnail" src="${escapeHtml(item.image)}" alt="">` : `<span class="menu-admin-thumbnail-placeholder" aria-hidden="true">🍽️</span>`}</td><td><strong>${escapeHtml(item.name)}</strong><div class="muted">#${item.id} ・ ${item.stock < 5 && item.stock > 0 ? "残りわずか" : item.stock === 0 ? "在庫切れ" : `在庫 ${item.stock}`}</div></td><td>${escapeHtml(item.category)}</td><td>${money(item.price)}</td><td>${item.stock}</td><td><label class="form-check form-switch mb-0"><input class="form-check-input" type="checkbox" data-available-item="${item.id}" ${item.available ? "checked" : ""}><span class="visually-hidden">販売中</span></label></td><td>${item.options.length ? escapeHtml(item.options.map((option) => option.name).join(", ")) : "—"}</td><td><button class="btn btn-sm btn-outline-dark" data-edit-item="${item.id}">編集</button></td></tr>`).join("");
  document.querySelectorAll("#menu-admin-list tr").forEach((row, index) => {
    row.cells[1].insertAdjacentHTML("beforeend", `<div class="menu-label-list">${renderMenuLabels(items[index].labels)}</div>`);
  });
  document.querySelectorAll("[data-available-item]").forEach((input) => input.addEventListener("change", () => updateState((current) => {
    const item = current.menu.find((entry) => entry.id === Number(input.dataset.availableItem));
    if (item) item.available = input.checked;
  })));
  document.querySelectorAll("[data-edit-item]").forEach((button) => button.addEventListener("click", () => showEditor(state.menu.find((item) => item.id === Number(button.dataset.editItem)))));
}

function showEditor(item = null) {
  const optionText = JSON.stringify(item?.options || [], null, 2);
  let imageData = item?.image?.startsWith("data:image/jpeg;base64,") ? item.image : "";
  document.querySelector("#menu-editor .modal-content").innerHTML = `<form id="menu-item-form"><div class="modal-header"><div><span class="eyebrow">MENU ITEM</span><h2 class="modal-title fs-5">${item ? "商品を編集" : "商品を追加"}</h2></div><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="閉じる"></button></div><div class="modal-body"><div class="row g-3"><div class="col-md-7"><label class="form-label">商品名</label><input name="name" class="form-control" maxlength="80" required value="${escapeHtml(item?.name || "")}"></div><div class="col-md-5"><label class="form-label">カテゴリ</label><input name="category" class="form-control" maxlength="40" required list="category-suggestions" value="${escapeHtml(item?.category || "")}"><datalist id="category-suggestions">${[...new Set(getState().menu.map((entry) => entry.category))].map((category) => `<option value="${escapeHtml(category)}"></option>`).join("")}</datalist></div><div class="col-md-6"><label class="form-label">価格 (円)</label><input name="price" class="form-control" type="number" min="0" step="1" required value="${item?.price ?? ""}"></div><div class="col-md-6"><label class="form-label">在庫</label><input name="stock" class="form-control" type="number" min="0" step="1" required value="${item?.stock ?? 30}"></div><div class="col-12"><label class="form-label" for="menu-image">商品写真</label><input id="menu-image" name="image" class="form-control" type="file" accept="image/*"><div class="muted mt-1">画像を縮小・圧縮して保存します（元画像は10MB以下、保存画像は最大16KB）。</div><div id="menu-image-preview-wrap" class="menu-image-preview-wrap" ${imageData ? "" : "hidden"}><img id="menu-image-preview" src="${escapeHtml(imageData)}" alt="商品写真プレビュー"><button type="button" id="remove-menu-image" class="btn btn-sm btn-outline-danger">写真を削除</button></div></div><div class="col-12"><label class="form-label">オプション（JSON配列）</label><textarea name="options" class="form-control" rows="6" spellcheck="false">${escapeHtml(optionText)}</textarea><div class="muted mt-1">例: [{"name":"ナン変更","choices":[{"name":"チーズナン","price":220}] }]</div></div><div class="col-12"><label class="form-check"><input name="available" class="form-check-input" type="checkbox" ${item?.available !== false ? "checked" : ""}><span class="form-check-label">販売中</span></label></div></div></div><div class="modal-footer"><button type="button" class="btn btn-outline-dark" data-bs-dismiss="modal">キャンセル</button><button class="btn btn-primary" type="submit">保存</button></div></form>`;
  const imageInput = document.querySelector("#menu-image");
  document.querySelector("#menu-item-form .row").insertAdjacentHTML("beforeend",
    `<fieldset class="col-12"><legend class="form-label fs-6">おすすめラベル（複数選択可）</legend><div class="d-flex flex-wrap gap-3">${MENU_LABELS.map((label) =>
      `<label class="form-check"><input class="form-check-input" type="checkbox" name="labels" value="${label.id}" ${Array.isArray(item?.labels) && item.labels.includes(label.id) ? "checked" : ""}><span class="form-check-label">${label.name}</span></label>`).join("")}</div></fieldset>`);
  const previewWrap = document.querySelector("#menu-image-preview-wrap");
  const preview = document.querySelector("#menu-image-preview");
  const saveButton = document.querySelector('#menu-item-form button[type="submit"]');
  let imageProcessingId = 0;
  imageInput.addEventListener("change", async () => {
    const file = imageInput.files[0];
    if (!file) return;
    const processingId = ++imageProcessingId;
    saveButton.disabled = true;
    try {
      const compressedImage = await compressMenuImage(file);
      if (processingId !== imageProcessingId) return;
      imageData = compressedImage;
      preview.src = imageData;
      previewWrap.hidden = false;
    } catch (error) {
      if (processingId !== imageProcessingId) return;
      console.error("Could not process menu photo.", error);
      imageInput.value = "";
      window.alert(error.message);
    } finally {
      if (processingId === imageProcessingId) saveButton.disabled = false;
    }
  });
  document.querySelector("#remove-menu-image").addEventListener("click", () => {
    imageProcessingId += 1;
    saveButton.disabled = false;
    imageData = "";
    imageInput.value = "";
    preview.removeAttribute("src");
    previewWrap.hidden = true;
  });
  document.querySelector("#menu-item-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let options;
    try {
      options = JSON.parse(String(form.get("options") || "[]"));
    } catch (error) {
      console.error("Invalid menu options JSON.", error);
      window.alert("オプションは正しいJSON配列で入力してください。");
      return;
    }
    if (!Array.isArray(options) || options.some((group) => typeof group.name !== "string" || !group.name.trim() || !Array.isArray(group.choices) || group.choices.length === 0 || group.choices.some((choice) => typeof choice.name !== "string" || !choice.name.trim() || !Number.isInteger(Number(choice.price)) || Number(choice.price) < 0))) {
      window.alert("オプションの形式が正しくありません。名前と選択肢の名前・追加料金を確認してください。");
      return;
    }
    options = options.map((group) => ({
      name: group.name.trim(),
      choices: group.choices.map((choice) => ({ name: choice.name.trim(), price: Number(choice.price) }))
    }));
    const name = String(form.get("name")).trim();
    const category = String(form.get("category")).trim();
    const price = Number(form.get("price"));
    const stock = Number(form.get("stock"));
    const labels = MENU_LABELS.filter((label) => form.getAll("labels").includes(label.id)).map((label) => label.id);
    if (!name || !category || !Number.isInteger(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      window.alert("商品名、カテゴリ、価格、在庫を確認してください。");
      return;
    }
    updateState((state) => {
      if (item) {
        const current = state.menu.find((entry) => entry.id === item.id);
        if (!current) throw new Error("編集対象の商品が見つかりません。");
        Object.assign(current, { name, category, price, stock, options, labels, available: form.has("available"), image: imageData });
      } else {
        const id = Math.max(0, ...state.menu.map((entry) => Number(entry.id) || 0)) + 1;
        state.menu.push({ id, name, category, price, stock, options, labels, available: form.has("available"), image: imageData });
      }
    });
    editor.hide();
  });
  editor.show();
}

async function compressMenuImage(file) {
  const maxUploadBytes = 10 * 1024 * 1024;
  const maxStoredBytes = 16 * 1024;
  if (!file.type.startsWith("image/")) throw new Error("画像ファイルを選択してください。");
  if (file.size > maxUploadBytes) throw new Error("画像は10MB以下のファイルを選択してください。");
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (error) {
    throw new Error("この画像を読み込めません。別の画像を選択してください。", { cause: error });
  }
  try {
    let scale = Math.min(1, 600 / Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("画像を処理できません。このブラウザを確認してください。");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.78, 0.65, 0.52, 0.4]) {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob && blob.size <= maxStoredBytes) return await blobToDataUrl(blob);
      }
      scale *= 0.75;
    }
  } finally {
    bitmap.close();
  }
  throw new Error("写真の容量を小さくできませんでした。別の画像を選択してください。");
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error || new Error("写真を読み込めませんでした。")));
    reader.readAsDataURL(blob);
  });
}

document.querySelector("#add-menu-item").addEventListener("click", () => showEditor());
document.querySelector("#menu-filter").addEventListener("input", () => renderItems(getState()));
subscribe(render);
render();
