'use strict';

// Synthetic cases for the user's output preferences: HIV is shown only when
// positivity is definite and its subject is retained; DDH uses compact prose while
// keeping details that cannot safely be reduced to a positive/negative label.
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
PROM(-), MAS(-)`;

const ALL_NEGATIVE_DDH = `DDH risk factors: negative
子宮內壓迫徵象: negative
Hip PE: negative`;

const OLD_NEGATIVE_SENTENCE = 'Screening for DDH risk factors and physical signs was negative.';
const OLD_RISK_NORMAL_DISCHARGE = 'Due to identified DDH risk factors including breech presentation, DDH screening was performed; however, physical examination of the hips was unremarkable.';
const OLD_POSITIVE_DISCHARGE = "Due to identified DDH risk factors including breech presentation and torticollis, as well as positive Barlow's sign and positive Ortolani's sign, an outpatient follow-up examination was arranged for further evaluation of DDH.";
const compact = text => String(text).replace(/\s+/g, ' ').trim();

function specimen(source, manualPE = []) {
  const app = loadApp();
  const data = app.parse(source);
  const html = app.render(data, manualPE);
  const bodies = Object.fromEntries(Object.entries(html).map(([name, value]) => [name, toText(value)]));
  assert.equal(app.errors.length, 0);
  return { app, data, html, bodies };
}

function noHIV(bodies, label) {
  for (const [name, body] of Object.entries(bodies)) {
    assert.doesNotMatch(body, /\bHIV\b/i, `${label}/${name}: non-positive HIV is not displayed`);
  }
}

test('HD-01: negative, missing, indeterminate and conflicting HIV remain absent from every rendered document', () => {
  for (const source of [
    '',
    'Maternal HIV(-)',
    'Maternal HIV: negative',
    'Maternal HIV: non-reactive',
    'Maternal HIV status unknown',
    'Maternal HIV: pending',
    'Maternal HIV(+)\nMaternal HIV(-)',
    'Infant HIV(+)\nMaternal HIV(-)',
  ]) {
    const { bodies } = specimen(`${BASE}\nHBsAg(-), HBeAg(-), RPR(-)\n${source}`);
    if (/Infant HIV\(\+\)/.test(source)) {
      noHIV({ summary: bodies.summary, discharge: bodies.discharge, diagnosis: bodies.diagnosis }, 'negative maternal HIV outside the infant-positive newborn field');
      assert.match(bodies.consultation, /@ Newborn's condition:[^]*Infant HIV\(\+\)/i);
      assert.doesNotMatch(bodies.consultation, /Maternal HIV\(-\)|HIV[^.\n]*(?:was negative|non-reactive)/i);
    } else noHIV(bodies, source || 'missing');
    assert.match(bodies.summary, /HBsAg/);
    assert.match(bodies.consultation, /RPR/);
  }
});

test('HD-02: detailed maternal fallback and bound diagnosis Copy omit negative HIV while retaining other same-row findings and doses', async () => {
  const source = `${BASE.replace('GBS(-)\nGDM(-)', '')}
