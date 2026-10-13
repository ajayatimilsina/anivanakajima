(() => {
  const storageKey = "ajimaru-language";
  const translations = new Map(Object.entries({
    "テーブルオーダー": "Table Ordering",
    "収支管理": "Finance",
    "在庫管理": "Inventory",
    "レジ": "Register",
    "レジ・会計": "Register / POS",
    "キッチン": "Kitchen",
    "メニュー管理": "Menu Management",
    "テーブルQR": "Table QR Codes",
    "QR一覧": "QR Code List",
    "スタッフ PIN": "Staff PIN",
    "開く": "Unlock",
    "PINが違います": "Incorrect PIN",
    "お好きなメニューを": "Choose your menu",
    "お選びください。": "to get started.",
    "ご注文はこの画面からどうぞ。スタッフが順番にお届けします。": "Place your order here. Our staff will bring it to your table.",
    "メニューを検索": "Search menu",
    "スタッフを呼ぶ": "Call Staff",
    "メニューカテゴリ": "Menu categories",
    "ご注文状況": "Your Orders",
    "領収書が必要ですか？": "Need a receipt?",
    "宛名を登録すると、お会計時に領収書へ反映されます。": "Save a name to have it printed on your receipt.",
    "領収書の宛名": "Receipt name",
    "宛名を保存": "Save Name",
    "点": " items",
    "カートを見る": "View Cart",
    "注文を確認して、調理状況を更新します。": "View orders and update their preparation status.",
    "キッチンに注文はありません。": "There are no orders in the kitchen.",
    "通知音": "Notification sound",
    "新規注文を自動印刷": "Auto-print new orders",
    "音声を有効にする": "Enable sound",
    "🔊 音声を有効にする": "🔊 Enable sound",
    "いらっしゃいませ": "Welcome",
    "ありがとうございました": "Thank you",
    "テーブル": "Table",
    "お客様を呼ぶ": "Call Customer",
    "料理を完了しました。カウンターまでお越しください。": "Your order is ready. Please come to the counter.",
    "キッチンが混み合っています。": "The kitchen is busy.",
    "未会計・未提供の注文が": "There are",
    "件あるため、新しい注文を一時停止しています。": "active orders, so new orders are temporarily paused.",
    "キッチンが注文受付を一時停止しています。": "The kitchen has temporarily paused new orders.",
    "注文再開まで5分ほどお待ちください。": "Please wait up to five minutes before ordering again.",
    "自動停止中：注文数が上限に達しました（10件以上）。": "Automatically paused: the order queue has reached the limit (10 or more).",
    "注文受付を一時停止中です。": "New orders are temporarily paused.",
    "注文受付中です。": "Accepting orders.",
    "注文受付中です。10件以上になると注文受付が自動停止します。": "Accepting orders. New orders pause automatically at 10 or more.",
    "再開まで": "Resumes in",
    "注文受付を再開": "Resume order acceptance",
    "5分間注文停止": "Pause orders for 5 minutes",
    "混雑のため自動停止中": "Automatically paused due to high demand",
    "収支管理の説明": "Track sales and record expenses, labor costs, and other spending.",
    "会計売上を集計し、経費・人件費などを記録します。": "Track sales and record expenses, labor costs, and other spending.",
    "CSVを書き出す": "Export CSV",
    "集計期間": "Period",
    "日次": "Daily",
    "月次": "Monthly",
    "＋ 支出を記録": "+ Add Expense",
    "売上・支出推移": "Sales & Expenses",
    "支出履歴": "Expense History",
    "注文ごとに在庫を自動で減算します。5個未満は残りわずか、0個で欠品です。": "Stock is deducted automatically for each order. Fewer than 5 items is low stock; 0 is out of stock.",
    "棚卸を確定": "Confirm Stocktake",
    "商品名・カテゴリで検索": "Search by item or category",
    "商品": "Item",
    "カテゴリ": "Category",
    "現在庫": "Current Stock",
    "棚卸実数": "Counted Stock",
    "差異": "Difference",
    "状態": "Status",
    "価格、販売状態、在庫、オプションを編集します。": "Edit prices, availability, stock, and options.",
    "商品写真": "Product photo",
    "画像を縮小・圧縮して保存します（元画像は10MB以下、保存画像は最大16KB）。": "Photos are resized and compressed before saving (original file up to 10 MB; saved image up to 16 KB).",
    "商品写真プレビュー": "Product photo preview",
    "写真を削除": "Remove photo",
    "写真": "Photo",
    "＋ 商品を追加": "+ Add Item",
    "商品名": "Item Name",
    "価格": "Price",
    "在庫": "Stock",
    "販売": "Availability",
    "オプション": "Options",
    "テーブルを選択して注文を確認し、お会計を完了します。": "Select a table to review orders and complete payment.",
    "紙幅": "Paper Width",
    "テーブル会計": "Checkout",
    "日次集計": "Daily Summary",
    "会計履歴": "Payment History",
    "本日の売上": "Today's Sales",
    "月間売上": "Monthly Sales",
    "日次売上": "Daily Sales",
    "支出合計": "Total Expenses",
    "差引損益": "Net Profit / Loss",
    "会計件数 / 人件費": "Payments / Labor Costs",
    "閉じる": "Close",
    "保存": "Save",
    "キャンセル": "Cancel",
    "すべて": "All",
    "基本価格": "Base Price",
    "数量": "Quantity",
    "カートに追加": "Add to Cart",
    "オプションはありません。": "No options available.",
    "カート": "Cart",
    "商品を選んでください。": "Choose items to get started.",
    "ご注文内容": "Order Summary",
    "減らす": "Decrease quantity",
    "増やす": "Increase quantity",
    "注文メモ（任意）": "Order note (optional)",
    "例：辛さ控えめ": "e.g. Less spicy",
    "注文を送信": "Place Order",
    "合計": "Total",
    "お預かり金額": "Cash Received",
    "お釣り": "Change",
    "合計から値引き": "Discount from total",
    "お会計": "Payment",
    "会計を完了": "Complete Payment",
    "割引": "Discount",
    "売上": "Sales",
    "支出": "Expenses",
    "会計件数": "Payments",
    "注文品数": "Items Ordered",
    "支払方法別": "By Payment Method",
    "現金": "Cash",
    "クレジット": "Credit Card",
    "再印刷": "Reprint",
    "領収書印刷": "Print Receipt",
    "支払方法を変更": "Change Payment Method",
    "レシート再印刷": "Reprint Receipt",
    "お会計完了": "Payment Complete",
    "領収書": "Receipt",
    "様": "",
    "小計": "Subtotal",
    "但し お飲食代として": "For food and beverages",
    "上記正に領収いたしました": "Payment received in full",
    "レシートを印刷": "Print Receipt",
    "領収書を印刷": "Print Receipt",
    "宛名（領収書に記載）": "Name on receipt",
    "例: 株式会社〇〇": "e.g. Example Company",
    "未会計の注文はありません。": "No unpaid orders.",
    "空席": "Empty",
    "スタッフ呼び出し": "Staff Calls",
    "対応済み": "Resolved",
    "受付": "Received",
    "受付済み": "Received",
    "調理中": "Preparing",
    "できあがり": "Ready",
    "提供済み": "Served",
    "提供済みにする": "Mark as Served",
    "調理開始": "Start Preparing",
    "印刷": "Print",
    "✅ 呼び出しました": "✅ Announced",
    "できあがり（カウンターへ）": "Ready (pick up at counter)",
    "お客様を呼ぶ（声）": "Announce Pickup",
    "📣 呼び出し": "📣 Calls",
    "件の注文": " orders",
    "注文": "Order",
    "商品を編集": "Edit Item",
    "価格 (円)": "Price (JPY)",
    "円": "JPY",
    "オプション（JSON配列）": "Options (JSON array)",
    "販売中": "Available",
    "販売停止": "Unavailable",
    "在庫切れ": "Out of stock",
    "欠品": "Out of stock",
    "残りわずか": "Low stock",
    "まとめて欠品": "Mark All Out of Stock",
    "販売再開": "Resume Sales",
    "編集": "Edit",
    "内容": "Description",
    "区分": "Type",
    "金額 (円)": "Amount (JPY)",
    "日付": "Date",
    "支出を記録": "Record Expense",
    "経費": "Expense",
    "人件費": "Labor",
    "その他": "Other",
    "種別": "Type",
    "支払方法": "Payment Method",
    "例：食材仕入れ": "e.g. Ingredients",
    "該当するメニューがありません。": "No matching menu items.",
    "まだご注文はありません。メニューを選んでご注文ください。": "No orders yet. Choose items from the menu to place an order.",
    "この商品は現在注文できません。": "This item is currently unavailable.",
    "オプションは正しいJSON配列で入力してください。": "Enter options as a valid JSON array.",
    "オプションの形式が正しくありません。名前と選択肢の名前・追加料金を確認してください。": "Invalid option format. Check the option names, choices, and additional prices.",
    "商品名、カテゴリ、価格、在庫を確認してください。": "Check the item name, category, price, and stock.",
    "編集対象の商品が見つかりません。": "The item being edited could not be found.",
    "棚卸実数は0以上の整数で入力してください。": "Enter a whole number of 0 or more for the stock count.",
    "差異はありません。": "There are no stock differences.",
    "商品の在庫数を実数に合わせて更新します。よろしいですか？": "Update stock to match the counted amounts?",
    "宛名を入力してください。": "Enter a receipt name.",
    "宛名を保存しました。お会計時に反映されます。": "Receipt name saved. It will appear at checkout.",
    "スタッフを呼びました。少々お待ちください。": "Staff has been called. Please wait.",
    "内容、金額、日付を確認してください。": "Check the description, amount, and date.",
    "この日の会計履歴はありません。": "No payments found for this date.",
    "支出の登録はありません。": "No expenses recorded.",
    "QRコードを読み込めません。インターネット接続を確認してください。": "Could not load the QR code library. Check your internet connection.",
    "QRコードの生成に失敗しました。": "Could not generate the QR code.",
    "注文ページを開くQRコード": "QR code to open the ordering page",
    "QRコードを読み込んでご注文ください。": "Scan the QR code to place your order.",
    "このQRを印刷": "Print this QR code",
    "注文URLを確認": "View order URL",
    "テーブル1〜40 QR一覧": "Table QR Codes (1–40)",
    "店舗で公開する前に、サイトの公開URLを設定してから印刷してください。": "Set the public site URL before printing these codes for your restaurant.",
    "一覧を印刷": "Print All",
    "スキャンして注文": "Scan to Order",
    "注文ページを開く": "Open Ordering Page",
    "同期オフ": "Sync Off",
    "ローカルのみ": "Local Only",
    "Firebase リアルタイム同期": "Firebase Realtime Sync",
    "ローカルのみ（同期オフ）": "Local Only (Sync Off)",
    "⚠ リアルタイム同期オフ（この端末のみ保存）": "⚠ Realtime sync is off (saved on this device only)",
    "保存データを読み込めません。ブラウザの保存データを確認してください。": "Could not load saved data. Check this browser's stored data.",
    "注文状態が更新されました。テーブルを選び直してください。": "Order status has changed. Please select the table again.",
    "共有データを保存できませんでした。通信状況を確認してください。": "Could not save shared data. Check your connection.",
    "定食": "Set Meals",
    "ナンセット": "Naan Sets",
    "サブメニュー": "Side Dishes",
    "ドリンク": "Drinks",
    "飲み放題ドリンク": "All-you-can-drink Beverages",
    "飲み放題": "All-you-can-drink",
    "お品書き": "Menu",
    "ナン単品": "Naan",
    "コース料理": "Course Meals",
    "鍋・麺": "Hot Pots & Noodles",
    "ラーメン": "Ramen",
    "ご飯": "Rice",
    "お子様メニュー": "Kids' Menu",
    "デザート": "Desserts",
    "アイス": "Ice",
    "唐揚げ定食": "Karaage Set Meal",
    "あじまる唐揚げ定食": "Ajimaru Karaage Set Meal",
    "とんかつ定食": "Tonkatsu Set Meal",
    "みそとんかつ定食": "Miso Tonkatsu Set Meal",
    "アジフライ定食": "Fried Horse Mackerel Set Meal",
    "ミックスフライ定食": "Mixed Fry Set Meal",
    "プレーンナンセット": "Plain Naan Set",
    "ご飯 小": "Rice (Small)",
    "ご飯 中": "Rice (Medium)",
    "ご飯 大": "Rice (Large)",
    "生ビール": "Draft Beer",
    "その他（飲み物）": "Other (Drinks)",
    "ソースチキン定食": "Sauce Chicken Set Meal",
    "ハイボール": "Highball",
    "ソーセージ盛り合わせ": "Sausage Platter",
    "牛サイコロステーキ": "Diced Beef Steak",
    "鶏の炭火焼き": "Charcoal-Grilled Chicken",
    "ローストチキン": "Roast Chicken",
    "炙りチャーシュー": "Seared Chashu",
    "ごぼう揚げ": "Fried Burdock Root",
    "チキンリング": "Chicken Rings",
    "チキン南蛮": "Chicken Nanban",
    "手羽先タレ味": "Soy-Sauce Chicken Wings",
    "手羽先 ホットチリ味": "Hot Chili Chicken Wings",
    "フライドボテト": "French Fries",
    "からあげ": "Karaage",
    "串カツセット": "Kushi-katsu Set",
    "串カツ うずら(1本)": "Quail Kushi-katsu (1 skewer)",
    "串カツ玉ねぎ(1本)": "Onion Kushi-katsu (1 skewer)",
    "串カツ えび(1本)": "Shrimp Kushi-katsu (1 skewer)",
    "豚串カツ(1本)": "Pork Kushi-katsu (1 skewer)",
    "串カツれんこん(1本)": "Lotus Root Kushi-katsu (1 skewer)",
    "黑豚饺子": "Black Pork Dumplings",
    "ピリ辛餃子": "Spicy Dumplings",
    "野菜餃子": "Vegetable Dumplings",
    "肉餃子": "Pork Dumplings",
    "チーズ餃子": "Cheese Dumplings",
    "お通し": "Appetizer",
    "ジムビームハイボール": "Jim Beam Highball",
    "角ハイボール": "Kaku Highball",
    "ウイスキーコーラハイボール": "Whisky Cola Highball",
    "ジンジャーハイボール": "Ginger Highball",
    "翠ジンソーダ": "Sui Gin Soda",
    "こだわり酒場のレモンサワー": "Lemon Sour",
    "酎ハイ ウーロン茶": "Chu-Hi (Oolong Tea)",
    "酎ハイ 緑茶": "Chu-Hi (Green Tea)",
    "酎ハイ 青リンゴ": "Chu-Hi (Green Apple)",
    "酎ハイ 巨峰": "Chu-Hi (Kyoho Grape)",
    "酎ハイ グレープフルーツ": "Chu-Hi (Grapefruit)",
    "酎ハイ カルピス": "Chu-Hi (Calpis)",
    "サントリー生ビール 中瓶": "Suntory Draft Beer (Medium Bottle)",
    "大隅（麦）": "Osumi Barley Shochu",
    "大隅（芋）": "Osumi Sweet Potato Shochu",
    "いいちこ（麦）": "Iichiko Barley Shochu",
    "麦ざかり（麦）": "Mugizakari Barley Shochu",
    "黒霧島（芋）": "Kurokirishima Sweet Potato Shochu",
    "芋ざかり（芋）": "Imozakari Sweet Potato Shochu",
    "ワイン（赤）": "Red Wine",
    "ワイン（白）": "White Wine",
    "カシスソーダ": "Cassis Soda",
    "カシスオレンジ": "Cassis Orange",
    "カシスウーロン": "Cassis Oolong",
    "ピーチソーダ": "Peach Soda",
    "ピーチオレンジ": "Peach Orange",
    "ピーチウーロン": "Peach Oolong",
    "梅酒": "Plum Wine",
    "ウーロン茶": "Oolong Tea",
    "メロンソーダ": "Melon Soda",
    "緑茶": "Green Tea",
    "カルピスソーダ": "Calpis Soda",
    "ペプシ": "Pepsi",
    "カルピス": "Calpis",
    "ジンジャーエール": "Ginger Ale",
    "オレンジジュース": "Orange Juice",
    "オールフリー小瓶": "All-Free (Small Bottle)",
    "チーズナンセット": "Cheese Naan Set",
    "バターチキンセット": "Butter Chicken Set",
    "ほうれん草セット": "Spinach Curry Set",
    "サントリー生ビールとチキンティッカ（2個）": "Suntory Draft Beer & Chicken Tikka (2 pcs)",
    "プレーンナン": "Plain Naan",
    "チーズナン": "Cheese Naan",
    "ガーリックナン": "Garlic Naan",
    "ごまナン": "Sesame Naan",
    "チョコナン": "Chocolate Naan",
    "ハニーナン": "Honey Naan",
    "ハニーチーズナン": "Honey Cheese Naan",
    "味まる屋スペシャルセット": "Ajimaru Special Set",
    "チキンティッカ 2個": "Chicken Tikka (2 pcs)",
    "チキンティッカ 5個": "Chicken Tikka (5 pcs)",
    "チキンチリ": "Chicken Chili",
    "タンドリーチキン": "Tandoori Chicken",
    "ラッシー": "Lassi",
    "マンゴーラッシー": "Mango Lassi",
    "コース料理（お一人様）": "Course Meal (per person)",
    "味噌もつ鍋": "Miso Offal Hot Pot",
    "醤油もつ鍋": "Soy Sauce Offal Hot Pot",
    "もつ（追加）": "Extra Offal",
    "野菜盛り（追加）": "Extra Vegetables",
    "豆腐（追加）": "Extra Tofu",
    "もつ鍋の〆ラーメン": "Finishing Ramen for Offal Hot Pot",
    "ホルモン辛麺": "Spicy Offal Noodles",
    "からラーメン": "Kara Ramen",
    "みそラーメン": "Miso Ramen",
    "醤油ラーメン": "Soy Sauce Ramen",
    "冷麺": "Cold Noodles",
    "チャーハン": "Fried Rice",
    "白ごはん 小": "Steamed Rice (Small)",
    "白ごはん 中": "Steamed Rice (Medium)",
    "白ごはん 大": "Steamed Rice (Large)",
    "お子様ハンバーグセット": "Kids' Hamburger Steak Set",
    "お子様カレーセット": "Kids' Curry Set",
    "バニラチーズベリー": "Vanilla Cheese Berry",
    "白玉抹茶": "Matcha with Shiratama",
    "抹茶アイス": "Matcha Ice Cream",
    "バニラアイス": "Vanilla Ice Cream",
    "シーザーサラダ": "Caesar Salad",
    "バンバンジーサラダ": "Bang Bang Chicken Salad",
    "ポテトサラダ": "Potato Salad",
    "鶏梅きゅうり": "Chicken, Plum & Cucumber",
    "味付けうずら": "Seasoned Quail Eggs",
    "キムチ": "Kimchi",
    "梅きゅうり": "Plum & Cucumber",
    "マグロ": "Tuna",
    "漬けマグロ": "Marinated Tuna",
    "刺身3種盛り": "Assorted Sashimi (3 kinds)",
    "鶏ももたたき": "Seared Chicken Thigh Sashimi",
    "鶏むねたたき": "Seared Chicken Breast Sashimi",
    "とりさし": "Chicken Sashimi",
    "とり刺身3種盛り": "Assorted Chicken Sashimi (3 kinds)",
    "ナン変更": "Naan Choice",
    "登録商品": "Registered Items",
    "数量は1〜20で入力してください。": "Enter a quantity between 1 and 20.",
    "まだご注文はありません。": "No orders yet.",
    "料理": "Food",
    "声": "Voice",
    "📣 お客様を呼ぶ（声）": "📣 Announce Pickup",
    "📣 カウンターへ呼ぶ（声）": "📣 Announce to Counter",
    "🔊 音声のお知らせをオンにする": "🔊 Enable Voice Announcements",
    "🔊 音声のお知らせ：オン": "🔊 Voice Announcements: On",
    "音声のお知らせをオンにしました。": "Voice announcements enabled.",
    "お料理ができあがりました。": "Your order is ready.",
    "会計": "Payment",
    "在庫差異": "Stock Difference",
    "の棚卸実数": "counted stock",
    "呼び出しました": "Announced",
    "×": "×",
  }));

  const patterns = [
    [/^テーブル\s+(\d+)$/, "Table $1"],
    [/^テーブル\s+(\d+)、料理が完了しました。カウンターまでお越しください。よろしくお願いいたします。(?:注文 #\d+)?$/, "Table $1: Your order is ready. Please come to the counter."],
    [/^テーブル\s+(\d+)、料理が完了しました。カウンターまでお越しください。$/, "Table $1: Your order is ready. Please come to the counter."],
    [/^テーブル\s+(\d+)、お料理ができあがりました。カウンターまでお越しください。$/, "Table $1: Your order is ready. Please come to the counter."],
    [/^テーブル\s+(\d+)、料理完了しました。カウンターまでお越しください。$/, "Table $1: Your order is ready. Please come to the counter."],
    [/^テーブル\s+(\d+)\s*[・,]\s*(.+)$/, "Table $1 · $2"],
    [/^(\d+)\s*件の注文\s*・\s*📣 呼び出し\s*(\d+)\s*件$/, (match, orders, calls) => `${orders} ${orders === "1" ? "order" : "orders"} · 📣 ${calls} ${calls === "1" ? "call" : "calls"}`],
    [/^(\d+)\s* 個$/, "$1 units"],
    [/^在庫\s+(\d+)$/, "Stock: $1"],
    [/^#\d+ ・ 在庫 (\d+)$/, "Stock: $1"],
    [/^#\d+\s*[・·]\s*(残りわずか|在庫切れ)$/, (match, stock) => translations.get(stock)],
    [/^#\d+\s*[・·]\s*在庫\s*(\d+)$/, "Stock: $1"],
    [/^(\d+)月$/, (match, month) => new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(2000, Number(month) - 1, 1))],
    [/^(\d+)月(\d+)日$/, "$1/$2"],
    [/^支出\s+(.+)$/, "Expense $1"],
    [/^支出合計$/, "Total Expenses"],
    [/^注文メモ（任意）$/, "Order note (optional)"],
    [/^テーブル (\d+)、.+注文 #\d+$/, "Table $1: Your order is ready. Please come to the counter."],
    [/^(\d+)\s*件$/, (match, count) => `${count} ${count === "1" ? "order" : "orders"}`],
    [/^(\d+)\s*件の注文$/, (match, count) => `${count} ${count === "1" ? "order" : "orders"}`],
    [/^(\d+)\s*商品$/, "$1 items"],
    [/^(\d+)\s*品$/, "$1 items"],
    [/^在庫\s+(\d+)$/, "Stock: $1"],
    [/^欠品\s+(\d+)\/(\d+)$/, "Out of stock: $1/$2"],
    [/^(\d+)商品の在庫数を実数に合わせて更新します。よろしいですか？$/, "Update stock for $1 items to the counted amounts?"],
    [/^(\d+)商品の棚卸を確定しました。$/, "Stocktake confirmed for $1 items."],
    [/^商品名、カテゴリ、価格、在庫を確認してください。$/, "Check the item name, category, price, and stock."],
    [/^テーブル\s+(\d+)\s*[・·]\s*(.+?)\s*対応済み$/, "Table $1 · $2 Resolved"],
    [/^テーブル (\d+)、カウンターまでお越しください。よろしくお願いいたします。$/, "Table $1: Please come to the counter. Thank you."],
    [/^(.+) のご注文$/, "$1 order"],
    [/^(.+) ・ (受付|受付済み|調理中|できあがり|提供済み)$/, (match, time, status) => `${time} · ${translations.get(status)}`],
    [/^領収書宛名:\s*(.*)$/, "Receipt name: $1"],
    [/^(売上|支出)\s+(.+)$/, (match, label, value) => `${label === "売上" ? "Sales" : "Expenses"} ${value}`],
    [/^📣\s*テーブル\s+(\d+)\s*[・·]\s*(.+?)\s*対応済み$/, "📣 Table $1 · $2 Resolved"],
    [/^(受付済み|調理中|できあがり|提供済み)$/, (match, status) => translations.get(status)],
    [/^(現金|PayPay|クレジット)\s*[・,]\s*(.+)$/, (match, method, date) => `${translations.get(method)} · ${date}`],
    [/^(経費|人件費|その他)\s*[・,]\s*(.+)$/, (match, category, date) => `${translations.get(category)} · ${date}`],
    [/^支出(.+)$/, "Expense$1"],
    [/^🍛\s*テーブル\s+(\d+)、お料理ができあがりました。カウンターまでお越しください。$/, "🍛 Table $1: Your order is ready. Please come to the counter."],
    [/^🍛\s*テーブル\s+(\d+)、料理が完了しました。カウンターまでお越しください。よろしくお願いいたします。(?:注文 #\d+)?$/, "🍛 Table $1: Your order is ready. Please come to the counter."],
    [/^(.+)を追加$/, (match, name) => `Add ${translations.get(name) || name}`],
    [/^(.+)の棚卸実数$/, (match, name) => `Stock count for ${translations.get(name) || name}`],
    [/^テーブル\s+(\d+)\s+注文QRコード$/, "Table $1 order QR code"],
    [/^(.+)の在庫が不足しています。カートを確認してください。$/, "$1 is out of stock. Please check your cart."],
    [/^あと (.+) 不足しています。$/, "Short by $1."],
    [/^数量は1〜(\d+)で入力してください。$/, "Enter a quantity between 1 and $1."],
    [/^([\d,]+)\s* 件\s*\/\s*(.+)$/, "$1 payments / $2"],
    [/^テーブル (\d+)、料理が完了しました。カウンターまでお越しください。$/, "Table $1: Your order is ready. Please come to the counter."],
  ];

  let language = "ja";
  const translatedText = new WeakMap();
  const translatedAttributes = new WeakMap();

  function translate(value) {
    const trimmed = value.trim();
    if (!trimmed) return value;
    let result = translations.get(trimmed);
    if (result === undefined) {
      for (const [pattern, replacement] of patterns) {
        if (pattern.test(trimmed)) {
          result = trimmed.replace(pattern, replacement);
          break;
        }
      }
    }
    if (result === undefined) {
      const itemLines = trimmed.replace(/([^、]+?) × (\d+)/g, (line, name, quantity) => {
        const translatedName = translations.get(name.trim());
        return translatedName ? `${translatedName} × ${quantity}` : line;
      });
      if (itemLines !== trimmed) result = itemLines;
    }
    if (result === undefined) {
      const choice = trimmed.match(/^(.+?)(\s+\(.+\))$/);
      const translatedName = choice && translations.get(choice[1]);
      if (translatedName) result = `${translatedName}${choice[2]}`;
    }
    if (result === undefined && /売上|支出/.test(trimmed)) {
      result = trimmed.replaceAll("売上", "Sales").replaceAll("支出", "Expenses");
    }
    if (result === undefined) return value;
    return value.replace(trimmed, result);
  }

  window.ajimaruI18n = { translate, getLanguage: () => language };

  function updateText(node) {
    if (!translatedText.has(node)) translatedText.set(node, node.nodeValue);
    const original = translatedText.get(node);
    node.nodeValue = language === "en" ? translate(original) : original;
  }

  function updateAttributes(element) {
    for (const attribute of ["placeholder", "aria-label", "title"]) {
      if (!element.hasAttribute(attribute)) continue;
      let originals = translatedAttributes.get(element);
      if (!originals) {
        originals = new Map();
        translatedAttributes.set(element, originals);
      }
      if (!originals.has(attribute)) originals.set(attribute, element.getAttribute(attribute));
      const original = originals.get(attribute);
      const value = language === "en" ? translate(original) : original;
      if (element.getAttribute(attribute) !== value) element.setAttribute(attribute, value);
    }
  }

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      updateText(node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_NODE) return;
    if (node.nodeType === Node.ELEMENT_NODE) updateAttributes(node);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let textNode;
    while ((textNode = walker.nextNode())) updateText(textNode);
    if (node.nodeType === Node.ELEMENT_NODE) {
      for (const element of node.querySelectorAll("[placeholder], [aria-label], [title]")) updateAttributes(element);
    }
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage;
    localStorage.setItem(storageKey, language);
    document.documentElement.lang = language;
    document.title = language === "en" ? translateTitle(document.title) : originalTitle;
    processNode(document.body);
    document.querySelectorAll(".language-switch button").forEach((button) => {
      const active = button.dataset.language === language;
      button.classList.toggle("active", active);
      const pressed = String(active);
      if (button.getAttribute("aria-pressed") !== pressed) button.setAttribute("aria-pressed", pressed);
    });
  }

  const originalTitle = document.title;
  const titleMap = new Map([
    ["ajimaru | テーブルオーダー", "ajimaru | Table Ordering"],
    ["ajimaru | 収支管理", "ajimaru | Finance"],
    ["ajimaru | 在庫管理", "ajimaru | Inventory"],
    ["ajimaru | レジ", "ajimaru | Register"],
    ["ajimaru | メニュー管理", "ajimaru | Menu Management"],
    ["ajimaru | キッチン", "ajimaru | Kitchen"],
    ["ajimaru | テーブルQR", "ajimaru | Table QR"],
    ["ajimaru | QR一覧", "ajimaru | QR Code List"]
  ]);

  function translateTitle(title) {
    return titleMap.get(title) || title;
  }

  function addSwitcher() {
    if (document.querySelector(".language-switch")) return;
    const customerHeader = document.querySelector(".customer-header");
    const header = document.createElement(customerHeader ? "div" : "header");
    header.className = "language-header no-print";
    header.innerHTML = `<div class="language-switch" role="group" aria-label="Language"><button type="button" data-language="ja" aria-label="日本語">JA</button><span aria-hidden="true">|</span><button type="button" data-language="en" aria-label="English">EN</button></div>`;
    if (customerHeader) {
      header.classList.add("language-header-inline");
      customerHeader.append(header);
    } else {
      document.body.append(header);
    }
    header.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => setLanguage(button.dataset.language)));
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(processNode);
      if (mutation.type === "attributes") updateAttributes(mutation.target);
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["placeholder", "aria-label", "title"] });
  document.addEventListener("DOMContentLoaded", () => {
    addSwitcher();
    setLanguage(localStorage.getItem(storageKey) === "en" ? "en" : "ja");
  }, { once: true });
})();
