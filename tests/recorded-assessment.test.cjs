'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, toText } = require('./app-harness.cjs');

// Entirely synthetic, deliberately ordinary background; no patient data.
const BASE = `Female newborn
GA 38+3 weeks, BW 3200 gm, AGA
30 y/o mother, G1 P1 A0
NSD
Maternal blood group: type O, Rh+
GBS(-)
GDM(-)
HBsAg(-), HBeAg(-), HIV(-), RPR(-)
PROM(-), MAS(-)
Apgar score: 8 -> 9`;

const NARRATIVES = ['summary', 'consultation', 'discharge'];
const NO_UNSUPPORTED_HIP_NORMAL = /screening for DDH risk factors and physical signs was negative|physical examination of the hips was unremarkable|hip (?:examination|exam)(?: was| is)? (?:normal|unremarkable)|but physical signs were negative/i;

function narrativeAssertions(outputs, assertion) {
  for (const name of NARRATIVES) assertion(toText(outputs[name]), name, outputs[name]);
}

function noUnsupportedHipNormal(outputs) {
  narrativeAssertions(outputs, (text, name) => {
    assert.doesNotMatch(text, NO_UNSUPPORTED_HIP_NORMAL, `${name} must not turn missing/partial evidence into a normal hip examination`);
  });
}

test('screenshot-style spacing preserves each positive risk and compression finding', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}
DDH risk factors: Breech(-), Family Hx (+), Oligohydramnios (+), Twins (+)
子宮內壓迫徵象: 斜頸(-), 足踝內翻(-), 膝反曲(-), 大腿姿勢不對稱 (+)`);
  assert.deepEqual(Array.from(data.ddhRisk).sort(), ['family history of DDH', 'oligohydramnios', 'twin pregnancy'].sort());
  assert.deepEqual(Array.from(data.compressionSigns), ['asymmetric thigh posture']);
  const outputs = app.render(data);
  narrativeAssertions(outputs, (text, name) => {
    assert.match(text, /family history of DDH/i, `${name}: family history`);
    assert.match(text, /oligohydramnios/i, `${name}: oligohydramnios`);
    assert.match(text, /twin pregnancy/i, `${name}: twin pregnancy`);
    assert.match(text, /asymmetric thigh posture|大腿姿勢不對稱/i, `${name}: compression sign`);
  });
  noUnsupportedHipNormal(outputs);
});

test('multiline DDH and compression sections parse without requiring the values on the heading line', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}
DDH risk factors:
  Breech (+)
  Family Hx (-)
  Oligohydramnios (+)
  Twins (-)
子宮內壓迫徵象:
  斜頸 (+)
  足踝內翻 (-)
  膝反曲 (+)
  大腿姿勢不對稱 (-)
PE:
  Barlow (-), Ortolani (+)`);
  assert.deepEqual(Array.from(data.ddhRisk).sort(), ['breech presentation', 'oligohydramnios'].sort());
  assert.deepEqual(Array.from(data.compressionSigns).sort(), ['torticollis', 'genu recurvatum'].sort());
  assert.match(data.ddhPe.join(' '), /positive Ortolani/i);
  assert.doesNotMatch(data.ddhPe.join(' '), /positive Barlow/i);
});

test('case, fullwidth signs, and whitespace are accepted without making negative siblings positive', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}
ddh risk factors：breech（＋）, family hx（－）, oligohydramnios (+ ), twins（－）
子宮內壓迫徵象：斜頸（＋）, 足踝內翻（－）, 膝反曲（－）, 大腿姿勢不對稱（－）
PE：BARLOW（－）, ORTOLANI（＋）`);
  assert.deepEqual(Array.from(data.ddhRisk).sort(), ['breech presentation', 'oligohydramnios'].sort());
  assert.deepEqual(Array.from(data.compressionSigns), ['torticollis']);
  assert.match(data.ddhPe.join(' '), /positive Ortolani/i);
  assert.doesNotMatch(data.ddhPe.join(' '), /positive Barlow/i);
});

test('mixed positive and negative hip signs preserve the actual positive sign in all narratives', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}\nPE: Barlow(-), Ortolani(+)`);
  assert.match(data.ddhPe.join(' '), /positive Ortolani/i);
  assert.doesNotMatch(data.ddhPe.join(' '), /positive Barlow/i);
  const outputs = app.render(data);
  narrativeAssertions(outputs, (text, name) => assert.match(text, /Ortolani/i, `${name}: Ortolani finding`));
  noUnsupportedHipNormal(outputs);
});

