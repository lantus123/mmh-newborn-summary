'use strict';

// Synthetic acceptance for the user-approved BR document scope only.
// Admission restores the original brief birth/perinatal/initial-PE template;
// discharge uses the user's original routine BR template, with supplied BR
// observations and explicit exceptions overriding the corresponding defaults.
// Exact wording is not snapshotted. No transfer-workflow feature is tested here.
const test = require('node:test');
const assert = require('node:assert/strict');
const { setTimeout: delay } = require('node:timers/promises');
const { loadApp, toText } = require('./app-harness.cjs');

const BASE = 'Male newborn\nGA 39+0 weeks, BW 3200 gm, AGA\nNSD\n29 y/o mother, G1 P1 A0\nApgar score: 9 -> 10';
const BR_ADMISSION = 'Admitted to BR for routine newborn care.';
const CARE = 'Nursery course: feeding was well tolerated at 48 hours of age.';
const HOME = 'Discharged home in stable condition at 72 hours of age.';
const BODY_IDS = { summary: 'outputSummary', discharge: 'dischargeOutput' };
const REVIEW_IDS = { summary: 'summaryReview', discharge: 'dischargeReview' };

function specimen(source, manualPE = [], configure) {
  const app = loadApp();
  if (configure) configure(app);
  const data = app.parse(source);
  const html = app.render(data, manualPE);
  const bodies = Object.fromEntries(Object.entries(html).map(([kind, value]) => [kind, toText(value)]));
  const reviews = Object.fromEntries(Object.keys(REVIEW_IDS).map(kind => [kind,
    toText(app.context.generateNarrativeReview(data, manualPE, kind)),
  ]));
  assert.equal(app.errors.length, 0, 'source parsing and rendering succeed');
  return { app, data, html, bodies, reviews };
}

function preserveBirthContext(body) {
  for (const fact of [/male/i, /39\+0/, /3200/]) {
    assert.match(body, fact, `birth fact remains: ${fact}`);
  }
}

function sourceRetained(result, line, field) {
  const records = result.app.context.getClinicalSourceRecords(result.data);
  assert.ok(records[field].includes(line), `the ${field} parser retains the actual source: ${line}`);
  assert.doesNotMatch(result.bodies.consultation, /@ Clinical records|Additional source records/,
    'the restored consultation no longer serves as a later-course source archive');
  assert.equal(result.reviews.summary, '', 'the original admission style has no clinical-source review appendix');
}

function assertNoFullInpatientPrompt(text) {
  assert.doesNotMatch(text, /完整住院經過|治療反應|complete (?:inpatient |hospital )?course|treatment response/i,
    'ordinary BR notes must not require a complete inpatient course or treatment response');
}

function paragraphs(html) {
  return toText(String(html).replace(/<\/p\s*>|<\/div\s*>/gi, '\n\n'))
    .split(/\n\s*\n/).map(value => value.trim()).filter(Boolean);
}

test('BS-01: birth-only input retains admission context and produces the original routine BR discharge template', () => {
  const result = specimen(BASE);
  preserveBirthContext(result.bodies.summary);
  for (const kind of Object.keys(BODY_IDS)) {
    assertNoFullInpatientPrompt(`${result.bodies[kind]} ${result.reviews[kind]}`);
    assert.doesNotMatch(result.bodies[kind], /待確認|尚未提供|not documented|G\?P\?/i,
      'routine missing-data prompts do not become copyable prose');
  }
  assert.doesNotMatch(result.bodies.summary, /received.*(?:vitamin K|HBV vaccine)|feeding was well tolerated|discharged|stable condition|uneventful|unremarkable|routine care was provided/i,
    'restoring discharge defaults does not change admission facts');
  assert.match(result.bodies.summary, /G1\s*P1/i);
  assert.equal(result.data.a, '0');
  assert.match(result.bodies.consultation, /G1\s*P1\s*A0/i);
  assert.match(result.bodies.summary, /vaginal delivery|NSD/i);
  assert.match(result.bodies.summary, /APGAR/i);
  for (const part of [/^Upon admission, the infant received routine prophylaxis/i, /HBV vaccine \(IM\)/i,
    /tetracycline ophthalmic ointment/i, /Vitamin K1 \(IM\)/i, /routine nursery care/i,
    /rooming-in[^.]*mother/i, /Feeding volume was gradually increased as tolerated/i,
    /bilirubin[^.]*within normal limits/i, /discharged in stable condition/i, /MBD and OPD follow-up/i]) {
    assert.match(result.bodies.discharge, part, `original routine template restored: ${part}`);
  }
  assert.doesNotMatch(result.bodies.discharge, /39\+0|3200|G1\s*P1|APGAR|vaginal delivery|NSD/i,
    'discharge no longer repeats the admission background');
  assert.notEqual(result.bodies.summary, result.bodies.discharge, 'even birth-only input has different document purposes');
  assert.equal(result.reviews.discharge, '', 'the user no longer has to provide a complete BR course to use the original template');
});

