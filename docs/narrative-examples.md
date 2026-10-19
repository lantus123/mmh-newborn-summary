# BR 出摘恢復原版寫法：完整合成驗收範例

依使用者要求，出摘恢復原本「常規預防處置 → BR 照護 → 餵食 → 膽紅素與出院安排」的模板及勾選產文方式，不再重述出生、母體背景，也不要求先補完整照護經過。

以下是程式實際產生的全文；全部為合成資料。一般案例的原版模板逐字保留；同項已有明確原文時以原文取代預設句，DDH／子宮內壓迫／PE 的解析修正仍保留。入摘維持先前的初始資料與時間範圍。

`index.html` SHA-256：`bcd2a7132785639685a84c1c130c9aadb5adda4a3d93ef3039b12f5363a77bbc`

## DS-01：只有產房資料，恢復原版常規出摘

不要求另填 BR course，出摘從常規預防處置开始，不重複出生或母體背景；與原版完整文字比較。

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
GBS(-)
GDM(-)
PROM(-)
```

手動選項：無。Sepsis 評估：未勾選。

### 原版出摘

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

與本版出摘全文逐字一致。

### 本版入院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

Maternal GBS screening was negative. The maternal history was negative for gestational diabetes. There was no premature rupture of membranes (PROM).

### 入院摘要待確認區

無待確認提示。

### 本版出院摘要正文

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

### 出院摘要待確認區

無待確認提示。

## DS-02：原文 DDH、子宮內壓迫及詳細 PE

在原本 BR 照護模板中保留來源的風險及所見，不把漏讀或缺 PE 改寫成正常。

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
GBS(-)
GDM(-)
PROM(-)
DDH risk factors: Oligohydramnios (+), Twins (+)
子宮內壓迫徵象: 大腿姿勢不對稱 (+)
PE: Heart murmur(+), grade 2/6 at left sternal border.
```

手動選項：無。Sepsis 評估：未勾選。

### 本版入院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

Maternal GBS screening was negative. The maternal history was negative for gestational diabetes. There was no premature rupture of membranes (PROM).

Documented DDH risk factors included oligohydramnios and twin pregnancy. Documented intrauterine compression signs included asymmetric thigh posture. The physical examination record stated “Heart murmur(+), grade 2/6 at left sternal border”.

### 入院摘要待確認區

無待確認提示。

### 本版出院摘要正文

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). Documented DDH risk factors included oligohydramnios and twin pregnancy. Documented intrauterine compression signs included asymmetric thigh posture. The physical examination record stated “Heart murmur(+), grade 2/6 at left sternal border”. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

### 出院摘要待確認區

無待確認提示。

## DS-03：PROM 自動勾選與原有 HC 模板

依既有 PROM 判讀自動勾選感染評估，出摘恢復 sepsis 完成句；勾选 caput 與 HC 後帶入北馬原有 Q2H→QD 監測段落。

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
GBS(-)
GDM(-)
PROM(+) 24 hours
```

手動選項：Caput succedaneum (check HC Q2H then QD)。Sepsis 評估：已勾選。

### 本版入院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

Maternal GBS screening was negative. The maternal history was negative for gestational diabetes. The perinatal history included PROM for 24 hours.

Physical examination findings included Caput succedaneum.

### 入院摘要待確認區

待確認事項（不包含在複製內容）

已選取的評估／處置計畫
Sepsis evaluation plan selected for prolonged PROM (>18 hours): CBC/DC, CRP, and blood culture. Completion and results require confirmation from the clinical record. Selected head circumference monitoring plan: every 2 hours (Q2H) for the first day, followed by daily (QD) measurements until discharge.

### 本版出院摘要正文

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). Due to prolonged PROM (>18 hours), a sepsis workup including CBC/DC, CRP, and blood culture was performed. The laboratory results were within normal limits. Due to the presence of caput succedaneum, head circumference was monitored every 2 hours (Q2H) for the first day, followed by daily (QD) measurements until discharge. No significant interval increase was observed. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

### 出院摘要待確認區

無待確認提示。

## DS-04：原有短版衛教

選取左側 undescended testis 與 hydrocele，恢復原本直接寫入出摘的短版衛教。長版另有固定測試。

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
GBS(-)
GDM(-)
PROM(-)
```

手動選項：Hydrocele、Undescended testis (lt)。Sepsis 評估：未勾選。

### 本版入院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

Maternal GBS screening was negative. The maternal history was negative for gestational diabetes. There was no premature rupture of membranes (PROM).

