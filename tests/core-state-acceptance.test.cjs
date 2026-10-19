'use strict';

// Formal adapter of acceptance-core/acceptance.cjs. Original specimen inputs,
// expected values and inspect callbacks are retained without semantic changes.
const test = require('node:test');
const assert = require('node:assert/strict');
const { isDeepStrictEqual } = require('node:util');
const { loadApp, toText } = require('./app-harness.cjs');

function group(id, title, priority, blockerReason, specimens) {
  specimens.forEach(({ input, expected, inspect }, index) => {
    const suffix = specimens.length > 1 ? ` [${index + 1}/${specimens.length}]` : '';
    test(`${id}: ${title}${suffix}`, () => {
      const app = loadApp();
      app.document.getElementById('inputData').value = input;
      app.context.updateUI();
      const data = app.parse(input);
      const output = Object.fromEntries(Object.entries(app.render(data)).map(([key, value]) => [key, toText(value)]));
      const checks = [];
      const check = (criterion, wanted, actual) => checks.push({
        criterion, expected: wanted, actual, verdict: isDeepStrictEqual(wanted, actual) ? 'PASS' : 'FAIL',
      });
      inspect({ data, output, check, app });
      check('No application runtime error', 0, app.errors.length);
      const failures = checks.filter(check => check.verdict === 'FAIL');
      assert.equal(failures.length, 0, `${expected}\n${JSON.stringify(failures, null, 2)}`);
    });
  });
}

group('A01', '受支援格式對照：母體結果與出生基本數值', 'control', '', [{
  input: 'GA 39+2 weeks, BW 3200 gm, AGA\nG1 P1 A0, NSD\nGBS(-)\nGDM(-)\nPROM(-)\nMAS(-)\nPre-eclampsia(-)\nMaternal blood group: type A, Rh+\nHBsAg(-), HBeAg(-), HIV(-), RPR(-)',
  expected: 'GA 39+2、BW 3200 gm、AGA、母體 A/Rh+，原文明示的陰性保留。此對照僅驗指定欄位，未驗證全部病程模板。',
  inspect: ({ data, output, check }) => {
    check('GA', '39+2', data.ga); check('BW gm', '3200', data.bw); check('growth class', 'AGA', data.aga);
    check('maternal blood group', 'A, Rh+', data.bloodGroup); check('GBS', 'negative', data.gbs);
    check('GDM', 'No GDM.', data.gdm); check('PROM absent', false, data.prom.present);
    check('MAS absent', true, data.masIsAbsent); check('preeclampsia absent', false, data.preEclampsia);
    check('serology all explicitly negative', true, Object.values(data.serology).every(v => v === '-'));
    check('consultation retains GBS negative', true, /GBS: GBS\(-\)/.test(output.consultation));
  },
}]);

group('A02', '同一行多項母體結果應各自判讀', 'blocker', '明確陽性/陰性被另一個欄位改寫，造成病歷及診斷錯誤。', [
  { input: 'GBS(+), GDM(-)', expected: 'GBS positive、GDM negative。', inspect: ({ data, output, check }) => {
    check('GBS positive', true, data.isGbsPositive); check('GDM negative', 'No GDM.', data.gdm);
    check('consultation must not assert GBS negative', false, /GBS: GBS\(-\)/.test(output.consultation));
  } },
  { input: 'GBS(-), GDM(+) under insulin', expected: 'GBS negative、GDM positive，保留 insulin。', inspect: ({ data, output, check }) => {
    check('GBS negative', false, data.isGbsPositive); check('GDM insulin', 'GDM under insulin.', data.gdm);
    check('diagnosis retains infant of diabetic mother', true, /Infant of diabetic mother/.test(output.diagnosis));
  } },
  { input: 'GBS negative, GDM positive', expected: 'GBS negative、GDM positive，不能借用 GDM 的 positive。', inspect: ({ data, output, check }) => {
    check('GBS negative', false, data.isGbsPositive);
    check('diagnosis must not add positive GBS', false, /Maternal GBS positive/.test(output.diagnosis));
  } },
]);

