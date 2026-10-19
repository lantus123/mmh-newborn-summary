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
  for (const name of ['summary', 'discharge']) {
    assert.match(timed[name], /heart murmur was absent at birth/i);
    if(name === 'summary'){
      assert.doesNotMatch(timed[name], /present on day 2|murmur\(\+\)/i);
      assert.match(timedResult.reviews.summary, /Heart murmur\(\+\) on day 2/i);
    }else assert.match(timed[name], /heart murmur was present on day 2/i);
    assert.doesNotMatch(timed[name], /conflict/i);
    assert.match(undated[name], /conflicting/i);
    assert.match(undated[name], /Heart murmur\(\+\), Heart murmur\(-\)/);
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
    const { outputs, reviews } = render(`${BASE}\n${line}`);
    for (const name of ['summary', 'discharge']) {
      assert.ok((name === 'summary' ? reviews.summary : outputs[name]).includes(line), `${name}: keep the qualifier with its subject in the appropriate region`);
      assert.doesNotMatch(outputs[name], /support consisted of|feeding consisted of/i, `${name}: no actual administration implied`);
    }
    assert.doesNotMatch(outputs.summary, /CPAP|formula|breastfeeding/i);
  }
});

test('narrative qualifiers: a cancelled appointment stays cancelled rather than becoming a future follow-up plan', () => {
  const { outputs, reviews } = render(`${BASE}\nOPD follow-up on 2026-10-26 was cancelled`);
  for (const name of ['summary', 'discharge']) {
    assert.match(name === 'summary' ? reviews.summary : outputs[name], /OPD follow-up on 2026-10-26 was cancelled/);
    assert.doesNotMatch(outputs[name], /follow-up was (?:planned|scheduled|arranged)/i);
  }
  assert.doesNotMatch(outputs.summary, /2026-10-26|follow-up/i);
});

test('narrative qualifiers: days of life and days of antibiotic treatment are not numerically reordered together', () => {
  const { outputs, reviews } = render(`${BASE}\nHospital course: antibiotics started on day 5 of life.\nHospital course: fever resolved on day 2 of antibiotic treatment.`);
  for (const name of ['summary', 'discharge']) {
    const care = name === 'summary' ? reviews.summary : outputs[name];
    assert.match(care, /antibiotics (?:were )?started on day 5 of life/i);
    assert.match(care, /fever resolved on day 2 of antibiotic treatment/i);
    assert.ok(care.indexOf('day 5 of life') < care.indexOf('day 2 of antibiotic treatment'), `${name}: preserve distinct time anchors and the supplied sequence`);
  }
  assert.doesNotMatch(outputs.summary, /antibiotics|fever resolved/i);
});

test('narrative qualifiers: alternative and explicitly negative delivery assistance stays consistent in all three narratives', () => {
  const alternate = render('Male newborn\nGA 39 weeks\nBW 3200 gm\nNSD, vacuum or forceps').outputs;
  const negative = render('Male newborn\nGA 39 weeks\nBW 3200 gm\nNSD, painless(-)').outputs;
  for (const name of ['summary', 'consultation', 'discharge']) {
    assert.equal((alternate[name].match(/NSD, vacuum or forceps/g) || []).length, 1, `${name}: retain the alternative source once`);
    assert.doesNotMatch(alternate[name], /with vacuum assistance|and forceps assistance/i);
    assert.match(negative[name], /Painless labor was not used/);
    assert.doesNotMatch(negative[name], /with painless labor/i);
  }
});

test('narrative qualifiers: corrected birth measurements retain both values without selecting the superseded number as definitive', () => {
  const { data, outputs } = render('Male newborn\nGA 39 weeks, corrected to 38 weeks\nBW 3200 gm, corrected to 3100 gm\nNSD');
  assert.equal(data.ga, '?');
  assert.equal(data.gaWeeks, null);
  assert.equal(data.bw, '?');
  for (const [name, text] of Object.entries(outputs)) {
    assert.match(text, /GA 39 weeks, corrected to 38 weeks/, `${name}: complete GA correction`);
    assert.match(text, /BW 3200 gm, corrected to 3100 gm/, `${name}: complete weight correction`);
    assert.doesNotMatch(text, /born[^.]*at 39 weeks|birth weight was 3200 gm|# Term infant/i, `${name}: the original value is not stated as current`);
  }
});

test('narrative qualifiers: an additional pending IAP record is retained once beside the documented adequate entry', () => {
  const { outputs } = render(`${BASE}\nGBS(+)\nComplete IAP\nIAP pending`);
  for (const name of ['summary', 'discharge']) {
    assert.match(outputs[name], /intrapartum antibiotic prophylaxis was documented as adequate/i);
    assert.equal((outputs[name].match(/pending/gi) || []).length, 1, `${name}: preserve the additional status without duplicating it`);
    assert.match(outputs[name], /additional IAP entry/i);
  }
});
