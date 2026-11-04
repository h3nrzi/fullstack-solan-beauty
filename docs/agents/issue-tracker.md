# Issue tracker: Local Markdown

Issues and specs for this repo live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`.
- Spec: `.scratch/<feature-slug>/spec.md`.
- Implementation tickets: one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`.
- Triage state: a `Status:` line near the top of each issue file, using the role strings in `triage-labels.md`.
- Comments and conversation history: append under a `## Comments` heading.

## Publish and fetch

When publishing, create the spec or ticket at its conventional path above, creating directories as needed. When fetching a ticket, read the referenced file; resolve a supplied number within the relevant feature's `issues/` directory.

## Wayfinding operations

Used by `/wayfinder`. The map is a file with one child file per ticket.

- **Map**: `.scratch/<effort>/map.md`, containing Notes, Decisions-so-far, and Fog.
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body and a `Type:` line (`research`, `prototype`, `grilling`, or `task`).
- **Status**: use `open`, `claimed`, or `resolved` for wayfinding tickets.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every listed ticket is `resolved`.
- **Frontier**: scan for open, unblocked, unclaimed tickets; lowest number wins.
- **Claim**: set `Status: claimed` and save before starting work.
- **Resolve**: append the answer under `## Answer`, set `Status: resolved`, and append a gist plus ticket link to Decisions-so-far in the map.