Maternal: GBS(+), HIV(-), complete IAP: ampicillin 2 g IV started 5 hours before delivery
Maternal: GDM(+) under diet control and insulin 4 units at bedtime; HIV non-reactive; HBsAg(-), HBeAg(-), RPR(+)
Laboratory: HIV(-), CRP: 4.2 mg/L
Treatment: Vitamin K1 given at 03:00; HIV(-)`;
  const { app, data, bodies } = specimen(source);
  assert.equal(data.gbsStatus, 'positive');
  assert.equal(data.gdmStatus, 'positive');
  assert.equal(data.iapStatus, 'adequate');
  assert.equal(data.serologyStatus.HIV, 'negative', 'display filtering does not erase the parsed source status');
  assert.equal(data.serologyStatus.RPR, 'positive');
  noHIV(bodies, 'maternal detail fallback');
  for (const name of ['summary', 'consultation']) {
    assert.match(bodies[name], /ampicillin 2 g IV/i, `${name}: same-row IAP dose retained`);
    assert.match(bodies[name], /5 hours before delivery/i);
    assert.match(bodies[name], /diet control/i);
    assert.match(bodies[name], /insulin 4 units at bedtime/i);
    assert.match(bodies[name], /RPR/i);
  }
  assert.match(bodies.diagnosis, /Maternal GBS positive/i);
  const records = app.context.getClinicalSourceRecords(data);
  assert.ok(records.labs.some(line => /CRP[^.\n]*4\.2 mg\/L/i.test(line)),
    'nonpositive HIV display filtering does not erase the adjacent result from the laboratory parser');
  for (const name of ['discharge']) {
    assert.match(bodies[name], /Vitamin K1[^.\n]*03:00/i, `${name}: an adjacent recorded treatment is retained`);
  }
  assert.doesNotMatch(bodies.consultation, /@ Clinical records|CRP[^.\n]*4\.2 mg\/L|Vitamin K1[^.\n]*03:00/i);
  assert.doesNotMatch(bodies.diagnosis, /Additional source records|CRP[^.\n]*4\.2 mg\/L|Vitamin K1[^.\n]*03:00/i);
  const copied = [];
  app.context.navigator.clipboard = { async writeText(text) { copied.push(text); } };
  app.document.getElementById('inputData').value = source;
  app.context.updateUI();
  app.context.switchTab('diagnosis');
  app.document.getElementById('copyActiveBtn').dispatchEvent({ type: 'click' });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(copied.length, 1);
  assert.equal(copied[0], app.document.getElementById('diagnosisOutput').innerText);
  assert.doesNotMatch(copied[0], /\bHIV\b/i);
  assert.match(copied[0], /Maternal GBS positive/i);
  assert.equal(app.errors.length, 0);
});

test('HD-03: definite maternal and recorded infant HIV positivity stay in their existing fields without crossing subjects', () => {
  for (const positive of ['Maternal HIV(+)', 'Maternal HIV: reactive']) {
    const { data, bodies } = specimen(`${BASE}\nInfant HIV(-)\n${positive}`);
    assert.equal(data.serologyStatus.HIV, 'positive');
    assert.match(bodies.summary, /\bHIV\b/);
    assert.match(bodies.consultation, /HIV\(\+\)|HIV[^.\n,;]*positive/i);
    for (const name of ['summary', 'consultation']) {
      assert.doesNotMatch(bodies[name], /HIV\s*(?:\(-\)|(?:was\s+)?negative|non[- ]?reactive)/i);
    }
  }
  const { app, data, bodies } = specimen(`${BASE}\nMaternal HIV(-)\nLaboratory: Infant HIV(+)`);
  assert.equal(data.serologyStatus.HIV, 'negative', 'an infant result does not change the maternal status');
  assert.doesNotMatch(bodies.summary, /\bHIV\b/i, 'the negative maternal field remains omitted');
  assert.ok(app.context.getClinicalSourceRecords(data).labs.some(line => /Infant HIV\(\+\)/i.test(line)));
  assert.match(bodies.consultation, /@ Newborn's condition:[^]*Infant HIV\(\+\)/i,
    'a supplied positive infant result remains with its subject in the existing newborn field');
  assert.doesNotMatch(bodies.consultation, /Maternal HIV\(-\)|@ Clinical records/i);
  assert.doesNotMatch(bodies.diagnosis, /^#.*HIV|Additional source records/im,
    'a lab record does not create a new HIV diagnosis or an appended source archive');
  const careResult = specimen(`${BASE}\nMaternal HIV(+)\nTreatment: HIV prophylaxis with zidovudine started at 03:00`);
  assert.ok(careResult.app.context.getClinicalSourceRecords(careResult.data).treatment.some(line => /zidovudine[^.\n]*03:00/i.test(line)),
    'the complete actual drug/time remains in the treatment parser without requiring three new source blocks');
  assert.doesNotMatch(careResult.bodies.consultation, /@ Clinical records|Additional source records/i);
  assert.doesNotMatch(careResult.bodies.diagnosis, /Additional source records/i);
});

test('HD-04: complete negative DDH screening uses the single original admission sentence and no discharge catalog', () => {
  const { bodies } = specimen(`${BASE}\nPE: no gross anomalies.\n${ALL_NEGATIVE_DDH}`);
  assert.equal(bodies.summary.split(OLD_NEGATIVE_SENTENCE).length - 1, 1);
  assert.doesNotMatch(bodies.summary, /DDH risk screening was explicitly|Intrauterine compression screening was explicitly|Hip examination was explicitly/i);
  assert.doesNotMatch(bodies.discharge, /DDH|intrauterine compression|hip examination|Barlow|Ortolani/i,
    'an entirely negative DDH source does not add a second catalog to the original routine discharge');
});

test('HD-05: a documented risk with explicitly negative hip screening restores the original risk-only branches', () => {
  const { bodies } = specimen(`${BASE}
