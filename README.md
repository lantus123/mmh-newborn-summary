# 馬偕新生兒 BR 入院、出院摘要與會診單產生器

Mackay Memorial Hospital · BR Admission Summary & Consultation Form Generator

Single-page client-side tool: 貼入產房與 BR 原始紀錄 → 即時生成診斷、入院摘要、會診單、出院摘要。

入院與出院摘要恢復原本各自的寫法：**入摘沿用原版一段式入院模板；出摘沿用原版常規 BR 照護與出院模板。** 原始資料有 finding 時正確帶入，診斷下方不另加 risk factor 區塊。

## 依原版寫法恢復 BR 入摘、出摘與診斷（2026-10-19）

| 文書 | 範圍 |
| --- | --- |
| BR 入院摘要 | 原版一段式語序：出生與 BW → 母體 → PROM／MAS → APGAR → PE → 已選評估／入 Baby Room 安排。後續照護經過不併入入院正文。 |
| BR 出院摘要 | 常規預防處置 → BR 照護與相關 DDH／PE → 餵食 → 膽紅素與出院安排。沿用原本模板與勾選產文方式。 |
| 診斷 | 沿用原本條列。可確認的 PE 陽性所見保留於條列，移除下方新增的 risk factor 區塊。 |

- 依使用者要求恢復整輪修改前的入摘與出摘寫法。只貼產房資料、搭配原有勾選，即可使用原本常規模板，不要求先填完整 BR 經過。
- 入摘恢復原版的單段結構、語序、勾選敘述與入 Baby Room 結尾，移除後加的長篇病程組織及待確認清單。資料來源的否定、未知與真正衝突仍正確保留。
- 一般案例沿用原本的 HBV vaccine／眼藥膏／Vitamin K1、routine nursery care／rooming-in、餵食增加，以及 bilirubin WNL、stable discharge／MBD／OPD 文字。
- 原有 sepsis、血糖、兩院區 HC、呼吸及衛教長短版等條件，恢復在出摘內帶入原本對應模板；sepsis 包含原有自動勾選。入摘也恢復原有勾選敘述，會診格式維持既有分區。
- 明確提供的同項臨床紀錄優先於對應模板：數值、時間、拒絕、尚未執行、持續症狀與有條件的出院安排，不會同時被相反的預設句覆蓋。
- 不新增轉 NBC 分流；僅保留原本已有的選項與出摘模板相容性。
- 初始 DDH／子宮內壓迫不因原文行序而漏寫。明示晚期 PE 不提前；其具體來源保留於出摘與會診。真正同項來源／勾選衝突仍在可複製正文辨識，不以刪除待確認區為由把不確定資料當成確定 finding。
- 本輪以原版實際文字比對常規出摘，並保留核心解析、DDH／PE、Copy 與 Reset 的回歸檢查。測試契約與驗收結果見 [測試說明](tests/README.md)，正式站結果另記於合併 PR。

## 文字流暢性與資料保真

BR 入院恢復原版的一段式模板；BR 出院直接從原本的照護模板開始。會診單保留分區格式。

- 入摘不塞入缺值清單或後續病程；出摘不再把出生、母體資料寫一遍，也不再提示必須補齊照護與出院紀錄才能使用。
- 出摘採原有常規模板，已提供的 BR 處置、症狀、衛教及去向則保留其實際內容，取代同項預設句。
- 數值、單位、藥名、劑量、時間、否定、拒絕與未執行狀態保持原意。格式不明或含無法確定的限定語時保留完整引文，避免為了句子流暢而選定某一個可能結果。
- 在已歸入同一份文書的事件內，整理日期只限各行明確提供相同起算點的單一 `on day N` 事件。不同起算點不混排，不增加「因此」等來源未提供的因果關係。
- 原始 PE 的分級／左右側保留，同向手動所見去重。原文與手動選項的真正衝突仍留在可複製正文，避免複製後丟失不確定性。
- 入摘與出摘不再另外顯示這輪新增的完整病程／處置待確認清單。兩頁 Copy 各自只複製正文，Reset 一併清理所有輸出與選項。
- 出生數值含 `corrected`／`revised`／`amended` 時，解析與入摘／會診保留更正原文，不將第一個值作確定結果；出摘不重述這些背景。

合成輸入與程式實際輸出見 [敘事驗收範例](docs/narrative-examples.md)。一般常規 BR 出摘與原版全文對照；其他案例檢查風險／PE 保留及明確來源如何取代對應模板。較長療程的既有測試僅驗證原文保留與相反敘述，不定義一般 BR 照護流程。

## 核心欄位與病程轉寫（2026-10-19 後續修正）

- GBS、GDM、PROM、MAS、preeclampsia 與 serology 依各自欄位旁的結果判讀，分清陽性、陰性、未記錄／不明及衝突。同一行其他欄位的 `+`／`-` 不會互相覆蓋。
- 母親與嬰兒的血型、篩檢結果依明示主詞或段落區分；保留未標示 maternal 的既有篩檢格式。原文結果不明時保留原文，供核對。
- GA 支援 `36+6`、`36w6d`、`36 6/7 weeks`；BW 支援 `3.2 kg`、`3,200 gm`；PROM 支援小數與日／時／分換算。缺 GA 或生長分類時不再自動補成 Term／AGA。
- IAP 的「有記載」、「充分」、「不充分」分開處理，支援分行記錄。單純 `s/p IAP` 不再變成充分完成，原文的藥名、劑量等細節仍保留。
- 產前用藥、產房復甦等背景保留於適用的入摘與會診；BR 檢驗、處置、病程與去向保留於出摘，明確原文的數值、否定、待執行與拒絕狀態優先於同項模板。
- 入摘與出摘的相關勾選恢復原有模板，會診保留計畫與來源的分區呈現。手動 Respiratory distress 仍列入診斷，不推定病因；沒有新增 NBC 流程。
- 換貼資料會撤回舊的自動感染評估建議，再依目前資料重算。手動 PE、評估及性別選擇在編輯時保留，按 Reset 才一併清除。
- 未記載嬰兒性別時不再預設女性；空白輸入不會拿 placeholder 範例生成個案。Reset 後尚在排程中的輸入更新也不會恢復範例或舊輸出。

