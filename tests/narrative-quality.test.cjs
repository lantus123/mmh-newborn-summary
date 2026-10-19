'use strict';

// Synthetic narrative acceptance. Existing tests cover parser formats; these
// cases protect explicit source meaning, clinical sequence and the copy boundary.
// The user restored the original BR discharge defaults and selected-care prose;
// admission now also restores its original brief template and selected-care
// ending. Explicit exceptions and clinical findings must retain their meaning.
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
  for (const fact of [/18\.2 mg\/dL/i, /11\.0 mg\/dL/i,
    /jaundice[^.\n]{0,70}48 hours of age/i,
    /phototherapy[^.\n]{0,50}started at 50 hours[^.\n]{0,50}stopped at 74 hours/i,
    /11\.0 mg\/dL at 74 hours/i, /feeding was well tolerated/i,
    /caregivers were counseled about jaundice and follow-up/i,
    /stable[^.\n]{0,40}80 hours/i, /2026-10-26/]) {
    assert.match(body, fact, `preserve documented fact ${fact}`);
  }
  for (const name of ['summary', 'consultation']) {
    assert.match(bodies[name], /3200\s*(?:g|gm|grams)/i, `${name}: birth weight remains available`);
  }
  // Full resuscitation detail remains in consultation rather than an additional
  // appendix beneath the user's restored brief admission.
  assert.match(bodies.consultation, /positive pressure ventilation\s*(?:\(-\)|was not (?:provided|performed))/i);
  assert.match(bodies.consultation, /intubation\s*(?:\(-\)|was not (?:provided|performed))/i);
  assert.equal(reviews.summary, '');
  assert.doesNotMatch(body, /3200\s*(?:g|gm|grams)|positive pressure ventilation|intubation|maternal blood group/i,
    'restored discharge style does not repeat birth, maternal or delivery-room history');
  inOrder(body, [/jaundice[^.\n]{0,70}48 hours/i,
    /18\.2 mg\/dL/i, /phototherapy/i, /11\.0 mg\/dL/i,
    /caregivers were counseled/i, /80 hours/i, /2026-10-26/], 'full-course chronology');
  assert.ok(paragraphs(html.discharge).length >= 2, 'the original course and discharge ending remain readable as separate paragraphs');
  assert.match(paragraphs(html.discharge).at(-1), /80 hours[^\n]*2026-10-26/i, 'documented discharge and follow-up close the note');
  assert.doesNotMatch(body, /(?:at birth|on admission)[^.\n]{0,40}jaundice|jaundice[^.\n]{0,40}(?:at birth|on admission)/i);
  assert.doesNotMatch(body, /physiologic(?:al)? jaundice|hemolytic|ABO incompatibility|breast milk jaundice|therefore|consequently|as a result|due to|because|resulted in|led to/i);
  assert.doesNotMatch(body, GENERATED_PLANS);
  assert.doesNotMatch(reviews.discharge, /尚未提供完整住院經過|尚未提供出院狀態|(?:course|discharge)[^.]*not documented/i, 'completed supplied course is not downgraded to missing');
});

