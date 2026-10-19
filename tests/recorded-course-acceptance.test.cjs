'use strict';

// Formal adapter of acceptance-outputs/accept-outputs.cjs. Original desired
// behavior and inspect callbacks are retained except the explicit OUT-04
// note-template contract restored by the user. The UI-02 prerequisite correction
// is documented locally below; it repairs an audit contradiction, not a product
// defect. Historical `lines` metadata in the copied fixtures is not interpreted.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, toText } = require('./app-harness.cjs');

const base = 'Term male infant\nGA 39+0 weeks\nBW 3200 gm\nAGA\nG1P1A0\nNSD\n29 y/o mother\nAPGAR score: 9 -> 10';
const criterion = (description, pass) => ({ description, pass: Boolean(pass) });
const match = (text, expression) => text.match(expression)?.[0] ?? '';
const currentOutput = app => Object.fromEntries([
  ['summary', 'outputSummary'], ['consultation', 'consultOutput'],
  ['discharge', 'dischargeOutput'], ['diagnosis', 'diagnosisOutput'],
].map(([name, id]) => [name, toText(app.document.getElementById(id).innerHTML)]));

function assertCriteria(criteria) {
  const failures = criteria.filter(criterion => !criterion.pass);
  assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
}

function accept({ id, title, extra = '', manualPE = [], configure, ui = false, inspect }) {
  test(`${id}: ${title}`, () => {
    const app = loadApp();
    const input = `${base}\n${extra}`;
    if (configure) configure(app);
    let output;
    if (ui) {
      app.document.getElementById('inputData').value = input;
      app.context.updateUI();
      output = currentOutput(app);
    } else {
      output = Object.fromEntries(Object.entries(app.render(app.parse(input), manualPE)).map(([name, value]) => [name, toText(value)]));
    }
    const criteria = inspect(output, app);
    criteria.push(criterion('解析及生成沒有程式例外', app.errors.length === 0));
    assertCriteria(criteria);
  });
}

accept({
  id: 'OUT-01', title: '復甦處置保留陽性紀錄',
  extra: 'Resuscitation: Manual positive pressure ventilation(+), Intubation(+)',
  lines: [897, 900], desired: '原文明確記載的 PPV 與插管要保留，不能固定輸出陰性。',
  inspect: o => [
    criterion('會診保留 PPV 陽性', /Manual positive pressure ventilation\(\+\)/i.test(o.consultation)),
    criterion('會診保留插管陽性', /Intubation\(\+\)/i.test(o.consultation)),
    criterion('會診沒有相反的 PPV/插管陰性', !/Manual positive pressure ventilation\(-\)|Intubation\(-\)/i.test(o.consultation)),
  ],
  evidence: o => ({ consultation: match(o.consultation, /Free flow oxygen[^]*?NS challenge\(-\)/) }),
});

accept({
  id: 'OUT-02', title: '產前類固醇與抗生素依記載輸出',
  extra: 'GBS(-)\nPrenatal steroid use: betamethasone x 2 doses completed\nPrenatal antibiotics: ampicillin 2 g IV before delivery',
  lines: [891, 895], desired: '保留明確藥名、劑量或療程；GA 與 GBS 不可覆蓋已提供的用藥史。',
  inspect: o => [
    criterion('會診保留 betamethasone 紀錄', /betamethasone/i.test(o.consultation)),
    criterion('會診保留 ampicillin 紀錄', /ampicillin/i.test(o.consultation)),
    criterion('會診沒有相反的 nil 用藥紀錄', !/Prenatal steroid use: nil|Prenatal antibiotics: nil/i.test(o.consultation)),
  ],
  evidence: o => ({ consultation: match(o.consultation, /Prenatal steroid use:[^]*?Prenatal antibiotics:[^\n]*/) }),
});

accept({
  id: 'OUT-03', title: '異常檢驗不可轉寫為正常',
  extra: 'GDM(+)\nBlood glucose: low, 28 mg/dL\nCRP: elevated\nBlood culture: positive for E. coli\nTotal bilirubin: elevated, 20 mg/dL; phototherapy started',
  configure: app => { app.document.getElementById('sepsisWorkup').checked = true; },
  lines: [977, 997, 1024], desired: '保留已記載的異常結果或標示待核對；不能加入相反的正常結果。',
  inspect: o => [
    criterion('出摘保留異常檢驗/數值/照光資料', /28 mg\/dL/.test(o.discharge) && /E\. coli/.test(o.discharge) && /20 mg\/dL/.test(o.discharge) && /phototherapy/i.test(o.discharge)),
    criterion('出摘沒有與原始結果相反的 WNL 敘述', !/laboratory results were within normal limits|glucose levels[^.]*remained within normal limits|bilirubin level[^.]*within normal limits/i.test(o.discharge)),
  ],
  evidence: o => ({ discharge: [match(o.discharge, /Due to clinical concern[^]*?normal limits\./), match(o.discharge, /Blood glucose[^]*?normal limits\./), match(o.discharge, /Prior to discharge[^]*/)].join('\n') }),
});

