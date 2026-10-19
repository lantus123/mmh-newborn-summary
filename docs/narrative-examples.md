# 原始模板與對應 finding：完整產文驗收

以下全部為合成輸入，以真正的原版與修正版程式產文。原版基準為整輪 DDH／PE 修改前的 `81a73dcf5738ed58632e54fc9b7f0d1d66088213`。

目標是保留原有模板，僅補正相對應的既有資料。常規預填文句沿用原模板；明確同項資料在原欄位修正，不增加臨床紀錄、來源引文或待確認章節。HIV 僅明確陽性顯示，診斷沒有風險因子或來源附錄。

本文件對應 `index.html` SHA-256：`2f0d0848b8b825525bc07f6bec0c0d5dfcbdd4f7ab986bd86056e41dd42a93b6`。完整全文與控制項比較的結果另記錄於測試及本次 PR。

## 一般原版輸入：三份完整文書

只依已確認例外省略非陽性 HIV，以及沒有完整 DDH 陰性資料時的陰性篩檢句；會診的原固定欄位與 routine 預設保留。

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
```

### 原版入院摘要

```text
This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, HIV, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. Physical examination revealed no gross anomalies. Screening for DDH risk factors and physical signs was negative. The infant was admitted to the Baby Room for routine newborn care.
```

### 修正版入院摘要

```text
This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. Physical examination revealed no gross anomalies. The infant was admitted to the Baby Room for routine newborn care.
```

### 原版會診單

```text
Dear Dr,
The neonatal resuscitation team attendance at delivery was requested by obstetrician because of high-risk pregnancy with prematurity(-), fetal distress(-), maternal preeclampsia(-), IUGR(-), PROM(-).

@ Maternal condition: G1 P1 A0, GA at 39+0 wks, 29 y/o mother
Maternal blood type: O, Rh+
Serology: HBsAg(-), HBeAg(-), HIV(-), RPR(-)
GBS: GBS(-)
GDM: GDM(-)
Prenatal steroid use: nil
Prenatal antibiotics: nil

@ Newborn's condition: GA 39+0 weeks, BW 3200 gm, AGA, male neonate, born via vaginal delivery
Apgar score: 9 (1分鐘) to 10 (5分鐘).
Activity: fair. Muscle tone: normal. No cyanosis.
Respiration: Normal

High risk neonatal critical care:
Free flow oxygen(-), Manual positive pressure ventilation(-), Neopuff (setting)(-), 
Intubation(-), Chest compression(-), UVC(-), Epinephrine(-), NS challenge(-)

Therefore, he was transferred to BR for further evaluation and treatment.
```

### 修正版會診單

```text
Dear Dr,
The neonatal resuscitation team attendance at delivery was requested by obstetrician because of high-risk pregnancy with prematurity(-), fetal distress(-), maternal preeclampsia(-), IUGR(-), PROM(-).

@ Maternal condition: G1 P1 A0, GA at 39+0 wks, 29 y/o mother
Maternal blood type: O, Rh+
Serology: HBsAg(-), HBeAg(-), RPR(-)
GBS: GBS(-)
GDM: GDM(-)
Prenatal steroid use: nil
Prenatal antibiotics: nil

@ Newborn's condition: GA 39+0 weeks, BW 3200 gm, AGA, male neonate, born via vaginal delivery
Apgar score: 9 (1分鐘) to 10 (5分鐘).
Activity: fair. Muscle tone: normal. No cyanosis.
Respiration: Normal

High risk neonatal critical care:
Free flow oxygen(-), Manual positive pressure ventilation(-), Neopuff (setting)(-), 
Intubation(-), Chest compression(-), UVC(-), Epinephrine(-), NS challenge(-)

Therefore, he was transferred to BR for further evaluation and treatment.
```

### 原版出院摘要

```text
Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.
```

### 修正版出院摘要

```text
Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.
```

### 修正版診斷

```text
# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA
```

## 原有感染評估勾選

沿用原有 sepsis workup 句型與相應原始欄位。

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
```

原有選項：`#sepsisWorkup`、`input[name="sepsisReason"][value="gbs"]`。

### 修正版入院摘要

