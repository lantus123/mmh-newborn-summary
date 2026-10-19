# 敘事驗收範例（合成資料）

這份檔案保留七種驗收情境的完整輸入與程式實際產出的出院正文，供審查資料忠實度、文字流暢性和臨床順序。所有資料均為合成測試資料。

`tests/narrative-quality.test.cjs` 驗證這些情境的關鍵事實、段落、時間、處置狀態與複製範圍；`tests/narrative-qualifiers.test.cjs` 覆蓋獨立文字審查找到的限定語與時間尺度反例。通過列出的案例不代表任意自由文字皆能解析。

一般未提供欄位不會塞入病程正文；未確認的 UI 計畫及衛教準備顯示於正文旁的待確認區。實際來源衝突、不確定結果與明示未執行的處置仍保留在可複製正文。

程式只依已提供的事實組織句子。未記載療效、穩定出院或追蹤時，不補寫結局。對無法確定語意的簡寫保留完整引文；同一時間尺度的單一 day-N 事件才按日期整理，不同起算點保留原文順序。

`index.html` SHA-256：`b5a619578069ae3deff89697957072e9cc40568365f2c17195e9330ab64492e1`

## DN-01：完整病程與明示的治療反應、出院安排

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
Maternal blood group: type O, Rh+
GBS(-)
GDM(-)
Pre-eclampsia(-)
HBsAg(-), HBeAg(-), HIV(-), RPR(-)
PE: Jaundice(+) at 48 hours of age
PROM(-)
MAS(-)
Resuscitation: Manual positive pressure ventilation(-), Intubation(-)
Total bilirubin: 18.2 mg/dL at 48 hours of age
Treatment: phototherapy started at 50 hours and stopped at 74 hours
Hospital course: total bilirubin decreased to 11.0 mg/dL at 74 hours. Feeding was well tolerated.
Education: caregivers were counseled about jaundice and follow-up.
Discharge: clinically stable at 80 hours; OPD follow-up on 2026-10-26.
```

手動所見：無。

### 程式實際產出的出院正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

The mother's blood type was O, Rh+. Maternal GBS screening was negative. The maternal history was negative for gestational diabetes and preeclampsia. Maternal serology was negative for HBsAg, HBeAg, HIV, and RPR. There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS).

Manual positive pressure ventilation was not provided. Intubation was not performed. Jaundice was present at 48 hours of age.

Total bilirubin was 18.2 mg/dL at 48 hours of age. Phototherapy was started at 50 hours and stopped at 74 hours. Total bilirubin decreased to 11.0 mg/dL at 74 hours. Feeding was well tolerated. Caregivers were counseled about jaundice and follow-up.

The infant was discharged in clinically stable condition at 80 hours. OPD follow-up was planned for 2026-10-26.

### 正文外的待確認區

此情境沒有尚待補充或勾選的提示。

## DN-02：僅出生資料，沒有住院病程

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
```

手動所見：無。

### 程式實際產出的出院正文

This male newborn was born at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age.

### 正文外的待確認區

待確認事項（不包含在複製內容）尚未提供完整住院經過；請依實際紀錄補充病程與治療反應。 尚未提供出院狀態與後續安排；請在完成出院摘要前補入。

## DN-03：明確陰性、尚未執行、拒絕與手動計畫

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
PE: Respiratory distress(+), Grunting(-)
Treatment: HBIG not yet administered; parents declined HBV vaccine.
Respiratory support: CPAP planned, not started.
```

手動所見：Respiratory distress。

此情境另選取 sepsis 評估與因呼吸症狀轉入 NBC 的計畫；下方正文不將勾選當作已完成處置。

### 程式實際產出的出院正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

Respiratory distress was present. Grunting was absent.

HBIG was not yet administered. Parents declined HBV vaccine. CPAP was planned, not started.

### 正文外的待確認區

待確認事項（不包含在複製內容）尚未提供出院狀態與後續安排；請在完成出院摘要前補入。已選取的評估／處置計畫
Sepsis evaluation plan selected: CBC/DC, CRP, and blood culture. Completion and results require confirmation from the clinical record. Selected transfer plan: NBC for respiratory symptoms. Transfer completion and the subsequent course must follow the supplied record.

## DN-04：未明資料與相互衝突的來源

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
GDM status unknown
GBS(+)
GBS(-)
PE: Heart murmur(-)
```

手動所見：Heart murmur。

### 程式實際產出的出院正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

Maternal GBS status entries were conflicting (“GBS(+)”; “GBS(-)”). Maternal gestational diabetes status was recorded as unknown.

The physical examination record stated “Heart murmur(-)”. PE source conflict: Heart murmur. Manual selection indicates presence, while the supplied PE records a negative or conflicting result. Please reconcile the source and manual selection.

### 正文外的待確認區

待確認事項（不包含在複製內容）尚未提供完整住院經過；請依實際紀錄補充病程與治療反應。 尚未提供出院狀態與後續安排；請在完成出院摘要前補入。

## DN-05：治療確已開始，但沒有反應或出院資料

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
PE: Respiratory distress(+)
Respiratory support: CPAP started at 2 hours of age.
```

手動所見：Respiratory distress。

### 程式實際產出的出院正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

Respiratory distress was present.

CPAP was started at 2 hours of age.

### 正文外的待確認區

待確認事項（不包含在複製內容）尚未提供出院狀態與後續安排；請在完成出院摘要前補入。

## DN-06：PE 內夾有檢驗／治療，且有同向手動 finding

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
PE:
Heart murmur(+), grade 2/6, left sternal border
Respiratory support: CPAP
Blood glucose: 28 mg/dL
```

手動所見：Heart murmur。

### 程式實際產出的出院正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

A heart murmur was present (grade 2/6, left sternal border).

Respiratory support consisted of CPAP. Blood glucose was 28 mg/dL.

### 正文外的待確認區

待確認事項（不包含在複製內容）尚未提供出院狀態與後續安排；請在完成出院摘要前補入。

## DN-07：來源段落亂序、同時存在的事實不等於因果

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
Discharge: clinically stable on day 4; OPD follow-up on 2026-10-26.
Laboratory: blood culture positive for E. coli on day 2.
Treatment: ampicillin started on day 1.
Hospital course: feeding was well tolerated on day 3.
```

手動所見：無。

### 程式實際產出的出院正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

Ampicillin was started on day 1. Blood culture was positive for E. coli on day 2. Feeding was well tolerated on day 3.

The infant was discharged in clinically stable condition on day 4. OPD follow-up was planned for 2026-10-26.

### 正文外的待確認區

此情境沒有尚待補充或勾選的提示。