test('BS-02: brief admission keeps the initial BR purpose while later nursery care and discharge remain in the clinical notes', () => {
  const result = specimen(`${BASE}\n${BR_ADMISSION}\n${CARE}\n${HOME}`);
  preserveBirthContext(result.bodies.summary);
  assert.match(result.bodies.summary, /admitted[^.]*(?:BR|Baby Room)[^.]*routine newborn care/i);
  assert.doesNotMatch(result.bodies.summary, /48 hours|feeding was well tolerated|discharged home|72 hours/i);
  sourceRetained(result, CARE, 'course');
  sourceRetained(result, HOME, 'disposition');
  assert.match(result.bodies.discharge, /feeding was well tolerated[^]*48 hours[^]*discharged home[^]*72 hours/i);
});

test('BS-03: discharge retains actual BR observations, counseling and home arrangement in clinical order', () => {
  const result = specimen(`${BASE}\n${BR_ADMISSION}
${CARE}
Transcutaneous bilirubin: 8.4 mg/dL at 60 hours of age
Education: caregivers were counseled about feeding and jaundice.
${HOME}`);
  for (const fact of [/feeding was well tolerated/i, /48 hours/i, /8\.4 mg\/dL/i, /60 hours/i, /discharged home/i, /72 hours/i]) {
    assert.match(result.bodies.discharge, fact, `BR care or disposition is retained: ${fact}`);
  }
  sourceRetained(result, 'Education: caregivers were counseled about feeding and jaundice.', 'education');
  assert.match(paragraphs(result.html.discharge).at(-1), /discharged home[^.]*72 hours/i);
  assert.ok(result.bodies.discharge.indexOf('8.4') < result.bodies.discharge.toLowerCase().indexOf('discharged home'));
  assertNoFullInpatientPrompt(result.reviews.discharge);
  assert.doesNotMatch(result.bodies.discharge, /physiologic(?:al)? jaundice|therefore|as a result/i,
    'prose does not add an unsupported diagnosis or causal bridge');
});

test('BS-04: admission and discharge serve distinct purposes when both admission and subsequent BR data are supplied', () => {
  const laterLab = 'Transcutaneous bilirubin: 8.4 mg/dL at 60 hours of age';
  const education = 'Education: caregivers were counseled about feeding and jaundice.';
  const followup = 'OPD follow-up on 2026-10-26.';
  const result = specimen(`${BASE}\n${BR_ADMISSION}\n${CARE}\n${laterLab}\n${education}\n${HOME}\n${followup}`);
  assert.notEqual(result.bodies.summary, result.bodies.discharge,
    'both tabs cannot be the same complete narrative for an episode with later events');
  assert.match(result.bodies.summary, /APGAR/i);
  assert.match(result.bodies.summary, /admitted[^.]*(?:BR|Baby Room)/i);
  assert.doesNotMatch(result.bodies.summary, /8\.4 mg\/dL|counseled about feeding|2026-10-26|discharged home/i,
    'later BR course and closing arrangements are not initial-admission content');
  for (const [line, field] of [[laterLab, 'labs'], [education, 'education'], [followup, 'disposition']]) sourceRetained(result, line, field);
  assert.match(result.bodies.discharge, /8\.4 mg\/dL/i);
  assert.match(result.bodies.discharge, /2026-10-26/i);
  assert.ok(paragraphs(result.html.discharge).length >= 2,
    'a supplied course and final disposition are readable as separate sections or paragraphs');
  assert.match(paragraphs(result.html.discharge).at(-1), /discharg|2026-10-26/i);
});