```text
This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. Physical examination revealed no gross anomalies. Due to GBS colonization with incomplete IAP, a sepsis workup including CBC/DC, CRP, and blood culture was performed. The infant was admitted to the Baby Room for routine newborn care.
```

### 修正版會診單

```text
Dear Dr,
The neonatal resuscitation team attendance at delivery was requested by obstetrician because of high-risk pregnancy with prematurity(-), fetal distress(-), maternal preeclampsia(-), IUGR(-), PROM(-).

@ Maternal condition: G1 P1 A0, GA at 39+0 wks, 29 y/o mother
Maternal blood type: O, Rh+
Serology: HBsAg(-), HBeAg(-), RPR(-)
GBS: GBS(-)
GDM: GDM(-)
Prenatal steroid use: nil
Prenatal antibiotics: nil

@ Newborn's condition: GA 39+0 weeks, BW 3200 gm, AGA, male neonate, born via vaginal delivery
Apgar score: 9 (1分鐘) to 10 (5分鐘).
Activity: fair. Muscle tone: normal. No cyanosis.
Respiration: Normal

High risk neonatal critical care:
Free flow oxygen(-), Manual positive pressure ventilation(-), Neopuff (setting)(-), 
Intubation(-), Chest compression(-), UVC(-), Epinephrine(-), NS challenge(-)

Therefore, he was transferred to BR for further evaluation and treatment.
```

### 修正版出院摘要

```text
Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). Due to GBS colonization with incomplete IAP, a sepsis workup including CBC/DC, CRP, and blood culture was performed. The laboratory results were within normal limits. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.
```

### 修正版診斷

```text
# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA
# Rule out neonatal sepsis
```

## 原版已能辨識的 DDH 陽性

已正確的入出摘句型保留；會診原本漏掉的資料補入既有 PE 位置。

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
子宮內壓迫徵象: 斜頸(+)
Hip PE: Barlow(+), Ortolani(+)
```

### 原版入院摘要

```text
This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, HIV, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. On physical examination, musculoskeletal examination was notable for positive Barlow's sign, positive Ortolani's sign, torticollis. DDH risk factors including breech presentation were identified. The infant was admitted to the Baby Room for routine newborn care.
```

### 修正版入院摘要

```text
This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. On physical examination, musculoskeletal examination was notable for positive Barlow's sign, positive Ortolani's sign, torticollis. DDH risk factors including breech presentation were identified. The infant was admitted to the Baby Room for routine newborn care.
```

### 原版會診單

```text
Dear Dr,
The neonatal resuscitation team attendance at delivery was requested by obstetrician because of high-risk pregnancy with prematurity(-), fetal distress(-), maternal preeclampsia(-), IUGR(-), PROM(-).

@ Maternal condition: G1 P1 A0, GA at 39+0 wks, 29 y/o mother
Maternal blood type: O, Rh+
Serology: HBsAg(-), HBeAg(-), HIV(-), RPR(-)
GBS: GBS(-)
GDM: GDM(-)
Prenatal steroid use: nil
Prenatal antibiotics: nil

@ Newborn's condition: GA 39+0 weeks, BW 3200 gm, AGA, male neonate, born via vaginal delivery
Apgar score: 9 (1分鐘) to 10 (5分鐘).
Activity: fair. Muscle tone: normal. No cyanosis.
Respiration: Normal

High risk neonatal critical care:
Free flow oxygen(-), Manual positive pressure ventilation(-), Neopuff (setting)(-), 
Intubation(-), Chest compression(-), UVC(-), Epinephrine(-), NS challenge(-)

Therefore, he was transferred to BR for further evaluation and treatment.
```

### 修正版會診單

```text
Dear Dr,
The neonatal resuscitation team attendance at delivery was requested by obstetrician because of high-risk pregnancy with prematurity(-), fetal distress(-), maternal preeclampsia(-), IUGR(-), PROM(-).

@ Maternal condition: G1 P1 A0, GA at 39+0 wks, 29 y/o mother
Maternal blood type: O, Rh+
Serology: HBsAg(-), HBeAg(-), RPR(-)
GBS: GBS(-)
GDM: GDM(-)
Prenatal steroid use: nil
Prenatal antibiotics: nil

