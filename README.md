# 馬偕新生兒 BR 入院、出院摘要與會診單產生器

Mackay Memorial Hospital · BR Admission Summary & Consultation Form Generator

Single-page client-side tool: 貼入產房與 BR 原始紀錄 → 即時生成診斷、入院摘要、會診單、出院摘要。

入院與出院摘要各有用途：**BR 入院摘要描述入室時的背景與初始評估；BR 出院摘要簡述實際 BR 照護及離室安排。**兩份正文應各自組織內容，保留資料原意與臨床時序。

## BR 入院與出院的用途（2026-10-19 修正）

| 文書 | 範圍 |
| --- | --- |
| BR 入院摘要 | 出生、母體、產時、初始 PE 與入室初始評估。後續照護經過不併入入院正文。 |
| BR 出院摘要 | 簡述出生資料及必要風險／PE，再呈現實際 BR 照護、離室狀態與已記載的出院安排。 |

- 兩份摘要各自產生正文；出生資料等事實解析可共用，入院與出院不再共用同一份完整病程敘事。
- `planned`、尚未執行及 UI checkbox 保持計畫狀態，不轉寫成已完成處置。
- BR 摘要不要求補齊「完整住院經過」或「治療反應」。沒有記載實際照護、恢復或離室狀態時，不自動補成正常療程、症狀改善或穩定出院。
- 初始 DDH／子宮內壓迫不因原文行序而漏寫。明示晚期 PE 不提前；同項手動勾選的時間需核對時，來源與選項留在待確認區，真正衝突仍在正文提示。
- 本輪 **159 項測試全數通過**，包含 14 個一般 BR 文件用途案例；另讀取六組來源的兩份完整正文，修正後複驗具體問題。部署與正式站結果另記於合併 PR。

## 文字流暢性與資料保真

在各份 BR 文書的範圍內，以完整英文句子整理已提供的事實。BR 出院依出生背景、BR 照護、BR 離室去向組織段落；BR 入院保持入室時點的內容。會診單保留分區格式。

- 缺值、重複欄位標題、UI 勾選計畫與衛教 checklist 不串進摘要正文。只有出生資料時，就產生相應的簡短出生段落。
- 已記載的處置、症狀、衛教與去向，先確認是否屬於當次 BR 文書，再保留其實際狀態；沒有記載的療效、症狀消失或穩定出院不補寫。
- 數值、單位、藥名、劑量、時間、否定、拒絕與未執行狀態保持原意。格式不明或含無法確定的限定語時保留完整引文，避免為了句子流暢而選定某一個可能結果。
- 在已歸入同一份文書的事件內，整理日期只限各行明確提供相同起算點的單一 `on day N` 事件。不同起算點不混排，不增加「因此」等來源未提供的因果關係。
- 原始 PE 的分級／左右側保留，同向手動所見去重。原文與手動選項的真正衝突仍留在可複製正文，避免複製後丟失不確定性。
- 評估／NBC／血糖／HC 計畫及衛教準備保留在正文外，兩頁 Copy 都只複製正文。空白、Reset 與換貼資料會同步清理待確認區。
- 出生數值含 `corrected`／`revised`／`amended` 更正說明時保留原文供核對，不將第一個數值當作確定結果。分娩器械的替代關係與明確陰性在三份文字輸出中一致處理。

合成輸入與輸出對照集中於 [敘事驗收範例](docs/narrative-examples.md)。PR #2 的舊版案例含照光、CPAP、抗生素與後續住院段落，原用途是驗證英文語法、資料保真、時間及處置狀態；它們不定義 BR 流程，也不能證明這些後段應寫入 BR 摘要。本輪範例已改為六組一般 BR 入摘／出摘對照，不以較長住院療程作為主範本。

## 核心欄位與病程轉寫（2026-10-19 後續修正）

