https://anivaajimaru-default-rtdb.firebaseio.com/
aniva
アプリ ID
1:308884440439:web:c464ea26859d24988c0d72
リンク先の Firebase Hosting サイト
anivaajimaru

SDK の設定と構成

npm

CDN

Config
npm とモジュール バンドラ（webpack や Rollup など）をすでに使用している場合は、次のコマンドを実行して最新の SDK をインストールできます。（詳細）。

npm install firebase
次に Firebase を初期化し、使用するプロダクトの SDK の利用を開始します。

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBq1xj8h2hRp_ZzIxHTALb6rMtvSOZJQ8o",
  authDomain: "anivaajimaru.firebaseapp.com",
  databaseURL: "https://anivaajimaru-default-rtdb.firebaseio.com",
  projectId: "anivaajimaru",
  storageBucket: "anivaajimaru.firebasestorage.app",
  messagingSenderId: "308884440439",
  appId: "1:308884440439:web:c464ea26859d24988c0d72",
  measurementId: "G-22HE8SE1DM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
注: このオプションではモジュラー JavaScript SDK を使用します。これにより SDK のサイズが小さくなります。

ウェブ向け Firebase の詳細については、こちらをご覧ください: 使ってみる、 ウェブ SDK API リファレンス、 サンプル




create the

ajimaru QR Order + POS
A lightweight static restaurant ordering demo built with HTML5, Bootstrap 5, and vanilla JavaScript.

Firebase Authentication: enable the Anonymous sign-in provider in the Firebase console under Authentication > Sign-in method. All pages using `js/store.js` automatically sign in before accessing the Realtime Database. If authentication fails, the error is logged and the app uses browser-only storage with the existing realtime-sync warning.

Ordering hours (Asia/Tokyo): Monday-Friday 11:00-15:00; Saturday-Sunday 11:00-23:00. Opening time is inclusive, closing time is exclusive. Outside these hours, customers can view menus and existing orders but cannot add or submit orders. Kitchen queue limits and manual pauses still apply.

Customer orders are grouped by table and a shared session ID. Reloading the customer page or scanning its QR code reuses the table's active session, so unpaid orders continue to display until checkout. Completing checkout marks that session `Completed`; the next QR scan or page load creates a new session ID. New orders and payments record their session ID. This lifecycle is shared through Firebase when available and otherwise across tabs in the same browser.

After receiving a successfully saved payment, an open kitchen page waits 10 seconds, then plays "ありがとうございました。" twice with a one-second pause between utterances using Web Speech API. Enable kitchen audio with the sound button/toggle (browser user interaction is required). Historical payments are not replayed when the kitchen page opens; payments received while sound is off wait until sound is enabled. Cross-device notifications require working Firebase sync; browser-only fallback syncs tabs on the same browser.

Views
View	File
Customer ordering	index.html?table=<1-40> (e.g. index.html?table=3)
Single-table QR sign	table1-40-qr.html
QR sheet, tables 1-40	tables-1-to-40-qr.html
Kitchen Display System	kitchen.html
Register / POS (checkout)	register.html
Run
Customers scan the table's QR code, which opens the Customer view with that table number.

To try it locally, open the files directly in a browser or serve the folder with any static server. For the smoothest multi-tab behavior, use a local server:

python -m http.server 8080
Then open http://localhost:8080/index.html?table=3.

Open Kitchen and Register in separate tabs. Orders and status changes sync through BroadcastChannel and localStorage. This is a front-end demo store, not a production multi-device backend.

Data model
data/schema.json defines menu items, orders, and payments as JSON Schema. The example menu (including item photos) lives in js/data.js. In production, replace js/store.js with API calls and server-side persistence and authentication.

Demo flow
Customer: open a URL with a table number, add menu items, and send the order. A kitchen ticket prints and the order appears in Register (checkout).
Kitchen: start cooking, then mark the ticket ready.
Customer: the status banner updates to Preparing, then Served.
Register: select the table, apply a discount, choose a payment method, close the table, and print the receipt.



スタッフ画面（kds / pos / menu / inventory / finance）は初回にPIN入力（API側でも検証）。お客様画面は公開。

