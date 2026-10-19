# Newborn record regression and acceptance tests

All fixtures are synthetic. No patient data or external dependencies are used.
The tests run the final inline application script from `index.html` in a fresh
Node `vm` context for each case. A small DOM stub reads the page's actual input
controls and supports parser, generator, reset, and campus configuration checks.

## Run

From the repository root, with Node 22 or later:

```bash
node --test --test-isolation=none tests/*.test.cjs
```

The explicit isolation mode avoids a subprocess IPC limitation in the current
execution environment. Each case still receives its own JavaScript VM and DOM.
Alternatively, the test file can be run directly:

```bash
node tests/recorded-assessment.test.cjs
node tests/recorded-assessment-followup.test.cjs
```

To compare with a separately retained source revision without replacing the
working file:

```bash
MMH_TEST_APP_PATH=/absolute/path/to/baseline-index.html node tests/recorded-assessment.test.cjs
MMH_TEST_APP_PATH=/absolute/path/to/baseline-index.html node tests/recorded-assessment-followup.test.cjs
```

## Current BR document contract: original admission/discharge style (2026-10-19)

The user first requested the original discharge writing/workflow, then also
requested: 「入摘內容也變成太複雜了，請恢復成原本的版本。我需要的就是有 finding 時要正確顯示。還有診斷下面也不需要 risk factor。」
The original document formats are the reference; the repaired finding parsers
remain required. The earlier PR #2/#3 source-only narrative format is superseded.

| Output or region | Required behavior |
| --- | --- |
| BR admission body | Restore the original connected paragraph: birth/BW → maternal → PROM/MAS → APGAR → PE → selected evaluation and Baby Room ending. Do not append the later hospital course. |
| BR discharge body | Retain PR #4's restored routine prophylaxis → selected BR care → rooming-in/feeding → bilirubin and discharge/MBD/OPD template, without a birth/maternal opening. |
| DDH/compression/PE | Display the recorded finding, grade, laterality, negation and uncertainty correctly in the appropriate note. Missing/unknown hip PE is not a negative or normal examination. |
| Diagnosis | Remove the lower Risk factors and examination findings appendix. Confirmed raw PE positives may join the original diagnosis-style lines; a risk, OR alternative or unknown result does not become a diagnosis. A positive hip sign is recorded as a sign, without inferring confirmed DDH. |
| Clinical source | Explicit care/refusal/pending states take precedence over opposite matching defaults. Later PE/course remains in discharge and consultation, without becoming an initial admission observation. |
| Review and Copy | Remove the added admission/discharge course and plan checklists. Copy copies only the active body; Reset clears all outputs and controls. |

A complete, explicitly normal fixture must reproduce the original admission
paragraph, allowing only whitespace normalization. It includes explicit normal
PE and negative DDH/compression/hip records, so exact comparison does not demand
restoring the original false-negative behavior for missing records. Birth-only
input must still produce the original routine discharge template.

Restoring a template is an intentional return to the user's workflow, not proof
that the described care occurred. Shared parser repairs, consultation, campus
configuration, controls, Copy/Reset and PR #4 discharge functions remain in scope
for regression protection. No new NBC transfer workflow is introduced.

### Deliberate expectation changes

- Admission assertions now require the original one-paragraph order, selected
  template clauses and Baby Room ending. They no longer require the expanded
  narrative sections, source-only course or supplementary review checklist.
- Later/untimed clinical records that were previously asserted in admission
  review remain checked, with their values and states, in consultation/discharge
  and the parser. Later PE must not become an initial finding.
- The removed diagnosis risk section is no longer used as an all-output source
  archive. Risk/negative/unknown/OR source is checked in notes/parser; diagnosis
  separately forbids false positive diagnoses and retains definite raw findings.
- Maternal status, IAP/GDM source details, corrected GA/BW, qualifier, treatment
  state and source/manual conflict assertions remain required in their
  appropriate document context.
- All PR #4 discharge expectations remain unchanged. The existing new discharge
  tests may have only their admission-side assertions updated.

## Test files