## DDH 與 PE 紀錄轉寫（2026-10-19 修正）

- DDH risk、子宮內壓迫徵象及 hip PE 支援空白、換行、大小寫與全形符號，例如 `Oligohydramnios (+)`、`大腿姿勢不對稱（＋）`。
- 陽性、陰性、未記錄、結果不明或前後矛盾分別處理。未辨識到陽性不代表陰性；單一檢查陰性也不代表整套 hip examination 正常。
- 入院摘要、會診單與出院摘要共用 DDH／PE 的解析及事實保留規則，各份摘要依用途組織正文。診斷頁移除「Risk factors and examination findings」區塊；明確 PE 陽性所見以原本 `#` 條列呈現，風險本身不升格為診斷。
- `PE:`／`Physical examination:`／`理學檢查:` 的自由文字保留分級、左右側及補充描述。已標示的 Plan、Maternal history 等段落不作為新生兒檢查結果。
- 不明格式、共同否定、條件語句及限定文字以原文保留，解析列提示核對；文字以 HTML escaping 顯示。
- 原文 PE 與手動 checkbox 維持獨立，不會自行勾選處置。缺少 hip PE 或只有風險，不補成髖關節正常。出摘依原版在明確 hip PE 陽性或已勾 DDH suspect 時帶入回診模板；同項原文明示計畫中、拒絕或取消時，以原文為準。入摘與會診不由 DDH 結果宣稱已安排回診。
- PE 區塊內的 `Newborn reflexes` 子項目會保留；Plan、Newborn history 等章節邊界仍適用。
- `Barlow(+) or Ortolani(+)` 等替代關係保留原文並提示核對，不會改寫成兩項確定陽性；以 `and` 明確並列的陽性維持正常判讀。
- 原文同項 PE 明確陰性或前後矛盾，卻手動勾選陽性時，摘要／會診及解析列保留來源衝突。取消勾選或修正原文後重新計算，Reset 清除提示；不把未知、OR 或衝突的 raw PE 升格為確診。

### 本機功能驗證

不需要安裝套件，在 repo 根目錄執行：

```bash
node --test --test-isolation=none tests/*.test.cjs
```

測試使用 Node 內建 `node:test`／`vm` 與最小 DOM，載入真正的 HTML application script。案例均為合成資料，涵蓋各輸出、清除重填、段落邊界與兩院區 HC 設定。這是程式功能驗證；未代替正式站瀏覽器驗收。

### 驗證範圍

既有測試涵蓋 DDH／PE、欄位解析、來源細節、事件狀態、敘事語法、Copy 與 Reset。`tests/discharge-template-restoration.test.cjs` 驗證已恢復的出摘；`tests/admission-template-restoration.test.cjs` 驗證原版入摘語序、全文、finding 與精簡診斷。既有入摘／診斷區域斷言依最新要求調整，具體資料、否定、時點與衝突的要求保留在適用文書。詳見 [測試說明](tests/README.md)。

本次入摘／診斷修正以 PR #4 已驗收的出摘為基準，出摘函式保持不變。最終 **181 項測試全數通過，無失敗、取消或跳過**：保留 169 個既有案例，新增 12 個入摘／診斷驗收案例；其中 47 個既有案例依最新格式要求調整契約或文書區域斷言，沒有刪除案例。完整明示正常的入摘與原版全文一致，6 組出摘全文與 PR #4 逐字相同；兩位審閱者已讀完 6 組入摘、出摘及診斷全文。正式站結果在部署後另記錄於本次 PR。

已完成的歷史驗證：

- PR #1 的 DDH／PE 修正已合併、部署，並完成四個分頁的原文保留、衝突提示、Copy 及 Reset 正式站操作檢查。
- [PR #2](https://github.com/lantus123/mmh-newborn-summary/pull/2) 已合併至 `0845710` 並部署。該版有 **145 項本地測試通過**，另完成 **16 項正式站互動驗收**，包括敘事、待確認區、實際 Copy、Reset 與兩院區 HC。這些是該版資料保真、文句與操作的證據。
- PR #2 確實仍有 BR 文書用途的缺口：入院、出院使用共同的整段病程敘事，且待確認區要求補齊完整住院經過。先前的 145 項與 16 項驗收沒有覆蓋兩份文書應各自組織內容的要求，不能作為本輪修正的通過證明。
- [PR #3](https://github.com/lantus123/mmh-newborn-summary/pull/3) 在 `df963eef` 通過 159 項測試及 16 項正式站操作，修復兩份摘要共用全文；但仍把出摘改為重述出生背景、依輸入病程產文的方式。使用者其後明確要求回到原本出摘寫法，本輪以該要求調整，不把 PR #3 的產品形式當成固定前提。

- [PR #4](https://github.com/lantus123/mmh-newborn-summary/pull/4) 已恢復原版出摘並合併至 `bf4fd598`，通過 **169 項本機測試與 8 項正式站操作**。使用者接續要求入摘也恢復原版、診斷去除下方 risk factor 區塊，因此另做本次修正。

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
