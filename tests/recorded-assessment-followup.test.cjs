'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { setTimeout: delay } = require('node:timers/promises');
const { loadApp, toText } = require('./app-harness.cjs');

// Synthetic follow-up cases for the acceptance findings and review boundaries. These exercise
// public parser/generator/UI behavior, not a particular new helper or state shape.
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

const TAB_IDS = {
  summary: 'outputSummary',
  consultation: 'consultOutput',
  discharge: 'dischargeOutput',
  diagnosis: 'diagnosisOutput',
};
const CONFLICT = /conflict|contradict|inconsistent|disagree|mismatch|矛盾|衝突|不一致/i;
const REVIEW = /review|uncertain|unresolved|clarif|confirm|alternative|請核對|需確認|待確認|待核對|不確定|或/i;

function eachTab(outputs, check) {
  for (const tab of Object.keys(TAB_IDS)) check(toText(outputs[tab]), tab);
}

function currentUI(app) {
  return {
    statusHTML: app.document.getElementById('parseStatus').innerHTML,
    status: toText(app.document.getElementById('parseStatus').innerHTML),
    tabs: Object.fromEntries(Object.entries(TAB_IDS)
      .map(([tab, id]) => [tab, toText(app.document.getElementById(id).innerHTML)])),
  };
}

function assertTraceablePEWarning(ui, findingPattern, sourcePattern) {
  assert.match(ui.status, CONFLICT, 'the status bar must flag the source/manual conflict');
  const peWarning = ui.statusHTML.match(/<span\b[^>]*class="[^"]*\bparse-warn\b[^"]*"[^>]*>PE:[\s\S]*?<\/span>/i);
  assert.ok(peWarning, 'PE must be marked with the warning style, not a successful-parse badge');
  assert.match(toText(peWarning[0]), CONFLICT, 'the warning badge must describe the PE conflict');
  for (const [tab, text] of Object.entries(ui.tabs)) {
    const match = CONFLICT.exec(text);
    assert.ok(match, `${tab}: the copied narrative itself must contain the conflict warning`);
    const nearby = text.slice(Math.max(0, match.index - 180), match.index + match[0].length + 220);
    assert.match(nearby, findingPattern, `${tab}: the warning must identify the finding in conflict`);
    assert.match(nearby, /manual|手動/i, `${tab}: the warning must identify the manual result as a source of disagreement`);
    assert.match(text, sourcePattern, `${tab}: the original negative remains traceable`);
  }
}

function assertTraceableMurmurWarning(ui, sourcePattern = /Heart murmur\(-\)/i) {
  assertTraceablePEWarning(ui, /heart\s+murmur|心雜音/i, sourcePattern);
}

async function inputRecord(app, text) {
  const input = app.document.getElementById('inputData');
  input.value = text;
  input.dispatchEvent({ type: 'input' });
  // Exercise the page's real 300 ms input debounce, rather than call updateUI.
  await delay(350);
}

function checkMurmur(app, checked) {
  const manual = app.document.querySelector('input[name="peFinding"][value="Heart murmur"]');
  manual.checked = checked;
  manual.dispatchEvent({ type: 'change' });
  return manual;
}

test('follow-up: Newborn reflexes within PE preserves weak suck and asymmetric Moro in all four tabs', () => {
  const app = loadApp();
  const outputs = app.render(app.parse(`${BASE}\nPE:\nNewborn reflexes: weak suck; asymmetric Moro reflex`));
  eachTab(outputs, (text, tab) => {
    assert.match(text, /weak suck/i, `${tab}: weak suck was supplied as an examination finding`);
    assert.match(text, /asymmetric Moro reflex/i, `${tab}: the reflex finding must survive the subheading`);
    assert.doesNotMatch(text, /Physical examination findings were not documented/i, `${tab}: supplied PE cannot become an absent-examination statement`);
  });
});