group('A03', 'GDM 的明確陰性與 unknown', 'blocker', '將 negative/unknown 改寫成 GDM 陽性並產生診斷。', [
  { input: 'GDM negative', expected: '保留 negative，不新增 Infant of diabetic mother。', inspect: ({ data, output, check }) => {
    check('GDM negative', 'No GDM.', data.gdm);
    check('diabetic mother diagnosis absent', false, /Infant of diabetic mother/.test(output.diagnosis));
  } },
  { input: 'GDM status unknown', expected: '保持未明，不宣稱 GDM 陽性，也不新增糖尿病母親嬰兒診斷。', inspect: ({ output, check }) => {
    check('no asserted positive GDM', false, /GDM: GDM\(\+\)/.test(output.consultation));
    check('diabetic mother diagnosis absent', false, /Infant of diabetic mother/.test(output.diagnosis));
  } },
]);

group('A04', 'PROM 時數不可被同列 GBS 陰性覆蓋', 'blocker', '已提供的 PROM 20 小時被改為不存在。', [{
  input: 'PROM for 20 hrs, GBS(-)', expected: 'PROM present，20 小時；會診單不得顯示 PROM(-)。',
  inspect: ({ data, output, check }) => {
    check('PROM present', true, data.prom.present); check('PROM duration hours', '20', data.prom.duration);
    check('no negative PROM statement', false, /PROM\(-\)/.test(output.consultation));
  },
}]);

group('A05', 'PROM 小數及單位換算', 'blocker', '時數被改變至不同量級，且改變現有風險判斷。', [
  { input: 'PROM for 18.5 hours', expected: '18.5 小時，不能截成 5 小時。', inspect: ({ data, output, check }) => {
    check('PROM duration hours', '18.5', data.prom.duration); check('no corrupted 5-hour summary', false, /PROM for 5 hours/.test(output.summary));
  } },
  { input: 'PROM for 0.5 days', expected: '12 小時，不能當成 5 天/120 小時。', inspect: ({ data, output, check }) => {
    check('PROM duration hours', '12', data.prom.duration); check('no corrupted 120-hour summary', false, /PROM for 120 hours/.test(output.summary));
  } },
]);

group('A06', 'IAP 狀態分行仍須保留', 'blocker', '明確 incomplete IAP 消失，讓同一資料只因換行改變結果。', [{
  input: 'GBS(+)\nIncomplete IAP', expected: '保留 GBS positive 及 incomplete IAP，摘要/診斷須反映此限制。',
  inspect: ({ data, output, check }) => {
    check('IAP incomplete retained', true, /incomplete/.test(data.gbs));
    check('summary retains inadequate IAP', true, /without adequate intrapartum antibiotic prophylaxis/.test(output.summary));
  },
}]);

group('A07', '未載明 adequacy 的 IAP 不可擴寫充分完成', 'blocker', '將有限的處置描述擴寫成原文未載明的充分完成。', [{
  input: 'GBS(+) s/p IAP', expected: '記錄曾接受 IAP；原文未載 adequate，診斷不得擴寫 adequate IAP completed。',
  inspect: ({ output, check }) => {
    check('diagnosis must not invent adequate completed IAP', false, /adequate intrapartum antibiotic prophylaxis \(IAP\) completed/.test(output.diagnosis));
  },
}]);

group('A08', 'Serology 冒號與英文結果', 'blocker', '明示檢驗結果被遺漏，會診單還聲稱 not tested。', [{
  input: 'HBsAg: positive\nHBeAg: negative\nHIV: negative\nRPR: positive', expected: '依序為 +、-、-、+，不得寫 not tested。',
  inspect: ({ data, output, check }) => {
    check('HBsAg', '+', data.serology.HBsAg); check('HBeAg', '-', data.serology.HBeAg);
    check('HIV', '-', data.serology.HIV); check('RPR', '+', data.serology.RPR);
    check('no not-tested statement', false, /Serology: not tested/.test(output.consultation));
  },
}]);

group('A09', 'Pre-eclampsia 與 MAS 英文陽性', 'blocker', '肯定結果被直接改寫為陰性。', [{
  input: 'Pre-eclampsia: positive\nMAS positive', expected: '兩者陽性都須保留；不得写 preeclampsia(-)/no MAS。',
  inspect: ({ data, output, check }) => {
    check('preeclampsia positive', true, data.preEclampsia); check('MAS present', false, data.masIsAbsent);
    check('no negative preeclampsia', false, /maternal preeclampsia\(-\)/.test(output.consultation));
    check('no negative MAS assertion', false, /no premature rupture of membranes \(PROM\) or meconium aspiration syndrome \(MAS\)|no MAS/.test(output.summary));
  },
}]);