プリンタ設定
A. ブラウザ印刷（標準） — キッチン端末とレジ端末のChromeを「サイレント印刷」で起動:

Windowsの既定プリンタを、その端末で使う感熱プリンタ（キッチン用 / レシート用）に設定。
画面右上の紙幅（80mm / 58mm）を選択。@media print と @page が自動で切り替わります。
KDSは新規注文ごとに自動印刷（1品1枚、価格なし）。複数のKDSがあっても注文ごとに1回だけ印刷されます。
余白は「なし」、拡大縮小100%のドライバ設定を推奨。
B. ESC/POS 直接印刷（任意） — ネットワーク対応の感熱プリンタ（Epson互換、ポート9100）:

data/db.json の settings.printers.kitchen / receipt に "IP:9100" を設定して再起動。
KDS / レジ画面の印刷方式を「ESC/POS」に切り替え。
漢字モードはEpson互換（FS &, Shift_JIS）。Star等は server/escpos.js の初期化コマンドを調整。

画面の使い方（要点）
お客様: カテゴリタブ → 商品タップ → オプション選択 → 追加 → 注文。欠品はグレーで注文不可。 「店員を呼ぶ」でレジに通知。キッチンが「📣 カウンターへ取りに来てください」を押すと大きな緑のバナー（振動・音）。 ページ末尾の「領収書が必要ですか？」で宛名を保存（レジ画面・領収書に反映）。
KDS: 初回に「🔊 音声を有効にする」を押す（ブラウザ制限）。新規注文で効果音・点滅・音声。 上部「いらっしゃいませ / ありがとうございました」で店内アナウンス（チェックでお客様画面にも表示）。
レジ: テーブル一覧と合計、呼び出しアラート、会計（現金 / PayPay / クレジット、割引 ¥/%）、レシート自動印刷 （領収書希望なら宛名入り領収書も）。「日次集計」「会計履歴」タブあり。
在庫: 注文ごとに自動減算、0で自動欠品、5未満で「残りわずか」。棚卸で実数入力→差異表示→確定。
収支: 売上は会計から自動集計。経費・人件費・その他を入力し、日次/月次の損益グラフとCSV出力。

前提・補足
シード全品目に stock: 30 を設定。バターチキン/ほうれん草セットには元サイトと同じ「ナン変更」オプションを追加（他は options: []）。
83〜98など同名の「タンドリーチキン」(ID 95/96) はシードのまま。必要ならメニュー管理で名称を変更してください。
「PACHIKO」は日次集計と解釈。

menu

カテゴリ別 欠品
定食 欠品 0/8
まとめて欠品 まとめて販売再開
ナンセット 欠品 0/5
まとめて欠品 まとめて販売再開
サブメニュー 欠品 0/24
まとめて欠品 まとめて販売再開
ドリンク 欠品 0/40
まとめて欠品 まとめて販売再開
飲み放題ドリンク 欠品 0/1
まとめて欠品 まとめて販売再開
飲み放題 欠品 0/1
まとめて欠品 まとめて販売再開
お品書き 欠品 0/24
まとめて欠品 まとめて販売再開
ナン単品 欠品 0/7
まとめて欠品 まとめて販売再開
コース料理 欠品 0/1
まとめて欠品 まとめて販売再開
鍋・麺 欠品 0/6
まとめて欠品 まとめて販売再開
ラーメン 欠品 0/5
まとめて欠品 まとめて販売再開
ご飯 欠品 0/4
まとめて欠品 まとめて販売再開
お子様メニュー 欠品 0/2
まとめて欠品 まとめて販売再開
デザート 欠品 0/4
まとめて欠品 まとめて販売再開
#1
 欠品
Remove
Name 
唐揚げ定食
Category 
定食
Price (¥) 
800
OPTION（名前 / 追加料金）
+ OPTION
#2
 欠品
Remove
Name 
あじまる唐揚げ定食
Category 
定食
Price (¥) 
900
OPTION（名前 / 追加料金）
+ OPTION
#3
 欠品
Remove
Name 
とんかつ定食
Category 
定食
Price (¥) 
880
OPTION（名前 / 追加料金）
+ OPTION
#4
 欠品