test('DN-02: birth-only input preserves admission facts and original placeholders plus the routine discharge template', () => {
  const { data, bodies, reviews } = specimen(sources.sparse);
  for (const fact of [/male/i, /39/, /3200/, /AGA|appropriate for gestational age/i, /NSD|(?:spontaneous )?vaginal delivery/i]) {
    assert.match(bodies.summary, fact);
  }
  for (const name of Object.keys(REVIEW_IDS)) {
    const body = bodies[name];
    if (name === 'discharge') assert.doesNotMatch(body, /G\?P\?|not documented|not recorded|unknown|not separately specified|require confirmation|待確認|未記錄|尚未提供/i, `${name}: ordinary omissions belong in review`);
    else assert.doesNotMatch(body, /not documented|not recorded|unknown|not separately specified|require confirmation|待確認|未記錄|尚未提供/i,
      'the original admission may retain its question-mark placeholders without adding a review checklist');
    assert.doesNotMatch(body, GENERATED_PLANS);
  }
  assert.equal(data.g, '?');
  assert.equal(data.p, '?');
  assert.match(bodies.summary, /G\?P\?/i, 'missing parity remains an original placeholder rather than an invented value');
  assert.equal(reviews.summary, '');
  assert.doesNotMatch(bodies.summary, /routine (?:care|prophylaxis)|vitamin K|HBIG|HBV vaccine|blood culture|normal (?:exam|examination)|feeding was (?:well tolerated|adequate)|tolerated feeding/i);
  assert.doesNotMatch(bodies.summary, INVENTED_OUTCOME, 'discharge restoration does not change the admission contract');
  assert.doesNotMatch(bodies.discharge, /39\+0|3200|AGA|vaginal delivery|NSD/i);
  for (const part of [/^Upon admission, the infant received routine prophylaxis/i, /HBV vaccine \(IM\)/i,
    /tetracycline ophthalmic ointment/i, /Vitamin K1 \(IM\)/i, /routine nursery care/i,
    /rooming-in[^.]*mother/i, /Feeding volume was gradually increased as tolerated/i,
    /bilirubin[^.]*within normal limits/i, /discharged in stable condition/i, /MBD and OPD follow-up/i]) {
    assert.match(bodies.discharge, part, `original routine BR sentence: ${part}`);
  }
  assert.notEqual(bodies.summary, bodies.discharge);
  assert.equal(reviews.discharge, '', 'source-only missing-care prompts are removed from the restored workflow');
});

test('DN-03: documented negatives, pending/declined care and source plans remain distinct from UI-selected plans', () => {
  const { bodies, reviews } = specimen(sources.unperformed, ['Respiratory distress'], app => {
    app.document.getElementById('sepsisWorkup').checked = true;
    app.document.getElementById('nbcTransfer').checked = true;
    app.document.querySelector('input[name="nbcReason"][value="respiratory"]').checked = true;
  });
  for (const name of Object.keys(REVIEW_IDS)) {
    const body = bodies[name];
    const care = name === 'summary' ? bodies.consultation : body;
    assert.match(body, /grunting\s*(?:\(-\)|was absent|was not present)/i);
    // Detailed untimed care remains in consultation/discharge. A source exception
    // can also qualify the admission's matching selected-care sentence.
    assert.match(care, /HBIG\s+(?:was\s+)?not yet administered/i);
    assert.match(care, /parents declined HBV vaccine/i);
    assert.match(care, /CPAP\s+(?:was\s+)?planned,?\s*not started/i);
    if(name === 'summary') assert.doesNotMatch(body, /HBIG|HBV vaccine/i);
    assert.doesNotMatch(body, GENERATED_PLANS, `${name}: control selections are outside copied prose`);
    if (name === 'summary') {
      assert.equal(reviews[name], '');
      assert.match(bodies.consultation, /Sepsis evaluation plan selected/i);
      assert.match(bodies.consultation, /Selected transfer plan:\s*NBC/i);
      assert.match(body, /blood culture was performed/i,
        'the restored original admission includes the selected sepsis sentence');
      assert.doesNotMatch(body, INVENTED_OUTCOME);
    } else {
      assert.equal(reviews[name], '');
      assert.match(body, /blood culture was performed/i, 'the explicitly selected original sepsis template is restored');
    }
    assert.doesNotMatch(body, /CPAP was (?:provided|started)|HBIG was (?:given|administered)|received HBV vaccine|O2 hood was provided|good response|weaned to room air/i,
      'explicit pending/declined source overrides the corresponding default or selected treatment');
  }
});