test('BS-05: DDH, compression signs and a source/manual PE conflict remain in both copyable notes', () => {
  const result = specimen(`${BASE}
DDH risk factors: Family Hx (+), Oligohydramnios (+)
子宮內壓迫徵象: 斜頸 (+)
PE: Heart murmur(-)
${CARE}
${HOME}`, ['Heart murmur']);
  for (const kind of Object.keys(BODY_IDS)) {
    const body = result.bodies[kind];
    assert.match(body, /family (?:Hx|history)/i);
    assert.match(body, /oligohydramnios/i);
    assert.match(body, /斜頸|torticollis/i);
    assert.match(body, /Heart murmur\(-\)/i, 'raw negative source is copyable despite a selected positive');
    assert.match(body, /Heart murmur[^.]{0,200}(?:conflict|manual selection positive)|conflict[^.]{0,200}Heart murmur|PE[^.]*衝突/i);
    assert.match(body, /manual selection|手動/i);
  }

});

test('BS-06: maternal antibiotics and delivery-room resuscitation remain correctly attributable in consultation without expanding either brief template', () => {
  const result = specimen(`${BASE}
Maternal antibiotics: ampicillin 2 g IV before delivery.
Resuscitation: CPAP for 5 minutes in the delivery room.
${BR_ADMISSION}`);
  assert.match(result.bodies.summary, /admitted[^.]*(?:BR|Baby Room)/i);
  assert.match(result.bodies.consultation, /ampicillin[^.]*2 g IV before delivery/i);
  assert.match(result.bodies.consultation, /CPAP[^.]*5 minutes[^.]*delivery room/i);
  const records = result.app.context.getClinicalSourceRecords(result.data);
  assert.ok(records.prenatalAntibiotics.some(line => /ampicillin 2 g IV before delivery/.test(line)));
  assert.ok(records.resuscitation.some(line => /CPAP for 5 minutes in the delivery room/.test(line)));
  for (const kind of ['summary', 'consultation']) {
    assert.doesNotMatch(result.bodies[kind], /(?:infant|newborn)\s+(?:was given|received)[^.]*ampicillin/i,
      'maternal exposure must not be recast as infant treatment');
  }
  assert.doesNotMatch(result.bodies.discharge, /ampicillin|before delivery|CPAP|delivery room/i,
    'the original discharge style does not repeat maternal and delivery-room history');
});

test('BS-07: detailed initial PE stays in the brief admission while initial measurements and treatment retain their discharge slots', () => {
  const result = specimen(`${BASE}\n${BR_ADMISSION}
Laboratory at admission: blood glucose 38 mg/dL
Treatment at admission: glucose gel was administered in BR.
PE: Heart murmur(+), grade 2/6, left sternal border at BR admission.`);
  for (const fact of [/heart murmur/i, /grade 2\/6/i, /left sternal border/i]) {
    assert.match(result.bodies.summary, fact, `initial assessment and care are admission facts: ${fact}`);
    assert.match(`${result.bodies.discharge} ${result.reviews.discharge}`, fact,
      `initial fact is also retained or traceable for discharge: ${fact}`);
  }
  for (const fact of [/blood glucose[^.]*38 mg\/dL/i, /glucose gel[^.]*administered in BR/i]) {
    assert.match(result.bodies.discharge, fact, `actual initial care remains in discharge: ${fact}`);
  }
  const records = result.app.context.getClinicalSourceRecords(result.data);
  assert.ok(records.labs.some(line => /38 mg\/dL/.test(line)));
  assert.ok(records.treatment.some(line => /glucose gel/.test(line)));
  assert.doesNotMatch(result.bodies.consultation, /@ Clinical records|Additional source records|38 mg\/dL|glucose gel/,
    'the original consultation has no laboratory/course appendix');
  assert.doesNotMatch(result.bodies.summary, /38 mg\/dL|glucose gel|glucose[^.]*normalized|responded well|discharged home/i);
  assert.equal(result.reviews.summary, '');
});

