'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {loadApp}=require('./app-harness.cjs');
const parse=text=>loadApp().parse(text);
const statusKeys=['gbsStatus','gdmStatus','masStatus','preEclampsiaStatus','fetalDistressStatus'];

test('missing core facts remain unknown and create no positive risk flags',()=>{
    const data=parse('');
    for(const key of ['ga','bw','aga','deliveryMode','selectedGender'])assert.equal(data[key],'?',key);
    for(const key of statusKeys)assert.equal(data[key],'unknown',key);
    assert.equal(data.prom.status,'unknown');assert.equal(data.prom.duration,null);
    assert.equal(data.iapStatus,'unknown');assert.equal(data.gaWeeks,null);
    assert.equal(data.isHighRiskForHypoglycemia,false);
    assert.equal(data.preEclampsia,false);assert.equal(data.masIsAbsent,false);
    assert.equal(data.sourceText,'');
});

test('explicit negative core values remain negative',()=>{
    const data=parse('GBS(-)\nGDM negative\nPROM(-)\nMAS negative\nPre-eclampsia(-)\nFetal distress(-)');
    for(const key of statusKeys)assert.equal(data[key],'negative',key);
    assert.equal(data.prom.status,'negative');assert.equal(data.prom.present,false);
    assert.equal(data.gdm,'No GDM.');assert.equal(data.masIsAbsent,true);
    assert.equal(data.isHighRiskForHypoglycemia,false);
});

test('GBS positive is independent of same-row negative GDM',()=>{
    const data=parse('GBS(+), GDM(-)');
    assert.equal(data.gbsStatus,'positive');assert.equal(data.isGbsPositive,true);
    assert.equal(data.gdmStatus,'negative');
});

test('GDM positive and insulin survive a negative GBS on the same row',()=>{
    const data=parse('GBS(-), GDM(+) under insulin');
    assert.equal(data.gbsStatus,'negative');assert.equal(data.gdmStatus,'positive');
    assert.equal(data.gdm,'GDM under insulin.');assert.equal(data.isHighRiskForHypoglycemia,true);
});

test('English negative does not borrow a sibling positive',()=>{
    const data=parse('GBS negative, GDM positive');
    assert.equal(data.gbsStatus,'negative');assert.equal(data.gdmStatus,'positive');
});

test('bare GDM and explicit unknown are not affirmative diagnoses',()=>{
    for(const input of ['GDM','GDM status unknown','GDM pending','GDM not tested']){
        const data=parse(input);assert.equal(data.gdmStatus,'unknown',input);
        assert.equal(data.isHighRiskForHypoglycemia,false,input);
        assert.match(data.gdmSource,/GDM/);
    }
});

test('the explicit shared no-PROM-or-GBS-or-GDM phrase remains negative',()=>{
    const data=parse('no PROM or GBS or GDM');
    assert.equal(data.prom.status,'negative');assert.equal(data.gbsStatus,'negative');assert.equal(data.gdmStatus,'negative');
});

test('normalization accepts fullwidth punctuation and signs',()=>{
    const data=parse('GBS：（＋），GDM：（－）\nHBsAg：（＋），HBeAg：（－）\nPre-eclampsia：（＋）');
    assert.equal(data.gbsStatus,'positive');assert.equal(data.gdmStatus,'negative');
    assert.equal(data.serology.HBsAg,'+');assert.equal(data.serology.HBeAg,'-');
    assert.equal(data.preEclampsiaStatus,'positive');
});

test('PROM duration survives unrelated same-line negatives',()=>{
    for(const input of ['PROM for 20 hrs, GBS(-)','PROM (+) for 20 hrs, no maternal fever']){
        const data=parse(input);assert.equal(data.prom.status,'positive',input);
        assert.equal(data.prom.duration,'20',input);
    }
});

test('PROM fractional durations and combined units preserve the stated quantity',()=>{
    for(const [input,hours] of [
        ['PROM for 18.5 hours','18.5'],['PROM for 0.5 days','12'],
        ['PROM (+) for 1 day 2.5 hours','26.5'],['ROM for 90 minutes','1.5'],
        ['PROM for 0 hours','0'],
    ]){
        const data=parse(input);assert.equal(data.prom.status,'positive',input);assert.equal(data.prom.duration,hours,input);
    }
});

test('PROM absence does not borrow duration from IAP',()=>{
    const data=parse('PROM negative, IAP for 4 hours');
    assert.equal(data.prom.status,'negative');assert.equal(data.prom.duration,null);
});

