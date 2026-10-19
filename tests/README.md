# Recorded DDH and PE regression tests

All fixtures are synthetic. No patient data or external dependencies are used.
The tests run the final inline application script from `index.html` in a fresh
Node `vm` context for each case. A small DOM stub reads the page's actual input
controls and supports parser, generator, reset, and campus configuration checks.

## Run

From the repository root, with Node 22 or later:

```bash
node --test --test-isolation=none tests/recorded-assessment.test.cjs
```

The explicit isolation mode avoids a subprocess IPC limitation in the current
execution environment. Each case still receives its own JavaScript VM and DOM.
Alternatively, the test file can be run directly:

```bash
node tests/recorded-assessment.test.cjs
```

To compare with a separately retained source revision without replacing the
working file:

```bash
MMH_TEST_APP_PATH=/absolute/path/to/baseline-index.html node tests/recorded-assessment.test.cjs
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

This is a logic regression suite. It does not replace real-browser checks for
layout, clipboard permissions, event timing, or hosted deployment behavior.