test('BS-08: an explicitly later PE finding stays timed in discharge without becoming an initial admission or delivery-consultation finding', () => {
  const laterPE = 'PE: Jaundice(+) at 48 hours of age';
  const result = specimen(`${BASE}\n${BR_ADMISSION}\n${laterPE}\n${CARE}\n${HOME}`);
  assert.doesNotMatch(result.bodies.summary, /jaundice|48 hours/i,
    'day-two jaundice must not silently become an initial physical finding');
  assert.match(result.data.sourcePE, /Jaundice\(\+\) at 48 hours of age/);
  assert.doesNotMatch(result.bodies.consultation, /jaundice|48 hours/i,
    'the original delivery consultation does not gain a later BR course');
  assert.match(result.bodies.discharge, /jaundice[^.\n]{0,100}48 hours of age/i);
  assert.doesNotMatch(result.bodies.discharge, /(?:at birth|on admission)[^.\n]*jaundice|jaundice[^.\n]*(?:at birth|on admission)/i);

});

test('BS-09: a future BR discharge plan and conditional counseling remain planned rather than completed', () => {
  const planned = 'Discharge: planned tomorrow if feeding remains adequate.';
  const education = 'Education: caregivers will be counseled about feeding before discharge.';
  const result = specimen(`${BASE}\n${BR_ADMISSION}\n${planned}\n${education}`);
  assert.doesNotMatch(result.bodies.summary, /planned tomorrow|will be counseled/i);
  for (const kind of ['discharge']) {
    const trace = result.bodies[kind];
    assert.match(trace, /planned tomorrow if feeding remains adequate/i);
    assert.doesNotMatch(result.bodies[kind], /(?:was|had been) discharged|caregivers were counseled|feeding was adequate/i,
      'future or conditional source statements do not establish completed care');
  }
  sourceRetained(result, planned, 'disposition');
  sourceRetained(result, education, 'education');
  assert.doesNotMatch(result.bodies.summary, /(?:was|had been) discharged|caregivers were counseled|feeding was adequate/i);
  assert.equal(result.reviews.summary, '');
});

test('BS-10: bound Copy uses each restored document body and Reset clears the templates without review residue', async () => {
  const app = loadApp();
  const copied = [];
  app.context.navigator.clipboard = { async writeText(text) { copied.push(text); } };
  const input = app.document.getElementById('inputData');
  input.value = `${BASE}\n${BR_ADMISSION}\n${CARE}\n${HOME}`;
  input.dispatchEvent({ type: 'input' });
  await delay(350);
  app.document.getElementById('sepsisWorkup').checked = true;
  app.document.getElementById('sepsisWorkup').dispatchEvent({ type: 'change' });
  assert.equal(app.errors.length, 0);

  for (const kind of Object.keys(BODY_IDS)) {
    const body = app.document.getElementById(BODY_IDS[kind]);
    const review = app.document.getElementById(REVIEW_IDS[kind]);
    assert.equal(review.classList.contains('hidden'), true);
    assert.equal(review.innerHTML, '');
    if (kind === 'discharge') {
      assert.match(body.innerText, /blood culture was performed/i,
        'a selected sepsis template is part of the original discharge text and is copied');
    }
    if (kind === 'summary') assert.match(body.innerText, /blood culture was performed/i,
      'the restored admission includes its selected sepsis sentence');
    app.context.switchTab(kind);
    app.document.getElementById('copyActiveBtn').dispatchEvent({ type: 'click' });
    await delay(0);
    assert.equal(copied.at(-1), body.innerText, `${kind}: actual bound copy handler uses only its own body`);
    assert.doesNotMatch(copied.at(-1), /待確認|Sepsis evaluation plan selected/i);
    if (kind === 'summary') assert.doesNotMatch(copied.at(-1), /feeding was well tolerated|discharged home/i);
    else assert.match(copied.at(-1), /feeding was well tolerated[^]*discharged home/i);
  }
  app.document.getElementById('resetBtn').dispatchEvent({ type: 'click' });
  for (const kind of Object.keys(BODY_IDS)) {
    const review = app.document.getElementById(REVIEW_IDS[kind]);
    assert.equal(toText(app.document.getElementById(BODY_IDS[kind]).innerHTML), '請在左側貼上資料。');
    assert.equal(review.innerHTML, '');
    assert.equal(review.classList.contains('hidden'), true);
  }
  assert.equal(input.value, '');
  assert.equal(app.document.getElementById('sepsisWorkup').checked, false);
});

