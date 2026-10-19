# HIV 與 DDH：原版句型及完整合成範例

依使用者要求，非明確陽性的 HIV 不輸出；入摘、出摘的 DDH 回到原版簡短句型，僅在實際 finding 或必要限定內容存在時補充。診斷仍無 risk factor 附錄。

以下均為合成輸入與實際程式輸出。HD-01 入摘與整輪修改前原版全文一致，唯一文字差異是依要求移除陰性清單中的 HIV；HD-02 出摘 DDH 句與原版逐字一致。其他案例驗證缺值、異常與已記錄的追蹤狀態。

`index.html` SHA-256：`459fb2f9f7ad4397168fae991fe448890f9e7620ee69d93e15a04a48b08c74ad`

## HD-01：明示正常：HIV 陰性省略、DDH 回到原單句

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

### 入院摘要

This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. Physical examination revealed no gross anomalies. Screening for DDH risk factors and physical signs was negative. The infant was admitted to the Baby Room for routine newborn care.

### 出院摘要

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). The physical examination record stated “no gross anomalies”. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

### 診斷

# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA

## HD-02：有 DDH 風險且完整髖部檢查陰性

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
DDH risk factors: Breech(+)
子宮內壓迫徵象: negative
Hip PE: negative
```

### 入院摘要

This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. On physical examination, DDH screening noted risk factors including breech presentation, but physical signs were negative. The infant was admitted to the Baby Room for routine newborn care.

### 出院摘要

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). Due to identified DDH risk factors including breech presentation, DDH screening was performed; however, physical examination of the hips was unremarkable. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

### 診斷

# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA

## HD-03：有風險但沒記錄髖部結果

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
DDH risk factors: Breech(+)
子宮內壓迫徵象: negative
```

### 入院摘要

This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. On physical examination, DDH risk factors including breech presentation were identified. The infant was admitted to the Baby Room for routine newborn care.

### 出院摘要

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). DDH risk factors including breech presentation were identified. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

### 診斷

# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA

## HD-04：風險、壓迫與明確陽性：原句型保留必要 finding

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
Hip PE: Barlow(+), Ortolani(-)
PE: Heart murmur(+), grade 2/6 systolic at left sternal border; Left undescended testis(+)
```

### 入院摘要

This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. The physical examination record stated “Heart murmur(+), grade 2/6 systolic at left sternal border; Left undescended testis(+)”. On physical examination, musculoskeletal examination was notable for positive Barlow's sign, asymmetric thigh posture. DDH risk factors including oligohydramnios, twin pregnancy were identified. The infant was admitted to the Baby Room for routine newborn care.

### 出院摘要

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). The physical examination record stated “Heart murmur(+), grade 2/6 systolic at left sternal border; Left undescended testis(+)”. Due to identified DDH risk factors including oligohydramnios, twin pregnancy, and asymmetric thigh posture, as well as positive Barlow's sign, an outpatient follow-up examination was arranged for further evaluation of DDH. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

### 診斷

# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA
# Heart murmur, grade 2/6 systolic at left sternal border
# Undescended testis, left
# Positive Barlow's sign

## HD-05：HIV 明確陽性保留，DDH 已記錄計畫不寫成完成

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
HBsAg(-), HBeAg(-), HIV(+), RPR(-)
PROM(-), MAS(-)
DDH risk factors: Family Hx (+)
Hip PE: Barlow(+)
Follow-up: hip ultrasound planned at 6 weeks, appointment not yet arranged.
```

### 入院摘要

This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal history was significant for positive serology for HIV. Screening for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, RPR) was negative. There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. On physical examination, musculoskeletal examination was notable for positive Barlow's sign. DDH risk factors including family history of DDH were identified. The infant was admitted to the Baby Room for routine newborn care.

### 出院摘要

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). DDH risk factors including family history of DDH were identified. Musculoskeletal examination was notable for positive Barlow's sign. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The disposition record stated “Follow-up: hip ultrasound planned at 6 weeks, appointment not yet arranged”.

### 診斷

# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA
# Positive Barlow's sign

Additional source records
Disposition and follow-up, as recorded: Follow-up: hip ultrasound planned at 6 weeks, appointment not yet arranged..

## HD-06：HIV 不明省略，必要 DDH 不確定內容保留

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
HBsAg(-), HBeAg(-), HIV(?), RPR(-)
PROM(-), MAS(-)
DDH risk factors: Family Hx(?)
Hip PE: Barlow(+) or Ortolani(+)
```

### 入院摘要

This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. DDH risk assessment: Family Hx(?). Hip examination: Barlow(+) or Ortolani(+). The infant was admitted to the Baby Room for routine newborn care.

### 出院摘要

Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). DDH risk assessment: Family Hx(?). Hip examination: Barlow(+) or Ortolani(+). The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.

### 診斷

# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA

## 比對原則

資料缺漏不寫成陰性；單一 hip sign 陰性不推成全部髖部檢查正常。有風險不直接列為確診 DDH，陽性髖部徵象仍以 sign 記載。既有篩檢／回診模板保留使用者原本的寫法；同項原文明示計畫中、尚未安排、拒絕或取消時，以該記錄為準。