- GBS、GDM、PROM、MAS、preeclampsia 與 serology 依各自欄位旁的結果判讀，分清陽性、陰性、未記錄／不明及衝突。同一行其他欄位的 `+`／`-` 不會互相覆蓋。
- 母親與嬰兒的血型、篩檢結果依明示主詞或段落區分；保留未標示 maternal 的既有篩檢格式。原文結果不明時保留原文，供核對。
- GA 支援 `36+6`、`36w6d`、`36 6/7 weeks`；BW 支援 `3.2 kg`、`3,200 gm`；PROM 支援小數與日／時／分換算。缺 GA 或生長分類時不再自動補成 Term／AGA。
- IAP 的「有記載」、「充分」、「不充分」分開處理，支援分行記錄。單純 `s/p IAP` 不再變成充分完成，原文的藥名、劑量等細節仍保留。
- 產前用藥、復甦、檢驗、治療、預防處置、病程與去向依各份摘要用途選取；寫出時保留數值、否定、待執行或拒絕狀態。不由風險或 PE 勾選產生「已做檢查」、「結果正常」、「已接種」、「症狀消失」等敘述。
- Sepsis／NBC 勾選、血糖與兩院區 HC 監測條件產生明確標示的計畫。實際執行、結果、衛教完成與出院狀態由提供的臨床紀錄決定。手動 Respiratory distress 會列入診斷，不推定病因。
- 換貼資料會撤回舊的自動感染評估建議，再依目前資料重算。手動 PE、評估及性別選擇在編輯時保留，按 Reset 才一併清除。
- 未記載嬰兒性別時不再預設女性；空白輸入不會拿 placeholder 範例生成個案。Reset 後尚在排程中的輸入更新也不會恢復範例或舊輸出。

## DDH 與 PE 紀錄轉寫（2026-10-19 修正）

- DDH risk、子宮內壓迫徵象及 hip PE 支援空白、換行、大小寫與全形符號，例如 `Oligohydramnios (+)`、`大腿姿勢不對稱（＋）`。
- 陽性、陰性、未記錄、結果不明或前後矛盾分別處理。未辨識到陽性不代表陰性；單一檢查陰性也不代表整套 hip examination 正常。
- 入院摘要、會診單與出院摘要共用 DDH／PE 的解析及事實保留規則，各份摘要依用途組織正文。診斷頁另列「Risk factors and examination findings」，保留紀錄層級。
- `PE:`／`Physical examination:`／`理學檢查:` 的自由文字保留分級、左右側及補充描述。已標示的 Plan、Maternal history 等段落不作為新生兒檢查結果。
- 不明格式、共同否定、條件語句及限定文字以原文保留，解析列提示核對；文字以 HTML escaping 顯示。
- 原文 PE 與手動 checkbox 維持獨立，原文所見不會自行觸發 checkbox 的病程模板。DDH 結果本身不再產生「髖關節正常」或「已安排回診」的推定敘述。
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

既有測試涵蓋 DDH／PE、欄位解析、來源細節、事件狀態、敘事語法、Copy 與 Reset。本輪新增 `tests/br-document-scope.test.cjs`，專門驗證 BR 入院的初始評估、BR 出院的實際照護與離室安排，以及兩份正文各自的內容與順序。本輪 **159 項通過、0 失敗、0 跳過**；`index.html` SHA-256 為 `1989cf2b19307fa41be43cfffc54e29489729d04f0df5a1f5e3178589c705980`。詳見 [測試說明](tests/README.md)。

已完成的歷史驗證：

- PR #1 的 DDH／PE 修正已合併、部署，並完成四個分頁的原文保留、衝突提示、Copy 及 Reset 正式站操作檢查。
- [PR #2](https://github.com/lantus123/mmh-newborn-summary/pull/2) 已合併至 `0845710` 並部署。該版有 **145 項本地測試通過**，另完成 **16 項正式站互動驗收**，包括敘事、待確認區、實際 Copy、Reset 與兩院區 HC。這些是該版資料保真、文句與操作的證據。
- PR #2 確實仍有 BR 文書用途的缺口：入院、出院使用共同的整段病程敘事，且待確認區要求補齊完整住院經過。先前的 145 項與 16 項驗收沒有覆蓋兩份文書應各自組織內容的要求，不能作為本輪修正的通過證明。

本輪邏輯與全文驗收已完成，正式站部署後的操作结果記錄於合併 PR。任意自由文字格式與原生 iOS Safari 行為，不因上述合成案例或桌面瀏覽器檢查而視為全面驗證。

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