test('follow-up: preserving Newborn reflexes does not absorb Newborn history or conditional Plan findings', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}
PE:
Newborn reflexes: weak suck; asymmetric Moro reflex
Newborn history:
A previous assessment reported Barlow(+), HISTORY_ONLY_SENTINEL.
Plan:
If Ortolani(+), PLAN_ONLY_SENTINEL.`);
  assert.equal(data.ddhPe.length, 0, 'history and conditional-plan test results must not become current definite-positive hip findings');
  eachTab(app.render(data), (text, tab) => {
    assert.match(text, /weak suck/i, `${tab}: the genuine PE remains present`);
    assert.match(text, /asymmetric Moro reflex/i, `${tab}: the genuine PE remains complete`);
    assert.doesNotMatch(text, /HISTORY_ONLY_SENTINEL|PLAN_ONLY_SENTINEL/i, `${tab}: excluded blocks do not re-enter the examination narrative`);
    assert.doesNotMatch(text, /positive Barlow|positive Ortolani/i, `${tab}: no current positive is invented from the excluded blocks`);
  });
});

test('follow-up: Barlow positive OR Ortolani positive preserves the unresolved alternative in all four tabs', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}\nHip PE: Barlow(+) or Ortolani(+)`);
  assert.equal(data.ddhPe.length, 0, 'neither individual test is established as definitely positive by an unresolved OR relation');
  eachTab(app.render(data), (text, tab) => {
    assert.match(text, /Barlow/i, `${tab}: the first candidate test is identified`);
    assert.match(text, /Ortolani/i, `${tab}: the second candidate test is identified`);
    const preservesSource = /Barlow\s*\(\+\)\s+or\s+Ortolani\s*\(\+\)/i.test(text);
    assert.ok(preservesSource || REVIEW.test(text), `${tab}: preserve the original alternative or explicitly request confirmation`);
    assert.doesNotMatch(text, /documented positive Barlow's sign and positive Ortolani's sign/i, `${tab}: OR cannot be rewritten as two definite positives`);
  });
});

