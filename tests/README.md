# Recorded DDH and PE regression tests

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

This is a logic regression suite. It does not replace real-browser checks for
layout, clipboard permissions, event timing, or hosted deployment behavior.
The candidate HTML could not be opened in the test browser because its URL
policy blocks local files; mobile/iOS Safari checks remain unperformed.
Known failures in the maternal/birth parsers and non-DDH/PE course templates are
outside this focused regression suite and are not certified by these passes.

## Follow-up verification (2026-10-19)

The original 24 tests and 12 follow-up tests pass (36 total). The separate eight
acceptance probes that previously exposed the three DDH/PE gaps also pass.
The first nine follow-up tests were additionally run against the exact earlier
PR candidate (`7ec7a1e0`): seven failed and the two positive controls passed.

The follow-up tests cover all four outputs and the bound input/change/reset
events, including source replacement with a manual selection still checked.
Review controls include whitespace within finding names, an unrelated OR in a
different PE observation, an explicitly uncertain result, and matching versus
opposite sides for a manually selected inguinal hernia.
