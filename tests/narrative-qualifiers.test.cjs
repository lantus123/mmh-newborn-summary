'use strict';

// Concrete counterexamples from independent narrative review. These tests
// protect clinical meaning when shorthand receives a complete English sentence.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, toText } = require('./app-harness.cjs');
const BASE = 'Male newborn\nGA 39+0 weeks\nBW 3200 gm\nNSD';

function render(source, manualPE = []) {
  const app = loadApp();
  const data = app.parse(source);
  const outputs = Object.fromEntries(Object.entries(app.render(data, manualPE)).map(([key, html]) => [key, toText(html)]));
  const reviews = Object.fromEntries(['summary','discharge'].map(name=>[name,toText(app.context.generateNarrativeReview(data,manualPE,name))]));
  assert.equal(app.errors.length, 0);
  return { app, data, outputs, reviews };
}

test('narrative qualifiers: PE alternatives and uncertain or contradictory prefixes are preserved together', () => {
  for (const finding of ['Heart murmur(-), or Hydrocele(+)', 'No heart murmur(+)', 'Possible Heart murmur(+)']) {
    const { outputs } = render(`${BASE}\nPE: ${finding}`);
    for (const name of ['summary', 'discharge']) {
      assert.ok(outputs[name].includes(finding), `${name}: retain the complete qualified source`);
      assert.doesNotMatch(outputs[name], /(?:murmur|hydrocele) was (?:present|absent)/i, `${name}: no unqualified observation replaces the source`);
    }
  }
});

test('narrative qualifiers: different observation times are not a source conflict, while undated opposites remain unresolved', () => {
  const timedResult = render(`${BASE}\nPE: Heart murmur(-) at birth, Heart murmur(+) on day 2`);
  const timed = timedResult.outputs;
  const undated = render(`${BASE}\nPE: Heart murmur(+), Heart murmur(-)`).outputs;
  assert.doesNotMatch(undated.diagnosis, /^# Heart murmur\b/im,
    'unresolved opposing source observations do not establish a definite diagnosis');
  for (const name of ['summary', 'discharge']) {
    assert.match(timed[name], /heart murmur(?:\(-\)| was absent) at birth/i);
    if(name === 'summary'){
      assert.doesNotMatch(timed[name], /present on day 2|murmur\(\+\)/i);
      assert.doesNotMatch(timedResult.outputs.consultation, /Heart murmur\(\+\) on day 2/i,
        'the original consultation concerns delivery, not the later BR course');
      assert.equal(timedResult.reviews.summary, '', 'the brief admission no longer adds a later-course review appendix');
    }else assert.match(timed[name], /heart murmur(?:\(\+\)| was present)? on day 2/i);
    assert.doesNotMatch(timed[name], /conflict/i);
    assert.match(undated[name], /conflict/i);
    assert.match(undated[name], /Heart murmur\(\+\)[\s\S]*Heart murmur\(-\)/,
      'both opposing results stay in the same original PE slot; prose may use an appropriate conjunction');
  }
});

test('narrative qualifiers: settings or feeding descriptions do not establish administration when qualified as unstarted or declined', () => {
  for (const line of [
    'Respiratory support: CPAP at 5 cm H2O, not yet started',
    'Respiratory support: CPAP at 5 cm H2O planned',
    'Feeding: formula not yet started',
    'Feeding: formula declined',
    'Feeding: breastfeeding not established',
  ]) {
    const { app, data, outputs, reviews } = render(`${BASE}\n${line}`);
    const records = app.context.getClinicalSourceRecords(data);
    assert.ok([...records.treatment, ...records.course].includes(line), 'the parser keeps the qualifier with its clinical subject');
    for (const name of ['discharge']) {
      assert.ok(outputs[name].includes(line.replace(/^[^:]+:\s*/, '')), `${name}: keep the qualifier with its subject in the matching original slot`);
      assert.doesNotMatch(outputs[name], /support consisted of|feeding consisted of/i, `${name}: no actual administration implied`);
    }
    assert.doesNotMatch(outputs.summary, /CPAP|formula|breastfeeding/i);
    assert.equal(reviews.summary, '');
  }
});

test('narrative qualifiers: a cancelled appointment stays cancelled rather than becoming a future follow-up plan', () => {
  const { outputs, reviews } = render(`${BASE}\nOPD follow-up on 2026-10-26 was cancelled`);
  for (const name of ['discharge']) {
    assert.match(outputs[name], /OPD follow-up on 2026-10-26 was cancelled/);
    assert.doesNotMatch(outputs[name], /follow-up was (?:planned|scheduled|arranged)|scheduled MBD and OPD follow-up/i,
      'a cancelled supplied appointment overrides the corresponding default follow-up sentence');
  }
  assert.doesNotMatch(outputs.summary, /2026-10-26|follow-up/i);
  assert.equal(reviews.summary, '');
});

