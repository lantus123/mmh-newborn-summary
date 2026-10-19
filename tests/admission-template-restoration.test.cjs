'use strict';

// Synthetic acceptance of the original concise admission-writing workflow.
// Fully negative/normal fixture statements are explicitly supplied. Restoring
// the original layout must not restore false negatives for omitted findings.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, toText } = require('./app-harness.cjs');

const BASE = `Male newborn
GA 39+0 weeks, BW 3200 gm, AGA
NSD
29 y/o mother, G1 P1 A0
Apgar score: 9 -> 10
Maternal blood group: type O, Rh+
GBS(-)
GDM(-)
HBsAg(-), HBeAg(-), HIV(-), RPR(-)
PROM(-), MAS(-)`;

const FULL_NORMAL = `${BASE}
PE: no gross anomalies.
DDH risk factors: negative
子宮內壓迫徵象: negative
Hip PE: negative`;

// Fixed prose follows the pre-round generateSummary with the user's explicit
// nonpositive-HIV omission, independent of the implementation under test.
// Whitespace/HTML highlighting are not substantive.
const ORIGINAL_NORMAL_ADMISSION = `This 1-day-old male infant was born to a 29-year-old G1P1 mother at 39+0 weeks of gestation via NSD. The birth weight was 3200 gm (AGA). Maternal blood type is O, Rh+. Maternal screening was negative for GDM, GBS colonization, infectious serology (HBsAg, HBeAg, RPR). There was no premature rupture of membranes (PROM) or meconium aspiration syndrome (MAS). APGAR scores were 9 and 10 at 1 and 5 minutes, respectively. Physical examination revealed no gross anomalies. Screening for DDH risk factors and physical signs was negative. The infant was admitted to the Baby Room for routine newborn care.`;

const PR4_ROUTINE_DISCHARGE = `Upon admission, the infant received routine prophylaxis including HBV vaccine (IM), tetracycline ophthalmic ointment (topical), and Vitamin K1 (IM). The infant was managed with routine nursery care and rooming-in was arranged with the mother. Feeding volume was gradually increased as tolerated.

Prior to discharge, total bilirubin level was checked and found to be within normal limits (WNL). The infant was discharged in stable condition with scheduled MBD and OPD follow-up.`;

const compact = text => String(text).replace(/\s+/g, ' ').trim();

function specimen(source = BASE, manualPE = [], configure, campus = 'tpc') {
  const app = loadApp(campus);
  if (configure) configure(app);
  const findings = manualPE === null ? app.context.getPEFindings() : manualPE;
  const data = app.parse(source);
  const html = app.render(data, findings);
  const bodies = Object.fromEntries(Object.entries(html).map(([name, value]) => [name, toText(value)]));
  const review = toText(app.context.generateNarrativeReview(data, findings, 'summary'));
  assert.equal(app.errors.length, 0);
  return { app, data, html, bodies, review };
}

test('AR-01: explicitly normal input reproduces the original one-paragraph admission text and BR ending', () => {
  const { html, bodies, review } = specimen(FULL_NORMAL);
  assert.equal(compact(bodies.summary), compact(ORIGINAL_NORMAL_ADMISSION));
  assert.doesNotMatch(html.summary, /<br\s*\/?>\s*<br|<h[1-6]\b|<p\b/i,
    'the restored admission is one connected paragraph');
  assert.match(bodies.summary.trim(), /The infant was admitted to the Baby Room for routine newborn care\.$/);
  assert.equal(review, '', 'the simplified admission has no supplementary course/checklist panel');
});

