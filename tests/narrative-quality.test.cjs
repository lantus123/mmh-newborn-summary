'use strict';

// Synthetic narrative acceptance. Existing tests cover parser formats; these
// cases protect source-grounded prose, clinical sequence and the copy boundary.
// Exact sentence wording is intentionally not snapshotted. Fluency still needs
// a separate reading of the complete rendered notes.
const test = require('node:test');
const assert = require('node:assert/strict');
const { setTimeout: delay } = require('node:timers/promises');
const { loadApp, toText } = require('./app-harness.cjs');

const BASE = 'Male newborn\nGA 39+0 weeks, BW 3200 gm, AGA\nNSD\n29 y/o mother, G1 P1 A0\nApgar score: 9 -> 10';
const GENERATED_PLANS = /Sepsis evaluation plan selected|Selected transfer plan|Blood glucose monitoring plan|Selected head circumference monitoring plan|Counseling checklist|Suggested counseling topics/i;
const INVENTED_OUTCOME = /responded (?:well|favorably)|good response|symptoms? (?:improved|resolved)|distress (?:improved|resolved)|wean(?:ed|ing)|room air|clinically stable|remained stable|stable condition|uneventful|unremarkable|was discharged|follow[- ]?up (?:was )?(?:arranged|planned|scheduled)/i;
const PE_CONFLICT = /PE source conflict:\s*Heart murmur/i;
const REVIEW_IDS = { summary: 'summaryReview', discharge: 'dischargeReview' };
const BODY_IDS = { summary: 'outputSummary', discharge: 'dischargeOutput' };

const sources = {
  complete: `${BASE}
Maternal blood group: type O, Rh+
GBS(-)
GDM(-)
Pre-eclampsia(-)
HBsAg(-), HBeAg(-), HIV(-), RPR(-)
PE: Jaundice(+) at 48 hours of age
PROM(-)
MAS(-)
Resuscitation: Manual positive pressure ventilation(-), Intubation(-)
Total bilirubin: 18.2 mg/dL at 48 hours of age
Treatment: phototherapy started at 50 hours and stopped at 74 hours
Hospital course: total bilirubin decreased to 11.0 mg/dL at 74 hours. Feeding was well tolerated.
Education: caregivers were counseled about jaundice and follow-up.
Discharge: clinically stable at 80 hours; OPD follow-up on 2026-10-26.`,
  sparse: 'Male newborn\nGA 39+0 weeks, BW 3200 gm, AGA\nNSD',
  unperformed: `${BASE}
PE: Respiratory distress(+), Grunting(-)
Treatment: HBIG not yet administered; parents declined HBV vaccine.
Respiratory support: CPAP planned, not started.`,
  conflicts: `${BASE}
GDM status unknown
GBS(+)
GBS(-)
PE: Heart murmur(-)`,
  treatmentOnly: `${BASE}
PE: Respiratory distress(+)
Respiratory support: CPAP started at 2 hours of age.`,
  embedded: `${BASE}
PE:
Heart murmur(+), grade 2/6, left sternal border
Respiratory support: CPAP
Blood glucose: 28 mg/dL`,
  unordered: `${BASE}
Discharge: clinically stable on day 4; OPD follow-up on 2026-10-26.
Laboratory: blood culture positive for E. coli on day 2.
Treatment: ampicillin started on day 1.
Hospital course: feeding was well tolerated on day 3.`,
};

function specimen(source, manualPE = [], configure) {
  const app = loadApp();
  if (configure) configure(app);
  const data = app.parse(source);
  const html = app.render(data, manualPE);
  const bodies = Object.fromEntries(Object.entries(html).map(([name, value]) => [name, toText(value)]));
  const reviews = Object.fromEntries(Object.keys(REVIEW_IDS).map(name => [name,
    toText(app.context.generateNarrativeReview(data, manualPE, name)),
  ]));
  assert.equal(app.errors.length, 0, 'rendering must not fall back to a parse-error message');
  return { app, data, html, bodies, reviews };
}

