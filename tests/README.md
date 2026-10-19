# Tests: original templates with corresponding finding repairs

Run from the repository root; no dependencies are required:

```bash
node --test --test-isolation=none --test-reporter=spec tests/*.test.cjs
```

The harness executes the real inline script from `index.html` in Node's `vm`
with a minimal DOM populated from the real controls. All specimens are
synthetic. UI events, generated bodies and Copy/Reset are checked against the
application rather than a second implementation of its parsing rules.

## Current output contract

The comparison baseline is the complete original application before the DDH/PE
round: commit `81a73dcf5738ed58632e54fc9b7f0d1d66088213`, original `index.html`
SHA-256 `4c97625a3fee3b735e227f6a0251a576bf4233dc6dfc9de16b37a7e23015fe99`.

Compare admission, discharge and consultation independently against that
original using identical source text and original checkbox selections.

- Admission keeps its original single paragraph, sentence order and Baby Room
  ending. Discharge keeps its original routine care and discharge paragraphs.
- Consultation keeps its actual original `Dear Dr` opening, maternal/newborn
  fields, high-risk neonatal critical-care list and BR ending. Its original
  routine defaults are part of the template. They are not converted wholesale
  into a missing-data checklist when source text is silent.
- Actual findings, side, grade and necessary qualifications are inserted in
  the existing related field or sentence. Explicit contrary or unresolved
  source data modifies that slot rather than creating a new source section.
- No new clinical-record, source-quotation, review or plan blocks appear.
  Diagnoses keep the original `#` list without a risk-factor or source appendix.
- HIV appears only when definitely positive. DDH risk without sufficient
  negative hip evidence cannot assert unremarkable hips. Alternatives or
  conflicts cannot become two confirmed findings or diagnoses.
- Existing maternal/infant subject boundaries, numeric units, core states,
  finding recognition and input/reset repairs remain required.
- Existing routine selections, campus HC wording and education variants stay
  in the original templates. No new NBC workflow is introduced.

These are deliberate corrections to the output contract. Earlier tests that
required broad source archives, inpatient-course summaries, mandatory missing
fields or source material in every document do not define this version's
product behavior. Their parser-state and actual finding checks remain relevant;
obsolete presentation assertions are revised to the original related slots.
A rising historical test count is not evidence of matching the user's writing.

## Acceptance evidence

Complete original-output fixtures establish the normal template and original
control branches. Focused regressions verify that previously missed DDH,
intrauterine compression and PE are present once in their related sentences;
HIV, negation, uncertainty, side and grade remain correct.

The test harness also exercises the actual bound Copy and Reset handlers.
Production acceptance separately uses real visible output and clipboard reads,
checks both campus settings, and clears synthetic input afterward.

See [complete generated examples](../docs/narrative-examples.md) for full input
and output text. Exact final test counts, source identity, independent review,
merge commit and deployment results are recorded in the release PR. Historical
PR results are retained in Git history and their respective PR descriptions.

These tests cover the specified source formats and desktop-browser interactions;
they do not establish arbitrary natural-language interpretation or native iOS
Safari behavior.