@ Newborn's condition: GA 39+0 weeks, BW 3200 gm, AGA, male neonate, born via vaginal delivery
Apgar score: 9 (1分鐘) to 10 (5分鐘).
Activity: fair. Muscle tone: normal. No cyanosis.
Respiration: Normal
His physical examination was also notable for positive Barlow's sign, positive Ortolani's sign, and torticollis. DDH risk factors including breech presentation were identified.

High risk neonatal critical care:
Free flow oxygen(-), Manual positive pressure ventilation(-), Neopuff (setting)(-), 
Intubation(-), Chest compression(-), UVC(-), Epinephrine(-), NS challenge(-)

Therefore, he was transferred to BR for further evaluation and treatment.
```

### 原版出院摘要

```text
Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). Due to identified DDH risk factors including breech presentation and torticollis, as well as positive Barlow's sign and positive Ortolani's sign, an outpatient follow-up examination was arranged for further evaluation of DDH. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.
```

### 修正版出院摘要

```text
Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). Due to identified DDH risk factors including breech presentation and torticollis, as well as positive Barlow's sign and positive Ortolani's sign, an outpatient follow-up examination was arranged for further evaluation of DDH. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.
```

### 修正版診斷

```text
# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA
# Positive Barlow's sign
# Positive Ortolani's sign
```

## 分行 DDH、壓迫與 PE 分級／側別

原本漏掉的 finding 放回對應位置，母體或 Plan 資料不誤作新生兒 PE。

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
DDH risk factors:
  Family Hx (+)
  Twins (+)
子宮內壓迫徵象:
  斜頸 (+)
  大腿姿勢不對稱 (+)
Hip PE: right Ortolani(+), Barlow(-)
PE: grade 2/6 systolic murmur at left sternal border; left undescended testis
```

### 修正版入院摘要

```text
This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. On physical examination, grade 2/6 systolic murmur at left sternal border and left undescended testis were noted. musculoskeletal examination was notable for positive Ortolani's sign (right), torticollis, asymmetric thigh posture. DDH risk factors including family history of DDH, twin pregnancy were identified. The infant was admitted to the Baby Room for routine newborn care.
```

### 修正版會診單

```text
Dear Dr,
The neonatal resuscitation team attendance at delivery was requested by obstetrician because of high-risk pregnancy with prematurity(-), fetal distress(-), maternal preeclampsia(-), IUGR(-), PROM(-).

@ Maternal condition: G1 P1 A0, GA at 39+0 wks, 29 y/o mother
Maternal blood type: O, Rh+
Serology: HBsAg(-), HBeAg(-), RPR(-)
GBS: GBS(-)
GDM: GDM(-)
Prenatal steroid use: nil
Prenatal antibiotics: nil

@ Newborn's condition: GA 39+0 weeks, BW 3200 gm, AGA, male neonate, born via vaginal delivery
Apgar score: 9 (1分鐘) to 10 (5分鐘).
Activity: fair. Muscle tone: normal. No cyanosis.
Respiration: Normal
His physical examination was also notable for grade 2/6 systolic murmur at left sternal border, left undescended testis, positive Ortolani's sign (right), torticollis, and asymmetric thigh posture. DDH risk factors including family history of DDH and twin pregnancy were identified.

High risk neonatal critical care:
Free flow oxygen(-), Manual positive pressure ventilation(-), Neopuff (setting)(-), 
Intubation(-), Chest compression(-), UVC(-), Epinephrine(-), NS challenge(-)

Therefore, he was transferred to BR for further evaluation and treatment.
```

### 修正版出院摘要

```text
Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). Due to identified DDH risk factors including family history of DDH, twin pregnancy, torticollis, and asymmetric thigh posture, as well as positive Ortolani's sign (right), an outpatient follow-up examination was arranged for further evaluation of DDH. On physical examination, grade 2/6 systolic murmur at left sternal border and left undescended testis were noted. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.
```

### 修正版診斷

```text
# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA
# Heart murmur, grade 2/6 systolic at left sternal border
# Undescended testis, left
# Positive Ortolani's sign, right
```

## DDH 替代關係與未知風險

