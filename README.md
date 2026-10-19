# 馬偕新生兒入院摘要與會診單產生器

Mackay Memorial Hospital · BR Admission Summary & Consultation Form Generator

Single-page client-side tool: 貼入產房原始紀錄 → 即時生成診斷、入院摘要、會診單、出院摘要。

## 敘事品質與臨床順序（2026-10-19）

入院及出院摘要以完整英文句子整理已提供的出生背景、母體／產時資料、檢查與住院經過，最後呈現已記載的出院狀態及追蹤安排。會診單保留分區格式，出生敘述共用同一個產生器。

- 不再將每個缺值、重複欄位標題、UI 勾選計畫或衛教 checklist 串進病程正文。只有出生資料時就產生簡短出生段落，待補住院／出院資訊顯示於正文外的「待確認事項」。
- 病程可寫成 `The infant had persistent fever, and antibiotics were started.`；來源沒有記載退燒或出院時，不加上治療反應或出院結局。原文有明示的療效、衛教及出院狀態則照實保留。
- 數值、單位、藥名、劑量、時間、否定、拒絕與未執行狀態保持原意。格式不明或含無法確定的限定語時保留完整引文，避免為了句子流暢而選定某一個可能結果。
- 整理日期只限各行明確提供相同起算點的單一 `on day N` 事件。不同起算點不混排，不增加「因此」等來源未提供的因果關係。
- 原始 PE 的分級／左右側保留，同向手動所見去重。原文與手動選項的真正衝突仍留在可複製正文，避免複製後丟失不確定性。
- 評估／NBC／血糖／HC 計畫及衛教準備保留在正文外，兩頁 Copy 都只複製正文。空白、Reset 與換貼資料會同步清理待確認區。
- 出生數值含 `corrected`／`revised`／`amended` 更正說明時保留原文供核對，不將第一個數值當作確定結果。分娩器械的替代關係與明確陰性在三份文字輸出中一致處理。

七種情境的完整合成輸入與程式實際輸出見 [敘事驗收範例](docs/narrative-examples.md)。本輪在原有 125 項回歸之上新增 20 項敘事、限定語與 UI／Copy 測試，共 **145 項通過**；文字流暢性另按完整段落閱讀驗收，不以關鍵字命中代替。

## 核心欄位與病程轉寫（2026-10-19 後續修正）

- GBS、GDM、PROM、MAS、preeclampsia 與 serology 依各自欄位旁的結果判讀，分清陽性、陰性、未記錄／不明及衝突。同一行其他欄位的 `+`／`-` 不會互相覆蓋。
- 母親與嬰兒的血型、篩檢結果依明示主詞或段落區分；保留未標示 maternal 的既有篩檢格式。原文結果不明時保留原文，供核對。
- GA 支援 `36+6`、`36w6d`、`36 6/7 weeks`；BW 支援 `3.2 kg`、`3,200 gm`；PROM 支援小數與日／時／分換算。缺 GA 或生長分類時不再自動補成 Term／AGA。
- IAP 的「有記載」、「充分」、「不充分」分開處理，支援分行記錄。單純 `s/p IAP` 不再變成充分完成，原文的藥名、劑量等細節仍保留。
- 產前用藥、復甦、檢驗、治療、預防處置、病程與去向依原文輸出；保留數值、否定、待執行或拒絕狀態。不由風險或 PE 勾選產生「已做檢查」、「結果正常」、「已接種」、「症狀消失」等敘述。
- Sepsis／NBC 勾選、血糖與兩院區 HC 監測條件產生明確標示的計畫。實際執行、結果、衛教完成與出院狀態由提供的臨床紀錄決定。手動 Respiratory distress 會列入診斷，不推定病因。
- 換貼資料會撤回舊的自動感染評估建議，再依目前資料重算。手動 PE、評估及性別選擇在編輯時保留，按 Reset 才一併清除。
- 未記載嬰兒性別時不再預設女性；空白輸入不會拿 placeholder 範例生成個案。Reset 後尚在排程中的輸入更新也不會恢復範例或舊輸出。

## DDH 與 PE 紀錄轉寫（2026-10-19 修正）

- DDH risk、子宮內壓迫徵象及 hip PE 支援空白、換行、大小寫與全形符號，例如 `Oligohydramnios (+)`、`大腿姿勢不對稱（＋）`。
- 陽性、陰性、未記錄、結果不明或前後矛盾分別處理。未辨識到陽性不代表陰性；單一檢查陰性也不代表整套 hip examination 正常。
- 入院摘要、會診單與出院摘要使用共同的紀錄輸出。診斷頁另列「Risk factors and examination findings」，保留紀錄層級。
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

測試包含既有 DDH／PE 回歸、先前驗收的 15 組核心問題、8 個病程輸出案例及 2 個 UI 案例，以及欄位解析、來源細節、事件狀態與敘事品質的補充回歸。詳見 `tests/README.md`。通過結果只涵蓋列出的合成案例與程式行為，並不涵蓋任意自由文字格式。

DDH／PE 的 PR #1 已合併並成功部署，正式站四個分頁的原文保留、衝突提示、複製及 Reset 已完成瀏覽器操作檢查。這次後續修正的候選版仍以實際 HTML script 的邏輯驗證為主；測試瀏覽器阻擋本機 HTML，故候選版的版面／剪貼簿，以及手機及 iOS Safari 尚未驗證。

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