test('missing DDH fields do not become negative screening or a normal hip examination', () => {
  const app = loadApp();
  noUnsupportedHipNormal(app.render(app.parse(BASE)));
});

test('a DDH risk factor with no hip PE does not imply a normal examination or completed follow-up', () => {
  const app = loadApp();
  const outputs = app.render(app.parse(`${BASE}\nDDH risk factors: Breech(+)`));
  noUnsupportedHipNormal(outputs);
  narrativeAssertions(outputs, (text, name) => {
    assert.match(text, /breech presentation/i, `${name}: risk retained`);
    assert.doesNotMatch(text, /outpatient follow-up examination was arranged|DDH screening was performed/i, `${name}: no unrecorded completed action`);
  });
});

test('one explicitly negative hip sign does not establish a negative full DDH screen', () => {
  const app = loadApp();
  noUnsupportedHipNormal(app.render(app.parse(`${BASE}\nPE: Barlow(-)`)));
});

test('contradictory duplicates remain uncertain rather than definite positive findings', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}
DDH risk factors: Breech(+), Breech(-)
子宮內壓迫徵象: 斜頸(+), 斜頸(-)
PE: Ortolani(+), Ortolani(-)`);
  assert.ok(!data.ddhRisk.includes('breech presentation'), 'contradictory breech observations must not be stored as definite positive');
  assert.ok(!data.compressionSigns.includes('torticollis'), 'contradictory compression observations must not be stored as definite positive');
  assert.doesNotMatch(data.ddhPe.join(' '), /positive Ortolani/i, 'contradictory hip observations must not be stored as definite positive');
  noUnsupportedHipNormal(app.render(data));
});

test('indeterminate signs do not become definite positives or a negative screen', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}
DDH risk factors: Breech(?), Family Hx(±)
子宮內壓迫徵象: 斜頸(+/-)
PE: Barlow(±), Ortolani(?)`);
  assert.equal(data.ddhRisk.length, 0);
  assert.equal(data.compressionSigns.length, 0);
  assert.equal(data.ddhPe.length, 0);
  noUnsupportedHipNormal(app.render(data));
});

test('explicitly negative siblings never leak into the definite-positive arrays', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}
DDH risk factors: Breech(-), Family Hx(-), Oligohydramnios(-), Twins(-)
子宮內壓迫徵象: 斜頸(-), 足踝內翻(-), 膝反曲(-), 大腿姿勢不對稱(-)
PE: Barlow(-), Ortolani(-), Galeazzi(-), Limitation of abduction(-)`);
  assert.equal(data.ddhRisk.length, 0);
  assert.equal(data.compressionSigns.length, 0);
  assert.equal(data.ddhPe.length, 0);
});

test('raw PE grade and laterality are preserved across the three narratives with all manual controls unchecked', () => {
  const app = loadApp();
  const outputs = app.render(app.parse(`${BASE}\nPE: grade 2/6 systolic murmur; left hip abduction limited`));
  assert.equal(app.context.getPEFindings().length, 0, 'raw observations do not silently set manual controls');
  narrativeAssertions(outputs, (text, name) => {
    assert.match(text, /2\/6/i, `${name}: grade retained`);
    assert.match(text, /systolic murmur/i, `${name}: finding retained`);
    assert.match(text, /left hip abduction limited/i, `${name}: laterality retained`);
  });
  noUnsupportedHipNormal(outputs);
});

test('recorded PE keeps respiratory findings factual while positive hip signs restore only the discharge DDH follow-up template', () => {
  const app = loadApp();
  const outputs = app.render(app.parse(`${BASE}
PE: Respiratory distress with nasal flaring; Fever(+); Ortolani(+)`));
  narrativeAssertions(outputs, (text, name) => {
    assert.match(text, /nasal flaring/i, `${name}: raw finding retained`);
    assert.match(text, /Ortolani/i, `${name}: raw hip finding retained`);
    assert.doesNotMatch(text, /O2 hood was provided|weaned to room air|resolved without intervention|Free flow oxygen\(\+\)/i, `${name}: raw PE is not a selection of a respiratory or fever course template`);
    if (name !== 'discharge') assert.doesNotMatch(text, /outpatient follow-up examination was arranged/i,
      `${name}: no completed follow-up inferred solely from raw PE`);
    else assert.match(text, /outpatient follow-up examination was arranged/i,
      'definite positive hip PE restores the original discharge-specific DDH follow-up sentence');
  });
});

test('PE text stops at Plan and does not swallow a subsequent maternal section', () => {
  const app = loadApp();
  const outputs = app.render(app.parse(`${BASE}
