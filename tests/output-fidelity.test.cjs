'use strict';

// These checks exercise the real parser and four generators with synthetic records.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, toText } = require('./app-harness.cjs');

const BASE = 'Male newborn\nGA 39+0 weeks, BW 3200 gm, AGA\nNSD\nApgar score: 9 -> 10';
const narrativeNames = ['summary', 'consultation', 'discharge'];

function specimen(source, manualPE = [], configure, campus = 'tpc') {
  const app = loadApp(campus);
  if (configure) configure(app);
  const data = app.parse(source);
  const html = app.render(data, manualPE);
  const outputs = Object.fromEntries(Object.entries(html).map(([name, value]) => [name, toText(value)]));
  assert.equal(app.errors.length, 0);
  return { app, data, html, outputs };
}

test('source fidelity: multiline resuscitation retains supplied positive and negative actions without adding others', () => {
  const { outputs } = specimen(`${BASE}\nResuscitation:\nManual positive pressure ventilation(+)\nIntubation(+)\nChest compression(-)`);
  assert.match(outputs.consultation, /Manual positive pressure ventilation\(\+\)/);
  assert.match(outputs.consultation, /Intubation\(\+\)/);
  assert.match(outputs.consultation, /Chest compression\(-\)/);
  assert.doesNotMatch(outputs.consultation, /Manual positive pressure ventilation\(-\)|Intubation\(-\)|Free flow oxygen\(-\)|Neopuff[^\n]*\(-\)/);
});

for (const [description, status] of [['Complete', 'adequate'], ['Incomplete', 'inadequate']]) {
  test(`source fidelity: ${description.toLowerCase()} IAP keeps the drug, dose and timing`, () => {
    const { data, outputs } = specimen(`${BASE}\nGBS(+)\n${description} IAP: ampicillin 2 g IV, started 5 hours before delivery`);
    assert.equal(data.iapStatus, status);
    for (const name of narrativeNames) {
      assert.match(outputs[name], /ampicillin 2 g IV/, `${name}: drug and dose`);
      assert.match(outputs[name], /started 5 hours before delivery/, `${name}: timing`);
    }
    assert.doesNotMatch(outputs.consultation, /Prenatal antibiotics: (?:nil|Not documented)/);
    if (status === 'inadequate') assert.match(outputs.summary, /without adequate intrapartum antibiotic prophylaxis/);
  });
}

test('source fidelity: an antibiotic dose on the GBS line is not lost when IAP is a separate marker', () => {
  const { outputs } = specimen(`${BASE}\nGBS(+) with ampicillin 2 g IV started 5 hours before delivery; complete IAP`);
  for (const name of narrativeNames) {
    assert.match(outputs[name], /ampicillin 2 g IV/);
    assert.match(outputs[name], /5 hours before delivery/);
  }
  assert.doesNotMatch(outputs.consultation, /Prenatal antibiotics: (?:nil|Not documented)/);
});

test('source fidelity: GDM management keeps multiple treatments and the source insulin dose', () => {
  const { outputs } = specimen(`${BASE}\nGDM(+) under diet control and insulin 4 units at bedtime`);
  for (const name of narrativeNames) {
    assert.match(outputs[name], /diet control/);
    assert.match(outputs[name], /insulin 4 units at bedtime/);
  }
  assert.match(outputs.diagnosis, /Infant of diabetic mother/);
});

test('source fidelity: clinical source sections end at PE and excluded Plan boundaries', () => {
  const { outputs } = specimen(`${BASE}\nPrenatal antibiotics:\nampicillin 2 g IV before delivery\nPE: left preauricular pit\nPlan: EXCLUDED_PLAN_SOURCE`);
  for (const name of narrativeNames) {
    assert.match(outputs[name], /ampicillin 2 g IV before delivery/);
    assert.match(outputs[name], /left preauricular pit/);
    assert.doesNotMatch(outputs[name], /EXCLUDED_PLAN_SOURCE/);
  }
});

test('source fidelity: clinical records already inside PE remain available after rendering deduplication', () => {
  const { app, data, outputs } = specimen(`${BASE}\nPE:\nHeart murmur(+)\nRespiratory support: CPAP\nBlood glucose: 28 mg/dL`);
  const records = app.context.getClinicalSourceRecords(data);
  assert.ok(records.treatment.some(line => /CPAP/.test(line)));
  assert.ok(records.labs.some(line => /28 mg\/dL/.test(line)));
  for (const name of narrativeNames) {
    assert.equal((outputs[name].match(/CPAP/g) || []).length, 1, `${name}: preserve source once`);
    assert.match(outputs[name], /28 mg\/dL/);
    assert.doesNotMatch(outputs[name], /(?:Treatment and prophylaxis administration|Laboratory results)[^.]*not documented/);
  }
  assert.doesNotMatch(outputs.consultation, /Additional treatment, investigation results, and disposition were not documented/);
});