test('DN-04: unknown and conflicting evidence stays traceable, and actual PE disagreement stays in copied prose', () => {
  const { data, bodies, reviews } = specimen(sources.conflicts, ['Heart murmur']);
  assert.equal(data.gdmStatus, 'unknown');
  assert.equal(data.gbsStatus, 'conflict');
  for (const name of ['consultation']) {
    const trace = `${bodies[name]} ${reviews[name] || ''}`.replace(/\s+/g, ' ');
    assert.match(trace, /(?:GDM|gestational diabetes)[^.]{0,120}(?:unknown|uncertain|unresolved|待確認|未明)/i);
    assert.match(trace, /GBS[^.]{0,120}(?:\(\+\)|positive)|positive[^.]{0,60}GBS/i);
    assert.match(trace, /GBS[^.]{0,120}(?:\(-\)|negative)|negative[^.]{0,60}GBS/i);
    assert.match(trace, /GBS[^.]{0,180}(?:conflict|discordant|inconsistent|unresolved|衝突)|(?:conflict|discordant|inconsistent|衝突)[^.]{0,180}GBS/i);
  }
  assert.doesNotMatch(bodies.discharge, /GDM|gestational diabetes|GBS\(\+\)|GBS\(-\)/i,
    'maternal uncertainty remains available in maternal documents without duplicating their paragraphs in discharge');
  for (const name of Object.keys(REVIEW_IDS)) {
    const body = bodies[name];
    assert.match(body, /Heart murmur\(-\)/i, `${name}: conflicting source is available when copied`);
    assert.match(body, PE_CONFLICT);
    assert.match(body, /manual selection indicates presence/i);
    assert.match(body, /negative or conflicting result/i);
    assert.doesNotMatch(body, /GDM\(\+\)|infant of diabetic mother|(?:GDM|gestational diabetes)(?: status)? (?:was|is) (?:positive|negative)|normal (?:exam|examination)|received adequate|\bwith adequate intrapartum|blood culture was performed/i);
  }
});

test('DN-05: documented CPAP overrides the respiratory template without inventing a treatment response', () => {
  const { bodies, reviews } = specimen(sources.treatmentOnly, ['Respiratory distress']);
  const body = bodies.discharge;
  assert.match(body, /CPAP\s+(?:was\s+)?started at 2 hours of age/i);
  assert.match(body, /respiratory distress/i);
  assert.doesNotMatch(body, /CPAP\s+(?:was\s+)?(?:planned|considered|suggested)|CPAP[^.]*not started/i);
  assert.doesNotMatch(body, /O2 hood|good response|responded (?:well|favorably)|symptoms? (?:improved|resolved)|distress (?:improved|resolved)|wean(?:ed|ing)|room air/i);
  assert.doesNotMatch(body, /secondary to|due to|diagnosed with|therefore|as a result|not documented|尚未提供|待確認/i);
  assert.doesNotMatch(body, /was discharged|stable condition/i,
    'an unfinished supplied respiratory-support course is not replaced by the routine completed-course ending');
  assert.equal(reviews.discharge, '');
});

