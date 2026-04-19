# /harness-task — Start → Implement → Validate → Merge

Takes a natural language task description and automatically runs the full flow:
planning → implementation → validation → completion.
Uses different branch strategies per phase (development/QA/hotfix) based on Git Flow settings in `harness.config.sh`.

---

## Step 0. Resume Existing Work

When a command is received, first determine **whether to resume or start fresh**.

### Criteria

1. Check if the input contains an existing task-id
   - e.g.: `/harness-task PROJ-102 continue`, `/harness-task PROJ-102 resume`
2. Check if a worktree exists at `.worktrees/<task-id>`
3. Check if an exec-plan exists at `docs/exec-plans/active/<task-id>.md` or `docs/exec-plans/active/*<task-id>*`

### Resuming (worktree + exec-plan exist)

Skip Steps 1~5 entirely and do the following:

1. Read the exec-plan to assess current status
2. Check `agent-failures.md` for records related to this task-id
   - If found: show the user "Previously failed for this reason"
3. Present a summary to the user:
   ```
   [HARNESS-TASK] Resuming existing task

     Task ID  : PROJ-102
     Worktree : .worktrees/PROJ-102 (exists)
     exec-plan: docs/exec-plans/active/PROJ-102.md
     Previous failure: F-2026-04-15-1 (02-test failure, tests not updated after policy change)

     How would you like to proceed?
     1. Fix the previous failure and continue
     2. Start over (delete worktree and begin fresh)
   ```
4. If the user picks 1 → jump directly to **Step 6 (Implementation)**. Reference the failure record while fixing
5. If the user picks 2 → delete worktree/branch and start from Step 1

### New Task (no worktree)

Proceed normally from Step 1.

---

## Step 1. Input Analysis

Extract the following from the user's natural language input.

### Task ID

1. If the input contains a Jira ticket ID, use it as-is
   - e.g.: "PROJ-203 fix login bug" → task-id = `PROJ-203`

2. If no ticket ID is present, ask the user
   - "Do you have a Jira ticket number? (e.g. PROJ-203). Press Enter to skip"
   - If they provide one → use as task-id
   - If they press Enter (none) → auto-generate from timestamp
     - Run `date +%Y%m%d-%H%M%S` via Bash
     - task-id = `TASK-{YYYYMMDD-HHMMSS}` (e.g. `TASK-20260415-143022`)

### Task Type

| Type | Criteria |
|------|----------|
| `feat` | New feature, new API, new screen |
| `fix` | Bug fix, error resolution, exception handling |
| `refactor` | Refactoring, structural improvement, performance optimization |
| `chore` | Config change, build, dependency update |
| `docs` | Documentation, README update, comment addition |

### One-Line Summary

Summarize the task within 50 characters.

---

## Step 2. Confirm Work Phase (Git Flow)

If `MERGE_STRATEGY` in `harness.config.sh` is `"pr"`, ask the user which phase:

```
Which phase are you working in?
  1. Development (based on develop → PR to upstream/develop)
  2. QA/Release  (based on release/x.x.x → PR to upstream/release)
  3. Hotfix      (based on main → PR to upstream/main → also merge to develop, release)
```

Determine the base branch by phase:
- **Development**: use `PHASE_DEVELOP_BASE` from `harness.config.sh` (default: `develop`)
- **QA/Release**: if `PHASE_RELEASE_BASE` is empty, ask the user
  - "What is the release branch name? (e.g. release/1.2.0)"
- **Hotfix**: use `PHASE_HOTFIX_BASE` (default: `main`)

If `MERGE_STRATEGY` is `"direct"`, skip this step and use `BASE_BRANCH`.

---

## Step 3. Show Analysis + Confirm

Show the user the result and get confirmation:

```
[HARNESS-TASK] Analysis

  Task ID  : PROJ-203
  Type     : fix
  Summary  : Fix null error on login page token expiry
  Phase    : QA/Release
  Base     : release/1.2.0
  Branch   : feature/PROJ-203
  Merge to : upstream/release/1.2.0 (PR)

Proceed?
```

---

## Step 4. Create Execution Plan

Create `docs/exec-plans/active/<task-id>.md`. (If task-start.sh already created a skeleton, fill it in)

```markdown
---
task_id: <task-id>
type: <type>
phase: develop | release | hotfix
base_branch: <determined base branch>
status: in-progress
created: <current time ISO8601>
owner: (author)
---

# <type>: <summary> (<task-id>)

## Background and Goal

[Based on user input]

## Implementation Steps

- [ ] 1. Assess impact scope
- [ ] 2. [Implementation steps matching the task]
- [ ] 3. Write/update tests
- [ ] 4. Validate with verify-task.sh
- [ ] 5. Complete with task-finish.sh

## Completion Criteria

- [ ] All 5 validators pass
- [ ] Existing tests pass

## References

- ARCHITECTURE.md
- docs/golden-principles.md
- logs/trends/failure-patterns.md
```

---

## Step 5. Sync Branch + Create Worktree

Sync the base branch using `GIT_REMOTE` (default: `upstream`) from `harness.config.sh`:

```bash
# 1. Fetch latest from upstream
git fetch <GIT_REMOTE> <base-branch>

# 2. Sync local base branch
git checkout <base-branch>
git merge --ff-only <GIT_REMOTE>/<base-branch>

# 3. Create worktree
./scripts/task-start.sh <task-id>
```

Since `task-start.sh` reads `BASE_BRANCH` from `harness.config.sh`,
export it for the current phase before running:

```bash
export BASE_BRANCH="<determined base branch>"
./scripts/task-start.sh <task-id>
```