function paragraphs(html) {
  // toText alone does not insert line breaks for block tags in this small DOM.
  return toText(String(html).replace(/<\/p\s*>|<\/div\s*>/gi, '\n\n'))
    .split(/\n\s*\n/).map(value => value.trim()).filter(Boolean);
}

function inOrder(text, expressions, label) {
  let previous = -1;
  for (const expression of expressions) {
    const match = expression.exec(text);
    assert.ok(match, `${label}: missing ${expression}`);
    assert.ok(match.index > previous, `${label}: ${expression} is out of order`);
    previous = match.index;
  }
}

function exactlyOnce(text, expression, label) {
  assert.equal([...text.matchAll(expression)].length, 1, label);
}

function choose(element, checked = true) {
  assert.ok(element, 'expected control exists in the real HTML');
  element.checked = checked;
  element.dispatchEvent({ type: 'change' });
}

async function paste(app, source) {
  const input = app.document.getElementById('inputData');
  input.value = source;
  input.dispatchEvent({ type: 'input' });
  await delay(350);
  assert.equal(app.errors.length, 0, 'bound input event renders successfully');
}

function assertEmptyReview(app) {
  for (const [name, id] of Object.entries(REVIEW_IDS)) {
    const review = app.document.getElementById(id);
    assert.ok(review, `${name} review exists`);
    assert.equal(review.innerHTML, '', `${name} review has no stale text`);
    assert.equal(review.classList.contains('hidden'), true, `${name} empty review is hidden`);
    assert.equal(toText(app.document.getElementById(BODY_IDS[name]).innerHTML), '請在左側貼上資料。', `${name} body is a placeholder`);
  }
}

test('DN-01: complete course preserves timed observations, treatment, outcomes and final disposition in clinical paragraphs', () => {
  const { html, bodies, reviews } = specimen(sources.complete);
  const body = bodies.discharge;
  for (const fact of [/3200\s*(?:g|gm|grams)/i, /18\.2 mg\/dL/i, /11\.0 mg\/dL/i,
    /jaundice[^.\n]{0,70}48 hours of age/i,
    /phototherapy[^.\n]{0,50}started at 50 hours[^.\n]{0,50}stopped at 74 hours/i,
    /11\.0 mg\/dL at 74 hours/i, /feeding was well tolerated/i,
    /caregivers were counseled about jaundice and follow-up/i,
    /stable[^.\n]{0,40}80 hours/i, /2026-10-26/]) {
    assert.match(body, fact, `preserve documented fact ${fact}`);
  }
  assert.match(body, /positive pressure ventilation\s*(?:\(-\)|was not (?:provided|performed))/i);
  assert.match(body, /intubation\s*(?:\(-\)|was not (?:provided|performed))/i);
  inOrder(body, [/3200/i, /positive pressure ventilation/i, /jaundice[^.\n]{0,70}48 hours/i,
    /18\.2 mg\/dL/i, /phototherapy/i, /11\.0 mg\/dL/i,
    /caregivers were counseled/i, /80 hours/i, /2026-10-26/], 'full-course chronology');
  assert.ok(paragraphs(html.discharge).length >= 3, 'a multi-phase course needs separate readable paragraphs');
  assert.match(paragraphs(html.discharge).at(-1), /80 hours[^\n]*2026-10-26/i, 'documented discharge and follow-up close the note');
  assert.doesNotMatch(body, /(?:at birth|on admission)[^.\n]{0,40}jaundice|jaundice[^.\n]{0,40}(?:at birth|on admission)/i);
  assert.doesNotMatch(body, /physiologic(?:al)? jaundice|hemolytic|ABO incompatibility|breast milk jaundice|therefore|consequently|as a result|due to|because|resulted in|led to/i);
  assert.doesNotMatch(body, GENERATED_PLANS);
  assert.doesNotMatch(reviews.discharge, /尚未提供完整住院經過|尚未提供出院狀態|(?:course|discharge)[^.]*not documented/i, 'completed supplied course is not downgraded to missing');
});

