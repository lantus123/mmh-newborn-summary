# 馬偕新生兒 BR 入院、出院摘要與會診單產生器

Mackay Memorial Hospital · BR Admission Summary & Consultation Form Generator

貼入產房與 BR 資料，搭配原有選項，即時產生入院摘要、出院摘要、會診單與診斷。

## 原始文書模板

文書以整輪 DDH／PE 修改前的原版 `81a73dcf5738ed58632e54fc9b7f0d1d66088213` 為基準。保留原本語序、句型、段落及勾選產文方式；修正來源已有、卻漏抓或顯示錯誤的資料，放回原有位置。

| 文書 | 原有結構 |
| --- | --- |
| 入院摘要 | 一段式：出生／BW → 母體 → PROM／MAS → APGAR → PE／DDH → 原有評估及入 Baby Room 結尾。 |
| 出院摘要 | 常規預防處置 → 對應的照護／finding → routine nursery care／rooming-in → 餵食 → bilirubin 與出院安排。 |
| 會診單 | `Dear Dr` → 原本高風險產房會診開頭 → `@ Maternal condition` → `@ Newborn's condition` → `High risk neonatal critical care` → 原本 BR 結尾。 |
| 診斷 | 原本 `#` 條列，陽性 finding 依其所見及必要側別／分級呈現。 |

沒有新加的來源彙整、整段引文、待確認清單、臨床紀錄章節或 risk factor 附錄。入摘與出摘保留各自原本的用途與寫法。

### 有資料時的對應顯示

- DDH risk、子宮內壓迫徵象及 hip PE 支援空白、換行、大小寫及全形符號；辨識結果放入原有 PE／DDH 句子。會診中漏掉的風險與所見補在既有新生兒 PE 位置。
- 原始 PE 的分級、左右側及有意義的限定詞保留；同一所見與手動選項合併，避免重複。Plan、Maternal history 等段落不誤作新生兒 PE。
- 有明確否定、未知、替代關係或真正衝突時，只在相關欄位保留必要限定，不把 `Barlow(+) or Ortolani(+)` 寫成兩項確定陽性。
- DDH 有風險但缺乏足夠髖部陰性資料時，不補成 hip examination unremarkable。風險本身不成為診斷。
- HIV 只有明確陽性才輸出；陰性、未提供、未知或結果衝突不加入常規清單。
- 已記錄的同項臨床資料修正原模板相應句子，例如實際處置結果、尚未執行、拒絕或取消。沒有另外建立病程轉寫或轉 NBC 工作流程。

### 保留的解析與操作修正

GBS、GDM、PROM、MAS、preeclampsia、serology、母嬰主詞、IAP 狀態與數值單位的解析修正保留。缺少出生數值不自行填入 Term／AGA；母體與嬰兒的篩檢不混用。

原有手動選項、感染評估自動勾選、兩院區 HC 設定、衛教長短版、Copy 與 Reset 沿用。換貼資料時重算自動狀態，保留手動選擇；Reset 清除資料、輸出及選項。

## 驗收

使用相同合成輸入與相同原有勾選，同時執行原版及修正版。驗收比較完整三份文書；正常既有文字維持原版，有 finding 時的差異限於原有位置的資料補正與明確要求的例外。

- [測試契約與執行方式](tests/README.md)
- [完整合成輸入及文書輸出](docs/narrative-examples.md)
- [修改、合併與部署紀錄](https://github.com/lantus123/mmh-newborn-summary/pulls?q=is%3Apr+is%3Amerged)

前幾輪的通過數字僅記錄當時版本，不作為此次原始模板恢復的驗收依據。

本機無需安裝套件：

```bash
node --test --test-isolation=none tests/*.test.cjs
```

測試載入真正的 HTML application script，透過 Node 內建 `node:test`／`vm` 和最小 DOM 檢查解析、產文及事件。正式站另以實際介面驗收 Copy、Reset 及兩院區行為。

## 多院區

| 院區 | URL | HC 設定 |
| --- | --- | --- |
| 北馬 | https://lantus123.github.io/mmh-newborn-summary/ | Q2H → QD |
| 東馬 | https://lantus123.github.io/mmh-newborn-summary/?campus=ttmh | Q8H |

同一份程式透過 `?campus=` 切換院區。新增院區時編輯 `index.html` 的 `CAMPUS_CONFIGS`；各院區共用解析及產文函式。

## 部署

純靜態 HTML，由 GitHub Pages 部署。Google Sites 可透過對應院區網址內嵌。

變更應先比較完整文書與驗證必要案例，再合併到 `main`；部署完成後確認正式站的實際輸出。