test('narrative qualifiers: days of life and days of antibiotic treatment retain distinct source anchors', () => {
  const { app, data, outputs, reviews } = render(`${BASE}\nHospital course: antibiotics started on day 5 of life.\nHospital course: fever resolved on day 2 of antibiotic treatment.`);
  const records = app.context.getClinicalSourceRecords(data);
  assert.deepEqual(Array.from(records.course), ['Hospital course: antibiotics started on day 5 of life.', 'Hospital course: fever resolved on day 2 of antibiotic treatment.']);
  assert.doesNotMatch(outputs.discharge, /fever resolved on day 2 of life|antibiotics started on day 2/i,
    'a source-only course archive is no longer mandatory, and different time anchors cannot be recast as one timeline');
  assert.doesNotMatch(outputs.summary, /antibiotics|fever resolved/i);
  assert.equal(reviews.summary, '');
});

test('narrative qualifiers: unresolved or negated delivery modifiers do not become confirmed interventions in the original delivery field', () => {
  const result = render('Male newborn\nGA 39 weeks\nBW 3200 gm\nNSD, vacuum or forceps');
  const alternate = result.outputs;
  assert.equal(result.data.deliveryLine, 'NSD, vacuum or forceps', 'the unmodified source remains available without a new source paragraph');
  const negative = render('Male newborn\nGA 39 weeks\nBW 3200 gm\nNSD, painless(-)').outputs;
  for (const name of ['summary', 'consultation']) {
    assert.match(alternate[name], /NSD|vaginal delivery/i, `${name}: the explicitly supplied delivery mode remains in its original field`);
    assert.doesNotMatch(alternate[name], /with vacuum assistance|and forceps assistance|vacuum-assisted|forceps-assisted/i);
    assert.doesNotMatch(negative[name], /with painless labor/i);
  }
  for (const discharge of [alternate.discharge, negative.discharge]) {
    assert.doesNotMatch(discharge, /NSD|vacuum|forceps|painless labor/i,
      'the restored BR discharge template does not repeat delivery details');
  }
});

test('narrative qualifiers: corrected birth measurements keep unresolved original fields and preserve both source values without affirming a superseded number', () => {
  const { data, outputs } = render('Male newborn\nGA 39 weeks, corrected to 38 weeks\nBW 3200 gm, corrected to 3100 gm\nNSD');
  assert.equal(data.ga, '?');
  assert.equal(data.gaWeeks, null);
  assert.equal(data.bw, '?');
  assert.match(data.gaSource, /GA 39 weeks, corrected to 38 weeks/);
  assert.match(data.bwSource, /BW 3200 gm, corrected to 3100 gm/);
  for (const [name, text] of Object.entries(outputs)) {
    if (name === 'discharge') {
      assert.doesNotMatch(text, /GA 39 weeks|38 weeks|BW 3200 gm|3100 gm|birth weight|born[^.]*weeks/i,
        'birth correction details stay in their admission, consultation and diagnosis documents');
      continue;
    }
    assert.match(text, /(?:GA|gestational age|at)\s*\?/i, `${name}: unresolved GA remains in its original field`);
    assert.match(text, /(?:BW|birth weight was)\s*\?/i, `${name}: unresolved weight remains in its original field`);
    assert.doesNotMatch(text, /born[^.]*at 39 weeks|birth weight was 3200 gm|# Term infant/i, `${name}: the original value is not stated as current`);
  }
});

test('narrative qualifiers: additional pending IAP remains in maternal documents without adding maternal history to discharge', () => {
  const { data, outputs } = render(`${BASE}\nGBS(+)\nComplete IAP\nIAP pending`);
  assert.match(data.iapSource, /Complete IAP/);
  assert.match(data.iapSource, /IAP pending/);
  assert.match(outputs.summary, /uncertain IAP completion|IAP[^.]*uncertain|uncertain[^.]*intrapartum antibiotic prophylaxis/i,
    'a pending entry prevents an unqualified completed-IAP assertion');
  assert.match(outputs.summary, /IAP pending|additional IAP entry/i);
  assert.match(outputs.consultation, /complete(?:d)? IAP/i);
  assert.doesNotMatch(outputs.summary, /with completed intrapartum antibiotic prophylaxis[.(]/i);
  assert.equal((outputs.summary.match(/pending/gi) || []).length, 1,
    'admission retains the original one-copy narrative qualifier requirement');
  // The same source now belongs only in the original GBS/prenatal fields.
  assert.match(outputs.consultation, /Complete IAP/i);
  assert.match(outputs.consultation, /IAP pending/);
  assert.doesNotMatch(outputs.discharge, /Complete IAP|IAP pending|additional IAP entry|intrapartum antibiotic prophylaxis/i);
});