test('DN-02: birth-only prose stays factual and moves missing course/discharge prompts outside both copied narratives', () => {
  const { bodies, reviews } = specimen(sources.sparse);
  for (const name of Object.keys(REVIEW_IDS)) {
    const body = bodies[name];
    assert.match(body, /male/i);
    assert.match(body, /39/);
    assert.match(body, /3200/);
    assert.match(body, /AGA|appropriate for gestational age/i);
    assert.match(body, /NSD|(?:spontaneous )?vaginal delivery/i);
    assert.doesNotMatch(body, /G\?P\?|not documented|not recorded|unknown|not separately specified|require confirmation|待確認|未記錄|尚未提供/i, `${name}: ordinary omissions belong in review`);
    assert.doesNotMatch(body, /routine (?:care|prophylaxis)|vitamin K|HBIG|HBV vaccine|blood culture|normal (?:exam|examination)|feeding was (?:well tolerated|adequate)|tolerated feeding/i);
    assert.doesNotMatch(body, INVENTED_OUTCOME, `${name}: no unsupported course or closure`);
    assert.doesNotMatch(body, GENERATED_PLANS);
  }
  assert.match(reviews.discharge, /住院|病程|hospital course/i);
  assert.match(reviews.discharge, /出院|discharg/i);
});

test('DN-03: documented negatives, pending/declined care and source plans remain distinct from UI-selected plans', () => {
  const { bodies, reviews } = specimen(sources.unperformed, ['Respiratory distress'], app => {
    app.document.getElementById('sepsisWorkup').checked = true;
    app.document.getElementById('nbcTransfer').checked = true;
    app.document.querySelector('input[name="nbcReason"][value="respiratory"]').checked = true;
  });
  for (const name of Object.keys(REVIEW_IDS)) {
    const body = bodies[name];
    assert.match(body, /grunting\s*(?:\(-\)|was absent|was not present)/i);
    assert.match(body, /HBIG\s+(?:was\s+)?not yet administered/i);
    assert.match(body, /parents declined HBV vaccine/i);
    assert.match(body, /CPAP\s+(?:was\s+)?planned,?\s*not started/i);
    assert.doesNotMatch(body, GENERATED_PLANS, `${name}: control selections are outside copied prose`);
    assert.match(reviews[name], /Sepsis evaluation plan selected/i);
    assert.match(reviews[name], /Selected transfer plan:\s*NBC/i);
    assert.doesNotMatch(body, /CPAP was (?:provided|started)|HBIG was (?:given|administered)|received HBV vaccine|blood culture was performed|was transferred to|O2 hood was provided/i);
    assert.doesNotMatch(body, INVENTED_OUTCOME);
  }
});

test('DN-04: unknown and conflicting evidence stays traceable, and actual PE disagreement stays in copied prose', () => {
  const { bodies, reviews } = specimen(sources.conflicts, ['Heart murmur']);
  for (const name of Object.keys(REVIEW_IDS)) {
    const body = bodies[name];
    const trace = `${body} ${reviews[name]}`.replace(/\s+/g, ' ');
    assert.match(trace, /(?:GDM|gestational diabetes)[^.]{0,120}(?:unknown|uncertain|unresolved|待確認|未明)/i);
    assert.match(trace, /GBS[^.]{0,120}(?:\(\+\)|positive)|positive[^.]{0,60}GBS/i);
    assert.match(trace, /GBS[^.]{0,120}(?:\(-\)|negative)|negative[^.]{0,60}GBS/i);
    assert.match(trace, /GBS[^.]{0,180}(?:conflict|discordant|inconsistent|unresolved|衝突)|(?:conflict|discordant|inconsistent|衝突)[^.]{0,180}GBS/i);
    assert.match(body, /Heart murmur\(-\)/i, `${name}: conflicting source is available when copied`);
    assert.match(body, PE_CONFLICT);
    assert.match(body, /manual selection indicates presence/i);
    assert.match(body, /negative or conflicting result/i);
    assert.doesNotMatch(body, /GDM\(\+\)|infant of diabetic mother|(?:GDM|gestational diabetes)(?: status)? (?:was|is) (?:positive|negative)|normal (?:exam|examination)|received adequate|\bwith adequate intrapartum|blood culture was performed/i);
  }
});