| File | Purpose |
| --- | --- |
| `admission-template-restoration.test.cjs` | Original full admission paragraph, original selections, finding accuracy, concise diagnosis, Copy/Reset and unchanged discharge |
| `discharge-template-restoration.test.cjs` | Original complete routine text, course-focused opening, selections, explicit-source overrides, DDH/PE, campus HC, Copy and Reset |
| `br-document-scope.test.cjs` | Initial-admission scope, later PE/source in its applicable note, independent original templates and BR care/disposition |
| `recorded-assessment.test.cjs` | DDH/compression/PE formats, explicit states, details and manual selections |
| `recorded-assessment-followup.test.cjs` | PE subsections, OR/AND and source/manual conflicts across four tabs and events |
| `core-state-acceptance.test.cjs` | Original core acceptance specimens and automatic/manual state |
| `recorded-course-acceptance.test.cjs` | Source-preserving clinical output and UI acceptance, with restored discharge template expectations |
| `core-parsers.test.cjs` | Maternal status/subject, IAP, units, corrected values and source details |
| `input-state.test.cjs` | Automatic/manual state, empty input, sex selection and queued Reset |
| `output-fidelity.test.cjs` | Source details and source precedence in the applicable document scope |
| `narrative-quality.test.cjs` | Complete sentence wording, source states, time order, review and Copy |
| `narrative-qualifiers.test.cjs` | Qualified findings, unstarted care, cancelled follow-up, time anchors and corrected background |

All cases use synthetic data and the actual inline application code. The
restoration is checked against the original full-text fixture as well as the
remaining regression requirements; historical test counts do not establish the
current output contract. Exact execution counts and deployed-browser results
are recorded with the restoring PR.

## Current admission/diagnosis restoration verification (2026-10-19)

The final candidate passed **181 tests**, with **0 failures, cancellations or
skips**, using the command above. Verified `index.html` SHA-256:
`8478678ecb01a088eb1ddede9c43ce083c961c756cf9b75f579b32ede00eb5b9`.

All 169 existing cases remain and 12 admission/diagnosis restoration cases were
added. In the eight affected existing files, the case count remains 106; 47
cases had document-contract or applicable-region assertions adjusted (45 direct
case changes and two affected by the shared conflict helper). No cases were
deleted or skipped. All PR #4 discharge-side assertions remain; DR-02 only
changes the admission-side expectation for detailed later glucose care.

A complete, explicitly normal admission fixture matches the original
`81a73dcf` full text, ignoring only whitespace. Two reviewers read six complete
admission/discharge/diagnosis examples. All six discharge outputs are identical
to PR #4 for the same inputs and controls, and both note-review panels are empty.

Targeted checks also caught and repaired concrete regressions during restoration:
delivery alternatives and negative painless labor, HC detail when raw PE is also
present, manual/source timing conflicts, pending BR admission, and same-side
raw/manual diagnosis duplicates. The diagnosis conflict can be understood when
copied alone, using a short qualifier in the original diagnosis list.

Source comparison confirms the shared parsers and narrative helpers,
consultation generator, PR #4 discharge context/generator, parse-status UI,
campus controls, Copy and Reset are unchanged. Core parser/state tests and the
test harness are unchanged. Current live deployment and actual-clipboard checks
are recorded in the restoring PR after deployment; historical results below do
not substitute for that acceptance.

## Historical PR #4 discharge restoration verification (2026-10-19)

The PR #4 application passed **169 tests**, with **0 failures, cancellations or
skips**, using the command above. The verified `index.html` SHA-256 is
`bcd2a7132785639685a84c1c130c9aadb5adda4a3d93ef3039b12f5363a77bbc`.

That suite retained all 159 previous cases and added 10 restoration cases. Of the
existing cases, 32 had discharge contract or document-region assertions updated
to the user's requested original behavior; no cases were deleted or skipped.
The core parser, state, DDH/PE follow-up tests and test harness are unchanged.

Two reviewers read six complete synthetic admission/discharge pairs, including
routine birth-only input, recorded DDH/compression/PE, automatic PROM/sepsis plus
HC, original short counseling, actual timed BR measurements and disposition,
and declined/pending care with conditional discharge. The normal birth-only
discharge also matched the original `81a73dcf` output **byte for byte**, including
paragraph whitespace, in a separate execution against the retained original.
The examples are maintained at [narrative-examples.md](../docs/narrative-examples.md); their current hash identifies the later admission restoration, not this historical PR #4 result.