test('PROM positive without duration and unknown duration are not invented',()=>{
    const positive=parse('PROM(+)');assert.equal(positive.prom.status,'positive');assert.equal(positive.prom.duration,null);
    const unknown=parse('PROM unknown');assert.equal(unknown.prom.status,'unknown');assert.equal(unknown.prom.duration,null);
});

test('different repeated PROM durations remain conflicting',()=>{
    const data=parse('PROM for 20 hours\nPROM for 24 hours');
    assert.equal(data.prom.status,'conflict');assert.equal(data.prom.duration,null);
    assert.match(data.prom.source,/20 hours/);assert.match(data.prom.source,/24 hours/);
});

test('IAP detail can be on the following line',()=>{
    const data=parse('GBS(+)\nIncomplete IAP');
    assert.equal(data.gbsStatus,'positive');assert.equal(data.iapStatus,'inadequate');
    assert.match(data.gbs,/incomplete IAP/);assert.match(data.iapSource,/Incomplete IAP/);
});

test('IAP existence alone does not establish adequate prophylaxis',()=>{
    for(const input of ['GBS(+) s/p IAP','GBS(+)\nIAP(+)','GBS(+)\nIAP: unknown']){
        const data=parse(input);assert.equal(data.iapStatus,'unknown',input);
        assert.doesNotMatch(data.gbs,/complete|adequate/,input);
    }
});

test('explicit IAP adequacy and negation are preserved',()=>{
    assert.equal(parse('GBS(+) s/p complete IAP').iapStatus,'adequate');
    for(const detail of ['incomplete IAP','inadequate IAP','without IAP','no adequate IAP','without complete IAP','not completed IAP','IAP: not completed']){
        assert.equal(parse('GBS(+)\n'+detail).iapStatus,'inadequate',detail);
    }
    assert.equal(parse('GBS(+)\nIAP adequate?').iapStatus,'unknown');
});

test('conflicting IAP entries remain conflicting',()=>{
    const data=parse('GBS(+)\nadequate IAP\nincomplete IAP');
    assert.equal(data.iapStatus,'conflict');assert.doesNotMatch(data.gbs,/complete|adequate/);
    assert.match(data.iapSource,/adequate/);assert.match(data.iapSource,/incomplete/);
});

test('GDM retains both documented diet and insulin management',()=>{
    const data=parse('GDM(+) under diet control and insulin');
    assert.equal(data.gdmStatus,'positive');
    assert.deepEqual(Array.from(data.gdmTreatment),['diet control','insulin']);
    assert.equal(data.gdm,'GDM under diet control and insulin.');
});

test('GDM treatment negation and uncertainty do not become affirmative medication use',()=>{
    for(const detail of [
        'under diet control, no insulin',
        'under diet control, no medication',
        'under diet control without insulin',
        'under diet control, consider insulin',
        'under diet control, consider medication',
        'under diet control, insulin not given',
        'under diet control, insulin(?)',
    ]){
        const source='GDM(+) '+detail, data=parse(source);
        assert.equal(data.gdmStatus,'positive',source);
        assert.deepEqual(Array.from(data.gdmTreatment),['diet control'],source);
        assert.equal(data.gdm,'GDM under diet control.',source);
        assert.equal(data.sourceText,source);
        assert.equal(data.gdmSource,source);
    }
});

test('blood group recognizes blood type heading and unadorned ABO value',()=>{
    for(const input of ['Maternal blood group: A, Rh+','Maternal blood type: type A, Rh+','Maternal blood type: A+']){
        assert.equal(parse(input).bloodGroup,'A, Rh+',input);
    }
});

test('infant results are not attributed to the mother',()=>{
    const data=parse('Infant blood group: type O, Rh+\nMaternal blood group: type B, Rh+\nInfant HBsAg(-)\nMaternal HBsAg(+)');
    assert.equal(data.bloodGroup,'B, Rh+');assert.equal(data.serology.HBsAg,'+');
    assert.doesNotMatch(data.bloodGroupSource,/Infant/);assert.doesNotMatch(data.serologySource.HBsAg,/Infant/);
});

test('maternal versus infant section headings also scope following result rows',()=>{
    const data=parse('Infant condition:\nblood group: type O, Rh+\nHBsAg(-)\nMaternal condition:\nblood type: type B, Rh+\nHBsAg(+)');
    assert.equal(data.bloodGroup,'B, Rh+');assert.equal(data.serology.HBsAg,'+');
});

test('same-line explicitly different subjects remain independent',()=>{
    const data=parse('Infant blood group: type O, Rh+; Maternal blood group: type B, Rh+\nInfant HBsAg(-); Maternal HBsAg(+)');
    assert.equal(data.bloodGroup,'B, Rh+');assert.equal(data.serology.HBsAg,'+');
});