Remove
Name 
みそとんかつ定食
Category 
定食
Price (¥) 
900
OPTION（名前 / 追加料金）
+ OPTION
#5
 欠品
Remove
Name 
アジフライ定食
Category 
定食
Price (¥) 
850
OPTION（名前 / 追加料金）
+ OPTION
#6
 欠品
Remove
Name 
ミックスフライ定食
Category 
定食
Price (¥) 
920
OPTION（名前 / 追加料金）
+ OPTION
#7
 欠品
Remove
Name 
プレーンナンセット
Category 
ナンセット
Price (¥) 
770
OPTION（名前 / 追加料金）
+ OPTION
#8
 欠品
Remove
Name 
ご飯 小
Category 
サブメニュー
Price (¥) 
150
OPTION（名前 / 追加料金）
+ OPTION
#9
 欠品
Remove
Name 
ご飯 中
Category 
サブメニュー
Price (¥) 
200
OPTION（名前 / 追加料金）
+ OPTION
#10
 欠品
Remove
Name 
ご飯 大
Category 
サブメニュー
Price (¥) 
250
OPTION（名前 / 追加料金）
+ OPTION
#14
 欠品
Remove
Name 
生ビール
Category 
ドリンク
Price (¥) 
550
OPTION（名前 / 追加料金）
+ OPTION
#15
 欠品
Remove
Name 
その他
Category 
サブメニュー
Price (¥) 
100
OPTION（名前 / 追加料金）
+ OPTION
#16
 欠品
Remove
Name 
その他（飲み物）
Category 
飲み放題ドリンク
Price (¥) 
0
OPTION（名前 / 追加料金）
+ OPTION
#17
 欠品
Remove
Name 
ソースチキン定食
Category 
定食
Price (¥) 
800
OPTION（名前 / 追加料金）
+ OPTION
#18
 欠品
Remove
Name 
ハイボール
Category 
飲み放題
Price (¥) 
0
OPTION（名前 / 追加料金）
+ OPTION
#19
 欠品
Remove
Name 
ソーセージ盛り合わせ
Category 
お品書き
Price (¥) 
605
OPTION（名前 / 追加料金）
+ OPTION
#20
 欠品
Remove
Name 
牛サイコロステーキ
Category 
お品書き
Price (¥) 
605
OPTION（名前 / 追加料金）
+ OPTION
#21
 欠品
Remove
Name 
鶏の炭火焼き
Category 
お品書き
Price (¥) 
660
OPTION（名前 / 追加料金）
+ OPTION
#22
 欠品
Remove
Name 
ローストチキン
Category 
お品書き
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#23
 欠品
Remove
Name 
炙りチャーシュー
Category 
お品書き
Price (¥) 
550
OPTION（名前 / 追加料金）
+ OPTION
#24
 欠品
Remove
Name 
ごぼう揚げ
Category 
お品書き
Price (¥) 
385
OPTION（名前 / 追加料金）
+ OPTION
#25
 欠品
Remove
Name 
チキンリング
Category 
お品書き
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#26
 欠品
Remove
Name 
チキン南蛮
Category 
お品書き
Price (¥) 
715
OPTION（名前 / 追加料金）
+ OPTION
#27
 欠品
Remove
Name 
手羽先タレ味
Category 
お品書き
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#28
 欠品
Remove
Name 
手羽先 ホットチリ味
Category 
お品書き
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#29
 欠品
Remove
Name 
フライドボテト
Category 
お品書き
Price (¥) 
330
OPTION（名前 / 追加料金）
+ OPTION
#30
 欠品
Remove
Name 
からあげ
Category 
お品書き
Price (¥) 
660
OPTION（名前 / 追加料金）
+ OPTION
#31
 欠品
Remove
Name 
串カツセット
Category 
お品書き
Price (¥) 
660
OPTION（名前 / 追加料金）
+ OPTION
#32
 欠品
Remove
Name 
串カツ うずら(1本)
Category 
お品書き
Price (¥) 
165
OPTION（名前 / 追加料金）
+ OPTION
#33
 欠品
