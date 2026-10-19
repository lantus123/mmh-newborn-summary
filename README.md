# 馬偕新生兒 BR 入院、出院摘要與會診單產生器

Mackay Memorial Hospital · BR Admission Summary & Consultation Form Generator

Single-page client-side tool: 貼入產房與 BR 原始紀錄 → 即時生成診斷、入院摘要、會診單、出院摘要。

入院與出院摘要各有用途：**BR 入院摘要描述入室時的背景與初始評估；BR 出院摘要沿用原本的常規 BR 照護與出院模板。** 出摘不再重複出生、母體與產房背景。

## 依原版寫法恢復 BR 出摘（2026-10-19）

| 文書 | 範圍 |
| --- | --- |
| BR 入院摘要 | 出生、母體、產時、初始 PE 與入室初始評估。後續照護經過不併入入院正文。 |
| BR 出院摘要 | 常規預防處置 → BR 照護與相關 DDH／PE → 餵食 → 膽紅素與出院安排。沿用原本模板與勾選產文方式。 |

- 依使用者要求恢復整輪修改前的出摘寫法：只貼產房資料、搭配原有勾選，即可產生常規出摘，不要求先填完整 BR 經過。
- 一般案例沿用原本的 HBV vaccine／眼藥膏／Vitamin K1、routine nursery care／rooming-in、餵食增加，以及 bilirubin WNL、stable discharge／MBD／OPD 文字。
- 原有 sepsis、血糖、兩院區 HC、呼吸及衛教長短版等條件，恢復在出摘內帶入原本對應模板；sepsis 包含原有自動勾選。入摘與會診的計畫呈現不變。
- 明確提供的同項臨床紀錄優先於對應模板：數值、時間、拒絕、尚未執行、持續症狀與有條件的出院安排，不會同時被相反的預設句覆蓋。
- 不新增轉 NBC 分流；僅保留原本已有的選項與出摘模板相容性。
- 初始 DDH／子宮內壓迫不因原文行序而漏寫。明示晚期 PE 不提前；同項手動勾選的時間需核對時，來源與選項留在待確認區，真正衝突仍在正文提示。
- 本輪以原版實際文字比對常規出摘，並保留核心解析、DDH／PE、Copy 與 Reset 的回歸檢查。測試契約與驗收結果見 [測試說明](tests/README.md)，正式站結果另記於合併 PR。

## 文字流暢性與資料保真

BR 出院直接從原本的照護模板開始；BR 入院保持出生與入室時點的內容。會診單保留分區格式。

- 入摘不塞入缺值清單或後续病程；出摘不再把出生、母體資料寫一遍，也不再提示必須補齊照護與出院紀錄才能使用。
- 出摘採原有常規模板，已提供的 BR 處置、症狀、衛教及去向則保留其實際內容，取代同項預設句。
- 數值、單位、藥名、劑量、時間、否定、拒絕與未執行狀態保持原意。格式不明或含無法確定的限定語時保留完整引文，避免為了句子流暢而選定某一個可能結果。
- 在已歸入同一份文書的事件內，整理日期只限各行明確提供相同起算點的單一 `on day N` 事件。不同起算點不混排，不增加「因此」等來源未提供的因果關係。
- 原始 PE 的分級／左右側保留，同向手動所見去重。原文與手動選項的真正衝突仍留在可複製正文，避免複製後丟失不確定性。
- 入摘的待確認區保留既有計畫與後續資料；出摘採原有勾選模板，不再另外要求完整病程或把同段模板重列為待確認計畫。兩頁 Copy 各自只複製正文，Reset 一併清理輸出與提示。
- 出生數值含 `corrected`／`revised`／`amended` 時，解析與入摘／會診保留更正原文，不將第一個值作確定結果；出摘不重述這些背景。

合成輸入與程式實際輸出見 [敘事驗收範例](docs/narrative-examples.md)。一般常規 BR 出摘與原版全文對照；其他案例檢查風險／PE 保留及明確來源如何取代對應模板。較長療程的既有測試僅驗證原文保留與相反敘述，不定義一般 BR 照護流程。