DDH risk factors: Breech(+)
子宮內壓迫徵象: negative
Hip PE: negative`);
  assert.match(compact(bodies.summary),
    /DDH screening noted risk factors including breech presentation, but physical signs were negative\./);
  assert.ok(compact(bodies.discharge).includes(OLD_RISK_NORMAL_DISCHARGE));
  for (const name of ['summary', 'discharge']) {
    assert.equal((bodies[name].match(/breech presentation/gi) || []).length, 1, `${name}: no duplicated risk sentence`);
    assert.doesNotMatch(bodies[name], /DDH risk screening was explicitly|Hip examination was explicitly|Documented DDH risk factors included/i);
  }
});

test('HD-06: a risk with missing, unknown or partial hip results never acquires the old unsupported normal-examination claim', () => {
  for (const hip of ['', 'Hip PE: unknown', 'Hip PE: Barlow(-)']) {
    const { data, bodies } = specimen(`${BASE}\nDDH risk factors: Breech(+)\n子宮內壓迫徵象: negative\n${hip}`);
    if (/Barlow/.test(hip)) assert.equal(
      data.recordedAssessment.hip.records.find(record => record.name === "Barlow's test")?.state, 'negative',
      'concise output still retains the correct negative parser state');
    for (const name of ['summary', 'discharge']) {
      assert.match(bodies[name], /breech presentation/i, `${name}: risk remains visible`);
      assert.doesNotMatch(bodies[name],
        /but physical signs were negative|physical examination of the hips was unremarkable|Screening for DDH risk factors and physical signs was negative/i,
        `${name}/${hip || 'missing'}: partial or absent evidence cannot establish an entirely normal hip examination`);
      if (/unknown/.test(hip)) assert.match(data.recordedAssessment.hip.source, /unknown/i,
        'an unspecified hip result stays in the parser; it does not require a new uncertainty paragraph');
      if (/Barlow/.test(hip)) assert.doesNotMatch(bodies[name], /positive Barlow's sign|Barlow\(\+\)/i,
        'an ordinary negative sibling may be omitted, but cannot become positive');
    }
  }
});

test('HD-07: positive risk, compression and hip signs use the original compact branches exactly once', () => {
  const { bodies } = specimen(`${BASE}