test('DN-05: documented CPAP initiation is retained without inventing a treatment response or discharge', () => {
  const { bodies, reviews } = specimen(sources.treatmentOnly, ['Respiratory distress']);
  const body = bodies.discharge;
  assert.match(body, /CPAP\s+(?:was\s+)?started at 2 hours of age/i);
  assert.match(body, /respiratory distress/i);
  assert.doesNotMatch(body, /CPAP\s+(?:was\s+)?(?:planned|considered|suggested)|CPAP[^.]*not started/i);
  assert.doesNotMatch(body, INVENTED_OUTCOME);
  assert.doesNotMatch(body, /secondary to|due to|diagnosed with|therefore|as a result|not documented|尚未提供|待確認/i);
  assert.match(reviews.discharge, /出院|discharg/i, 'the undocumented disposition is a review item');
});

test('DN-06: richer source PE and embedded treatment/lab facts survive paragraph reorganization exactly once', () => {
  const { html, bodies } = specimen(sources.embedded, ['Heart murmur']);
  for (const name of Object.keys(REVIEW_IDS)) {
    const body = bodies[name];
    exactlyOnce(body, /heart murmur/gi, `${name}: manual selection does not repeat the richer source finding`);
    exactlyOnce(body, /grade 2\/6/gi, `${name}: retain murmur grade once`);
    exactlyOnce(body, /left sternal border/gi, `${name}: retain murmur location once`);
    exactlyOnce(body, /CPAP/g, `${name}: retain respiratory support once`);
    exactlyOnce(body, /28 mg\/dL/g, `${name}: retain blood glucose once`);
    assert.match(body, /blood glucose[^.\n]{0,30}28 mg\/dL/i);
    const exam = paragraphs(html[name]).find(paragraph => /heart murmur/i.test(paragraph));
    assert.ok(exam, `${name}: an examination paragraph exists`);
    assert.doesNotMatch(exam, /CPAP|28 mg\/dL/, `${name}: treatment and lab values are not cast as physical signs`);
    assert.doesNotMatch(body, /(?:treatment|laboratory|blood glucose)[^.]*not documented|normal blood glucose|blood glucose[^.]*normal|PE source conflict/i);
  }
});

test('DN-07: explicit single day-N events are ordered, with discharge/follow-up last and no invented causal bridge', () => {
  const { html, bodies } = specimen(sources.unordered);
  const body = bodies.discharge;
  assert.match(body, /ampicillin\s+(?:was\s+)?started on day 1/i);
  assert.match(body, /blood culture\s+(?:was\s+)?positive for E\. coli on day 2/i);
  assert.match(body, /feeding was well tolerated on day 3/i);
  assert.match(body, /stable[^.\n]{0,30}on day 4/i);
  inOrder(body, [/3200/i, /ampicillin/i, /blood culture/i, /feeding was well tolerated/i, /on day 4/i, /2026-10-26/], 'single-scale dated chronology');
  assert.match(paragraphs(html.discharge).at(-1), /on day 4[^\n]*2026-10-26/i);
  assert.doesNotMatch(body, /therefore|consequently|as a result|because|due to|in response to|resulted in|led to|empiric|diagnos(?:ed|is).*sepsis|treated for sepsis/i);
  assert.doesNotMatch(body, GENERATED_PLANS);
});

test('NR-01: each review region is a sibling of, and never inside, its copyable body', () => {
  const app = loadApp();
  for (const [name, id] of Object.entries(REVIEW_IDS)) {
    const review = app.document.getElementById(id);
    const body = app.document.getElementById(BODY_IDS[name]);
    assert.ok(review, `${name} review exists`);
    assert.ok(body, `${name} copyable body exists`);
    assert.notEqual(body, review);
    assert.equal(review.parent, body.parent, `${name} uses sibling regions`);
    assert.equal(body.querySelector(`#${id}`), null, `${name} copy selector cannot include its review`);
    assert.equal(review.querySelector(`#${BODY_IDS[name]}`), null);
  }
});