## 核心欄位與病程轉寫（2026-10-19 後續修正）

- GBS、GDM、PROM、MAS、preeclampsia 與 serology 依各自欄位旁的結果判讀，分清陽性、陰性、未記錄／不明及衝突。同一行其他欄位的 `+`／`-` 不會互相覆蓋。
- 母親與嬰兒的血型、篩檢結果依明示主詞或段落區分；保留未標示 maternal 的既有篩檢格式。原文結果不明時保留原文，供核對。
- GA 支援 `36+6`、`36w6d`、`36 6/7 weeks`；BW 支援 `3.2 kg`、`3,200 gm`；PROM 支援小數與日／時／分換算。缺 GA 或生長分類時不再自動補成 Term／AGA。
- IAP 的「有記載」、「充分」、「不充分」分開處理，支援分行記錄。單純 `s/p IAP` 不再變成充分完成，原文的藥名、劑量等細節仍保留。
- 產前用藥、產房復甦等背景保留於適用的入摘與會診；BR 檢驗、處置、病程與去向保留於出摘，明確原文的數值、否定、待執行與拒絕狀態優先於同項模板。
- Sepsis／NBC、血糖及 HC 的計畫規則在入摘／會診維持既有呈現，出摘則依使用者要求恢復原模板。手動 Respiratory distress 仍列入診斷，不推定病因。
- 換貼資料會撤回舊的自動感染評估建議，再依目前資料重算。手動 PE、評估及性別選擇在編輯時保留，按 Reset 才一併清除。
- 未記載嬰兒性別時不再預設女性；空白輸入不會拿 placeholder 範例生成個案。Reset 後尚在排程中的輸入更新也不會恢復範例或舊輸出。

## DDH 與 PE 紀錄轉寫（2026-10-19 修正）

- DDH risk、子宮內壓迫徵象及 hip PE 支援空白、換行、大小寫與全形符號，例如 `Oligohydramnios (+)`、`大腿姿勢不對稱（＋）`。
- 陽性、陰性、未記錄、結果不明或前後矛盾分別處理。未辨識到陽性不代表陰性；單一檢查陰性也不代表整套 hip examination 正常。
- 入院摘要、會診單與出院摘要共用 DDH／PE 的解析及事實保留規則，各份摘要依用途組織正文。診斷頁另列「Risk factors and examination findings」，保留紀錄層級。
- `PE:`／`Physical examination:`／`理學檢查:` 的自由文字保留分級、左右側及補充描述。已標示的 Plan、Maternal history 等段落不作為新生兒檢查結果。
- 不明格式、共同否定、條件語句及限定文字以原文保留，解析列提示核對；文字以 HTML escaping 顯示。
- 原文 PE 與手動 checkbox 維持獨立，不會自行勾選處置。缺少 hip PE 或只有風險，不補成髖關節正常。出摘依原版在明確 hip PE 陽性或已勾 DDH suspect 時帶入回診模板；同項原文明示計畫中、拒絕或取消時，以原文為準。入摘與會診不由 DDH 結果宣稱已安排回診。
- PE 區塊內的 `Newborn reflexes` 子項目會保留；Plan、Newborn history 等章節邊界仍適用。
- `Barlow(+) or Ortolani(+)` 等替代關係保留原文並提示核對，不會改寫成兩項確定陽性；以 `and` 明確並列的陽性維持正常判讀。
- 原文同項 PE 明確陰性或前後矛盾，卻手動勾選陽性時，四個分頁與解析列會提示來源衝突。取消勾選或修正原文後重新計算，Reset 清除提示；不自行判定哪一方正確。

### 本機功能驗證

不需要安裝套件，在 repo 根目錄執行：

```bash
node --test --test-isolation=none tests/*.test.cjs
```

測試使用 Node 內建 `node:test`／`vm` 與最小 DOM，載入真正的 HTML application script。案例均為合成資料，涵蓋各輸出、清除重填、段落邊界與兩院區 HC 設定。這是程式功能驗證；未代替正式站瀏覽器驗收。

### 驗證範圍