Remove
Name 
串カツ玉ねぎ(1本)
Category 
お品書き
Price (¥) 
110
OPTION（名前 / 追加料金）
+ OPTION
#34
 欠品
Remove
Name 
串カツ えび(1本)
Category 
お品書き
Price (¥) 
165
OPTION（名前 / 追加料金）
+ OPTION
#35
 欠品
Remove
Name 
豚串カツ(1本)
Category 
お品書き
Price (¥) 
165
OPTION（名前 / 追加料金）
+ OPTION
#36
 欠品
Remove
Name 
串カツれんこん(1本)
Category 
お品書き
Price (¥) 
110
OPTION（名前 / 追加料金）
+ OPTION
#37
 欠品
Remove
Name 
黑豚饺子
Category 
お品書き
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#38
 欠品
Remove
Name 
ピリ辛餃子
Category 
お品書き
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#39
 欠品
Remove
Name 
野菜餃子
Category 
お品書き
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#40
 欠品
Remove
Name 
肉餃子
Category 
お品書き
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#41
 欠品
Remove
Name 
チーズ餃子
Category 
お品書き
Price (¥) 
550
OPTION（名前 / 追加料金）
+ OPTION
#42
 欠品
Remove
Name 
お通し
Category 
お品書き
Price (¥) 
330
OPTION（名前 / 追加料金）
+ OPTION
#43
 欠品
Remove
Name 
ジムビームハイボール
Category 
ドリンク
Price (¥) 
480
OPTION（名前 / 追加料金）
+ OPTION
#44
 欠品
Remove
Name 
角ハイボール
Category 
ドリンク
Price (¥) 
490
OPTION（名前 / 追加料金）
+ OPTION
#45
 欠品
Remove
Name 
ウイスキーコーラハイボール
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#46
 欠品
Remove
Name 
ジンジャーハイボール
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#47
 欠品
Remove
Name 
翠ジンソーダ
Category 
ドリンク
Price (¥) 
480
OPTION（名前 / 追加料金）
+ OPTION
#48
 欠品
Remove
Name 
こだわり酒場のレモンサワー
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#49
 欠品
Remove
Name 
酎ハイ ウーロン茶
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#50
 欠品
Remove
Name 
酎ハイ 緑茶
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#51
 欠品
Remove
Name 
酎ハイ 青リンゴ
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#52
 欠品
Remove
Name 
酎ハイ 巨峰
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#53
 欠品
Remove
Name 
酎ハイ グレープフルーツ
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#54
 欠品
Remove
Name 
酎ハイ カルピス
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#55
 欠品
Remove
Name 
サントリー生ビール 中瓶
Category 
ドリンク
Price (¥) 
660
OPTION（名前 / 追加料金）
+ OPTION
#56
 欠品
Remove
Name 
大隅（麦）
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#57
 欠品
Remove
Name 
大隅（芋）
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#58
 欠品
Remove
Name 
いいちこ（麦）
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#59
 欠品
Remove
Name 
麦ざかり（麦）
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#60
 欠品
Remove
Name 
黒霧島（芋）
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#61
 欠品
Remove
Name 
芋ざかり（芋）
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#62
 欠品
Remove
Name 
ワイン（赤）
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#63
 欠品
Remove
Name 
ワイン（白）
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#64
 欠品
Remove
Name 
カシスソーダ
Category 
ドリンク
Price (¥) 
480
OPTION（名前 / 追加料金）
+ OPTION
#65
 欠品
Remove
Name 
カシスオレンジ
Category 
ドリンク
Price (¥) 
480
OPTION（名前 / 追加料金）
+ OPTION
#66
 欠品
Remove
Name 
カシスウーロン
Category 
ドリンク
Price (¥) 
480
OPTION（名前 / 追加料金）
+ OPTION
#67
 欠品
Remove
Name 
ピーチソーダ
Category 
ドリンク
Price (¥) 
480
OPTION（名前 / 追加料金）
+ OPTION
#68
 欠品
Remove
Name 
ピーチオレンジ
Category 
ドリンク
Price (¥) 
480
OPTION（名前 / 追加料金）
+ OPTION
#69
 欠品