DDH risk factors: Breech(+)
子宮內壓迫徵象: 斜頸(+)
Hip PE: Barlow(+), Ortolani(+)`);
  assert.match(compact(bodies.summary),
    /musculoskeletal examination was notable for positive Barlow's sign, positive Ortolani's sign, and torticollis/i);
  assert.match(bodies.summary, /DDH risk factors including breech presentation were identified/i);
  assert.ok(compact(bodies.discharge).includes(OLD_POSITIVE_DISCHARGE));
  for (const name of ['summary', 'discharge']) {
    for (const finding of [/breech presentation/gi, /torticollis/gi, /positive Barlow's sign/gi, /positive Ortolani's sign/gi]) {
      assert.equal((bodies[name].match(finding) || []).length, 1, `${name}: ${finding} appears once`);
    }
    assert.doesNotMatch(bodies[name], /Documented DDH risk factors included|Documented intrauterine compression signs included|Hip examination documented/i);
  }
  assert.match(bodies.diagnosis, /^# Positive Barlow's sign/im);
  assert.match(bodies.diagnosis, /^# Positive Ortolani's sign/im);
  assert.doesNotMatch(bodies.diagnosis, /Risk factors and examination findings|^# (?:Confirmed DDH|Developmental dysplasia)/im);
});

test('HD-08: necessary hip side and unrelated detailed PE survive compact DDH prose without reversing a negative sibling', () => {
  const { bodies } = specimen(`${BASE}
DDH risk factors: Oligohydramnios(+)
Hip PE: right Ortolani(+), Barlow(-)
PE: Heart murmur(+), grade 2/6 systolic at left sternal border`);
  for (const name of ['summary', 'discharge']) {
    assert.match(bodies[name], /2\/6/);
    assert.match(bodies[name], /left sternal border/i);
    assert.match(bodies[name], /right[^.;\n]{0,40}Ortolani|Ortolani[^.;\n]{0,40}right/i,
      `${name}: hip laterality cannot be discarded when choosing an original template`);
    assert.doesNotMatch(bodies[name], /positive Barlow's sign|physical examination of the hips was unremarkable/i);
  }
  assert.match(bodies.diagnosis, /^# Positive Ortolani/im);
  assert.doesNotMatch(bodies.diagnosis, /^# Positive Barlow|Risk factors and examination findings/im);

  const mixed = specimen(`${BASE}\nPE: Heart murmur(+) and Barlow(+)`).bodies;
  for (const name of ['summary', 'discharge']) {
    assert.match(mixed[name], /Heart murmur/i, `${name}: the cardiac finding remains visible`);
    assert.match(mixed[name], /Barlow/i, `${name}: the hip finding remains visible`);
    assert.doesNotMatch(mixed[name], /musculoskeletal examination[^.]*Heart murmur/i,
      `${name}: a shared source fragment does not classify a cardiac finding as musculoskeletal`);
    assert.doesNotMatch(mixed[name], /Due to[^.]*Heart murmur[^.]*DDH|Due to[^.]*DDH[^.]*Heart murmur/i,
      `${name}: a cardiac finding cannot become a reason for DDH follow-up`);
  }
  assert.match(mixed.diagnosis, /^# Heart murmur/im);
  assert.match(mixed.diagnosis, /^# Positive Barlow's sign/im);
  assert.doesNotMatch(mixed.diagnosis, /Risk factors and examination findings/i);
});

test('HD-09: ambiguous or negated hip observations and a genuine source/manual conflict are preserved without false positive follow-up prose', () => {
  for (const hip of ['Barlow(+) or Ortolani(+)', 'no Barlow or Ortolani positive']) {
    const { bodies } = specimen(`${BASE}
