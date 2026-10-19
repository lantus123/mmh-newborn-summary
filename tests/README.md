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

## Scope

- DDH risk and intrauterine compression findings with screenshot-style spaces,
  multiline sections, case changes, fullwidth punctuation, and mixed signs.
- Missing, partial, indeterminate, and contradictory findings do not become
  documented normal examinations or definite positives.
- Admission, consultation, and discharge narratives preserve source findings.
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
  prophylaxis pending/declined states, and persistent symptoms.
- Clinical plans are distinct from completed investigations, normal results,
  administered medicines, recovery, completed counseling, and discharge.
- Automatic sepsis suggestions are recomputed on source changes. Manual
  choices remain during editing and are cleared by Reset. Empty input never
  renders placeholder example data, including after an already queued update.

## Test files

| File | Purpose |
| --- | --- |
| `recorded-assessment.test.cjs` | Original 24 DDH/PE regression cases |
| `recorded-assessment-followup.test.cjs` | 12 DDH/PE review follow-ups across four tabs and bound events |
| `core-state-acceptance.test.cjs` | Original 15 core acceptance groups, containing 22 specimens |
| `recorded-course-acceptance.test.cjs` | Original 8 output and 2 UI acceptance cases |
| `core-parsers.test.cjs` | 34 parser status, subject, unit, and source-detail regressions |
| `input-state.test.cjs` | 7 automatic/manual state, empty input, sex selection, and queued Reset cases |
| `output-fidelity.test.cjs` | 16 source-fidelity and clinical-course cases |
| `narrative-quality.test.cjs` | 7 full-course narrative scenarios and 5 review-region, Copy, and state checks |
| `narrative-qualifiers.test.cjs` | 8 regressions for qualified observations, intervention state, time anchors, corrected quantities, and duplicate source details |

The two acceptance adapters preserve the original synthetic inputs and desired
checks. One inconsistent **test prerequisite**, in UI-02, was corrected: the
old Reset setup required a sentence claiming a blood culture had been
performed merely because PROM selected a checkbox, while OUT-04 explicitly
forbids that claim. UI-02 now verifies the actual automatic checkbox/reason and
loaded DDH/PE records. All post-Reset requirements are unchanged. This correction
is not counted as a product fix.

## Narrative verification (2026-10-19)

All **145 tests pass**, with no failures or skips. The tested `index.html`
SHA-256 is `b5a619578069ae3deff89697957072e9cc40568365f2c17195e9330ab64492e1`.
The original 125 cases remain the source-fidelity and state regression gate;
the 20 additional cases cover complete clinical prose and its copy boundary.

The narrative revision changes a few presentation expectations in existing
tests, while keeping their clinical assertions:

- `phototherapy started` / `antibiotics started` accept grammatical auxiliaries
  (`was` / `were`). Quantities, start state, persistent symptoms and the absence
  of an invented response are still checked separately.
- Explicitly recorded completed care accepts capitalization and grammatical
  auxiliaries; administration time, measured results, the supplied `after`
  relation, counseling completion and follow-up date remain required.
- UI-selected plans, campus-specific HC intervals and counseling checklists
  are now verified in the adjacent review region. Copied prose must exclude
  those prompts and must still contain source-documented clinical plans or care.
- Raw positive/negative PE signs may become `was present` / `was absent`.
  Source/manual disagreements still retain the original sign, a traceable
  conflict warning and both sources inside the copied note.

Independent review read the complete output for seven fixed synthetic scenarios:
complete timed care, birth data only, pending/declined/planned care, unknown and
conflicting findings, treatment without a recorded response, embedded PE facts
and duplicate controls, and out-of-order single-scale dated events. The exact
inputs and generated prose are in [narrative-examples.md](../docs/narrative-examples.md).

Additional review counterexamples prevent turning `or`, `possible`, unstarted
CPAP/feeding, cancelled follow-up or different day-count anchors into definite
care or a false timeline. Corrected GA/BW source values are retained in all four
outputs instead of selecting the first number as definitive. These are targeted
format and state checks, not a universal natural-language interpretation claim.

The review regions are verified as DOM siblings of the copyable outputs, and
the actual bound Copy handler is exercised with a clipboard stub. Browser
clipboard permissions, visual layout, and mobile/iOS rendering remain outside
this local suite; the earlier production checks described below do not validate
this new candidate UI.

## Earlier broader follow-up verification (2026-10-19, before narrative revision)

All **125 tests passed** with no failures or skips against that earlier candidate.
Its tested `index.html` SHA-256 was
`f5a387435441c91a14ee89d63b2bbfca5f5a840bf2bbbd1639f1a2f2c869cbf9`.
The shared DDH/PE parser and rendering section is unchanged from merged PR #1.

Independent full-output review additionally found and verified fixes for:

- `GDM(+) under diet control, no insulin`: insulin is not added to the
  affirmative treatment list; explicit multi-treatment and dose controls remain.
- Treatment recorded within laboratory or hospital-course text: phototherapy
  and antibiotics remain in the output without a contradictory assertion that
  treatment was not documented merely because no separate treatment heading exists.

This is a logic regression suite. It does not replace real-browser checks for
layout, clipboard permissions, event timing, or hosted deployment behavior.
The broader candidate HTML could not be opened in the test browser because its
URL policy blocks local files; its browser layout, clipboard behavior, and
mobile/iOS Safari checks remain unperformed. The merged DDH/PE version from
PR #1 was separately checked on the deployed website: four-tab source retention,
conflict messaging, Copy, and Reset worked. That production check is evidence
for PR #1 and does not substitute for a browser check of this broader candidate.

## Earlier DDH/PE follow-up verification (2026-10-19, PR #1)

The original 24 tests and 12 follow-up tests pass (36 total). The separate eight
acceptance probes that previously exposed the three DDH/PE gaps also pass.
The first nine follow-up tests were additionally run against the exact earlier
PR candidate (`7ec7a1e0`): seven failed and the two positive controls passed.

The follow-up tests cover all four outputs and the bound input/change/reset
events, including source replacement with a manual selection still checked.
Review controls include whitespace within finding names, an unrelated OR in a
different PE observation, an explicitly uncertain result, and matching versus
opposite sides for a manually selected inguinal hernia.