test('DN-06: richer source PE and embedded treatment/lab facts survive paragraph reorganization exactly once', () => {
  const { html, bodies, reviews } = specimen(sources.embedded, ['Heart murmur']);
  for (const name of Object.keys(REVIEW_IDS)) {
    const body = bodies[name];
    exactlyOnce(body, /heart murmur/gi, `${name}: manual selection does not repeat the richer source finding`);
    exactlyOnce(body, /grade 2\/6/gi, `${name}: retain murmur grade once`);
    exactlyOnce(body, /left sternal border/gi, `${name}: retain murmur location once`);
    const care = name === 'summary' ? bodies.consultation : body;
    exactlyOnce(care, /CPAP/g, `${name}: retain respiratory support once in its document region`);
    exactlyOnce(care, /28 mg\/dL/g, `${name}: retain blood glucose once in its document region`);
    assert.match(care, /blood glucose[^.\n]{0,30}28 mg\/dL/i);
    if(name === 'summary') assert.doesNotMatch(body, /CPAP|28 mg\/dL/);
    if(name === 'summary') assert.equal(reviews[name], '');
    const exam = body.match(/[^.!?\n]*heart murmur[^.!?\n]*[.!?]?/i)?.[0];
    assert.ok(exam, `${name}: an examination sentence exists`);
    assert.doesNotMatch(exam, /CPAP|28 mg\/dL/, `${name}: treatment and lab values are not cast as physical signs in the examination sentence`);
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
  assert.doesNotMatch(body, /3200|39\+0|G1\s*P1|APGAR/i);
  inOrder(body, [/ampicillin/i, /blood culture/i, /feeding was well tolerated/i, /on day 4/i, /2026-10-26/], 'single-scale dated chronology');
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

test('NR-02: actual Copy preserves PE conflicts and each restored template while excluding review UI', async () => {
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
    if (name === 'summary') {
      assert.equal(review.classList.contains('hidden'), true, 'restored admission needs no plan checklist');
      assert.equal(review.innerHTML, '');
    } else {
      assert.equal(review.classList.contains('hidden'), true, 'restored discharge needs no duplicate plan checklist');
      assert.equal(review.innerHTML, '');
    }
    app.context.switchTab(name);
    app.document.getElementById('copyActiveBtn').dispatchEvent({ type: 'click' });
    await delay(0);
    const text = copied.at(-1);
    assert.equal(text, body.innerText, `${name} copies only the body`);
    assert.match(text, /Heart murmur\(-\)/i);
    assert.match(text, PE_CONFLICT);
    assert.doesNotMatch(text, GENERATED_PLANS);
    assert.doesNotMatch(text, /待確認事項|已選取的評估|尚未提供/);
    if (name === 'discharge') {
      assert.match(text, /blood culture was performed/i);
      assert.match(text, /Caregivers were counseled/i);
    } else {
      assert.match(text, /blood culture was performed/i);
      assert.doesNotMatch(text, /Caregivers were counseled/i);
    }
  }
  assert.equal(copied.length, 2, 'both bound Copy actions use the clipboard stub');
  assert.equal(app.errors.length, 0);
});

test('NR-03: initial and newly cleared input leave no review residue through the bound input handler', async () => {
  const app = loadApp();
  app.context.updateUI();
  assertEmptyReview(app);
  await paste(app, `${BASE}\nPROM for 20 hours`);
  assert.equal(app.document.getElementById(REVIEW_IDS.summary).innerHTML, '');
  assert.match(toText(app.document.getElementById(BODY_IDS.summary).innerHTML), /blood culture was performed/i);
  assert.equal(app.document.getElementById(REVIEW_IDS.discharge).innerHTML, '');
  assert.match(toText(app.document.getElementById(BODY_IDS.discharge).innerHTML), /blood culture was performed/i);
  await paste(app, ' \n\t ');
  assertEmptyReview(app);
});

test('NR-04: Reset clears populated notes and keeps reviews empty after an already queued input update', async () => {
  const app = loadApp();
  await paste(app, `${BASE}\nPROM for 20 hours`);
  choose(app.document.querySelector('input[name="peFinding"][value="Hydrocele"]'));
  assert.match(toText(app.document.getElementById('dischargeOutput').innerHTML), /Caregivers were counseled/i);
  assert.equal(app.document.getElementById('dischargeReview').innerHTML, '');
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

test('NR-05: replacement recomputes the selected original templates without carrying over the previous automatic risk', async () => {
  const app = loadApp();
  await paste(app, `${BASE}\nPROM for 20 hours\nGBS(-)\nGDM(-)`);
  assert.equal(app.document.getElementById(REVIEW_IDS.summary).innerHTML, '');
  assert.match(toText(app.document.getElementById(BODY_IDS.summary).innerHTML), /Due to prolonged PROM[^]*blood culture was performed/i);
  assert.match(toText(app.document.getElementById(BODY_IDS.discharge).innerHTML), /Due to prolonged PROM[^]*blood culture was performed/i);
  await paste(app, `${BASE}\nPROM(-)\nGBS(-)\nGDM(-)`);
  for (const [name, id] of Object.entries(REVIEW_IDS)) {
    assert.doesNotMatch(toText(app.document.getElementById(id).innerHTML), /Sepsis evaluation plan selected|prolonged PROM|20 hours/i, `${name} review uses only current automatic evidence`);
    assert.doesNotMatch(toText(app.document.getElementById(BODY_IDS[name]).innerHTML), GENERATED_PLANS);
    assert.doesNotMatch(toText(app.document.getElementById(BODY_IDS[name]).innerHTML), /Due to prolonged PROM|sepsis workup[^.]*was performed|laboratory results were within normal limits/i,
      `${name}: old automatic sepsis template is removed when current risk is negative`);
  }
  assert.equal(app.document.getElementById('sepsisWorkup').checked, false);
  assert.equal(app.document.querySelector('input[name="sepsisReason"][value="prom"]').checked, false);
});
