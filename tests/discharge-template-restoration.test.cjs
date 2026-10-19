'use strict';

// Synthetic acceptance cases for the user-requested return to the original BR
// discharge-writing workflow. The routine prose below is a fixed fixture from
// the pre-round application; this suite does not load a second application.
// Explicit records must still override a matching contradictory template.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, toText } = require('./app-harness.cjs');

const BASE = `Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
GBS(-)
GDM(-)
PROM(-)`;

const ORIGINAL_ROUTINE = `Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated.

Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.`;

const compact = text => String(text).replace(/\s+/g, ' ').trim();

function specimen(source = BASE, manualPE = [], configure, campus = 'tpc') {
  const app = loadApp(campus);
  if (configure) configure(app);
  const data = app.parse(source);
  const html = app.render(data, manualPE);
  const bodies = Object.fromEntries(Object.entries(html).map(([name, value]) => [name, toText(value)]));
  const dischargeReview = toText(app.context.generateNarrativeReview(data, manualPE, 'discharge'));
  assert.equal(app.errors.length, 0);
  return { app, data, html, bodies, dischargeReview };
}

test('DR-01: ordinary birth input again produces the original complete BR discharge prose without requiring extra course entry', () => {
  const { bodies, dischargeReview } = specimen();
  assert.equal(compact(bodies.discharge), compact(ORIGINAL_ROUTINE));
  assert.doesNotMatch(bodies.discharge, /born to|gestational age|weeks of gestation|birth weight|Maternal|G1\s*P1|Apgar/i,
    'the original discharge course does not acquire an admission-style birth/maternal opening');
  assert.doesNotMatch(dischargeReview,
    /尚未提供\s*BR\s*照護或離室前觀察|尚未提供\s*BR\s*離室狀態與出院安排|請補入實際紀錄/i,
    'restoring the routine template removes the requirement to supply a separate BR course first');
});

test('DR-02: both restored templates keep initial PE distinct from the detailed source course', () => {
  const { bodies } = specimen(`${BASE}
Admitted to BR for routine newborn care.
PE: Jitteriness(+) at admission.
Laboratory at admission: blood glucose 38 mg/dL
Treatment at admission: glucose gel given in BR
Blood glucose: 61 mg/dL at 4 hours of age
Discharge planned tomorrow if feeding remains adequate.`);
  assert.match(bodies.summary, /39\+0 weeks/);
  assert.match(bodies.summary, /3200 gm/);
  assert.match(bodies.summary, /Jitteriness/i);
  assert.doesNotMatch(bodies.summary, /38 mg\/dL|glucose gel/i,
    'the separately requested original admission style does not append a detailed treatment course');
  assert.match(bodies.consultation, /38 mg\/dL/);
  assert.match(bodies.consultation, /glucose gel/i);
  assert.doesNotMatch(bodies.summary, /61 mg\/dL|discharge planned|discharged in stable condition|received routine prophylaxis/i);
  assert.match(bodies.discharge, /61 mg\/dL/);
  assert.notEqual(compact(bodies.summary), compact(bodies.discharge));
});

test('DR-03: restored discharge retains multiline DDH, compression and detailed raw PE instead of assuming a normal hip examination', () => {
  const { bodies } = specimen(`${BASE}
DDH risk factors:
  Breech(-)
  Family Hx (+)
  Oligohydramnios (+)
子宮內壓迫徵象:
  斜頸 (+)
  大腿姿勢不對稱 (-)
PE: grade 2/6 systolic murmur; left hip abduction limited`);
  for (const fact of [/family history of DDH/i, /oligohydramnios/i, /torticollis/i, /2\/6/, /systolic murmur/i, /left hip abduction limited/i]) {
    assert.match(bodies.discharge, fact, `the restored template must retain ${fact}`);
  }
  assert.doesNotMatch(bodies.discharge,
    /Screening for DDH risk factors and physical signs was negative|physical examination of the hips was unremarkable|but physical signs were negative/i);
});

test('DR-04: Copy includes the restored course and raw/manual PE conflict, and Reset clears both', async () => {
  const app = loadApp();
  const copied = [];
  app.context.navigator.clipboard = { async writeText(text) { copied.push(text); } };
  app.document.getElementById('inputData').value = `${BASE}\nPE: Heart murmur(-)`;
  const murmur = app.document.querySelector('input[name="peFinding"][value="Heart murmur"]');
  murmur.checked = true;
  murmur.dispatchEvent({ type: 'change' });
  app.context.updateUI();
  app.context.switchTab('discharge');
  const body = app.document.getElementById('dischargeOutput');
  app.document.getElementById('copyActiveBtn').dispatchEvent({ type: 'click' });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(copied.length, 1);
  assert.equal(copied[0], body.innerText, 'the bound Copy action copies the visible discharge body');
  assert.match(copied[0], /Upon admission, the infant received routine prophylaxis/);
  assert.match(copied[0], /Heart murmur\(-\)/i);
  assert.match(copied[0], /PE source conflict:\s*Heart murmur/i);
  assert.doesNotMatch(copied[0], /待確認事項|尚未提供 BR|Selected transfer plan/i);
  app.document.getElementById('resetBtn').dispatchEvent({ type: 'click' });
  assert.equal(app.document.getElementById('inputData').value, '');
  assert.equal(murmur.checked, false);
  for (const id of ['outputSummary', 'consultOutput', 'dischargeOutput', 'diagnosisOutput']) {
    assert.match(toText(app.document.getElementById(id).innerHTML), /請在左側貼上資料/);
    assert.doesNotMatch(toText(app.document.getElementById(id).innerHTML), /Heart murmur|routine prophylaxis|source conflict/i);
  }
  app.context.updateUI();
  assert.doesNotMatch(toText(body.innerHTML), /routine prophylaxis|murmur/i, 'a blank update after Reset does not regenerate a template');
  assert.equal(app.errors.length, 0);
});