必要限定放在原有 PE／DDH 位置，不新開來源章節，也不把 OR 解讀成兩項確定陽性。

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
Hip PE: Barlow(+) or Ortolani(+)
DDH risk factors: Family Hx(?)
```

### 修正版入院摘要

```text
This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. On physical examination, musculoskeletal examination was notable for Barlow(+) or Ortolani(+). DDH screening noted Family Hx(?). The infant was admitted to the Baby Room for routine newborn care.
```

### 修正版會診單

```text
Dear Dr,
The neonatal resuscitation team attendance at delivery was requested by obstetrician because of high-risk pregnancy with prematurity(-), fetal distress(-), maternal preeclampsia(-), IUGR(-), PROM(-).

@ Maternal condition: G1 P1 A0, GA at 39+0 wks, 29 y/o mother
Maternal blood type: O, Rh+
Serology: HBsAg(-), HBeAg(-), RPR(-)
GBS: GBS(-)
GDM: GDM(-)
Prenatal steroid use: nil
Prenatal antibiotics: nil

@ Newborn's condition: GA 39+0 weeks, BW 3200 gm, AGA, male neonate, born via vaginal delivery
Apgar score: 9 (1分鐘) to 10 (5分鐘).
Activity: fair. Muscle tone: normal. No cyanosis.
Respiration: Normal
His physical examination was also notable for Barlow(+) or Ortolani(+). DDH screening noted Family Hx(?).

High risk neonatal critical care:
Free flow oxygen(-), Manual positive pressure ventilation(-), Neopuff (setting)(-), 
Intubation(-), Chest compression(-), UVC(-), Epinephrine(-), NS challenge(-)

Therefore, he was transferred to BR for further evaluation and treatment.
```

### 修正版出院摘要

```text
Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). DDH screening noted Family Hx(?); Barlow(+) or Ortolani(+). The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.
```

### 修正版診斷

```text
# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA
```

## 會診既有欄位中的異常與急救內容

實際輸入的異常與急救結果覆寫既有 Activity／Muscle tone／Cyanosis／Respiration／急救列。

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
PE: Hypotonia(+), Cyanosis(+), Respiratory distress(+), nasal flaring and subcostal retractions
Resuscitation: Free flow oxygen(+), Manual positive pressure ventilation(+), Intubation(-)
```

### 修正版入院摘要

```text
This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. On physical examination, Hypotonia, Cyanosis, Respiratory distress, nasal flaring, and subcostal retractions were noted. The infant was admitted to the Baby Room for routine newborn care.
```

### 修正版會診單

```text
Dear Dr,
The neonatal resuscitation team attendance at delivery was requested by obstetrician because of high-risk pregnancy with prematurity(-), fetal distress(-), maternal preeclampsia(-), IUGR(-), PROM(-).

@ Maternal condition: G1 P1 A0, GA at 39+0 wks, 29 y/o mother
Maternal blood type: O, Rh+
Serology: HBsAg(-), HBeAg(-), RPR(-)
GBS: GBS(-)
GDM: GDM(-)
Prenatal steroid use: nil
Prenatal antibiotics: nil

@ Newborn's condition: GA 39+0 weeks, BW 3200 gm, AGA, male neonate, born via vaginal delivery
Apgar score: 9 (1分鐘) to 10 (5分鐘).
Activity: not doing well. Muscle tone: decreased. General cyanosis.
Respiration: Respiratory distress(+), nasal flaring, subcostal retractions

High risk neonatal critical care:
Free flow oxygen(+), Manual positive pressure ventilation(+), Neopuff (setting)(-), 
Intubation(-), Chest compression(-), UVC(-), Epinephrine(-), NS challenge(-)

Therefore, he was transferred to BR for further evaluation and treatment.
```

### 修正版出院摘要

```text
Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). On physical examination, Hypotonia, Cyanosis, Respiratory distress, nasal flaring, and subcostal retractions were noted. The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated. 

 Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.
```

### 修正版診斷

```text
# Term infant, gestational age 39+0 weeks, BW 3200 gm, AGA
# Hypotonia
# Cyanosis
# Respiratory distress, nasal flaring subcostal retractions
```