test('NR-02: actual Copy excludes selected plans/checklists while preserving the raw/manual PE conflict', async () => {
  const app = loadApp();
  const copied = [];
  app.context.navigator.clipboard = { async writeText(text) { copied.push(text); } };
  await paste(app, sources.conflicts);
  choose(app.document.querySelector('input[name="peFinding"][value="Heart murmur"]'));
  choose(app.document.querySelector('input[name="peFinding"][value="Hydrocele"]'));
  choose(app.document.getElementById('sepsisWorkup'));

  for (const [name, id] of Object.entries(REVIEW_IDS)) {
    const review = app.document.getElementById(id);
    const body = app.document.getElementById(BODY_IDS[name]);
    assert.equal(review.classList.contains('hidden'), false, `${name} review is visible`);
    assert.match(toText(review.innerHTML), /Sepsis evaluation plan selected/i);
    if (name === 'discharge') assert.match(toText(review.innerHTML), /Counseling checklist/i);
    app.context.switchTab(name);
    app.document.getElementById('copyActiveBtn').dispatchEvent({ type: 'click' });
    await delay(0);
    const text = copied.at(-1);
    assert.equal(text, body.innerText, `${name} copies only the body`);
    assert.match(text, /Heart murmur\(-\)/i);
    assert.match(text, PE_CONFLICT);
    assert.doesNotMatch(text, GENERATED_PLANS);
    assert.doesNotMatch(text, /待確認事項|已選取的評估|尚未提供/);
  }
  assert.equal(copied.length, 2, 'both bound Copy actions use the clipboard stub');
  assert.equal(app.errors.length, 0);
});

test('NR-03: initial and newly cleared input leave no review residue through the bound input handler', async () => {
  const app = loadApp();
  app.context.updateUI();
  assertEmptyReview(app);
  await paste(app, `${BASE}\nPROM for 20 hours`);
  for (const id of Object.values(REVIEW_IDS)) assert.match(toText(app.document.getElementById(id).innerHTML), /Sepsis evaluation plan selected/i);
  await paste(app, ' \n\t ');
  assertEmptyReview(app);
});

test('NR-04: Reset clears populated reviews and keeps them empty after an already queued input update', async () => {
  const app = loadApp();
  await paste(app, `${BASE}\nPROM for 20 hours`);
  choose(app.document.querySelector('input[name="peFinding"][value="Hydrocele"]'));
  assert.match(toText(app.document.getElementById('dischargeReview').innerHTML), /Counseling checklist/i);
  const input = app.document.getElementById('inputData');
  input.value = sources.conflicts;
  input.dispatchEvent({ type: 'input' });
  app.document.getElementById('resetBtn').dispatchEvent({ type: 'click' });
  assertEmptyReview(app);
  await delay(350);
  assertEmptyReview(app);
  assert.equal(app.document.getElementById('sepsisWorkup').checked, false);
  assert.equal(app.errors.length, 0);
});

test('NR-05: replacement recomputes review plans without carrying over the previous automatic risk', async () => {
  const app = loadApp();
  await paste(app, `${BASE}\nPROM for 20 hours\nGBS(-)\nGDM(-)`);
  for (const id of Object.values(REVIEW_IDS)) assert.match(toText(app.document.getElementById(id).innerHTML), /Sepsis evaluation plan selected/i);
  await paste(app, `${BASE}\nPROM(-)\nGBS(-)\nGDM(-)`);
  for (const [name, id] of Object.entries(REVIEW_IDS)) {
    assert.doesNotMatch(toText(app.document.getElementById(id).innerHTML), /Sepsis evaluation plan selected|prolonged PROM|20 hours/i, `${name} review uses only current automatic evidence`);
    assert.doesNotMatch(toText(app.document.getElementById(BODY_IDS[name]).innerHTML), GENERATED_PLANS);
  }
  assert.equal(app.document.getElementById('sepsisWorkup').checked, false);
  assert.equal(app.document.querySelector('input[name="sepsisReason"][value="prom"]').checked, false);
});