test('DR-05: the original manually selected sepsis paragraph returns unless explicit infection results contradict it', () => {
  const selectWorkup = app => {
    app.document.getElementById('sepsisWorkup').checked = true;
    app.document.querySelector('input[name="sepsisReason"][value="maternal_fever"]').checked = true;
  };
  const routine = specimen(BASE, [], selectWorkup);
  assert.match(compact(routine.bodies.discharge),
    /Due to maternal fever, a sepsis workup including CBC\/DC, CRP, and blood culture was performed\. The laboratory results were within normal limits\./);
  const abnormal = specimen(`${BASE}\nCRP: elevated\nBlood culture: positive for E. coli`, [], selectWorkup);
  assert.match(abnormal.bodies.discharge, /CRP[^.]*elevated/i);
  assert.match(abnormal.bodies.discharge, /Blood culture[^.]*positive for E\. coli/i);
  assert.doesNotMatch(abnormal.bodies.discharge, /laboratory results were within normal limits/i);
});

test('DR-06: selected caput monitoring returns to discharge prose with each campus original interval', () => {
  for (const [campus, interval] of [
    ['tpc', 'every 2 hours (Q2H) for the first day, followed by daily (QD) measurements until discharge'],
    ['ttmh', 'every 8 hours (Q8H) until discharge'],
  ]) {
    const { bodies } = specimen(BASE, ['Caput succedaneum'], app => {
      app.document.getElementById('peCaput').checked = true;
      app.document.getElementById('caputHcInput').checked = true;
    }, campus);
    assert.ok(compact(bodies.discharge).includes(
      `Due to the presence of caput succedaneum, head circumference was monitored ${interval}. No significant interval increase was observed.`), campus);
    assert.doesNotMatch(bodies.summary, /head circumference was monitored|No significant interval increase was observed/i,
      `${campus}: restoring a discharge paragraph does not add its measured outcome to admission`);
  }
});

test('DR-07: short and long UDT/hydrocele counseling controls again select the original discharge paragraphs', () => {
  for (const verbosity of ['short', 'long']) {
    const { bodies } = specimen(BASE, ['Undescended testis (lt)', 'Hydrocele'], app => {
      app.document.querySelectorAll('input[name="verbosity"]').forEach(input => { input.checked = input.value === verbosity; });
    });
    assert.match(bodies.discharge, /The infant was noted to have left undescended testis\./);
    assert.match(bodies.discharge, /The infant was noted to have hydrocele\./);
    assert.match(bodies.discharge, /Caregivers were counseled regarding the condition/i);
    if (verbosity === 'short') {
      assert.match(bodies.discharge, /advised to follow up at the pediatric surgery clinic\./);
      assert.doesNotMatch(bodies.discharge, /Potential complications, including infertility|Caregivers verbalized understanding/i);
    } else {
      assert.match(bodies.discharge, /Potential complications, including infertility, testicular torsion, and increased risk of malignancy/i);
      assert.match(bodies.discharge, /typical natural resolution within the first 12-18 months of age/i);
      assert.match(bodies.discharge, /Caregivers verbalized understanding of the condition and follow-up plan\./);
    }
    assert.doesNotMatch(bodies.summary, /Caregivers were counseled|Caregivers verbalized understanding/i);
  }
});

test('DR-08: recorded refusal and pending HBIG override the routine prophylaxis statement', () => {
  const { bodies } = specimen(`${BASE}
HBsAg(+)
Treatment: HBIG not yet administered; parents declined HBV vaccine, Vitamin K1 and tetracycline ointment`);
  assert.match(bodies.discharge, /HBIG (?:was )?not yet administered/i);
  assert.match(bodies.discharge, /parents declined HBV vaccine, Vitamin K1 and tetracycline ointment/i);
  assert.doesNotMatch(bodies.discharge, /received routine prophylaxis|plus HBIG \(IM\)|HBIG (?:was )?(?:given|administered)/i);
});

test('DR-09: documented high bilirubin and persistent fever override matching normal/recovery defaults', () => {
  const { bodies } = specimen(`${BASE}
Total bilirubin: elevated, 20 mg/dL; phototherapy started
Hospital course: persistent fever, antibiotics started`, ['Fever']);
  assert.match(bodies.discharge, /20 mg\/dL/);
  assert.match(bodies.discharge, /phototherapy (?:was )?started/i);
  assert.match(bodies.discharge, /persistent fever/i);
  assert.match(bodies.discharge, /antibiotics (?:were )?started/i);
  assert.doesNotMatch(bodies.discharge, /bilirubin[^.]*within normal limits|resolved without intervention/i);
});

test('DR-10: a conditional discharge plan stays a plan instead of falling through to the original completed-discharge ending', () => {
  const { bodies } = specimen(`${BASE}
Education: caregivers will be counseled about feeding and jaundice before discharge.
Discharge plan: home tomorrow if feeding remains adequate; not yet discharged.`);
  assert.match(bodies.discharge, /will be counseled about feeding and jaundice/i);
  assert.match(bodies.discharge, /home tomorrow if feeding remains adequate/i);
  assert.match(bodies.discharge, /not yet discharged/i);
  assert.doesNotMatch(bodies.discharge, /Caregivers were counseled|Caregivers verbalized understanding|The infant was discharged in stable condition|was discharged home/i);
});
