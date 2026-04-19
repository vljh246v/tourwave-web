# Tech Debt Tracker

Tracks technical debt that was deferred rather than fixed immediately.
When resolved, delete the row and include `refs: TD-XXX` in the commit message.

## Active Debt

| ID | Description | Severity | Registered | Related Files |
|----|-------------|----------|------------|---------------|
| (add per your project) | | | | |

## Severity Criteria

| Grade | Meaning | Response |
|-------|---------|----------|
| HIGH | Outage risk or security vulnerability | Resolve within 1 week |
| MEDIUM | Development productivity impact | Resolve within 1 month |
| LOW | Code quality improvement | Resolve within the quarter |

## Resolution Steps

1. Start the task with `task-start.sh`
2. Fix the issue, then merge via `task-finish.sh`
3. Delete the corresponding row from this file
4. Include `refs: TD-XXX` in the commit message
