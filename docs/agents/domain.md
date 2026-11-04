# Domain docs

## Before exploring

- Read the root `GLOSSARY.md`, when present.
- Read ADRs in `docs/adr/` that touch the area being explored.
- If these files are absent, proceed silently. `/domain-modeling` creates them lazily as terms and decisions are resolved.

## Layout

This repo uses a single context:

```text
GLOSSARY.md
docs/adr/
  0001-<decision>.md
```

## Vocabulary and decisions

Use the glossary's defined terms in issue titles, proposals, hypotheses, and tests. When a needed concept is missing, reconsider the wording or note the gap for `/domain-modeling`.

If a proposal contradicts an existing ADR, identify the ADR and explain why the decision should be reopened.