PE:
  left preauricular pit
Plan:
  ONLY_PLAN_SENTINEL
Maternal condition:
  ONLY_MATERNAL_SENTINEL`));
  narrativeAssertions(outputs, (text, name) => {
    assert.match(text, /left preauricular pit/i, `${name}: multiline raw PE retained`);
    assert.doesNotMatch(text, /ONLY_PLAN_SENTINEL|ONLY_MATERNAL_SENTINEL/i, `${name}: section boundary respected`);
  });
});

test('maternal pre-eclampsia wording is not captured as newborn raw PE', () => {
  const app = loadApp();
  const outputs = app.render(app.parse(`${BASE}\nMaternal PE(+): ONLY_MATERNAL_PE_SENTINEL\nPre-eclampsia(+)`));
  narrativeAssertions(outputs, (text, name) => {
    assert.doesNotMatch(text, /ONLY_MATERNAL_PE_SENTINEL/i, `${name}: maternal PE is not an examination header`);
  });
});

test('unrecognized raw examination content is preserved as escaped text', () => {
  const app = loadApp();
  const outputs = app.render(app.parse(`${BASE}\nPE: left heel mark <mark data-test="literal">source notation</mark>`));
  narrativeAssertions(outputs, (text, name, html) => {
    assert.match(text, /left heel mark/i, `${name}: unknown finding retained`);
    assert.match(html, /&lt;mark\b/i, `${name}: literal markup escaped`);
    assert.doesNotMatch(html, /<mark\s+data-test/i, `${name}: raw markup cannot create elements`);
  });
});

test('manual findings still add to the record and reset clears both manual and source observations', () => {
  const app = loadApp();
  app.document.getElementById('inputData').value = `${BASE}\nPE: left preauricular pit`;
  app.document.querySelector('input[name="peFinding"][value="Heart murmur"]').checked = true;
  app.context.updateUI();
  assert.equal(app.errors.length, 0, 'updateUI should not report a parse or DOM error');
  for (const id of ['outputSummary', 'consultOutput', 'dischargeOutput']) {
    assert.match(toText(app.document.getElementById(id).innerHTML), /left preauricular pit/i, `${id}: source observation retained`);
  }
  for (const id of ['outputSummary', 'consultOutput', 'diagnosisOutput']) {
    assert.match(toText(app.document.getElementById(id).innerHTML), /murmur/i, `${id}: manual finding retained`);
  }
  app.context.resetAll();
  assert.equal(app.document.getElementById('inputData').value, '');
  assert.equal(app.context.getPEFindings().length, 0);
  for (const id of ['outputSummary', 'consultOutput', 'dischargeOutput', 'diagnosisOutput']) {
    assert.doesNotMatch(toText(app.document.getElementById(id).innerHTML), /preauricular pit|murmur/i, `${id}: reset removes the previous record`);
  }
  app.document.getElementById('inputData').value = BASE;
  app.context.updateUI();
  assert.equal(app.errors.length, 0);
  for (const id of ['outputSummary', 'consultOutput', 'dischargeOutput', 'diagnosisOutput']) {
    assert.doesNotMatch(toText(app.document.getElementById(id).innerHTML), /preauricular pit|murmur/i, `${id}: new input has no stale findings`);
  }
});

test('blank input cannot create a documented negative DDH screen', () => {
  const app = loadApp();
  noUnsupportedHipNormal(app.render(app.parse('')));
  app.document.getElementById('inputData').value = '';
  app.context.updateUI();
  assert.equal(app.errors.length, 0);
  for (const id of ['outputSummary', 'consultOutput', 'dischargeOutput']) {
    assert.doesNotMatch(toText(app.document.getElementById(id).innerHTML), NO_UNSUPPORTED_HIP_NORMAL, `${id}: blank/placeholder input is not a negative DDH screen`);
  }
});

for (const [campus, expectedInterval] of [['tpc', /every 2 hours \(Q2H\)/], ['ttmh', /every 8 hours \(Q8H\)/]]) {
  test(`${campus}: shared assessment and the existing manual head-circumference interval both remain available`, () => {
    const app = loadApp(campus);
    app.document.getElementById('peCaput').checked = true;
    app.document.getElementById('caputHcInput').checked = true;
    const data = app.parse(`${BASE}\nDDH risk factors: Oligohydramnios (+)\nPE: left preauricular pit`);
    const outputs = app.render(data, app.context.getPEFindings());
    narrativeAssertions(outputs, (text, name) => {
      assert.match(text, /oligohydramnios/i, `${campus}/${name}: risk retained`);
      assert.match(text, /left preauricular pit/i, `${campus}/${name}: raw examination retained`);
    });
    assert.match(toText(outputs.discharge), expectedInterval, `${campus}: original selected HC monitoring sentence is restored in discharge`);
    assert.match(toText(outputs.discharge), /head circumference was monitored/i);
    assert.match(toText(outputs.discharge), /No significant interval increase was observed/i);
    assert.match(toText(outputs.summary), campus === 'tpc' ? /check HC Q2H then QD/i : /check HC Q8H/i,
      `${campus}: the original selected caput detail remains available in brief admission`);
    assert.doesNotMatch(toText(outputs.summary), /head circumference was monitored|No significant interval increase was observed/i);
    assert.equal(app.context.generateNarrativeReview(data, app.context.getPEFindings(), 'summary'), '');
    assert.equal(app.context.generateNarrativeReview(data, app.context.getPEFindings(), 'discharge'), '');
  });
}

test('a shared negation over coordinated hip tests is not turned into a positive result', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}\nPE: no Barlow or Ortolani positive`);
  assert.equal(data.ddhPe.length, 0, 'a negated coordinated phrase is not a definite positive Ortolani test');
  const outputs = app.render(data);
  narrativeAssertions(outputs, (text, name) => {
    assert.match(text, /Barlow/i, `${name}: first sign retained`);
    assert.match(text, /Ortolani/i, `${name}: second sign retained`);
    assert.doesNotMatch(text, /documented positive Ortolani|positive Ortolani's sign/i, `${name}: no positive finding invented from a negated phrase`);
  });
  noUnsupportedHipNormal(outputs);
});