Physical examination findings included Hydrocele and Undescended testis (lt).

### 入院摘要待確認區

無待確認提示。

### 本版出院摘要正文

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). The infant was noted to have left undescended testis. Caregivers were counseled regarding the condition and advised to follow up at the pediatric surgery clinic. The infant was noted to have hydrocele. Caregivers were counseled regarding the condition and advised to follow up at the pediatric surgery clinic. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

### 出院摘要待確認區

無待確認提示。

## DS-05：實際 BR 數值及出院安排取代同項模板

維持原版從照護開始的寫法，同項有明確來源時保留 TcB、時間及追蹤日期，不另寫 total bilirubin WNL 或另一份預設出院安排。

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
GBS(-)
GDM(-)
PROM(-)
PE: Heart murmur(-), Grunting(-)
Admitted to BR for routine newborn care.
Nursery course: feeding was well tolerated at 48 hours of age.
Vital signs: stable
Transcutaneous bilirubin: 8.4 mg/dL at 60 hours of age
Education: caregivers were counseled about feeding and jaundice.
Discharged home in stable condition at 72 hours of age.
OPD follow-up on 2026-10-26.
```

手動選項：無。Sepsis 評估：未勾選。

### 本版入院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

Maternal GBS screening was negative. The maternal history was negative for gestational diabetes. There was no premature rupture of membranes (PROM).

The infant was admitted to BR for routine newborn care. Heart murmur and grunting were absent.

### 入院摘要待確認區

待確認事項（不包含在複製內容）

後續或未明示入院時點的臨床紀錄，保留於本區核對，未納入入院正文。
Nursery course: feeding was well tolerated at 48 hours of age.
Vital signs: stable
Transcutaneous bilirubin: 8.4 mg/dL at 60 hours of age
Education: caregivers were counseled about feeding and jaundice.
Discharged home in stable condition at 72 hours of age.
OPD follow-up on 2026-10-26.

### 本版出院摘要正文

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). Heart murmur and grunting were absent. The infant was admitted to BR for routine newborn care. Feeding was well tolerated at 48 hours of age. Vital signs were stable. Transcutaneous bilirubin was 8.4 mg/dL at 60 hours of age. Caregivers were counseled about feeding and jaundice. 

 The infant was discharged home in stable condition at 72 hours of age. OPD follow-up was planned for 2026-10-26.

### 出院摘要待確認區

無待確認提示。

## DS-06：拒絕、尚未施打與計畫出院

來源明示的拒絕、未施打與條件式出院取代對應預設，保留其餘原版常規模板。

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
GBS(-)
GDM(-)
PROM(-)
HBsAg(+)
Treatment: HBIG not yet administered; parents declined HBV vaccine.
Nursery course: feeding was well tolerated.
Education: caregivers will be counseled before discharge.
Discharge: planned if the repeat bilirubin result is acceptable; not yet discharged.
```

手動選項：無。Sepsis 評估：未勾選。

### 本版入院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

Maternal GBS screening was negative. The maternal history was negative for gestational diabetes. Maternal serology was positive for HBsAg. There was no premature rupture of membranes (PROM).

### 入院摘要待確認區

待確認事項（不包含在複製內容）

後續或未明示入院時點的臨床紀錄，保留於本區核對，未納入入院正文。
Treatment: HBIG not yet administered; parents declined HBV vaccine.
Nursery course: feeding was well tolerated.
Education: caregivers will be counseled before discharge.
Discharge: planned if the repeat bilirubin result is acceptable; not yet discharged.

### 本版出院摘要正文

Upon admission, the infant received routine prophylaxis including tetracycline ophthalmic ointment (topical) and Vitamin K1 (IM). HBIG was not yet administered. Parents declined HBV vaccine. Feeding was well tolerated. Caregivers will be counseled before discharge. 

 The disposition record stated “Discharge: planned if the repeat bilirubin result is acceptable; not yet discharged”.

### 出院摘要待確認區

無待確認提示。

## 驗收範圍

`tests/discharge-template-restoration.test.cjs` 比對原版全文、選項產文、來源優先、DDH／PE、兩院區 HC、Copy 與 Reset。既有測試保留核心解析、入摘時間範圍與其他分頁要求；出摘先前「缺紀錄不得使用常規模板」及「重述出生背景」的期待，已依使用者要求調整。

這些固定案例不代表任意自由文字都能自動判讀。