Remove
Name 
ピーチウーロン
Category 
ドリンク
Price (¥) 
480
OPTION（名前 / 追加料金）
+ OPTION
#70
 欠品
Remove
Name 
梅酒
Category 
ドリンク
Price (¥) 
480
OPTION（名前 / 追加料金）
+ OPTION
#71
 欠品
Remove
Name 
ウーロン茶
Category 
ドリンク
Price (¥) 
400
OPTION（名前 / 追加料金）
+ OPTION
#72
 欠品
Remove
Name 
メロンソーダ
Category 
ドリンク
Price (¥) 
400
OPTION（名前 / 追加料金）
+ OPTION
#73
 欠品
Remove
Name 
緑茶
Category 
ドリンク
Price (¥) 
400
OPTION（名前 / 追加料金）
+ OPTION
#74
 欠品
Remove
Name 
カルピスソーダ
Category 
ドリンク
Price (¥) 
400
OPTION（名前 / 追加料金）
+ OPTION
#75
 欠品
Remove
Name 
ペプシ
Category 
ドリンク
Price (¥) 
400
OPTION（名前 / 追加料金）
+ OPTION
#76
 欠品
Remove
Name 
カルピス
Category 
ドリンク
Price (¥) 
400
OPTION（名前 / 追加料金）
+ OPTION
#77
 欠品
Remove
Name 
ジンジャーエール
Category 
ドリンク
Price (¥) 
400
OPTION（名前 / 追加料金）
+ OPTION
#78
 欠品
Remove
Name 
オレンジジュース
Category 
ドリンク
Price (¥) 
400
OPTION（名前 / 追加料金）
+ OPTION
#79
 欠品
Remove
Name 
オールフリー小瓶
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#80
 欠品
Remove
Name 
チーズナンセット
Category 
ナンセット
Price (¥) 
1045
OPTION（名前 / 追加料金）
+ OPTION
#81
 欠品
Remove
Name 
バターチキンセット
Category 
ナンセット
Price (¥) 
990
OPTION（名前 / 追加料金）
+ OPTION
#82
 欠品
Remove
Name 
ほうれん草セット
Category 
ナンセット
Price (¥) 
990
OPTION（名前 / 追加料金）
+ OPTION
#83
 欠品
Remove
Name 
サントリー生ビールとチキンティッカ（2個）
Category 
サブメニュー
Price (¥) 
800
OPTION（名前 / 追加料金）
+ OPTION
#84
 欠品
Remove
Name 
プレーンナン
Category 
ナン単品
Price (¥) 
300
OPTION（名前 / 追加料金）
+ OPTION
#85
 欠品
Remove
Name 
チーズナン
Category 
ナン単品
Price (¥) 
660
OPTION（名前 / 追加料金）
+ OPTION
#86
 欠品
Remove
Name 
ガーリックナン
Category 
ナン単品
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#87
 欠品
Remove
Name 
ごまナン
Category 
ナン単品
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#88
 欠品
Remove
Name 
チョコナン
Category 
ナン単品
Price (¥) 
550
OPTION（名前 / 追加料金）
+ OPTION
#89
 欠品
Remove
Name 
ハニーナン
Category 
ナン単品
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#90
 欠品
Remove
Name 
ハニーチーズナン
Category 
ナン単品
Price (¥) 
770
OPTION（名前 / 追加料金）
+ OPTION
#91
 欠品
Remove
Name 
味まる屋スペシャルセット
Category 
ナンセット
Price (¥) 
1980
OPTION（名前 / 追加料金）
+ OPTION
#92
 欠品
Remove
Name 
チキンティッカ 2個
Category 
サブメニュー
Price (¥) 
330
OPTION（名前 / 追加料金）
+ OPTION
#93
 欠品
Remove
Name 
チキンティッカ 5個
Category 
サブメニュー
Price (¥) 
660
OPTION（名前 / 追加料金）
+ OPTION
#94
 欠品
Remove
Name 
チキンチリ
Category 
サブメニュー
Price (¥) 
990
OPTION（名前 / 追加料金）
+ OPTION
#95
 欠品
