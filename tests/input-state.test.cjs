'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, toText } = require('./app-harness.cjs');

const base = 'GA 39+2 weeks\nBW 3200 gm\nG1P1A0\nNSD';
const outputIds = ['outputSummary', 'consultOutput', 'dischargeOutput', 'diagnosisOutput'];

function input(app, text) {
  app.document.getElementById('inputData').value = text;
  app.context.updateUI();
  assert.equal(app.errors.length, 0);
}

function reason(app, value) {
  return app.document.querySelector(`input[name="sepsisReason"][value="${value}"]`);
}

function choose(element, checked) {
  element.checked = checked;
  element.dispatchEvent({ type: 'change' });
}

function expectBlank(app) {
  for (const id of outputIds) {
    assert.equal(toText(app.document.getElementById(id).innerHTML), '請在左側貼上資料。', id);
  }
  assert.equal(app.document.getElementById('parseStatus').innerHTML, '');
}

test('empty input does not turn placeholder examples into patient records', () => {
  const app = loadApp();
  app.context.updateUI();
  expectBlank(app);
  input(app, `${base}\nPROM for 20 hours`);
  assert.equal(app.document.getElementById('sepsisWorkup').checked, true);
  input(app, '   ');
  expectBlank(app);
  assert.equal(app.document.getElementById('sepsisWorkup').checked, false);
  assert.equal(reason(app, 'prom').checked, false);
});

test('automatic plans use decimal PROM and replace old reasons with current evidence', () => {
  const app = loadApp();
  input(app, `${base}\nPROM for 18.5 hours\nGBS(-)`);
  assert.equal(reason(app, 'prom').checked, true);
  assert.equal(app.document.getElementById('sepsisWorkup').checked, true);

  input(app, `${base}\nPROM(-)\nGBS(+)\nIncomplete IAP`);
  assert.equal(reason(app, 'prom').checked, false);
  assert.equal(reason(app, 'gbs').checked, true);

  input(app, `${base}\nPROM(-)\nGBS(-)\nGDM(-)`);
  assert.equal(app.document.getElementById('sepsisWorkup').checked, false);
  assert.equal(reason(app, 'prom').checked, false);
  assert.equal(reason(app, 'gbs').checked, false);
  for (const id of outputIds) {
    assert.doesNotMatch(toText(app.document.getElementById(id).innerHTML), /Sepsis evaluation plan selected|Due to prolonged PROM/i, id);
  }
});

test('editing source clears automatic reasons while preserving a manually chosen reason', () => {
  const app = loadApp();
  input(app, `${base}\nPROM for 20 hours`);
  choose(reason(app, 'fever'), true);
  input(app, `${base}\nPROM(-)\nGBS(-)`);
  assert.equal(reason(app, 'prom').checked, false);
  assert.equal(reason(app, 'fever').checked, true);
  assert.equal(app.document.getElementById('sepsisWorkup').checked, true);
  choose(reason(app, 'fever'), false);
  assert.equal(app.document.getElementById('sepsisWorkup').checked, false);
});

test('manual dismissal survives a PE edit, and Reset restores automatic suggestions', () => {
  const app = loadApp();
  input(app, `${base}\nPROM for 20 hours`);
  choose(app.document.getElementById('sepsisWorkup'), false);
  choose(app.document.querySelector('input[name="peFinding"][value="Heart murmur"]'), true);
  assert.equal(app.document.getElementById('sepsisWorkup').checked, false);
  assert.equal(reason(app, 'prom').checked, false);
  app.context.resetAll();
  input(app, `${base}\nPROM for 20 hours`);
  assert.equal(app.document.getElementById('sepsisWorkup').checked, true);
  assert.equal(reason(app, 'prom').checked, true);
});

test('unknown and conflicting screening fields are visibly distinct from negative results', () => {
  const app = loadApp();
  input(app, base);
  let status = toText(app.document.getElementById('parseStatus').innerHTML);
  for (const field of ['GBS', 'GDM', 'PROM']) assert.match(status, new RegExp(`${field}: 未記錄／待確認 ⚠`));
  input(app, `${base}\nGBS(-)\nGDM(-)\nPROM(-)`);
  status = toText(app.document.getElementById('parseStatus').innerHTML);
  for (const field of ['GBS', 'GDM', 'PROM']) assert.match(status, new RegExp(`${field}: - ✓`));
  input(app, `${base}\nGBS(+)\nGBS(-)`);
  assert.match(toText(app.document.getElementById('parseStatus').innerHTML), /GBS: 原文衝突，請核對 ⚠/);
  assert.equal(app.document.getElementById('sepsisWorkup').checked, false);
});

test('gender follows explicit infant data, clears when absent, and preserves a manual choice until Reset', () => {
  const app = loadApp();
  input(app, `${base}\nMale newborn`);
  assert.equal(app.document.getElementById('genderMale').checked, true);
  input(app, base);
  assert.equal(app.document.querySelectorAll('input[name="gender"]:checked').length, 0);
  assert.equal(app.parse(base).selectedGender, '?');
  choose(app.document.getElementById('genderFemale'), true);
  input(app, base);
  assert.equal(app.parse(base).selectedGender, 'female');
  assert.equal(app.document.getElementById('genderFemale').checked, true);
  app.context.resetAll();
  assert.equal(app.document.querySelectorAll('input[name="gender"]:checked').length, 0);
  assert.equal(app.parse(base).selectedGender, '?');
});

test('Reset remains empty when an already queued input update runs', async () => {
  const app = loadApp();
  const element = app.document.getElementById('inputData');
  element.value = `${base}\nPROM for 20 hours`;
  element.dispatchEvent({ type: 'input' });
  app.document.getElementById('resetBtn').dispatchEvent({ type: 'click' });
  await new Promise(resolve => setTimeout(resolve, 350));
  expectBlank(app);
  assert.equal(app.document.getElementById('sepsisWorkup').checked, false);
  assert.equal(app.errors.length, 0);
});