test('source fidelity: phototherapy on a laboratory line is not contradicted by a missing-treatment statement', () => {
  const { outputs } = specimen(`${BASE}\nTotal bilirubin: elevated, 20 mg/dL; phototherapy started`);
  assert.match(outputs.discharge, /20 mg\/dL; phototherapy started/);
  assert.doesNotMatch(outputs.discharge, /Treatment and prophylaxis administration[^.]*not documented|bilirubin[^.]*within normal limits/);
});

test('source fidelity: antibiotics on a hospital-course line are not contradicted by missing-treatment or self-resolution text', () => {
  const { outputs } = specimen(`${BASE}\nHospital course: persistent fever, antibiotics started`, ['Fever']);
  assert.match(outputs.discharge, /persistent fever, antibiotics started/);
  assert.doesNotMatch(outputs.discharge, /Treatment and prophylaxis administration[^.]*not documented|resolved without intervention/);
});

test('source fidelity: selected findings, infection workup and transfer controls express plans without completed care', () => {
  const { outputs } = specimen(`${BASE}\nGDM(+)`, ['Respiratory distress', 'Fever', 'Undescended testis (lt)', 'Hydrocele'], app => {
    app.document.getElementById('sepsisWorkup').checked = true;
    app.document.querySelector('input[name="sepsisReason"][value="fever"]').checked = true;
    app.document.getElementById('nbcTransfer').checked = true;
    app.document.querySelector('input[name="nbcReason"][value="respiratory"]').checked = true;
  });
  for (const name of narrativeNames) {
    assert.match(outputs[name], /Sepsis evaluation plan selected/);
    assert.match(outputs[name], /Selected transfer plan: NBC/);
    assert.match(outputs[name], /Blood glucose monitoring plan/);
    assert.doesNotMatch(outputs[name], /blood culture was performed|laboratory results were within normal limits|O2 hood was provided|weaned to room air|resolved without intervention|received routine prophylaxis|Caregivers were counseled|verbalized understanding|was transferred to|was discharged in stable condition/);
  }
  assert.match(outputs.diagnosis, /# Respiratory distress/);
});

for (const [campus, interval] of [['tpc', /every 2 hours \(Q2H\)/], ['ttmh', /every 8 hours \(Q8H\)/]]) {
  test(`source fidelity: ${campus} selected HC interval is a plan, with no invented measured outcome`, () => {
    const { outputs } = specimen(BASE, ['Caput succedaneum'], app => {
      app.document.getElementById('peCaput').checked = true;
      app.document.getElementById('caputHcInput').checked = true;
    }, campus);
    assert.match(outputs.discharge, /Selected head circumference monitoring plan/);
    assert.match(outputs.discharge, interval);
    assert.doesNotMatch(outputs.discharge, /head circumference was monitored|No significant interval increase was observed/);
  });
}

for (const verbosity of ['short', 'long']) {
  test(`source fidelity: ${verbosity} counseling option supplies topics without claiming counseling occurred`, () => {
    const { outputs } = specimen(BASE, ['Undescended testis (lt)', 'Hydrocele'], app => {
      app.document.querySelectorAll('input[name="verbosity"]').forEach(input => { input.checked = input.value === verbosity; });
    });
    assert.match(outputs.discharge, /Counseling checklist/);
    assert.match(outputs.discharge, /follow-up plan/);
    assert.doesNotMatch(outputs.discharge, /Caregivers were counseled|Caregivers verbalized understanding|follow-up examination was arranged/);
    if (verbosity === 'long') assert.match(outputs.discharge, /invite caregiver questions/);
  });
}

test('source fidelity: explicitly recorded completed actions and discharge details remain unchanged', () => {
  const { outputs } = specimen(`${BASE}\nTreatment: HBIG given at 03:00.\nLaboratory: blood glucose within normal limits, as measured.\nHospital course: fever resolved after antibiotics.\nEducation: caregivers counseled about follow-up.\nDischarge: stable; OPD follow-up on 2026-10-26.`);
  for (const name of narrativeNames) {
    for (const fact of ['HBIG given at 03:00', 'blood glucose within normal limits, as measured', 'fever resolved after antibiotics', 'caregivers counseled about follow-up', 'OPD follow-up on 2026-10-26']) {
      assert.ok(outputs[name].includes(fact), `${name}: ${fact}`);
    }
  }
});

test('source fidelity: unknown information stays unresolved and source markup cannot become HTML', () => {
  const empty = specimen('');
  assert.doesNotMatch(empty.outputs.diagnosis, /# Term infant|, AGA|Infant of diabetic mother/);
  for (const name of narrativeNames) assert.doesNotMatch(empty.outputs[name], /GBS\(-\)|GDM\(-\)|PROM\(-\)|MAS\(-\)|Serology: not tested|Prenatal (?:antibiotics|steroid use): nil/);
  const { html, outputs } = specimen(`${BASE}\nTreatment: CPAP <mark data-source="literal">source notation</mark>`);
  for (const name of narrativeNames) {
    assert.match(html[name], /&lt;mark\b/);
    assert.doesNotMatch(html[name], /<mark\s+data-source/);
    assert.match(outputs[name], /CPAP/);
  }
});