test('AR-02: a short input stays simple without inventing missing normal findings or requiring a BR course', () => {
  const { bodies, review } = specimen('BW 3200 gm');
  assert.match(bodies.summary, /3200 gm/);
  assert.doesNotMatch(bodies.summary,
    /Maternal screening was negative|no premature rupture|no PROM|no MAS|no gross anomalies|DDH[^.]*was negative|\bAGA\b|via NSD|female infant/i);
  assert.doesNotMatch(bodies.diagnosis, /# Term infant|, AGA\b/);
  assert.doesNotMatch(bodies.summary, /待確認事項|尚未提供 BR|後續或未明示入院時點|Selected .* plan|Counseling checklist/i);
  assert.equal(review, '');
});

test('AR-03: multiline DDH/compression findings and raw PE grade/side remain in the concise admission', () => {
  const { bodies, review } = specimen(`${BASE}
DDH risk factors:
  Breech(-)
  Family Hx (+)
  Oligohydramnios (+)
子宮內壓迫徵象:
  斜頸 (+)
  大腿姿勢不對稱 (-)
PE: grade 2/6 systolic murmur; left hip abduction limited`);
  for (const fact of [/family history of DDH/i, /oligohydramnios/i, /torticollis/i, /2\/6/, /systolic murmur/i, /left hip abduction limited/i]) {
    assert.match(bodies.summary, fact, `the shorter note retains ${fact}`);
  }
  assert.doesNotMatch(bodies.summary,
    /Screening for DDH risk factors and physical signs was negative|physical examination of the hips was unremarkable|but physical signs were negative/i);
  assert.equal(review, '');
});

test('AR-04: negative, indeterminate and conflicting findings do not become positive diagnoses or a globally normal screen', () => {
  const { data, bodies, review } = specimen(`${BASE}
DDH risk factors: Breech(+), Breech(-), Family Hx(±)
子宮內壓迫徵象: 斜頸(?)
PE: Heart murmur(-), Barlow(±), Ortolani(?)`);
  assert.equal(data.ddhRisk.length, 0);
  assert.equal(data.compressionSigns.length, 0);
  assert.equal(data.ddhPe.length, 0);
  assert.match(bodies.summary, /Breech\(\+\)/i);
  assert.match(bodies.summary, /Breech\(-\)/i);
  assert.match(bodies.summary, /Family Hx|family history/i);
  assert.match(bodies.summary, /Barlow|Ortolani/i);
  assert.match(bodies.summary, /conflict|uncertain|indeterminate|unresolved|equivocal|±|\?/i);
  assert.doesNotMatch(bodies.summary, /Screening for DDH risk factors and physical signs was negative|Physical examination revealed no gross anomalies/i);
  assert.doesNotMatch(bodies.diagnosis, /^# (?:Heart murmur|Positive .* sign|Suspected developmental dysplasia)/im);
  assert.equal(review, '');
});

test('AR-05: bound input, manual PE, Copy and Reset retain a true conflict without a separate admission review panel', async () => {
  const app = loadApp();
  const copied = [];
  app.context.navigator.clipboard = { async writeText(text) { copied.push(text); } };
  const input = app.document.getElementById('inputData');
  input.value = `${BASE}\nPE: Heart murmur(-)`;
  input.dispatchEvent({ type: 'input' });
  await new Promise(resolve => setTimeout(resolve, 320));
  const murmur = app.document.querySelector('input[name="peFinding"][value="Heart murmur"]');
  murmur.checked = true;
  murmur.dispatchEvent({ type: 'change' });
  app.context.switchTab('summary');
  const body = app.document.getElementById('outputSummary');
  const review = app.document.getElementById('summaryReview');
  assert.equal(toText(review.innerHTML), '');
  assert.equal(review.classList.contains('hidden'), true);
  app.document.getElementById('copyActiveBtn').dispatchEvent({ type: 'click' });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(copied.length, 1);
  assert.equal(copied[0], body.innerText);
  assert.match(copied[0], /Heart murmur\(-\)/i);
  assert.match(copied[0], /PE source conflict:\s*Heart murmur/i);
  assert.match(copied[0], /admitted to the Baby Room for routine newborn care/i);
  assert.doesNotMatch(copied[0], /待確認事項|已選取的評估／處置計畫|Risk factors and examination findings/i);
  app.context.switchTab('diagnosis');
  app.document.getElementById('copyActiveBtn').dispatchEvent({ type: 'click' });
  await new Promise(resolve => setTimeout(resolve, 0));
  const diagnosisCopy = copied.at(-1);
  assert.equal(copied.length, 2);
  assert.equal(diagnosisCopy, app.document.getElementById('diagnosisOutput').innerText);
  assert.match(diagnosisCopy, /Heart murmur/i);
  assert.match(diagnosisCopy, /conflict|discordant|inconsistent/i,
    'a separately copied diagnosis still makes the source/manual disagreement visible');
  for (const line of diagnosisCopy.split('\n').filter(line => /^#\s*Heart murmur\b/i.test(line))) {
    assert.match(line, /conflict|discordant|inconsistent/i,
      'a source-negative/manual-positive murmur is not an unqualified positive diagnosis');
  }
  assert.doesNotMatch(diagnosisCopy, /Risk factors and examination findings/i);
  app.document.getElementById('resetBtn').dispatchEvent({ type: 'click' });
  assert.equal(input.value, '');
  assert.equal(murmur.checked, false);
  for (const id of ['outputSummary', 'consultOutput', 'dischargeOutput', 'diagnosisOutput']) {
    assert.match(toText(app.document.getElementById(id).innerHTML), /請在左側貼上資料/);
    assert.doesNotMatch(toText(app.document.getElementById(id).innerHTML), /Heart murmur|source conflict/i);
  }
  assert.equal(toText(review.innerHTML), '');
  assert.equal(app.errors.length, 0);
});

test('AR-06: the original selected sepsis sentence and glucose-monitoring BR ending return to admission', () => {
  const { bodies, review } = specimen(BASE.replace('GDM(-)', 'GDM(+) under diet control'), [], app => {
    app.document.getElementById('sepsisWorkup').checked = true;
    app.document.querySelector('input[name="sepsisReason"][value="maternal_fever"]').checked = true;
  });
  assert.match(bodies.summary, /(?:GDM|gestational diabetes)[^.]*diet control/i);
  assert.match(bodies.summary,
    /Due to maternal fever, a sepsis workup including CBC\/DC, CRP, and blood culture was performed\./);
  assert.match(bodies.summary.trim(),
    /The infant was admitted to the Baby Room for routine newborn care, with blood glucose monitoring for 24 hours\.$/);
  assert.doesNotMatch(bodies.summary, /laboratory results were within normal limits|blood glucose levels[^.]*normal/i,
    'the original admission paragraph does not include the discharge normal-results template');
  assert.equal(review, '');
});

test('AR-07: original respiratory and BR endings respect explicitly planned or incomplete admission actions', () => {
  const findings = ['Respiratory distress (with nasal flaring, retraction)'];
  const routine = specimen(BASE, findings);
  assert.match(routine.bodies.summary, /respiratory distress with nasal flaring and retractions/i);
  assert.match(routine.bodies.summary,
    /Oxygen was administered via O2 hood, after which the infant remained otherwise stable and was transferred for routine newborn care\./);
  assert.equal(routine.review, '');
  const documented = specimen(`${BASE}
Respiratory support at admission: CPAP planned; oxygen not yet administered.`, findings);
  assert.match(documented.bodies.summary, /CPAP (?:was )?planned/i);
  assert.match(documented.bodies.summary, /oxygen (?:was |had )?not yet (?:been )?administered/i);
  assert.doesNotMatch(documented.bodies.summary, /Oxygen was administered via O2 hood|remained otherwise stable|weaned to room air/i);
  assert.equal(documented.review, '');
  const pendingAdmission = specimen(`${BASE}\nDisposition: admission to BR planned, not yet admitted.`);
  assert.match(pendingAdmission.bodies.summary, /not yet (?:been )?admitted/i);
  assert.doesNotMatch(pendingAdmission.bodies.summary, /The infant was admitted to (?:the Baby Room|BR)/i,
    'an explicitly pending BR admission cannot coexist with the original completed-admission ending');
  assert.equal(pendingAdmission.review, '');
});

test('AR-08: existing side and head-circumference controls still add their original admission findings for both campuses', () => {
  for (const [campus, interval] of [['tpc', /check HC Q2H then QD/i], ['ttmh', /check HC Q8H/i]]) {
    const { bodies, review } = specimen(BASE, null, app => {
      app.document.getElementById('peCaput').checked = true;
      app.document.getElementById('caputHcInput').checked = true;
      app.document.getElementById('peUDT').checked = true;
      app.document.querySelector('input[name="udtSide"][value="(lt)"]').checked = true;
    }, campus);
    assert.match(bodies.summary, /Caput succedaneum/i);
    assert.match(bodies.summary, interval, campus);
    assert.match(bodies.summary, /(?:left undescended testis|Undescended testis[^.]{0,20}(?:\(lt\)|left))/i, campus);
    assert.doesNotMatch(bodies.summary, /Caregivers were counseled|Caregivers verbalized understanding|No significant interval increase was observed/i);
    assert.equal(review, '');
  }
});

test('AR-09: later PE, treatment and discharge remain outside admission even after restoring the original layout', () => {
  const { bodies, review } = specimen(`${BASE}
PE: Heart murmur(-) at birth, Heart murmur(+) on day 2
BR course: feeding was well tolerated at 48 hours of age.
Total bilirubin: 20 mg/dL at 60 hours of age; phototherapy started.
Discharged home in stable condition at 72 hours of age.`);
  assert.match(bodies.summary,
    /Heart murmur\(-\)|heart murmur[^.]{0,60}(?:negative|absent)|(?:no|negative for)[^.]{0,30}heart murmur/i);
  assert.doesNotMatch(bodies.summary, /Heart murmur\(\+\)|on day 2|48 hours|20 mg\/dL|phototherapy|72 hours|discharged home/i);
  assert.match(bodies.summary.trim(), /admitted to the Baby Room for routine newborn care\.$/i);
  assert.match(bodies.discharge, /on day 2/i);
  assert.match(bodies.discharge, /20 mg\/dL/);
  assert.match(bodies.discharge, /phototherapy (?:was )?started/i);
  assert.match(bodies.discharge, /72 hours/i);
  assert.equal(review, '', 'excluded later history is no longer repeated below admission');
});

test('AR-10: the PR4 routine discharge restoration remains unchanged and distinct from admission', () => {
  const { bodies } = specimen(BASE);
  assert.equal(compact(bodies.discharge), compact(PR4_ROUTINE_DISCHARGE));
  assert.notEqual(compact(bodies.summary), compact(bodies.discharge));
  assert.doesNotMatch(bodies.summary, /received routine prophylaxis|total bilirubin[^.]*within normal limits|discharged in stable condition/i);
});

test('AR-11: definite raw PE positives become concise diagnosis lines with grade and side, without a risk-factor appendix', () => {
  const source = `${BASE}
PE: Heart murmur(+), grade 2/6 systolic at left sternal border; Left undescended testis(+); Barlow(+), Ortolani(-)`;
  const { bodies } = specimen(source);
  assert.match(bodies.diagnosis, /^# Heart murmur[^\n]*2\/6[^\n]*left sternal border/im);
  assert.match(bodies.diagnosis, /^# (?:Left undescended testis|Undescended testis[^\n]*(?:left|lt))/im);
  assert.match(bodies.diagnosis, /^# Positive Barlow[^\n]*sign/im);
  assert.doesNotMatch(bodies.diagnosis, /^# Positive Ortolani|^# (?:DDH|Developmental dysplasia|Confirmed DDH)/im);
  assert.doesNotMatch(bodies.diagnosis, /Risk factors and examination findings|Documented DDH risk factors included/i);
  const merged = specimen(source, ['Heart murmur', 'Undescended testis (lt)']).bodies.diagnosis;
  assert.equal((merged.match(/^# Heart murmur\b/gim) || []).length, 1,
    'a matching manual choice and source observation produce one murmur diagnosis');
  assert.equal((merged.match(/^# (?:Left undescended testis|Undescended testis)\b/gim) || []).length, 1,
    'a matching left-sided manual/source finding produces one UDT diagnosis');
  assert.match(merged, /^# Heart murmur[^\n]*2\/6[^\n]*left sternal border/im,
    'deduplication keeps the fuller source grade and location');
});

test('AR-12: DDH risk alone and uncertain/alternative PE do not create diagnoses or the removed risk-factor section', () => {
  const { bodies } = specimen(`${BASE}
DDH risk factors: Breech(+), Family Hx(+), Twins(+)
PE: Heart murmur(?); Barlow(+) or Ortolani(+)`);
  assert.match(bodies.summary, /breech presentation/i);
  assert.match(bodies.summary, /family history of DDH/i);
  assert.doesNotMatch(bodies.diagnosis, /Risk factors and examination findings|DDH risk|family history|twin pregnancy/i);
  assert.doesNotMatch(bodies.diagnosis,
    /^# (?:Heart murmur|Positive .* sign|Suspected developmental dysplasia|Developmental dysplasia|DDH|Breech)/im,
    'a risk, unknown observation or alternative pair is not an established newborn diagnosis');
});
