'use strict';

// These checks exercise the real parser and four generators with synthetic records.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, toText } = require('./app-harness.cjs');

const BASE = 'Male newborn\nGA 39+0 weeks, BW 3200 gm, AGA\nNSD\nApgar score: 9 -> 10';
const narrativeNames = ['summary', 'consultation', 'discharge'];
const perinatalNarrativeNames = ['summary', 'consultation'];

// The user restored both original BR templates. Admission retains its brief
// birth/maternal/finding structure and selected-care ending; detailed care stays
// in consultation/discharge. Explicit source exceptions still override matching
// defaults. No review checklist is needed to use either restored template.

function specimen(source, manualPE = [], configure, campus = 'tpc') {
  const app = loadApp(campus);
  if (configure) configure(app);
  const data = app.parse(source);
  const html = app.render(data, manualPE);
  const outputs = Object.fromEntries(Object.entries(html).map(([name, value]) => [name, toText(value)]));
  const reviews = Object.fromEntries(['summary', 'discharge'].map(name => [name, toText(app.context.generateNarrativeReview(data, manualPE, name))]));
  assert.equal(app.errors.length, 0);
  return { app, data, html, outputs, reviews };
}

test('source fidelity: multiline resuscitation retains supplied positive and negative actions without adding others', () => {
  const { outputs } = specimen(`${BASE}\nResuscitation:\nManual positive pressure ventilation(+)\nIntubation(+)\nChest compression(-)`);
  assert.match(outputs.consultation, /Manual positive pressure ventilation\(\+\)/);
  assert.match(outputs.consultation, /Intubation\(\+\)/);
  assert.match(outputs.consultation, /Chest compression\(-\)/);
  assert.doesNotMatch(outputs.consultation, /Manual positive pressure ventilation\(-\)|Intubation\(-\)/);
});

for (const [description, status] of [['Complete', 'adequate'], ['Incomplete', 'inadequate']]) {
  test(`source fidelity: ${description.toLowerCase()} IAP keeps the drug, dose and timing`, () => {
    const { data, outputs } = specimen(`${BASE}\nGBS(+)\n${description} IAP: ampicillin 2 g IV, started 5 hours before delivery`);
    assert.equal(data.iapStatus, status);
    for (const name of perinatalNarrativeNames) {
      assert.match(outputs[name], /ampicillin 2 g IV/, `${name}: drug and dose`);
      assert.match(outputs[name], /started 5 hours before delivery/, `${name}: timing`);
    }
    assert.doesNotMatch(outputs.discharge, /ampicillin 2 g IV|started 5 hours before delivery/,
      'discharge does not repeat the maternal IAP paragraph');
    assert.doesNotMatch(outputs.consultation, /Prenatal antibiotics: (?:nil|Not documented)/);
    if (status === 'inadequate') assert.match(outputs.summary, /without adequate intrapartum antibiotic prophylaxis/);
  });
}

test('source fidelity: an antibiotic dose on the GBS line is not lost when IAP is a separate marker', () => {
  const { outputs } = specimen(`${BASE}\nGBS(+) with ampicillin 2 g IV started 5 hours before delivery; complete IAP`);
  for (const name of perinatalNarrativeNames) {
    assert.match(outputs[name], /ampicillin 2 g IV/);
    assert.match(outputs[name], /5 hours before delivery/);
  }
  assert.doesNotMatch(outputs.discharge, /ampicillin 2 g IV|5 hours before delivery/);
  assert.doesNotMatch(outputs.consultation, /Prenatal antibiotics: (?:nil|Not documented)/);
});

test('source fidelity: GDM management keeps multiple treatments and the source insulin dose', () => {
  const { outputs } = specimen(`${BASE}\nGDM(+) under diet control and insulin 4 units at bedtime`);
  for (const name of perinatalNarrativeNames) {
    assert.match(outputs[name], /diet control/);
    assert.match(outputs[name], /insulin 4 units at bedtime/);
  }
  assert.doesNotMatch(outputs.discharge, /diet control|insulin 4 units at bedtime/,
    'maternal management remains in admission/consultation, not the BR course');
  assert.match(outputs.diagnosis, /Infant of diabetic mother/);
});

test('source fidelity: clinical source sections end at PE and excluded Plan boundaries', () => {
  const { app, data, outputs } = specimen(`${BASE}\nPrenatal antibiotics:\nampicillin 2 g IV before delivery\nPE: left preauricular pit\nPlan: EXCLUDED_PLAN_SOURCE`);
  const records = app.context.getClinicalSourceRecords(data);
  assert.ok(records.prenatalAntibiotics.some(line => /ampicillin 2 g IV before delivery/.test(line)));
  assert.doesNotMatch(records.prenatalAntibiotics.join(' '), /left preauricular pit|EXCLUDED_PLAN_SOURCE/);
  for (const name of narrativeNames) {
    if (name === 'discharge') assert.doesNotMatch(outputs[name], /ampicillin 2 g IV before delivery/);
    else if (name === 'consultation') assert.match(outputs[name], /ampicillin 2 g IV before delivery/);
    assert.match(outputs[name], /left preauricular pit/);
    assert.doesNotMatch(outputs[name], /EXCLUDED_PLAN_SOURCE/);
  }
});