test('follow-up: independent positives joined by AND remain definite positives', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}\nHip PE: Barlow(+) and Ortolani(+)`);
  assert.deepEqual(Array.from(data.ddhPe).sort(), ["positive Barlow's sign", "positive Ortolani's sign"].sort());
  eachTab(app.render(data), (text, tab) => {
    assert.match(text, /Barlow/i, `${tab}: Barlow positive remains available`);
    assert.match(text, /Ortolani/i, `${tab}: Ortolani positive remains available`);
  });
});

test('follow-up: the shared DDH parser also preserves OR between alternative risk factors', () => {
  const app = loadApp();
  const data = app.parse(`${BASE}\nDDH risk factors: Breech(+) or Oligohydramnios(+)`);
  assert.equal(data.ddhRisk.length, 0, 'alternative risk factors must not both enter the definite-positive collection');
  eachTab(app.render(data), (text, tab) => {
    assert.match(text, /breech/i, `${tab}: first alternative retained`);
    assert.match(text, /oligohydramnios/i, `${tab}: second alternative retained`);
    const preservesSource = /Breech\s*\(\+\)\s+or\s+Oligohydramnios\s*\(\+\)/i.test(text);
    assert.ok(preservesSource || REVIEW.test(text), `${tab}: the unresolved risk-factor relationship is visible`);
  });
});

test('follow-up: source-negative/manual-positive murmur warns in all four tabs and clears when unchecked', async () => {
  const app = loadApp();
  await inputRecord(app, `${BASE}\nPE: Heart murmur(-)`);
  checkMurmur(app, true);
  assert.equal(app.errors.length, 0, 'checking a manual observation must not break rendering');
  const conflictingUI = currentUI(app);
  assertTraceableMurmurWarning(conflictingUI);
  // Resolve the disagreement through the actual manual control, without Reset.
  checkMurmur(app, false);
  assert.equal(app.errors.length, 0);
  const resolvedUI = currentUI(app);
  assert.doesNotMatch([resolvedUI.status, ...Object.values(resolvedUI.tabs)].join('\n'), CONFLICT, 'a cleared manual selection cannot leave a stale conflict warning');
  for (const [tab, text] of Object.entries(resolvedUI.tabs)) {
    assert.match(text, /Heart murmur(?:\(-\)| was absent)/i, `${tab}: unchecking manual does not delete the recorded negative`);
    assert.doesNotMatch(text, /Heart murmur was noted|notable for heart murmur|Physical examination documented Heart murmur(?:[.,\n]|$)|# Heart murmur(?:\n|$)/i, `${tab}: the unchecked manual positive is removed`);
  }
});

test('follow-up: concordant source-positive/manual-positive findings are deduplicated without a conflict warning', async () => {
  const app = loadApp();
  await inputRecord(app, `${BASE}\nPE: Heart murmur(+)`);
  checkMurmur(app, true);
  assert.equal(app.errors.length, 0);
  const ui = currentUI(app);
  assert.doesNotMatch([ui.status, ...Object.values(ui.tabs)].join('\n'), CONFLICT, 'matching positive results must not be labeled as a conflict');
  for (const tab of ['summary', 'consultation', 'discharge']) {
    assert.equal((ui.tabs[tab].match(/heart murmur/gi) || []).length, 1, `${tab}: an equivalent source/manual finding is rendered once`);
  }
  assert.match(ui.tabs.diagnosis, /# Heart murmur/i, 'the manual diagnosis remains available alongside its recorded evidence');
});

test('follow-up: Reset removes a source/manual conflict from every tab and the next input', async () => {
  const app = loadApp();
  await inputRecord(app, `${BASE}\nPE: Heart murmur(-)`);
  const manual = checkMurmur(app, true);
  assertTraceableMurmurWarning(currentUI(app));

  app.document.getElementById('resetBtn').dispatchEvent({ type: 'click' });
  assert.equal(app.document.getElementById('inputData').value, '', 'Reset clears the source record');
  assert.equal(manual.checked, false, 'Reset clears the manual observation');
  assert.equal(app.context.getPEFindings().length, 0);
  const resetUI = currentUI(app);
  assert.equal(resetUI.status, '', 'Reset clears the parse status');
  for (const [tab, text] of Object.entries(resetUI.tabs)) {
    assert.doesNotMatch(text, /heart murmur/i, `${tab}: Reset removes both conflicting findings`);
    assert.doesNotMatch(text, CONFLICT, `${tab}: Reset removes the conflict warning`);
  }

  await inputRecord(app, BASE);
  assert.equal(app.errors.length, 0);
  const nextUI = currentUI(app);
  assert.doesNotMatch([nextUI.status, ...Object.values(nextUI.tabs)].join('\n'), CONFLICT, 'a new record cannot inherit the previous conflict');
  for (const [tab, text] of Object.entries(nextUI.tabs)) {
    assert.doesNotMatch(text, /heart murmur/i, `${tab}: a new record cannot inherit the previous source or manual finding`);
  }
});

test('follow-up: replacing source negative with positive resolves the conflict through the input event', async () => {
  const app = loadApp();
  await inputRecord(app, `${BASE}\nPE: Heart murmur(-)`);
  const manual = checkMurmur(app, true);
  assertTraceableMurmurWarning(currentUI(app));

  // Keep the manual finding selected while replacing only the supplied record.
  await inputRecord(app, `${BASE}\nPE: Heart murmur(+)`);
  assert.equal(manual.checked, true, 'source replacement must not silently clear the manual selection');
  assert.equal(app.errors.length, 0);
  const resolvedUI = currentUI(app);
  assert.doesNotMatch([resolvedUI.status, ...Object.values(resolvedUI.tabs)].join('\n'), CONFLICT, 'matching source/manual findings remove the previous conflict warning');
  for (const [tab, text] of Object.entries(resolvedUI.tabs)) {
    assert.match(text, /Heart murmur(?:\(\+\)| was present)/i, `${tab}: the replacement positive source is retained`);
    assert.doesNotMatch(text, /Heart murmur\(-\)/i, `${tab}: the superseded negative source is removed`);
  }
  for (const tab of ['summary', 'consultation', 'discharge']) {
    assert.equal((resolvedUI.tabs[tab].match(/heart murmur/gi) || []).length, 1, `${tab}: the now-concordant source/manual finding is deduplicated`);
  }
  assert.match(resolvedUI.tabs.diagnosis, /# Heart murmur/i, 'resolving the source conflict retains the selected manual diagnosis');
});

test('follow-up review: extra whitespace in a finding name does not hide an explicit negative/manual-positive conflict', async () => {
  const app = loadApp();
  await inputRecord(app, `${BASE}\nPE: Heart  murmur(-)`);
  checkMurmur(app, true);
  assert.equal(app.errors.length, 0);
  assertTraceableMurmurWarning(currentUI(app), /Heart\s{2}murmur\(-\)/i);
});

test('follow-up review: unrelated OR leaves a definite negative intact, while negative OR unknown stays unresolved', async () => {
  const app = loadApp();
  await inputRecord(app, `${BASE}\nPE: Heart murmur(-), abdominal distension or organomegaly?`);
  const manual = checkMurmur(app, true);
  const conflictingUI = currentUI(app);
  assertTraceableMurmurWarning(conflictingUI);
  for (const [tab, text] of Object.entries(conflictingUI.tabs)) {
    assert.match(text, /abdominal distension or organomegaly\?/i, `${tab}: the unrelated uncertain observation is also retained`);
  }

  // This OR qualifies the murmur result itself, so it cannot establish a negative.
  await inputRecord(app, `${BASE}\nPE: Heart murmur negative, or unknown`);
  assert.equal(manual.checked, true, 'the differing result must come from source interpretation, not an unchecked control');
  assert.equal(app.errors.length, 0);
  const unresolvedUI = currentUI(app);
  assert.doesNotMatch([unresolvedUI.status, ...Object.values(unresolvedUI.tabs)].join('\n'), CONFLICT, 'an unresolved negative-or-unknown source must not be reported as a definite source/manual conflict');
  for (const [tab, text] of Object.entries(unresolvedUI.tabs)) {
    assert.match(text, /Heart murmur negative, or unknown/i, `${tab}: the complete uncertain source remains traceable`);
  }
});

test('follow-up review: hernia conflict detection distinguishes opposite-side from same-side observations', async () => {
  const app = loadApp();
  await inputRecord(app, `${BASE}\nPE: right inguinal hernia(-)`);
  const hernia = app.document.getElementById('peHernia');
  hernia.checked = true;
  hernia.dispatchEvent({ type: 'change' });
  const left = app.document.querySelector('input[name="herniaSide"][value="(lt)"]');
  left.checked = true;
  left.dispatchEvent({ type: 'change' });
  assert.ok(Array.from(app.context.getPEFindings()).includes('Inguinal hernia (lt)'), 'the UI must actually supply a left-sided manual finding');
  const differentSideUI = currentUI(app);
  assert.doesNotMatch([differentSideUI.status, ...Object.values(differentSideUI.tabs)].join('\n'), CONFLICT, 'right-side absence does not contradict a left-side manual finding');
  for (const [tab, text] of Object.entries(differentSideUI.tabs)) {
    assert.match(text, /right inguinal hernia(?:\(-\)| was absent)/i, `${tab}: the right-sided negative source is retained`);
    assert.match(text, /Inguinal hernia(?:\s*\(lt\)|,\s*lt)/i, `${tab}: the left-sided manual finding is retained`);
  }

  // Replace only the source side: the selected manual finding remains left-sided.
  await inputRecord(app, `${BASE}\nPE: left inguinal hernia(-)`);
  assert.equal(hernia.checked, true);
  assert.equal(left.checked, true);
  assert.equal(app.errors.length, 0);
  assertTraceablePEWarning(currentUI(app), /Inguinal hernia\s*\(lt\)/i, /left inguinal hernia\(-\)/i);
});