accept({
  id: 'OUT-04', title: '自動風險恢復原版感染評估模板，會診回復原欄位不加計畫段落',
  extra: 'PROM for 20 hrs', ui: true,
  lines: [1158, 1167, 821, 977], desired: '三份文件皆依使用者最初模板：兩份摘要使用原 sepsis checkbox 句；會診只在原 PROM 欄呈現，不新增所選計畫段落。明確未做或異常結果仍由原文優先。',
  inspect: o => [
    criterion('PROM 時數有保留', /PROM for 20 hours/.test(o.summary)),
    criterion('入摘恢復原 sepsis checkbox 已執行句，但不加出摘的正常結果', /sepsis workup including CBC\/DC, CRP, and blood culture was performed/i.test(o.summary) && !/laboratory results were within normal limits/i.test(o.summary)),
    criterion('會診保留原 PROM 欄，不新增計畫或已抽血正常段落', /PROM\(\+\) for 20 hrs/i.test(o.consultation) && !/Sepsis evaluation plan selected|blood culture was performed|laboratory results were within normal limits/i.test(o.consultation)),
    criterion('出摘恢復原 sepsis checkbox 模板及所選 PROM 理由', /Due to prolonged PROM/i.test(o.discharge) && /sepsis workup including CBC\/DC, CRP, and blood culture was performed/i.test(o.discharge) && /laboratory results were within normal limits/i.test(o.discharge)),
  ],
  evidence: (o, app) => ({ autoWorkupChecked: app.document.getElementById('sepsisWorkup').checked, summary: match(o.summary, /Due to prolonged PROM[^]*?was performed\./), discharge: match(o.discharge, /Due to prolonged PROM[^]*?normal limits\./) }),
});

accept({
  id: 'OUT-05', title: '預防處置依施打狀態輸出',
  extra: 'HBsAg(+)\nTreatment: HBIG not yet administered; parents declined HBV vaccine, Vitamin K1 and tetracycline ointment',
  lines: [961, 965], desired: '待施打與拒絕狀態要保留；母體陽性或例行模板不能當作已施打證據。',
  inspect: o => [
    criterion('出摘保留待施打及拒絕狀態', /not yet administered/.test(o.discharge) && /declined/.test(o.discharge)),
    criterion('出摘沒有宣稱已接受被拒絕/待施打的處置', !/received routine prophylaxis[^.]*HBIG/i.test(o.discharge)),
  ],
  evidence: o => ({ discharge: match(o.discharge, /^Upon admission[^]*?HBIG \(IM\)\./) }),
});

accept({
  id: 'OUT-06', title: '呼吸 finding 不衍生未記載症狀、支持方式或恢復',
  extra: 'PE: Respiratory distress(+), Grunting(-)\nRespiratory support: CPAP',
  manualPE: ['Respiratory distress'],
  lines: [865, 899, 967], desired: '保留原始 PE 的 Grunting(-) 與 CPAP；勾 RD 不可額外宣稱呻吟、FFO、O2 hood 或已停氧。',
  inspect: o => [
    criterion('會診保留原始 Grunting(-)，BR 的 CPAP 支持留在原出摘呼吸處置位置', /Grunting\(-\)/.test(o.consultation) && /CPAP/.test(o.discharge)),
    criterion('會診沒有與原始資料衝突的呻吟及 FFO', !/Respiration: Grunting\.|Free flow oxygen\(\+\)/.test(o.consultation)),
    criterion('出摘没有由 RD 自動宣稱 O2 hood 及恢復', !/O2 hood was provided with good response|weaned to room air/.test(o.discharge)),
  ],
  evidence: o => ({ consultation: o.consultation.split('\n').filter(l => /^(Respiration:|Recorded physical examination:|Respiratory support:|Free flow oxygen)/.test(l)).join('\n'), discharge: match(o.discharge, /Regarding respiratory status[^]*?remained stable\./) }),
});