test('source fidelity: clinical records already inside PE remain available after rendering deduplication', () => {
  const { app, data, outputs, reviews } = specimen(`${BASE}\nPE:\nHeart murmur(+)\nRespiratory support: CPAP\nBlood glucose: 28 mg/dL`);
  const records = app.context.getClinicalSourceRecords(data);
  assert.ok(records.treatment.some(line => /CPAP/.test(line)));
  assert.ok(records.labs.some(line => /28 mg\/dL/.test(line)));
  for (const name of ['discharge']) {
    const care = outputs[name];
    assert.equal((care.match(/CPAP/g) || []).length, 1, `${name}: preserve source once in the appropriate region`);
    assert.match(care, /28 mg\/dL/);
    assert.doesNotMatch(outputs[name], /(?:Treatment and prophylaxis administration|Laboratory results)[^.]*not documented/);
  }
  assert.doesNotMatch(outputs.summary, /CPAP|28 mg\/dL/, 'untimed later clinical sections do not become initial PE');
  assert.match(outputs.summary, /heart murmur/i, 'the brief admission retains the actual examination finding');
  assert.equal(reviews.summary, '', 'detailed care is not duplicated in an admission review appendix');
  assert.doesNotMatch(outputs.consultation, /Additional treatment, investigation results, and disposition were not documented/);
});

test('source fidelity: phototherapy on a laboratory line is not contradicted by a missing-treatment statement', () => {
  const { outputs } = specimen(`${BASE}\nTotal bilirubin: elevated, 20 mg/dL; phototherapy started`);
  assert.match(outputs.discharge, /20 mg\/dL/);
  assert.match(outputs.discharge, /phototherapy (?:was )?started/i);
  assert.doesNotMatch(outputs.discharge, /Treatment and prophylaxis administration[^.]*not documented|bilirubin[^.]*within normal limits/);
});

test('source fidelity: antibiotics on a hospital-course line are not contradicted by missing-treatment or self-resolution text', () => {
  const { outputs } = specimen(`${BASE}\nHospital course: persistent fever, antibiotics started`, ['Fever']);
  assert.match(outputs.discharge, /persistent fever/i);
  assert.match(outputs.discharge, /antibiotics (?:were )?started/i);
  assert.doesNotMatch(outputs.discharge, /Treatment and prophylaxis administration[^.]*not documented|resolved without intervention/);
});

