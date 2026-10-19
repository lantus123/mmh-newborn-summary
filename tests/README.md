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

## Current BR document contract: restored original discharge style (2026-10-19)

The user reviewed the original and the revised output, then explicitly requested
that the discharge note return to its original writing and workflow. This
contract supersedes the PR #2/#3 source-only discharge design.

| Output or region | Required behavior |
| --- | --- |
| BR admission body | Retain the existing birth, maternal/perinatal, initial PE and admission-time scope. Later or untimed clinical records remain in admission review. |
| BR discharge body | Restore the original routine prophylaxis → BR care/rooming-in → feeding → bilirubin and discharge/MBD/OPD template. Do not prepend birth, maternal or delivery-room background. |
| Discharge checkboxes | Restore the original sepsis, blood glucose, HC, respiratory and counseling template clauses, including the existing automatic sepsis checkbox. |
| Explicit BR source | Keep actual measurements, times, findings, treatment states, refusals and disposition. A supplied record takes precedence over the matching default clause. |
| Review and Copy | Admission review remains unchanged. Discharge no longer demands a full supplied course or repeats template clauses as uncompleted plans. Copy still copies only the current body; Reset clears all outputs and controls. |

The routine discharge fixture must match the original version's complete text,
allowing only whitespace normalization. Missing clinical-course input must not
prevent that ordinary template from being produced. This is an intentional
return to the user's original tool behavior, not a claim that a template proves
an intervention occurred.

The current shared parsers, admission/consultation/diagnosis generators, campus
configuration, NBC controls and selected-plan helper are outside the restoration
implementation. No new NBC transfer workflow is introduced. The original NBC
checkbox branch is retained only for output compatibility.

### Deliberate expectation changes

- Birth-only discharge now requires the original routine template and forbids
  the duplicated birth/maternal opening or missing-course prompt. Admission
  remains factual and short.
- Maternal screening, prenatal medication, corrected GA/BW, delivery details
  and birth resuscitation are checked in their appropriate admission,
  consultation and parser context. The discharge note must not repeat that
  background merely to satisfy an old all-output assertion.
- Original selected discharge template clauses are asserted inside the copied
  discharge body. The same selections remain plans in admission/consultation.
  Automatic sepsis selections follow the original discharge checkbox contract.
- Explicit source negation, abnormal values, unstarted support, persistent
  symptoms, declined prophylaxis, and planned/cancelled discharge still must not
  be contradicted by an incompatible template clause.
- DDH/compression/PE grade, laterality, uncertainty, source/manual conflicts and
  source retention remain required. Missing hip PE must not become a normal hip
  examination. Raw PE alone does not automatically select a treatment checkbox.
- The admission time boundary, exact Copy body, Reset/empty state, and automatic
  suggestion withdrawal on input change retain their established assertions.

## Test files

| File | Purpose |
| --- | --- |
| `discharge-template-restoration.test.cjs` | Original complete routine text, course-focused opening, selections, explicit-source overrides, DDH/PE, campus HC, Copy and Reset |
| `br-document-scope.test.cjs` | Initial-admission scope, later PE, source order, independent outputs and BR care/disposition |
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

### Restoration verification (2026-10-19)

The final application passed **169 tests**, with **0 failures, cancellations or
skips**, using the command above. The verified `index.html` SHA-256 is
`bcd2a7132785639685a84c1c130c9aadb5adda4a3d93ef3039b12f5363a77bbc`.

The suite retains all 159 previous cases and adds 10 restoration cases. Of the
existing cases, 32 had discharge contract or document-region assertions updated
to the user's requested original behavior; no cases were deleted or skipped.
The core parser, state, DDH/PE follow-up tests and test harness are unchanged.

Two reviewers read six complete synthetic admission/discharge pairs, including
routine birth-only input, recorded DDH/compression/PE, automatic PROM/sepsis plus
HC, original short counseling, actual timed BR measurements and disposition,
and declined/pending care with conditional discharge. The normal birth-only
discharge also matched the original `81a73dcf` output **byte for byte**, including
paragraph whitespace, in a separate execution against the retained original.
These current full outputs are in [narrative-examples.md](../docs/narrative-examples.md).

Source comparison confirmed that admission and consultation generators, shared
parsers, diagnosis, campus controls, Copy and Reset are unchanged. The only
admission-review wording edit removes the claim that every later/untimed record
will also appear in discharge; its admission-time scope logic is unchanged.
Live deployment and actual browser clipboard results are recorded with the PR
after deployment, independently of the local test result.

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