DDH risk factors: Family Hx(?)
子宮內壓迫徵象: 斜頸(+), 斜頸(-)
PE: Heart murmur(-); ${hip}`, ['Heart murmur']);
    for (const name of ['summary', 'discharge']) {
      assert.match(bodies[name], /Family Hx\(\?\)|family history[^.]*unknown/i);
      assert.match(bodies[name], /斜頸\(\+\)/);
      assert.match(bodies[name], /斜頸\(-\)/);
      assert.match(bodies[name], /Barlow/);
      assert.match(bodies[name], /Ortolani/);
      assert.match(bodies[name], /Heart murmur\(-\)/i);
      assert.match(bodies[name], /Heart murmur[^.]{0,200}(?:conflict|manual selection positive)|conflict[^.]{0,200}Heart murmur/i);
      assert.doesNotMatch(bodies[name], /positive Barlow's sign|positive Ortolani's sign|outpatient follow-up examination was arranged|Screening for DDH risk factors and physical signs was negative/i);
    }
    assert.doesNotMatch(bodies.diagnosis, /^# Positive .*sign|Risk factors and examination findings/im);
  }
});

test('HD-10: explicitly pending or canceled DDH follow-up overrides the original completed-arrangement template', () => {
  for (const followup of [
    'Follow-up: DDH outpatient evaluation planned, not yet arranged.',
    'Follow-up: DDH outpatient evaluation canceled.',
  ]) {
    const { bodies } = specimen(`${BASE}\nDDH risk factors: Breech(+)\nHip PE: Ortolani(+)\n${followup}`);
    assert.match(bodies.discharge, /DDH outpatient evaluation/i);
    if (/planned/.test(followup)) assert.match(bodies.discharge, /planned[^.]*not yet arranged/i);
    else assert.match(bodies.discharge, /cancel(?:l)?ed/i);
    assert.doesNotMatch(bodies.discharge, /outpatient follow-up examination was arranged/i);
    assert.match(bodies.discharge, /Ortolani/i);
    assert.match(bodies.diagnosis, /^# Positive Ortolani/im);
    const hipDiagnosis = bodies.diagnosis.split('\n').find(line => /^# Positive Ortolani/i.test(line));
    assert.doesNotMatch(hipDiagnosis, /Follow[- ]?up|\bplanned\b|\bcancel(?:l)?ed\b/i,
      'the positive hip-sign diagnosis excludes follow-up plans, which belong in the original discharge slot');
    assert.doesNotMatch(bodies.diagnosis, /Risk factors and examination findings/i);
  }
});

test('HD-11: definite DDH positives keep English side details and fluent lists without mixing independent findings', () => {
  const { bodies } = specimen(`${BASE}
DDH risk factors: Breech(+) and Family Hx(+)
子宮內壓迫徵象: 左側斜頸(+) and 右側足踝內翻(+)
Hip PE: 右側Ortolani(+), Barlow(-)
PE: Heart murmur(+), grade 2/6 at left sternal border`);
  for (const name of ['summary', 'consultation', 'discharge']) {
    const body = bodies[name];
    assert.match(body, name === 'discharge'
      ? /breech presentation, family history of DDH, [^.]*, and /i
      : /breech presentation and family history of DDH/i,
    `${name}: the positive list uses the conjunction appropriate to its two or four findings`);
    assert.match(body, /left(?:-sided)? torticollis|torticollis\s*\(left(?: side)?\)/i, `${name}: torticollis keeps its left side`);
    assert.match(body, /right(?:-sided)? foot inversion|foot inversion\s*\(right(?: side)?\)/i, `${name}: foot inversion keeps its right side`);
    assert.match(body, /right[^.;,]*Ortolani|Ortolani[^.;,]*right/i, `${name}: the positive Ortolani sign keeps its right side`);
    for (const finding of [/breech presentation/gi, /family history of DDH/gi, /torticollis/gi, /foot inversion/gi, /Ortolani/gi]) {
      assert.equal((body.match(finding) || []).length, 1, `${name}: ${finding} appears once, without being copied into another finding's detail`);
    }
    assert.doesNotMatch(body, /左側|右側|斜頸|足踝內翻|positive Barlow|physical examination of the hips was unremarkable/i,
      `${name}: confirmed positives use English without reversing the negative sibling`);
    assert.match(body, /2\/6[^.]*left sternal border/i, `${name}: the unrelated PE detail is preserved`);
  }
  assert.match(bodies.summary, /\. Musculoskeletal examination was notable for /,
    'the musculoskeletal sentence starts with a capital after another PE sentence');
  assert.doesNotMatch(bodies.diagnosis, /Risk factors and examination findings|family history of DDH|breech presentation|^# Positive Barlow/im);
});
