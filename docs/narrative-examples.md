# BR 入院與出院摘要：完整合成驗收範例

本版依一般嬰兒室的兩種文件用途，分開產生入院與出院摘要。以下每例保留相同來源的兩份完整正文與各自待確認內容，供核對資料、時間及文字流暢性；全部為合成資料。

入院摘要描述出生、母體產時、初次入室資料與初始 PE；後續或未明示為入室時的臨床紀錄保留在入摘待確認區。出院摘要保留相關背景、實際提供的 BR 照護、離室狀況與出院安排。沒有來源時，不推定正常過程或已完成出院。

待確認區在 Copy 範圍之外；真正的 PE 來源／手動衝突仍留在可複製正文。只有出生資料時，可用事實重疊是合理的，不能為了讓兩份文字不同而虛構經過。

`index.html` SHA-256：`1989cf2b19307fa41be43cfffc54e29489729d04f0df5a1f5e3178589c705980`

## BR-01：一般 BR 照護與已記錄的返家安排

入摘保留初次入室資訊；48/60/72 小時的照護與返家安排只在出摘正文。數值及正常狀態均由合成來源明示。

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

手動 PE：無。

### 程式實際產出的入院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

Maternal GBS screening was negative. The maternal history was negative for gestational diabetes. There was no premature rupture of membranes (PROM).

The infant was admitted to BR for routine newborn care. Heart murmur and grunting were absent.

### 入院摘要的待確認區

待確認事項（不包含在複製內容）

後續或未明示入院時點的臨床紀錄，保留於出院摘要及本區核對，未納入入院正文。
Nursery course: feeding was well tolerated at 48 hours of age.
Vital signs: stable
Transcutaneous bilirubin: 8.4 mg/dL at 60 hours of age
Education: caregivers were counseled about feeding and jaundice.
Discharged home in stable condition at 72 hours of age.
OPD follow-up on 2026-10-26.

### 程式實際產出的出院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

Maternal GBS screening was negative. The maternal history was negative for gestational diabetes. There was no premature rupture of membranes (PROM).

The infant was admitted to BR for routine newborn care. Heart murmur and grunting were absent.

Feeding was well tolerated at 48 hours of age. Vital signs were stable. Transcutaneous bilirubin was 8.4 mg/dL at 60 hours of age. Caregivers were counseled about feeding and jaundice.

The infant was discharged home in stable condition at 72 hours of age. OPD follow-up was planned for 2026-10-26.

### 出院摘要的待確認區

此情境沒有待確認提示。

## BR-02：DDH、子宮內壓迫及 PE 原文完整保留

兩份正文均保留 DDH、子宮內壓迫及真正的 PE 來源衝突；未把計畫出院寫成已出院。

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
DDH risk factors: Family Hx (+), Oligohydramnios (+)
子宮內壓迫徵象: 斜頸 (+)
PE: Heart murmur(-)
Admitted to BR for routine newborn care.
Nursery course: feeding was well tolerated.
Discharge: planned after reassessment.
```

手動 PE：Heart murmur。

### 程式實際產出的入院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

The infant was admitted to BR for routine newborn care. Documented DDH risk factors included family history of DDH and oligohydramnios. Documented intrauterine compression signs included torticollis. The physical examination record stated “Heart murmur(-)”. PE source conflict: Heart murmur. Manual selection indicates presence, while the supplied PE records a negative or conflicting result. Please reconcile the source and manual selection.

### 入院摘要的待確認區

待確認事項（不包含在複製內容）

後續或未明示入院時點的臨床紀錄，保留於出院摘要及本區核對，未納入入院正文。
Nursery course: feeding was well tolerated.
Discharge: planned after reassessment.

### 程式實際產出的出院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

The infant was admitted to BR for routine newborn care. Documented DDH risk factors included family history of DDH and oligohydramnios. Documented intrauterine compression signs included torticollis. The physical examination record stated “Heart murmur(-)”. PE source conflict: Heart murmur. Manual selection indicates presence, while the supplied PE records a negative or conflicting result. Please reconcile the source and manual selection.

Feeding was well tolerated.

Discharge was planned after reassessment.

### 出院摘要的待確認區

此情境沒有待確認提示。

## BR-03：只有出生資訊，沒有可用的 BR 經過

可用事實只有出生資訊，因此兩份短文可重疊。出摘待確認區提示需要 BR 照護與出院資料，不補寫餵食良好、正常檢驗或穩定返家。

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
```

手動 PE：無。

### 程式實際產出的入院摘要正文

This male newborn was born at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age.

### 入院摘要的待確認區

此情境沒有待確認提示。

### 程式實際產出的出院摘要正文

This male newborn was born at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age.

### 出院摘要的待確認區

待確認事項（不包含在複製內容）

