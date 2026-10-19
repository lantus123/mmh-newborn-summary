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

## Current BR document contract (2026-10-19)

The admission and discharge outputs serve different purposes in the BR
encounter. The current revision separates the two documents as follows:

| Output or region | Required scope |
| --- | --- |
| BR admission body | Birth, maternal and perinatal information, initial PE, and the initial BR admission assessment. Subsequent care does not extend the admission note. |
| BR discharge body | A brief birth background and necessary risks/PE, followed by actual BR care, the recorded condition on leaving BR, and documented discharge arrangements. |
| Adjacent review region | Selected plans, counseling preparation, and record-review prompts remain separate from the copyable narrative. |

- Admission and discharge have independent narrative renderers. They may share
  fact helpers, such as birth information, without sharing one complete course
  narrative.
- `planned`, pending care, and checkboxes do not establish a completed
  intervention.
- A BR note must not request a complete inpatient course or treatment response
  as a generic completion requirement. Missing care or disposition data must not
  become a normal course, symptom recovery, or stable discharge.
- Source-fidelity, qualified observations, and source/manual PE conflict checks
  remain necessary within the relevant document scope.

All **159 tests pass**, with no failures or skips. This includes **14** dedicated
BR document-purpose cases. The tested `index.html` SHA-256 is
`1989cf2b19307fa41be43cfffc54e29489729d04f0df5a1f5e3178589c705980`.

Independent full-text review read six paired examples (12 narratives) and then
re-read the three affected pairs after fixes. Targeted follow-ups confirmed
DDH/compression retention in both single-line and multiline records regardless
of source ordering, and prevented manual checkboxes from reintroducing later
PE as an initial finding. Actual initial source/manual conflicts remain copyable;
for a conflict involving only a deferred examination, the admission body states
the conflict and unknown admission-time status, and its complete raw source and
manual choice remain in the review region.

The existing `narrative-quality`, `narrative-qualifiers`, and `output-fidelity`
tests now check later or untimed care in admission review rather than admission
body, and explicitly forbid that care from appearing as initial information.
Their quantities, time anchors, negation, conditional states and complete source
requirements remain. Discharge and consultation retain the original factual
requirements. These are deliberate document-scope changes, not removed tests.

Production UI checks occur after deployment and are recorded in the merge PR.
This local suite uses the actual bound Copy/Reset handlers and a clipboard stub;
it does not establish browser clipboard behavior or native iOS Safari support.

The earlier 145-test PR #2 gate checked source fidelity, wording, and state. It
had a real document-purpose gap: admission and discharge shared a whole-course
narrative, and discharge prompts requested a complete inpatient course. Passing
that gate did not establish distinct, appropriate BR admission and discharge
content.

## Source-fidelity and state regression scope

- DDH risk and intrauterine compression findings with screenshot-style spaces,
  multiline sections, case changes, fullwidth punctuation, and mixed signs.
- Missing, partial, indeterminate, and contradictory findings do not become
  documented normal examinations or definite positives.
- Relevant source findings are preserved in each document, with admission and
  discharge assertions following their distinct BR purposes above.
- Raw PE preserves grade, laterality, unknown text, and section boundaries.
- Raw observations alone do not trigger completed oxygen treatment, symptom
  resolution, or arranged outpatient follow-up statements.
- Manual findings, Reset, replacement input, and both campus HC intervals.
- Follow-up coverage in all four tabs (including diagnosis): PE subsection
  headings, alternative observations joined by OR, and explicit source/manual
  conflicts. AND remains a supported definite-positive control.
- Conflict warnings are derived from the current source and manual selection,
  including clearing after edits, unchecking, and Reset. Unchecked controls do
  not establish negative observations.
- Independent maternal screening values, mother/infant subject boundaries,
  explicit unknown/conflicting results, and IAP adequacy versus mere receipt.
- GA weeks/days, gram/kilogram birth weights, decimal PROM durations and units,
  and missing data without invented Term/AGA, delivery mode, or newborn sex.
- Source medication details, resuscitation, abnormal measurements, treatment,
  prophylaxis pending/declined states, and persistent symptoms retain their
  meaning in the appropriate document.
- Clinical plans are distinct from completed investigations, normal results,
  administered medicines, recovery, completed counseling, and discharge.
- Automatic sepsis suggestions are recomputed on source changes. Manual
  choices remain during editing and are cleared by Reset. Empty input never
  renders placeholder example data, including after an already queued update.

## Test files

The existing 145 cases plus 14 BR document-purpose cases form the 159-test gate.
Document-scope expectation changes are described above.

| File | Purpose |
| --- | --- |
| `br-document-scope.test.cjs` | 14 BR initial-assessment, actual care/disposition, DDH order, timed/manual PE, independent narrative, Copy and Reset cases |
| `recorded-assessment.test.cjs` | Original 24 DDH/PE regression cases |
| `recorded-assessment-followup.test.cjs` | 12 DDH/PE review follow-ups across four tabs and bound events |
| `core-state-acceptance.test.cjs` | Original 15 core acceptance groups, containing 22 specimens |
| `recorded-course-acceptance.test.cjs` | Original 8 output and 2 UI acceptance cases |
| `core-parsers.test.cjs` | 34 parser status, subject, unit, and source-detail regressions |
| `input-state.test.cjs` | 7 automatic/manual state, empty input, sex selection, and queued Reset cases |
| `output-fidelity.test.cjs` | 16 source-fidelity and clinical-course cases |
| `narrative-quality.test.cjs` | Original 7 narrative wording/source-fidelity scenarios and 5 review-region, Copy, and state checks; these do not define the BR document contract |
| `narrative-qualifiers.test.cjs` | 8 regressions for qualified observations, intervention state, time anchors, corrected quantities, and duplicate source details |

The two acceptance adapters preserve the original synthetic inputs and desired
checks. One inconsistent **test prerequisite**, in UI-02, was corrected: the
old Reset setup required a sentence claiming a blood culture had been
performed merely because PROM selected a checkbox, while OUT-04 explicitly
forbids that claim. UI-02 now verifies the actual automatic checkbox/reason and
loaded DDH/PE records. All post-Reset requirements are unchanged. This correction
is not counted as a product fix.

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