Source comparison confirmed that admission and consultation generators, shared
parsers, diagnosis, campus controls, Copy and Reset are unchanged. The only
admission-review wording edit removes the claim that every later/untimed record
will also appear in discharge; its admission-time scope logic is unchanged.
PR #4 merged as `bf4fd598`, deployed successfully, and passed **8 production
interaction checks**, including original routine prose, detailed DDH/PE, automatic
PROM/sepsis, both campus HC intervals, explicit pending/declined overrides, actual
Copy and Reset. Evidence is recorded in [PR #4](https://github.com/lantus123/mmh-newborn-summary/pull/4).

The local Copy tests use the real bound handler and a clipboard stub. Production
acceptance reads the actual browser clipboard after pressing Copy. Native iOS
Safari and arbitrary free-text interpretation are not established by desktop
browser or fixed synthetic-case checks.

## Historical PR #3 verification

PR #3 (`df963eef`) passed 159 tests and 16 live-site checks. It repaired the shared
whole-narrative defect but still prepended birth/maternal background to discharge
and required supplied BR care for a complete note. The user subsequently rejected
that writing/workflow. This restoration deliberately changes the discharge
expectations above while keeping the repaired parsers and admission boundary.

## Historical PR #2 verification (2026-10-19; excludes BR scope acceptance)

All **145 tests passed** at that revision, with no failures or skips. The tested
`index.html` SHA-256 was
`b5a619578069ae3deff89697957072e9cc40568365f2c17195e9330ab64492e1`.
The original 125 cases formed the source-fidelity and state gate; the 20 added
cases checked narrative wording, qualifiers, and the copy boundary. This hash
and result identify PR #2, not the current BR admission/discharge candidate.

That narrative revision changed a few presentation expectations in existing
tests while retaining their source-fidelity assertions:

- `phototherapy started` / `antibiotics started` accept grammatical auxiliaries
  (`was` / `were`). Quantities, start state, persistent symptoms and the absence
  of an invented response are still checked separately.
- Explicitly recorded completed care accepts capitalization and grammatical
  auxiliaries; administration time, measured results, the supplied `after`
  relation, counseling completion and follow-up date remain required.
- UI-selected plans, campus-specific HC intervals and counseling checklists
  were checked in the adjacent review region, outside copied prose. Which
  source-documented clinical records belonged in each BR body still lacked the
  document-scope checks now required above.
- Raw positive/negative PE signs may become `was present` / `was absent`.
  Source/manual disagreements still retain the original sign, a traceable
  conflict warning and both sources inside the copied note.

Independent review read the complete output for seven fixed synthetic scenarios:
timed care, birth data only, pending/declined/planned care, unknown and conflicting
findings, treatment without a recorded response, embedded PE facts and duplicate
controls, and out-of-order single-scale dated events. These were neutral checks
of wording, factual details, qualifiers, and chronology. Their inpatient care
examples are not templates for BR admission or discharge. Full input/output
examples are maintained in
[narrative-examples.md](../docs/narrative-examples.md); each example must be read
with its stated revision and care setting.

Additional review counterexamples prevent turning `or`, `possible`, unstarted
CPAP/feeding, cancelled follow-up or different day-count anchors into definite
care or a false timeline. Corrected GA/BW source values are retained in all four
outputs instead of selecting the first number as definitive. These are targeted
format and state checks, not a universal natural-language interpretation claim.

The local suite verified review regions as DOM siblings of the copyable outputs
and exercised the actual bound Copy handler with a clipboard stub. PR #2 was
then merged as `0845710`, deployed, and passed **16 live-site interaction
checks**, including narrative output, review regions, actual clipboard content,
Reset, and both campus HC settings.

Those live checks did not cover the shared admission/discharge narrative
defect. The new candidate still requires its own BR document tests and
deployment acceptance. Native iOS Safari and arbitrary free-text interpretation
are not established by either the local suite or the recorded desktop-browser
checks.

## Earlier broader follow-up verification (2026-10-19, before narrative revision)

All **125 tests passed** with no failures or skips against that earlier candidate.
Its tested `index.html` SHA-256 was
`f5a387435441c91a14ee89d63b2bbfca5f5a840bf2bbbd1639f1a2f2c869cbf9`.
At that revision, the shared DDH/PE parser and rendering section was unchanged
from merged PR #1.

Independent full-output review additionally found and verified fixes for:

- `GDM(+) under diet control, no insulin`: insulin is not added to the
  affirmative treatment list; explicit multi-treatment and dose controls remain.
- Treatment recorded within laboratory or hospital-course text: phototherapy
  and antibiotics remain in the output without a contradictory assertion that
  treatment was not documented merely because no separate treatment heading exists.

These were local logic checks of the earlier candidate. Later deployment and
browser acceptance of PR #2 are recorded above. Neither historical result is a
substitute for the current BR document gate or its live deployment checks.

## Earlier DDH/PE follow-up verification (2026-10-19, PR #1)

The original 24 tests and 12 follow-up tests passed (36 total). The separate eight
acceptance probes that previously exposed the three DDH/PE gaps also passed.
The first nine follow-up tests were additionally run against the exact earlier
PR candidate (`7ec7a1e0`): seven failed and the two positive controls passed.

The follow-up tests cover all four outputs and the bound input/change/reset
events, including source replacement with a manual selection still checked.
Review controls include whitespace within finding names, an unrelated OR in a
different PE observation, an explicitly uncertain result, and matching versus
opposite sides for a manually selected inguinal hernia.
