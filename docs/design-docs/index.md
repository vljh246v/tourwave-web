# Architecture Decision Records (ADR)

Records structural decisions and their rationale.

## ADR List

| ID | Title | Status | Last Verified |
|----|-------|--------|--------------|
| ADR-0001 | [Worktree Isolation Principle](ADR-0001-worktree-isolation.md) | Active | — |
| ADR-0002 | [5-Stage Validation Pipeline](ADR-0002-validation-pipeline.md) | Active | — |

## Writing a New ADR

1. Create `ADR-{N+1}-{kebab-case-title}.md`
2. Use the template below
3. Add a row to this index.md

## Template

```markdown
---
name: ADR-XXXX Title
verification_status: draft | active | superseded
last_verified: YYYY-MM-DD
owner: (author)
---

# ADR-XXXX: Title

## Context

Why is this decision needed?

## Decision

What was decided?

## Consequences

What are the pros and cons?

## Enforcement

How is this decision enforced?

- Validator: (validator name)
- Lint rule: (rule name)
- Hook: (hook name)
- Documentation: (related docs/ path)
```