Remove
Name 
タンドリーチキン
Category 
サブメニュー
Price (¥) 
450
OPTION（名前 / 追加料金）
+ OPTION
#96
 欠品
Remove
Name 
タンドリーチキン
Category 
サブメニュー
Price (¥) 
800
OPTION（名前 / 追加料金）
+ OPTION
#97
 欠品
Remove
Name 
ラッシー
Category 
ドリンク
Price (¥) 
330
OPTION（名前 / 追加料金）
+ OPTION
#98
 欠品
Remove
Name 
マンゴーラッシー
Category 
ドリンク
Price (¥) 
440
OPTION（名前 / 追加料金）
+ OPTION
#99
 欠品
Remove
Name 
コース料理（お一人様）
Category 
コース料理
Price (¥) 
3520
OPTION（名前 / 追加料金）
+ OPTION
#100
 欠品
Remove
Name 
味噌もつ鍋
Category 
鍋・麺
Price (¥) 
1089
OPTION（名前 / 追加料金）
+ OPTION
#101
 欠品
Remove
Name 
醤油もつ鍋
Category 
鍋・麺
Price (¥) 
1089
OPTION（名前 / 追加料金）
+ OPTION
#102
 欠品
Remove
Name 
もつ（追加）
Category 
鍋・麺
Price (¥) 
649
OPTION（名前 / 追加料金）
+ OPTION
#103
 欠品
Remove
Name 
野菜盛り（追加）
Category 
鍋・麺
Price (¥) 
429
OPTION（名前 / 追加料金）
+ OPTION
#104
 欠品
Remove
Name 
豆腐（追加）
Category 
鍋・麺
Price (¥) 
209
OPTION（名前 / 追加料金）
+ OPTION
#105
 欠品
Remove
Name 
もつ鍋の〆ラーメン
Category 
鍋・麺
Price (¥) 
330
OPTION（名前 / 追加料金）
+ OPTION
#106
 欠品
Remove
Name 
ホルモン辛麺
Category 
ラーメン
Price (¥) 
880
OPTION（名前 / 追加料金）
+ OPTION
#107
 欠品
Remove
Name 
からラーメン
Category 
ラーメン
Price (¥) 
770
OPTION（名前 / 追加料金）
+ OPTION
#108
 欠品
Remove
Name 
みそラーメン
Category 
ラーメン
Price (¥) 
715
OPTION（名前 / 追加料金）
+ OPTION
#109
 欠品
Remove
Name 
醤油ラーメン
Category 
ラーメン
Price (¥) 
660
OPTION（名前 / 追加料金）
+ OPTION
#110
 欠品
Remove
Name 
冷麺
Category 
ラーメン
Price (¥) 
715
OPTION（名前 / 追加料金）
+ OPTION
#111
 欠品
Remove
Name 
チャーハン
Category 
ご飯
Price (¥) 
509
OPTION（名前 / 追加料金）
+ OPTION
#112
 欠品
Remove
Name 
白ごはん 小
Category 
ご飯
Price (¥) 
132
OPTION（名前 / 追加料金）
+ OPTION
#113
 欠品
Remove
Name 
白ごはん 中
Category 
ご飯
Price (¥) 
176
OPTION（名前 / 追加料金）
+ OPTION
#114
 欠品
Remove
Name 
白ごはん 大
Category 
ご飯
Price (¥) 
220
OPTION（名前 / 追加料金）
+ OPTION
#115
 欠品
Remove
Name 
お子様ハンバーグセット
Category 
お子様メニュー
Price (¥) 
330
OPTION（名前 / 追加料金）
+ OPTION
#116
 欠品
Remove
Name 
お子様カレーセット
Category 
お子様メニュー
Price (¥) 
330
OPTION（名前 / 追加料金）
+ OPTION
#117
 欠品
Remove
Name 
バニラチーズベリー
Category 
デザート
Price (¥) 
430
OPTION（名前 / 追加料金）
+ OPTION
#118
 欠品
Remove
Name 
白玉抹茶
Category 
デザート
Price (¥) 
430
OPTION（名前 / 追加料金）
+ OPTION
#119
 欠品
