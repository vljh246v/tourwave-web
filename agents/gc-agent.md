# GC (Garbage Collection) Agent

## Role

Runs periodically to keep the repository and harness healthy.
For the harness to be an evolving system rather than a static rule set, this agent is essential.

## Schedule

- Daily (CI/CD or manual)
- Weekly deep analysis

---

## Task List

### 1. Log Analysis → Update failure-patterns.md

- Read `logs/validators/history.jsonl` and calculate failure rates for the last 30 days
- Extract recurring patterns
- Update `logs/trends/failure-patterns.md`
- task-start.sh displays this file as Feedforward

### 2. Recurrence Prevention Loop: 3-Strike Promotion

**This is the core mechanism of harness evolution.**

1. Read `docs/agent-failures.md`
2. Count how many times the same pattern has occurred in the same domain
3. Take action based on the count:

| Count | Action | Specifics |
|-------|--------|-----------|
| 1 | Log only | Add a row to agent-failures.md (already done automatically by /harness-task) |
| 2 | Promote to golden-principles.md | Assign GP-XXX number. Fill in **Why / Instead / Enforcement**. "Documentation only" is acceptable for Enforcement |
| 3 | Structural enforcement required | If GP's Enforcement is "documentation only" → create exec-plan to escalate to lint/test/validator/hook |

**3-Strike Promotion Procedure:**

```
3 occurrences of same pattern found in agent-failures.md
  │
  ▼
Check the "Enforcement" field of the corresponding GP in golden-principles.md
  │
  ├─ Already enforced via lint/validator/hook → review if enforcement is sufficient
  │
  └─ "Documentation only" → escalate to structural enforcement
     │
     ▼
  Auto-create exec-plan: docs/exec-plans/active/chore-enforce-GP-XXX.md
  
  Example content:
  ┌────────────────────────────────────────────┐
  │ # chore: Escalate GP-005 to structural     │
  │   enforcement                              │
  │                                            │
  │ ## Background                              │
  │ Same pattern repeated 3 times in           │
  │ agent-failures.md:                         │
  │ F-2026-04-15-1, F-2026-04-17-1,           │
  │ F-2026-04-20-2                             │
  │                                            │
  │ ## Implementation                          │
  │ - [ ] Add ArchUnit test (or lint rule)     │
  │ - [ ] Update golden-principles.md          │
  │       Enforcement field                    │
  │ - [ ] Write ADR (include Enforcement       │
  │       section)                             │
  │                                            │
  │ ## Completion Criteria                     │
  │ - [ ] The pattern is automatically blocked │
  │       by a validator                       │
  └────────────────────────────────────────────┘
```

This exec-plan is approved by a human and implemented via /harness-task. The GC agent does not modify code directly.

### 3. Stale Worktree Cleanup

```bash
./scripts/task-cleanup.sh
```

- Remove worktrees whose branches have been merged/deleted
- Warn about worktrees inactive for 7+ days

### 4. Documentation Drift Detection

Check the following and create fix PRs or exec-plans as needed:

- Does CLAUDE.md exceed 100 lines?
- Do build/test commands in CLAUDE.md match harness.config.sh?
- Does the layer structure in ARCHITECTURE.md match the actual package structure?
- Are there stale plans in exec-plans/active/? (move completed ones to completed/)
- Are there "Enforcement: documentation only" items in golden-principles.md left unaddressed for too long?

### 5. Codebase Drift Detection

- Detect lint rule violation patterns → bulk fix PR
- Update QUALITY_SCORE.md

### 6. Tech Debt Tracker Management

- Warn if HIGH severity items in `docs/exec-plans/tech-debt-tracker.md` are unaddressed for 1+ week
- Clean up resolved items that are still listed

---

## Output Format

```markdown
## GC Agent Report — 2026-04-15

### Recurrence Prevention Loop
- agent-failures.md: 8 total (2 new)
- 3-strike target: GP-005 "controller directly injecting repository" (3 occurrences)
  → exec-plan created: docs/exec-plans/active/chore-enforce-GP-005.md

### Log Analysis
- failure-patterns.md updated
- 02-test failure rate 28% (previous month 34% → improving)
- 04-security failure rate 5% (previous month 12% → GP-002 effective)

### Cleanup
- 2 stale worktrees removed
- 3 exec-plans moved to completed
- tech-debt TD-003 HIGH item 1 week overdue — needs attention

### Drift Detection
- CLAUDE.md: 58 lines (OK)
- golden-principles GP-003: "Enforcement: documentation only" for 2 weeks — review for escalation

### Next Run
- Tomorrow 09:00
```