test('original template contract: selected controls restore all original endings without a consultation plan appendix', () => {
  const { outputs, reviews } = specimen(`${BASE}\nGDM(+)`, ['Respiratory distress', 'Fever', 'Undescended testis (lt)', 'Hydrocele'], app => {
    app.document.getElementById('sepsisWorkup').checked = true;
    app.document.querySelector('input[name="sepsisReason"][value="fever"]').checked = true;
    app.document.getElementById('nbcTransfer').checked = true;
    app.document.querySelector('input[name="nbcReason"][value="respiratory"]').checked = true;
  });
  assert.match(outputs.consultation, /Therefore, he was transferred to NBC for further evaluation and treatment due to persistent respiratory symptoms\./);
  assert.doesNotMatch(outputs.consultation, /Sepsis evaluation plan selected|Selected transfer plan:|Blood glucose monitoring plan|blood culture was performed|laboratory results were within normal limits|O2 hood was provided|weaned to room air|resolved without intervention|received routine prophylaxis|Caregivers were counseled|verbalized understanding|was discharged in stable condition/);
  assert.match(outputs.summary, /sepsis workup including CBC\/DC, CRP, and blood culture was performed/i);
  assert.match(outputs.summary, /blood glucose monitoring for 24 hours/i);
  assert.match(outputs.summary, /transferred to NBC for further evaluation and care/i);
  assert.doesNotMatch(outputs.summary, /Sepsis evaluation plan selected|Selected transfer plan: NBC|Blood glucose monitoring plan|laboratory results were within normal limits|received routine prophylaxis|Caregivers were counseled|was discharged in stable condition/i);
  assert.equal(reviews.summary, '');
  assert.match(outputs.discharge, /sepsis workup including CBC\/DC, CRP, and blood culture was performed/i);
  assert.match(outputs.discharge, /laboratory results were within normal limits/i);
  assert.match(outputs.discharge, /Blood glucose levels were monitored per protocol and remained within normal limits/i);
  assert.match(outputs.discharge, /O2 hood was provided/i);
  assert.match(outputs.discharge, /symptoms persisted/i, 'the original selected NBC respiratory branch remains available');
  assert.match(outputs.discharge, /admitted to the NBC/i);
  assert.match(outputs.discharge, /fever[^.]*resolved without intervention/i);
  assert.match(outputs.discharge, /Caregivers were counseled/i);
  assert.doesNotMatch(outputs.discharge, /Sepsis evaluation plan selected|Selected transfer plan: NBC|Blood glucose monitoring plan|Counseling checklist/);
  assert.equal(reviews.discharge, '', 'restored discharge controls are expressed in its course, without a duplicate plan checklist');
  assert.match(outputs.diagnosis, /# Respiratory distress/);
});

for (const [campus, interval] of [['tpc', /every 2 hours \(Q2H\)/], ['ttmh', /every 8 hours \(Q8H\)/]]) {
  test(`discharge template contract: ${campus} selected HC interval restores its monitoring and outcome sentence`, () => {
    const { outputs, reviews } = specimen(BASE, ['Caput succedaneum'], app => {
      app.document.getElementById('peCaput').checked = true;
      app.document.getElementById('caputHcInput').checked = true;
    }, campus);
    assert.equal(reviews.summary, '');
    assert.match(outputs.summary, /caput succedaneum/i);
    assert.doesNotMatch(outputs.summary, /head circumference was monitored|No significant interval increase was observed/i,
      'the original brief admission does not copy the discharge monitoring outcome');
    assert.doesNotMatch(outputs.discharge, /Selected head circumference monitoring plan|check HC/);
    assert.match(outputs.discharge, /head circumference was monitored/i);
    assert.match(outputs.discharge, interval);
    assert.match(outputs.discharge, /No significant interval increase was observed/i);
    assert.equal(reviews.discharge, '');
  });
}

for (const verbosity of ['short', 'long']) {
  test(`discharge template contract: ${verbosity} counseling option restores the original UDT and hydrocele prose`, () => {
    const { outputs, reviews } = specimen(BASE, ['Undescended testis (lt)', 'Hydrocele'], app => {
      app.document.querySelectorAll('input[name="verbosity"]').forEach(input => { input.checked = input.value === verbosity; });
    });
    assert.match(outputs.discharge, /left undescended testis/i);
    assert.match(outputs.discharge, /hydrocele/i);
    assert.match(outputs.discharge, /Caregivers were counseled/i);
    assert.match(outputs.discharge, /pediatric surgery/i);
    assert.doesNotMatch(outputs.discharge, /Counseling checklist/);
    assert.equal(reviews.discharge, '');
    if (verbosity === 'long') {
      assert.match(outputs.discharge, /Caregivers verbalized understanding/i);
      assert.match(outputs.discharge, /infertility|testicular torsion/i);
      assert.match(outputs.discharge, /12-18 months/i);
    } else assert.doesNotMatch(outputs.discharge, /Caregivers verbalized understanding|infertility|testicular torsion|12-18 months/i);
  });
}

test('source fidelity: explicitly recorded completed actions and discharge details remain in their original discharge slots', () => {
  const { app, data, outputs, reviews } = specimen(`${BASE}\nTreatment: HBIG given at 03:00.\nLaboratory: blood glucose within normal limits, as measured.\nHospital course: fever resolved after antibiotics.\nEducation: caregivers counseled about follow-up.\nDischarge: stable; OPD follow-up on 2026-10-26.`);
  for (const name of ['discharge']) {
    // Tense agreement and capitalization may change; dose/time, action state,
    // measured result and explicitly supplied temporal relation may not.
    for (const fact of [/HBIG (?:was )?(?:given|administered) at 03:00/i, /blood glucose (?:was )?within normal limits, as measured/i, /fever resolved after antibiotics/i, /OPD follow-up (?:on|was planned for) 2026-10-26/i]) {
      assert.match(outputs[name], fact, `${name}: ${fact}`);
    }
  }
  const records = app.context.getClinicalSourceRecords(data);
  assert.ok(records.treatment.some(line => /HBIG given at 03:00/.test(line)));
  assert.ok(records.course.some(line => /fever resolved after antibiotics/.test(line)));
  assert.doesNotMatch(outputs.consultation, /@ Clinical records|HBIG|fever resolved|counseled|2026-10-26/,
    'later-course fields are not appended to the restored consultation');
  assert.doesNotMatch(outputs.summary, /HBIG|blood glucose|fever resolved|counseled|OPD follow-up/i);
  assert.equal(reviews.summary, '');
});

test('source fidelity: unknown information stays unresolved and source markup cannot become HTML', () => {
  const empty = specimen('');
  assert.doesNotMatch(empty.outputs.diagnosis, /# Term infant|, AGA|Infant of diabetic mother/);
  for (const name of narrativeNames) assert.doesNotMatch(empty.outputs[name], /GBS\(-\)|GDM\(-\)|PROM\(-\)|MAS\(-\)/);
  const { app, data, html, outputs, reviews } = specimen(`${BASE}\nTreatment: CPAP <mark data-source="literal">source notation</mark>`);
  for (const name of ['discharge']) {
    const regionHtml = html[name];
    assert.match(regionHtml, /&lt;mark\b/);
    assert.doesNotMatch(regionHtml, /<mark\s+data-source/);
    assert.match(outputs[name], /CPAP/);
  }
  assert.doesNotMatch(outputs.summary, /CPAP|source notation/);
  assert.equal(reviews.summary, '');
});