既有測試涵蓋 DDH／PE、欄位解析、來源細節、事件狀態、敘事語法、Copy 與 Reset。本輪新增 `tests/discharge-template-restoration.test.cjs`，以原版固定全文及選項驗證出摘模板恢復；原有出摘斷言依使用者最新要求調整，入摘／會診／診斷與來源衝突等要求保留。詳見 [測試說明](tests/README.md)。

本輪最終版本 **169 項測試全數通過，無失敗或跳過**；保留原 159 個案例、調整其中 32 個案例的出摘契約／文書區域斷言，另增 10 個原版恢復案例。一般常規出摘與原版完整文字逐字一致，並由兩位審閱者完整閱讀 6 組入摘／出摘與待確認區。正式站互動結果在部署後記錄於本輪 PR，不以歷史驗收代替。

已完成的歷史驗證：

- PR #1 的 DDH／PE 修正已合併、部署，並完成四個分頁的原文保留、衝突提示、Copy 及 Reset 正式站操作檢查。
- [PR #2](https://github.com/lantus123/mmh-newborn-summary/pull/2) 已合併至 `0845710` 並部署。該版有 **145 項本地測試通過**，另完成 **16 項正式站互動驗收**，包括敘事、待確認區、實際 Copy、Reset 與兩院區 HC。這些是該版資料保真、文句與操作的證據。
- PR #2 確實仍有 BR 文書用途的缺口：入院、出院使用共同的整段病程敘事，且待確認區要求補齊完整住院經過。先前的 145 項與 16 項驗收沒有覆蓋兩份文書應各自組織內容的要求，不能作為本輪修正的通過證明。
- [PR #3](https://github.com/lantus123/mmh-newborn-summary/pull/3) 在 `df963eef` 通過 159 項測試及 16 項正式站操作，修復兩份摘要共用全文；但仍把出摘改為重述出生背景、依輸入病程產文的方式。使用者其後明確要求回到原本出摘寫法，本輪以該要求調整，不把 PR #3 的產品形式當成固定前提。

各版本的實際驗收結果與部署證據記錄於合併 PR。任意自由文字格式與原生 iOS Safari 行為，不因合成案例或桌面瀏覽器檢查而視為全面驗證。

## 多院區 — URL 參數切換

同一份 code 透過 `?campus=` 切換院區，避免 2 個 repo sync 痛苦。

| 院區 | URL | 差異點 |
|---|---|---|
| 北馬（default）| `https://lantus123.github.io/mmh-newborn-summary/` | HC 監測 Q2H→QD |
| 東馬 | `https://lantus123.github.io/mmh-newborn-summary/?campus=ttmh` | HC 監測 Q8H |

## 新增院區

只改 `index.html` 開頭的 `CAMPUS_CONFIGS`：

```javascript
const CAMPUS_CONFIGS = {
  tpc: { name: '北馬', fullName: '...', hcMonitor: {...} },
  ttmh: { name: '東馬', fullName: '...', hcMonitor: {...} },
  // 新院區加在這
  tmh: { name: '淡馬', fullName: 'Mackay Memorial Hospital (Tamsui)', hcMonitor: {...} },
};
```

`?campus=tmh` 立刻可用，HTML/UI 不用改。Generator 邏輯（parser、output 模板）兩院區共用——bug 修一次兩邊都好。

## 部署

托管於 GitHub Pages。

嵌入 Google Sites：插入 → 內嵌 → 依網址 → 貼上方 URL（注意北馬/東馬 URL 不同）。

## 開發流程

純靜態 HTML，本機改完直接：

```bash
git add index.html
git commit -m "..."
git push
```

約 30 秒後 GitHub Pages 自動 deploy，Sites iframe 自動拿到新版。

## 維護差異點時的 workflow

- **修共用 bug / 加新功能**：直接改 generator/parser → 自動兩院區都吃到
- **加院區獨有設定**（HC schedule、未來其他差異）：在 `CAMPUS_CONFIGS` 物件加欄位 + 把 generator 對應位置從 hardcode 改成 `CAMPUS.xxx`
- **驗證 0 regression**：本機 `open index.html` 跟 `open 'index.html?campus=ttmh'` 各貼一份測試 input，比對輸出符合預期
