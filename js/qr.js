import { escapeHtml } from "./store.js";

function qrCodeUrl(table) {
  return new URL(`index.html?table=${table}`, location.href).href;
}

function drawCode(canvas, value, width) {
  if (typeof window.QRCode !== "function") {
    const message = document.createElement("p");
    message.className = "feedback";
    message.textContent = "QRコードを読み込めません。インターネット接続を確認してください。";
    canvas.replaceWith(message);
    return;
  }
  const container = document.createElement("div");
  container.className = "qr-code";
  canvas.replaceWith(container);
  try {
    new window.QRCode(container, {
      text: value,
      width,
      height: width,
      colorDark: "#20392d",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.M
    });
  } catch (error) {
    console.error("Could not generate a table QR code.", error);
    const message = document.createElement("p");
    message.className = "feedback";
    message.textContent = "QRコードの生成に失敗しました。";
    container.replaceWith(message);
  }
}

const singleRoot = document.querySelector("#qr-sign");
if (singleRoot) {
  const rawTable = Number(new URLSearchParams(location.search).get("table") || 1);
  const table = Number.isInteger(rawTable) && rawTable >= 1 && rawTable <= 40 ? rawTable : 1;
  singleRoot.innerHTML = `<a class="brand mb-4" href="index.html"><span class="brand-mark">あ</span><span>ajimaru<small>TABLE ORDER</small></span></a><span class="eyebrow">SCAN TO ORDER</span><h1 class="qr-table-number">テーブル ${table}</h1><canvas id="table-code" aria-label="注文ページを開くQRコード"></canvas><p>QRコードを読み込んでご注文ください。</p><p class="qr-checkout-note">お会計の際は、この用紙をレジへお持ちください。</p><a href="index.html?table=${table}" class="no-print">注文ページを開く</a><button class="btn btn-dark mt-4 no-print" onclick="window.print()">このQRを印刷</button>`;
  drawCode(document.querySelector("#table-code"), qrCodeUrl(table), 360);
}

const sheetRoot = document.querySelector("#qr-sheet");
if (sheetRoot) {
  sheetRoot.innerHTML = Array.from({ length: 40 }, (_, index) => {
    const table = index + 1;
    return `<article class="qr-tile"><h2 class="qr-table-number">テーブル ${table}</h2><canvas data-qr-table="${table}" aria-label="テーブル ${table} 注文QRコード"></canvas><p class="qr-checkout-note">お会計の際は、この用紙をレジへお持ちください。</p><p class="no-print">${escapeHtml(qrCodeUrl(table))}</p><a href="index.html?table=${table}" class="no-print">注文URLを確認</a></article>`;
  }).join("");
  sheetRoot.querySelectorAll("[data-qr-table]").forEach((canvas) => drawCode(canvas, qrCodeUrl(Number(canvas.dataset.qrTable)), 180));
  const heading = document.createElement("div");
  heading.className = "page-heading no-print";
  heading.innerHTML = `<div><span class="eyebrow">TABLE QR CODES</span><h1>テーブル1〜40 QR一覧</h1><p>店舗で公開する前に、サイトの公開URLを設定してから印刷してください。</p></div><button class="btn btn-primary" onclick="window.print()">一覧を印刷</button>`;
  sheetRoot.prepend(heading);
}