尚未提供 BR 照護或離室前觀察；有紀錄時請補入。 尚未提供 BR 離室狀態與出院安排；請補入實際紀錄。

## BR-04：明示入室當下的檢查與處置

明寫 at admission 的檢驗與處置進入摘；4 小時後的檢驗及後續出院計畫留在出摘。未自行添加低血糖病因或療效判斷。

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
PE: Jitteriness(+) at BR admission
Admitted to BR for newborn observation.
Laboratory at admission: blood glucose 38 mg/dL
Treatment at admission: glucose gel was administered in BR.
Nursery course: blood glucose was 61 mg/dL at 4 hours of age.
Discharge: planned after further observation.
```

手動 PE：無。

### 程式實際產出的入院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

The infant was admitted to BR for newborn observation. Jitteriness was present at BR admission.

At admission, blood glucose was 38 mg/dL. At admission, glucose gel was administered in BR.

### 入院摘要的待確認區

待確認事項（不包含在複製內容）

後續或未明示入院時點的臨床紀錄，保留於出院摘要及本區核對，未納入入院正文。
Nursery course: blood glucose was 61 mg/dL at 4 hours of age.
Discharge: planned after further observation.

### 程式實際產出的出院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

The infant was admitted to BR for newborn observation. Jitteriness was present at BR admission.

At admission, blood glucose was 38 mg/dL. At admission, glucose gel was administered in BR. Blood glucose was 61 mg/dL at 4 hours of age.

Discharge was planned after further observation.

### 出院摘要的待確認區

此情境沒有待確認提示。

## BR-05：出生與第 2 天的 PE 各有時間

入摘只保留明示出生時的陰性，第 2 天陽性在待確認區可追溯；出摘保留兩個不同時點，不把它們當作同時矛盾。

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
PE: Heart murmur(-) at birth, Heart murmur(+) on day 2
Admitted to BR for routine newborn care.
Nursery course: feeding was well tolerated on day 2.
Discharge: planned after clinical reassessment.
```

手動 PE：無。

### 程式實際產出的入院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

The infant was admitted to BR for routine newborn care. Heart murmur was absent at birth.

### 入院摘要的待確認區

待確認事項（不包含在複製內容）

此列含後續、跨時點或未能確認為入院時的評估，原文保留供核對，未納入入院正文。
Heart murmur(+) on day 2

後續或未明示入院時點的臨床紀錄，保留於出院摘要及本區核對，未納入入院正文。
Nursery course: feeding was well tolerated on day 2.
Discharge: planned after clinical reassessment.

### 程式實際產出的出院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

The infant was admitted to BR for routine newborn care. Heart murmur was absent at birth. Heart murmur was present on day 2.

Feeding was well tolerated on day 2.

Discharge was planned after clinical reassessment.

### 出院摘要的待確認區

此情境沒有待確認提示。

## BR-06：來源中的條件、計畫與尚未完成狀態

已記錄的餵食事實留出摘，衛教未來式與有條件的出院計畫保持原意；沒有擅自完成衛教或出院。

### 合成輸入

```text
Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
PE: Heart murmur(-)
Admitted to BR for routine newborn care.
Nursery course: feeding was well tolerated.
Education: caregivers will be counseled before discharge.
Discharge: planned if the repeat bilirubin result is acceptable; not yet discharged.
```

手動 PE：無。

### 程式實際產出的入院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

The infant was admitted to BR for routine newborn care. Heart murmur was absent.

### 入院摘要的待確認區

待確認事項（不包含在複製內容）

後續或未明示入院時點的臨床紀錄，保留於出院摘要及本區核對，未納入入院正文。
Nursery course: feeding was well tolerated.
Education: caregivers will be counseled before discharge.
Discharge: planned if the repeat bilirubin result is acceptable; not yet discharged.

### 程式實際產出的出院摘要正文

This male newborn was born to a 29-year-old G1P1A0 mother at 39+0 weeks of gestation by vaginal delivery. The birth weight was 3200 gm, and the infant was appropriate for gestational age. APGAR scores were 9 and 10 at 1 and 5 minutes, respectively.

The infant was admitted to BR for routine newborn care. Heart murmur was absent.

Feeding was well tolerated. Caregivers will be counseled before discharge.

The disposition record stated “Discharge: planned if the repeat bilirubin result is acceptable; not yet discharged”.

### 出院摘要的待確認區

此情境沒有待確認提示。

## 驗收用途

`tests/br-document-scope.test.cjs` 核對一般 BR 文件的用途、時間界線、DDH／PE、Copy 與 Reset。其他敘事與保真測試保留來源數值、狀態、條件與時間的回歸約束；其中較長療程僅用來檢查轉寫忠實度，不作為一般 BR 範例。

這些固定案例不代表可正確理解任意自由文字。無法安全拆開時間、條件或否定的來源會保留供核對。
