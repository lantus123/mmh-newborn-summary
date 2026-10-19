# BR 入摘、出摘恢復原版：完整合成驗收範例

依使用者要求，入摘恢復原版一段式語序與入 Baby Room 結尾，出摘維持原版照護模板；診斷移除下方新增的 risk factor 區塊。重點是原始資料有 finding 時正確顯示，保留既有解析修正。

以下全部為合成資料及程式實際產生的全文。AS-01 明示正常／陰性以對照原版入摘全文；六組出摘另與 PR #4 完整輸出逐字比較一致。入摘與出摘的額外待確認清單均已移除。

`index.html` SHA-256：`8478678ecb01a088eb1ddede9c43ce083c961c756cf9b75f579b32ede00eb5b9`

## AS-01：完整明示正常的原版入摘

完整明示正常／陰性，與整輪修改前的入摘全文比較；不利用漏填資料來要求產生陰性。

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
HBsAg(-), HBeAg(-), HIV(-), RPR(-)
PROM(-), MAS(-)
PE: no gross anomalies.
DDH risk factors: negative
子宮內壓迫徵象: negative
Hip PE: negative
```

手動 PE：無。Sepsis 評估：未勾選。

### 原版入摘

This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, HIV, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. Physical examination revealed no gross anomalies. Screening for DDH risk factors and physical signs was negative. The infant was admitted to the Baby Room for routine newborn care.

與本版入摘全文一致（僅忽略 HTML 顯示空白）。

### 本版入院摘要

This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, HIV, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. Physical examination revealed no gross anomalies. Screening for DDH risk factors and physical signs was negative. The infant was admitted to the Baby Room for routine newborn care.

### 本版出院摘要

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). DDH risk screening was explicitly documented as negative. Intrauterine compression screening was explicitly documented as negative. Hip examination was explicitly documented as negative. The physical examination record stated “no gross anomalies”. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

### 本版診斷

# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA

額外待確認區：無。

## AS-02：有 finding 時正確顯示，診斷去除風險附錄

保留 DDH、壓迫與 PE 細節；明確陽性所見使用原診斷條列，風險本身不當成診斷。

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
HBsAg(-), HBeAg(-), HIV(-), RPR(-)
PROM(-), MAS(-)
DDH risk factors: Oligohydramnios (+), Twins (+)
子宮內壓迫徵象: 大腿姿勢不對稱 (+)
PE: Heart murmur(+), grade 2/6 systolic at left sternal border; Left undescended testis(+); Barlow(+), Ortolani(-)
```

手動 PE：無。Sepsis 評估：未勾選。

### 本版入院摘要

This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, HIV, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. Documented DDH risk factors included oligohydramnios and twin pregnancy. Documented intrauterine compression signs included asymmetric thigh posture. The physical examination record stated “Heart murmur(+), grade 2/6 systolic at left sternal border; Left undescended testis(+); Barlow(+), Ortolani(-)”. The infant was admitted to the Baby Room for routine newborn care.

### 本版出院摘要

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). Documented DDH risk factors included oligohydramnios and twin pregnancy. Documented intrauterine compression signs included asymmetric thigh posture. The physical examination record stated “Heart murmur(+), grade 2/6 systolic at left sternal border; Left undescended testis(+); Barlow(+), Ortolani(-)”. Due to identified DDH risk factors including oligohydramnios, twin pregnancy, and asymmetric thigh posture, as well as positive Barlow's sign, an outpatient follow-up examination was arranged for further evaluation of DDH. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

### 本版診斷

# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA
# Heart murmur, grade 2/6 systolic at left sternal border
# Undescended testis, left
# Positive Barlow's sign

額外待確認區：無。

## AS-03：原有勾選、感染評估與入 Baby Room 結尾

入摘恢復原 sepsis、血糖與勾選所見的模板；出摘保留 PR #4 的 HC 與衛教模板。

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
Maternal blood group: type O, Rh+
GBS(-)
GDM(+) under diet control
HBsAg(-), HBeAg(-), HIV(-), RPR(-)
PROM(+) 24 hours, MAS(-)
```

手動 PE：Caput succedaneum (check HC Q2H then QD)、Undescended testis (lt)。Sepsis 評估：已勾選。

### 本版入院摘要

This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). The mother's blood type was O, Rh+. Maternal GBS screening was negative. The mother had gestational diabetes managed with diet control. Maternal serology was negative for HBsAg, HBeAg, HIV, and RPR. The perinatal history included PROM for 24 hours. There was no meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. On physical examination, Caput succedaneum (check HC Q2H then QD) and Undescended testis (lt) were noted. Due to prolonged PROM (>18 hours), a sepsis workup including CBC/DC, CRP, and blood culture was performed. The infant was admitted to the Baby Room for routine newborn care, with blood glucose monitoring for 24 hours.

### 本版出院摘要

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). Due to prolonged PROM (>18 hours), a sepsis workup including CBC/DC, CRP, and blood culture was performed. The laboratory results were within normal limits. Due to the presence of caput succedaneum, head circumference was monitored every 2 hours (Q2H) for the first day, followed by daily (QD) measurements until discharge. No significant interval increase was observed. Blood glucose levels were monitored per protocol and remained within normal limits. The infant was noted to have left undescended testis. Caregivers were counseled regarding the condition and advised to follow up at the pediatric surgery clinic. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

### 本版診斷

# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA
# Caput succedaneum
# Undescended testis, lt
# Infant of diabetic mother
# Prolonged rupture of membranes
# Neonatal infection evaluation planned (selected)

額外待確認區：無。

## AS-04：原文與勾選衝突、OR 及不確定結果

摘要仍能核對真正衝突；未知／OR 不升格為確定陽性，也不使用已移除的診斷風險附錄。

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
HBsAg(-), HBeAg(-), HIV(-), RPR(-)
PROM(-), MAS(-)
DDH risk factors: Family Hx(?)
PE: Heart murmur(-); Barlow(+) or Ortolani(+)
```