Remove
Name 
抹茶アイス
Category 
デザート
Price (¥) 
230
OPTION（名前 / 追加料金）
+ OPTION
#120
 欠品
Remove
Name 
バニラアイス
Category 
デザート
Price (¥) 
230
OPTION（名前 / 追加料金）
+ OPTION
#121
 欠品
Remove
Name 
シーザーサラダ
Category 
サブメニュー
Price (¥) 
605
OPTION（名前 / 追加料金）
+ OPTION
#122
 欠品
Remove
Name 
バンバンジーサラダ
Category 
サブメニュー
Price (¥) 
550
OPTION（名前 / 追加料金）
+ OPTION
#123
 欠品
Remove
Name 
ポテトサラダ
Category 
サブメニュー
Price (¥) 
495
OPTION（名前 / 追加料金）
+ OPTION
#124
 欠品
Remove
Name 
鶏梅きゅうり
Category 
サブメニュー
Price (¥) 
385
OPTION（名前 / 追加料金）
+ OPTION
#125
 欠品
Remove
Name 
味付けうずら
Category 
サブメニュー
Price (¥) 
400
OPTION（名前 / 追加料金）
+ OPTION
#126
 欠品
Remove
Name 
キムチ
Category 
サブメニュー
Price (¥) 
250
OPTION（名前 / 追加料金）
+ OPTION
#127
 欠品
Remove
Name 
梅きゅうり
Category 
サブメニュー
Price (¥) 
330
OPTION（名前 / 追加料金）
+ OPTION
#128
 欠品
Remove
Name 
マグロ
Category 
サブメニュー
Price (¥) 
660
OPTION（名前 / 追加料金）
+ OPTION
#129
 欠品
Remove
Name 
漬けマグロ
Category 
サブメニュー
Price (¥) 
715
OPTION（名前 / 追加料金）
+ OPTION
#130
 欠品
Remove
Name 
刺身3種盛り
Category 
サブメニュー
Price (¥) 
880
OPTION（名前 / 追加料金）
+ OPTION
#131
 欠品
Remove
Name 
鶏ももたたき
Category 
サブメニュー
Price (¥) 
550
OPTION（名前 / 追加料金）
+ OPTION
#132
 欠品
Remove
Name 
鶏むねたたき
Category 
サブメニュー
Price (¥) 
550
OPTION（名前 / 追加料金）
+ OPTION
#133
 欠品
Remove
Name 
とりさし
Category 
サブメニュー
Price (¥) 
605
OPTION（名前 / 追加料金）
+ OPTION
#134
 欠品
Remove
Name 
とり刺身3種盛り
Category 
サブメニュー
Price (¥) 
770
OPTION（名前 / 追加料金）
+ OPTION
#135
 欠品
Remove
Name 
チキン南蛮
Category 
定食
Price (¥) 
980
OPTION（名前 / 追加料金）
+ OPTION

https://anivaajimaru-default-rtdb.firebaseio.com/
aniva
アプリ ID
1:308884440439:web:c464ea26859d24988c0d72
リンク先の Firebase Hosting サイト
anivaajimaru

SDK の設定と構成

npm

CDN

Config
npm とモジュール バンドラ（webpack や Rollup など）をすでに使用している場合は、次のコマンドを実行して最新の SDK をインストールできます。（詳細）。

npm install firebase
次に Firebase を初期化し、使用するプロダクトの SDK の利用を開始します。

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBq1xj8h2hRp_ZzIxHTALb6rMtvSOZJQ8o",
  authDomain: "anivaajimaru.firebaseapp.com",
  databaseURL: "https://anivaajimaru-default-rtdb.firebaseio.com",
  projectId: "anivaajimaru",
  storageBucket: "anivaajimaru.firebasestorage.app",
  messagingSenderId: "308884440439",
  appId: "1:308884440439:web:c464ea26859d24988c0d72",
  measurementId: "G-22HE8SE1DM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
注: このオプションではモジュラー JavaScript SDK を使用します。これにより SDK のサイズが小さくなります。

ウェブ向け Firebase の詳細については、こちらをご覧ください: 使ってみる、 ウェブ SDK API リファレンス、 サンプル