accept({
  id: 'OUT-07', title: '發燒 finding 不衍生未記載的自癒病程',
  extra: 'Hospital course: persistent fever, antibiotics started',
  manualPE: ['Fever'],
  lines: [989], desired: '保留原始持續發燒/治療資訊；單一 Fever 勾選不能產生自行退燒且無治療的結論。',
  inspect: o => [
    criterion('出摘保留持續發燒及治療資訊', /persistent fever/i.test(o.discharge) && /antibiotics (?:were )?started/i.test(o.discharge)),
    criterion('出摘没有相反的自行緩解敘述', !/resolved without intervention/.test(o.discharge)),
  ],
  evidence: o => ({ discharge: match(o.discharge, /The infant developed fever[^]*?intervention\./) }),
});

accept({
  id: 'OUT-08', title: '手動選取的呼吸窘迫在診斷欄保留',
  manualPE: ['Respiratory distress (with nasal flaring, retraction)'],
  lines: [1039, 1077], desired: '診斷欄至少保留已明確選取的 Respiratory distress，不推定 TTN/RDS 等病因。',
  inspect: o => [
    criterion('入摘、會診及出摘有相應呼吸描述', /respiratory distress/i.test(o.summary) && /nasal flaring/.test(o.consultation) && /nasal flaring/.test(o.discharge)),
    criterion('診斷欄保留 Respiratory distress', /Respiratory distress/i.test(o.diagnosis)),
  ],
  evidence: o => ({ consultation: match(o.consultation, /Respiration:[^\n]*/), diagnosis: o.diagnosis }),
});

test('UI-01: 替換原文後重新計算自動感染評估狀態', () => {
  const app = loadApp();
  const firstInput = `${base}\nPROM for 20 hrs`;
  const secondInput = `${base}\nPROM(-)\nGBS(-)\nGDM(-)`;
  app.document.getElementById('inputData').value = firstInput;
  app.context.updateUI();
  const firstAutoChecked = app.document.getElementById('sepsisWorkup').checked;
  app.document.getElementById('inputData').value = secondInput;
  app.context.updateUI();
  const output = currentOutput(app);
  const checked = app.document.getElementById('sepsisWorkup').checked;
  const promReason = app.document.querySelector('input[name="sepsisReason"][value="prom"]').checked;
  const criteria = [
    criterion('前置狀態確實由 PROM 自動勾選', firstAutoChecked),
    criterion('替換為無此風險的資料後清掉舊的自動選取狀態', !checked && !promReason),
    criterion('新摘要沒有上一份輸入的 prolonged PROM 理由', !/Due to prolonged PROM/.test(output.summary)),
    criterion('沒有程式例外', app.errors.length === 0),
  ];
  assertCriteria(criteria);
});

test('UI-02: Reset 清除 DDH、原始 PE、手動勾選與既有輸出', () => {
  const app = loadApp();
  const input = `${base}\nPROM for 20 hrs\nDDH risk factors: Family Hx (+)\nPE: Heart murmur(+), grade 2/6, left sternal border`;
  app.document.getElementById('inputData').value = input;
  app.document.querySelector('input[name="peFinding"][value="Heart murmur"]').checked = true;
  app.context.updateUI();
  const before = currentOutput(app);
  // The original audit prerequisite now checks the actual automatic controls.
  // New user instructions restore both original note checkbox templates. Check
  // the actual selected controls instead. All Reset outcome checks below
  // remain exactly as in the original audit; this is not a product-fix count.
  const autoWorkupBeforeReset = app.document.getElementById('sepsisWorkup').checked;
  const autoPromReasonBeforeReset = app.document.querySelector('input[name="sepsisReason"][value="prom"]').checked;
  app.context.resetAll();
  const after = currentOutput(app);
  const checkedControls = app.document.querySelectorAll('input[type="checkbox"]:checked').map(el => el.id || el.value);
  const criteria = [
    criterion('前置狀態包含 DDH 原文、PE 與自動感染評估', /family history of DDH/.test(before.summary) && /Heart murmur/i.test(before.summary) && autoWorkupBeforeReset && autoPromReasonBeforeReset),
    criterion('Reset 後原始資料為空且所有 checkbox 清空', app.document.getElementById('inputData').value === '' && checkedControls.length === 0),
    criterion('Reset 後四頁只顯示貼上資料提示', Object.values(after).every(value => value === '請在左側貼上資料。')),
    criterion('Reset 後解析狀態列清空', app.document.getElementById('parseStatus').innerHTML === ''),
    criterion('沒有程式例外', app.errors.length === 0),
  ];
  assertCriteria(criteria);
});