Show the failure-patterns.md preview to the user as-is.

---

## Step 6. Implementation

**After getting confirmation, proceed directly to implementation. Do not stop here.**

### 6-1. Pre-Implementation Check (Feedforward)

Before writing code, read the following documents:

1. **`docs/golden-principles.md`** — read in full
   - Ensure the implementation does not violate any GP rules
   - e.g.: if GP-003 ("no business logic without tests") exists, always write tests alongside

2. **`docs/escalation-policy.md`** — check if this task falls into a high-risk category
   - **If it does**: notify the user immediately and get approval
     ```
     [ESCALATION] This task falls under the escalation policy.

       Category: Database schema change
       Policy: docs/escalation-policy.md#1

       Please add the following to the exec-plan:
       - Impact: Scope affected by this change
       - Rollback: How to revert if issues arise
       - Verification: How to confirm correct behavior

       Will proceed after approval. Continue?
     ```
   - **If not**: proceed with implementation

3. **`logs/trends/failure-patterns.md`** — check for past failures related to this task
   - If found, avoid those patterns during implementation

### 6-2. Implementation

1. Move to the worktree directory (`.worktrees/<task-id>`) and work there
2. Follow the layer rules in `ARCHITECTURE.md`
3. Execute implementation steps from the plan one by one:
   - Read related files → modify/add code → write/update tests
4. All code changes must target only files inside the worktree
5. After implementation, `git add` + `git commit` in the worktree
   - Commit message: `<type>: <task-id> <summary>`
   - e.g.: `feat: PROJ-101 Add todo completion status filter`

---

## Step 7. Validation + Completion

### Handling Validation Failures (Common)

If `verify-task.sh` fails, follow this sequence:

1. **Read the exec-plan**: `docs/exec-plans/active/<task-id>.md`
2. **Classify the failure**:
   - **Build failure (01-build)**: compile error → fix code
   - **Test failure (02-test)**: distinguish between two cases:
     - **A. Broke existing behavior**: a test unrelated to the exec-plan goal failed → my code is wrong. Fix the code
     - **B. Intentional policy change**: an existing test fails because the exec-plan explicitly changes behavior → the test expects the old policy. Update the test too
   - **Lint failure (03-lint)**: try auto-fix (e.g. `ktlintFormat`)
   - **Security failure (04-security)**: remove .env or secrets
   - **Docs failure (05-docs)**: update documentation
3. **Fix → re-commit → re-run verify-task.sh**
4. **Maximum 3 attempts**. After 3 failures:

   **a) Auto-log to `docs/agent-failures.md`:**
   - Generate an ID from the current date (run `date +%Y-%m-%d` via Bash)
   - Count existing F- entries for the same day to determine the sequence number
   - Append a row in this format:
   ```
   | F-YYYY-MM-DD-N | <failure symptom summary> | <root cause estimate> | <attempted remediation> | <domain> |
   ```
   - Example:
   ```
   | F-2026-04-15-1 | 02-test: createTodo empty title test failure | Policy change but tests not updated | Tried updating tests per exec-plan but failed | Test |
   ```

   **b) Report to the user:**
   ```
   [HARNESS-TASK] Auto-fix failed after 3 attempts. Human review needed.
     Failed validator: 02-test
     Decision needed: Is the code wrong, or do the tests need updating?
     exec-plan: docs/exec-plans/active/<task-id>.md
     Worktree: .worktrees/<task-id>
     Logged: docs/agent-failures.md (F-2026-04-15-1)
   ```

### MERGE_STRATEGY = "pr" (Production Projects)

1. Run `verify-task.sh <task-id>` to confirm all 5 validators pass
2. On failure, follow the "Handling Validation Failures" procedure above
3. When all pass:
   ```bash
   # Push feature branch from worktree
   cd .worktrees/<task-id>
   git push origin feature/<task-id>
   ```
4. Guide the user to create a PR:
   ```
   [HARNESS-TASK] Validation passed. Please create a PR:

     origin/feature/<task-id> → <GIT_REMOTE>/<base-branch>

   PR title: <type>: <task-id> <summary>
   ```
5. The worktree is cleaned up by the user after PR merge, or by `task-cleanup.sh`

### MERGE_STRATEGY = "direct" (Local Demo)

1. Run `task-finish.sh <task-id>` (validate + local merge + worktree cleanup)
2. On failure, follow the "Handling Validation Failures" procedure above

### Additional Steps for Hotfix

For hotfix tasks, additional work is needed after the PR merge. Inform the user:

```
[HARNESS-TASK] Hotfix follow-up required

  After merging to main, propagate the changes to:
  1. release/<current release version> (if QA is in progress)
  2. develop

  Method: cherry-pick or merge PR
```

---

## Step 8. Completion Report

```
[HARNESS-TASK] Complete

  Task ID   : <task-id>
  Phase     : Development / QA / Hotfix
  Base      : <base-branch>
  Status    : ✅ Push complete (PR needed) / ✅ Merged / ❌ Validation failed
  Changed   : [list of changed files]
  Validation: PASS 5 / FAIL 0
```

On success, move the plan to `docs/exec-plans/completed/`.

---

## Notes

- **Do not stop at Step 6.** After planning + worktree creation, proceed directly to implementation.
- Always create the exec-plan document before running `task-start.sh`
- When `MERGE_STRATEGY="pr"`, do not use `task-finish.sh` for direct merge — instead push + guide PR creation
- Code changes must only target files inside `.worktrees/<task-id>/`
- Attempt auto-fix on failure, but ask the user if the cause is unclear
- Propagating hotfix changes to develop/release is the user's responsibility — only provide guidance