test('BS-11: source ordering alone does not remove DDH risk or compression history from admission', () => {
  const result = specimen(`${BASE}\n${BR_ADMISSION}
Hospital course: feeding was well tolerated at 48 hours of age.
DDH risk factors: Family Hx (+), Oligohydramnios (+)
子宮內壓迫徵象: 斜頸 (+)`);
  for (const fact of [/family (?:Hx|history)/i, /oligohydramnios/i, /斜頸|torticollis/i]) {
    assert.match(result.bodies.summary, fact, `perinatal risk remains relevant despite later placement: ${fact}`);
    assert.match(result.bodies.discharge, fact);
  }
  assert.doesNotMatch(result.bodies.summary, /feeding was well tolerated|48 hours/i);
});

test('BS-12: a first-line exam spanning birth and day two does not hide the subsequent explicit initial BR admission', () => {
  const mixedPE = 'PE: Jaundice(-) at birth, Jaundice(+) on day 2';
  const result = specimen(`${mixedPE}\n${BASE}\n${BR_ADMISSION}`);
  preserveBirthContext(result.bodies.summary);
  assert.match(result.bodies.summary, /admitted[^.]*(?:BR|Baby Room)[^.]*routine newborn care/i,
    'the actual admission event remains initial even if a later-timed source row appears first');
  assert.match(result.bodies.summary, /jaundice[^.\n]{0,70}(?:absent|\(-\))[^.\n]{0,70}at birth/i);
  assert.doesNotMatch(result.bodies.summary, /on day 2|jaundice[^.\n]{0,30}present/i);
  assert.doesNotMatch(result.bodies.consultation, /Jaundice[^.\n]*on day 2/i);
  assert.match(result.bodies.discharge, /(?:Jaundice\s*\(\+\)|Jaundice(?: was present)?)\s+on day 2/i,
    'the unchanged discharge can retain the original timed source or its equivalent prose');
});

test('BS-13: a matching checkbox cannot promote a later-only positive PE into an initial finding', () => {
  const laterPE = 'PE: Jaundice(+) at 48 hours of age';
  const result = specimen(`${BASE}\n${BR_ADMISSION}\n${laterPE}`, ['Jaundice']);
  assert.doesNotMatch(result.bodies.summary,
    /Physical examination findings included Jaundice|Jaundice was present|examination showed jaundice/i,
    'a matching manual checkbox cannot reintroduce the deferred day-two finding as initial PE');
  assert.doesNotMatch(result.bodies.consultation, /Jaundice[^.\n]*48 hours of age/i);
  assert.match(result.bodies.discharge, /jaundice[^.]*48 hours of age/i);
});

test('BS-14: a later negative PE plus an undated positive checkbox stays timed in discharge without inventing initial PE', () => {
  const laterPE = 'PE: Heart murmur(-) at 48 hours of age';
  const result = specimen(`${BASE}\n${BR_ADMISSION}\n${laterPE}`, ['Heart murmur']);
  assert.doesNotMatch(result.bodies.summary,
    /Physical examination findings included Heart murmur|(?:a )?heart murmur was present|examination showed (?:a )?heart murmur/i,
    'the later conflicting source cannot become an unqualified positive initial examination');
  assert.match(result.data.sourcePE, /Heart murmur\(-\) at 48 hours of age/i);
  assert.match(result.bodies.discharge, /conflict|manual selection positive|PE[^.]*衝突/i,
    'the discharge PE slot retains the source/manual disagreement with its later time');
  assert.match(result.bodies.discharge, /48 hours/i);
  assert.doesNotMatch(result.bodies.consultation, /heart murmur[^.\n]*48 hours of age/i);
  assert.match(result.bodies.discharge, /manual|selected|checkbox|手動|勾選/i,
    'the compact copyable conflict retains the manual source of disagreement');
});