test('conditional hip tests in a Plan block are not re-imported by standalone-test parsing', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}
PE: left preauricular pit
Plan:
  If Barlow(+) or Ortolani(+), ONLY_PLAN_HIP_SENTINEL.`);
  assert.equal(data.ddhPe.length, 0, 'conditional future tests are not observed positive hip findings');
  const outputs = app.render(data);
  narrativeAssertions(outputs, (text, name) => {
    assert.match(text, /left preauricular pit/i, `${name}: true PE retained`);
    assert.doesNotMatch(text, /ONLY_PLAN_HIP_SENTINEL|positive Barlow|positive Ortolani/i, `${name}: Plan cannot re-enter as a hip examination`);
  });
});

test('a maternal history of a hip test is not re-imported as the newborn examination', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}
Maternal history:
  Mother had Barlow(+) as an infant, ONLY_MATERNAL_HIP_SENTINEL.
PE: left preauricular pit`);
  assert.equal(data.ddhPe.length, 0, 'the newborn has no documented positive Barlow test');
  narrativeAssertions(app.render(data), (text, name) => {
    assert.match(text, /left preauricular pit/i, `${name}: newborn PE retained`);
    assert.doesNotMatch(text, /ONLY_MATERNAL_HIP_SENTINEL|positive Barlow/i, `${name}: maternal history does not become newborn PE`);
  });
});

test('an inline Plan header terminates an inline PE block', () => {
  const app = loadApp();
  const outputs = app.render(app.parse(`${BASE}\nPE: left preauricular pit; Plan: ONLY_INLINE_PLAN_SENTINEL`));
  narrativeAssertions(outputs, (text, name) => {
    assert.match(text, /left preauricular pit/i, `${name}: inline PE retained`);
    assert.doesNotMatch(text, /ONLY_INLINE_PLAN_SENTINEL/i, `${name}: inline Plan is not PE content`);
  });
});

test('compound Hip PE and DDH PE headings preserve the scope of a group-level negative', () => {
  for (const heading of ['Hip PE', 'DDH PE']) {
    const app = loadApp();
    const outputs = app.render(app.parse(`${BASE}\n${heading}: negative`));
    narrativeAssertions(outputs, (text, name) => {
      assert.match(text, /(?:hip|DDH)[^.\n]*negative/i, `${heading}/${name}: the documented negative remains hip-specific`);
      assert.doesNotMatch(text, /Recorded physical examination:\s*negative/i, `${heading}/${name}: a hip-only negative is not a general physical-exam negative`);
    });
  }
});