test('serology accepts colon and word results without assuming a test was not done',()=>{
    const data=parse('HBsAg: positive\nHBeAg: negative\nHIV: non-reactive\nRPR: reactive');
    assert.deepEqual(Object.fromEntries(Object.entries(data.serology)),{HBsAg:'+',HBeAg:'-',HIV:'-',RPR:'+'});
    assert.equal(data.serologyStatus.HBsAg,'positive');assert.match(data.serologySource.HBsAg,/positive/);
});

test('conflicting source values remain unresolved and source is available',()=>{
    const source='GBS(+)\nGBS(-)\nGDM(+)\nGDM(-)\nHBsAg(+)\nHBsAg(-)\nMaternal blood type: A+\nMaternal blood type: B+';
    const data=parse(source);
    assert.equal(data.gbsStatus,'conflict');assert.equal(data.isGbsPositive,false);
    assert.equal(data.gdmStatus,'conflict');assert.equal(data.isHighRiskForHypoglycemia,false);
    assert.equal(data.serology.HBsAg,'?');assert.equal(data.serologyStatus.HBsAg,'conflict');
    assert.equal(data.bloodGroup,'?');assert.equal(data.bloodGroupStatus,'conflict');
    assert.equal(data.sourceText,source);
});

test('pre-eclampsia and MAS affirmative prose are retained',()=>{
    const data=parse('Pre-eclampsia: positive\nMAS positive');
    assert.equal(data.preEclampsiaStatus,'positive');assert.equal(data.preEclampsia,true);
    assert.equal(data.masStatus,'positive');assert.equal(data.masIsAbsent,false);
});

test('GA preserves weeks plus days in supported formats',()=>{
    for(const input of ['GA 36w6d','GA 36 6/7 weeks','GA 36+6 weeks','gestational age 36 weeks 6 days']){
        const data=parse(input);assert.equal(data.ga,'36+6',input);assert.equal(data.gaWeeks,36,input);
    }
    assert.equal(parse('AGA\nGA 39+2 weeks').ga,'39+2');
});

test('BW converts kilograms and preserves comma-separated grams',()=>{
    for(const input of ['BW 3.2 kg','BW 3,200 gm','birth weight: 3200 g','BW3200 gm']){
        assert.equal(parse(input).bw,'3200',input);
    }
});

test('unsupported or contradictory birth quantities remain unresolved',()=>{
    assert.equal(parse('GA 36+9').ga,'?');
    assert.equal(parse('GA 36+6\nGA 38+2').ga,'?');
    assert.equal(parse('BW 7 pounds').bw,'?');
    assert.equal(parse('BW 3200 gm\nBW 3300 gm').bw,'?');
    assert.equal(parse('AGA, SGA').aga,'?');
});

test('explicit delivery modes survive while omitted mode remains unknown',()=>{
    assert.equal(parse('BW 3200 gm').deliveryMode,'?');
    assert.equal(parse('NSD').deliveryMode,'NSD');
    assert.equal(parse('CS due to breech presentation').deliveryMode,'C/S');
    assert.equal(parse('vaginal delivery').deliveryMode,'NSD');
    assert.equal(parse('Prior CS\nNSD').deliveryMode,'?');
});

test('explicit negative delivery instrument signs do not become assistance',()=>{
    const data=parse('NSD, forceps(-), vacuum(-)');
    assert.equal(data.forcepsMatch,null);assert.equal(data.vacuumMatch,null);
    assert.ok(parse('NSD with forceps assistance').forcepsMatch);
});

test('maternal sex wording does not determine newborn gender',()=>{
    assert.equal(parse('30 y/o female mother\nBW 3200 gm').selectedGender,'?');
    assert.equal(parse('Term male infant\n30 y/o female mother').selectedGender,'male');
    assert.equal(parse('Female newborn').selectedGender,'female');
});

test('Apgar arrows and slash formats preserve explicit numbers',()=>{
    for(const input of ['APGAR score: 8 -> 9','Apgar 8 → 9','APGAR: 8/9']){
        assert.equal(parse(input).apgar,'8 -> 9',input);
    }
});

test('fetal distress only asserts an explicitly recorded positive',()=>{
    assert.equal(parse('Fetal distress: positive').fetalDistressStatus,'positive');
    assert.equal(parse('CS due to fetal distress').fetalDistressStatus,'positive');
    assert.equal(parse('Fetal distress(-)').fetalDistressStatus,'negative');
    assert.equal(parse('BW 3200 gm').fetalDistressStatus,'unknown');
});