手動 PE：Heart murmur。Sepsis 評估：未勾選。

### 本版入院摘要

This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, HIV, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. DDH risk screening, as recorded: Family Hx(?). The physical examination record stated “Heart murmur(-); Barlow(+) or Ortolani(+)”. PE source conflict: Heart murmur. Manual selection indicates presence, while the supplied PE records a negative or conflicting result. Please reconcile the source and manual selection. The infant was admitted to the Baby Room for routine newborn care.

### 本版出院摘要

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). DDH risk screening, as recorded: Family Hx(?). The physical examination record stated “Heart murmur(-); Barlow(+) or Ortolani(+)”. PE source conflict: Heart murmur. Manual selection indicates presence, while the supplied PE records a negative or conflicting result. Please reconcile the source and manual selection. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

### 本版診斷

# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA
# Heart murmur (source/manual conflict; presence not established)

額外待確認區：無。

## AS-05：晚期 PE 與照護留在適用的文書

原版入摘不增加後續病程；晚期所見、實際數值與出院安排仍保留於出摘，不再在入摘下方重複長篇資料。

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
HBsAg(-), HBeAg(-), HIV(-), RPR(-)
PROM(-), MAS(-)
PE: Heart murmur(-) at birth, Heart murmur(+) on day 2
Nursery course: feeding was well tolerated at 48 hours of age.
Transcutaneous bilirubin: 8.4 mg/dL at 60 hours of age
Discharged home in stable condition at 72 hours of age.
OPD follow-up on 2026-10-26.
```

手動 PE：無。Sepsis 評估：未勾選。

### 本版入院摘要

This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, HIV, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. Heart murmur was absent at birth. The infant was admitted to the Baby Room for routine newborn care.

### 本版出院摘要

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). Heart murmur was absent at birth. Heart murmur was present on day 2. Feeding was well tolerated at 48 hours of age. Transcutaneous bilirubin was 8.4 mg/dL at 60 hours of age. The infant was managed with routine nursery care and rooming-in was arranged with the mother. 

 The infant was discharged home in stable condition at 72 hours of age. OPD follow-up was planned for 2026-10-26.

### 本版診斷

# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA
# Heart murmur, on day 2

額外待確認區：無。

## AS-06：原文明示尚未執行的入院處置

明示尚未執行／計畫的同項處置優先，恢復原模板不會同時寫成相反的已完成病程。

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
HBsAg(-), HBeAg(-), HIV(-), RPR(-)
PROM(-), MAS(-)
Respiratory support at admission: CPAP planned; oxygen not yet administered.
Sepsis workup at admission: CBC/DC, CRP, and blood culture planned, not yet performed.
```

手動 PE：Respiratory distress。Sepsis 評估：已勾選。

### 本版入院摘要

This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, HIV, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. On physical examination, the infant exhibited respiratory distress. The treatment record stated “Sepsis workup at admission: CBC/DC, CRP, and blood culture planned, not yet performed”. The infant was admitted to the Baby Room. The treatment record stated “Respiratory support at admission: CPAP planned; oxygen not yet administered”.

### 本版出院摘要

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). Physical examination findings included Respiratory distress. The treatment record stated “Respiratory support at admission: CPAP planned; oxygen not yet administered”. The treatment record stated “Sepsis workup at admission: CBC/DC, CRP, and blood culture planned, not yet performed”.

### 本版診斷

# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA
# Respiratory distress
# Neonatal infection evaluation planned (selected)

Additional source records
Treatment and prophylaxis, as recorded: Respiratory support at admission: CPAP planned; oxygen not yet administered.
Sepsis workup at admission: CBC/DC, CRP, and blood culture planned, not yet performed..

額外待確認區：無。

## 驗收範圍

入摘及出摘各有固定原版全文、選項、finding、否定／不確定、來源優先、Copy 和 Reset 測試。診斷不要求用風險附錄保存原文，三份文書與 parser 仍驗證應有 finding；風險或不確定所見不可變成確診。晚期 PE 不回填成初始所見，出摘仍保留實際時間與照護。

這些固定案例不代表任意自由文字都能自動判讀。