group('A10', '未提供母體資料保留 parser 狀態及使用者原會診模板', 'blocker', '原版固定句不能回頭把 parser 缺值當成已建立的結果。', [{
  input: 'GA 39 weeks\nBW 3200 gm', expected: 'parser 缺值保留；一般會診預設回復原版，明示未知或矛盾仍另由 A03/A09 與 parser 測試檢查。',
  inspect: ({ data, output, check }) => {
    check('no fabricated negative GBS/GDM', false, /negative for GDM, GBS colonization/.test(output.summary));
    check('no fabricated no-PROM/no-MAS', false, /no premature rupture of membranes \(PROM\) or meconium aspiration syndrome \(MAS\)/.test(output.summary));
    check('preeclampsia remains unknown in parser', 'unknown', data.preEclampsiaStatus);
    check('serology remains unknown in parser', 'unknown', data.serologyStatus.HBsAg);
    check('original consultation risk flag is restored', true, /maternal preeclampsia\(-\)/.test(output.consultation));
    check('original consultation serology placeholder is restored', true, /Serology: not tested/.test(output.consultation));
  },
}]);

group('A11', '母親與嬰兒的結果不得混用', 'blocker', '把嬰兒結果套到母親，反轉母體結果。', [{
  input: 'Infant blood group: type O, Rh+\nMaternal blood group: type B, Rh+\nInfant HBsAg(-)\nMaternal HBsAg(+)',
  expected: '母親為 B/Rh+、HBsAg positive；嬰兒 O/Rh+ 與陰性不得覆蓋母體。',
  inspect: ({ data, output, check }) => {
    check('maternal blood group', 'B, Rh+', data.bloodGroup); check('maternal HBsAg', '+', data.serology.HBsAg);
    check('summary must not label mother O', false, /Maternal blood type is O, Rh\+/.test(output.summary));
  },
}]);

group('A12', '血型標題與值格式', 'nonblocker-format', '目前會標示 ?，屬需補格式支援；優先於完整性但低於內容反轉。', [
  { input: 'Maternal blood group: A, Rh+', expected: '母體血型 A/Rh+。', inspect: ({ data, check }) => { check('maternal blood group', 'A, Rh+', data.bloodGroup); } },
  { input: 'Maternal blood type: type A, Rh+', expected: 'blood type 標題同樣讀為 A/Rh+。', inspect: ({ data, check }) => { check('maternal blood group', 'A, Rh+', data.bloodGroup); } },
]);

group('A13', 'GA 週/日與分數不可截短', 'blocker', '孕期日數無提示地遺失。', [
  { input: 'GA 36w6d\nBW 3200 gm', expected: 'GA 36+6，保留第 6 天。', inspect: ({ data, output, check }) => {
    check('GA weeks+days', '36+6', data.ga); check('summary retains days', true, /36\+6 weeks/.test(output.summary));
  } },
  { input: 'GA 36 6/7 weeks\nBW 3200 gm', expected: 'GA 36+6，保留第 6 天。', inspect: ({ data, output, check }) => {
    check('GA weeks+days', '36+6', data.ga); check('diagnosis retains days', true, /36\+6 weeks/.test(output.diagnosis));
  } },
]);

group('A14', '出生體重單位與千分位', 'blocker', '3200 gm 被改成 3 gm，數值及單位被嚴重破壞。', [
  { input: 'GA 39 weeks\nBW 3.2 kg', expected: '出生體重 3200 gm。', inspect: ({ data, output, check }) => {
    check('BW gm', '3200', data.bw); check('no corrupted 3 gm summary', false, /birth weight was 3 gm/.test(output.summary));
  } },
  { input: 'GA 39 weeks\nBW 3,200 gm', expected: '出生體重 3200 gm。', inspect: ({ data, output, check }) => {
    check('BW gm', '3200', data.bw); check('no corrupted 3 gm diagnosis', false, /BW 3 gm/.test(output.diagnosis));
  } },
]);

group('A15', '缺 GA/生長分類不可補成 Term/AGA', 'blocker', '在孕期與生長分類資料不足時產生確定分類。', [{
  input: 'BW 3200 gm', expected: 'GA 及 AGA/SGA/LGA 未記載，診斷不得預設 Term 或 AGA。',
  inspect: ({ data, output, check }) => {
    check('unprovided GA remains unknown', '?', data.ga);
    check('no invented term diagnosis', false, /# Term infant/.test(output.diagnosis));
    check('no invented AGA classification', false, /\bAGA\b/.test(output.diagnosis));
  },
}]);
