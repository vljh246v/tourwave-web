# Core Beliefs — Team Principles

This document records the team's core design principles.
Both agents and team members reference these principles when making decisions.

## Development Principles

### 1. Worktree Isolation
All work is performed inside a worktree created by `task-start.sh`.
Directly modifying main / develop branches is forbidden.

**Reason**: Both agents and humans make mistakes. Isolation limits the blast radius.

### 2. Validation First
All 5 validators (build/test/lint/security/docs) must pass before merging code.
Bypassing or disabling validators is only allowed in exceptional circumstances.

**Reason**: Validation is mandatory, not optional. Code merged without validation burdens the entire team.

### 3. Repository = Single Source of Truth
Design decisions, architecture discussions, and team principles must be documented in this repository.
Slack/Jira/verbal agreements do not exist for the agent.

**Reason**: The agent cannot access information outside the repository.

### 4. Agent Readability First
Code and documentation should be written so that the agent can reason about them directly.
Avoid unclear abbreviations, internal jargon, or reliance on verbal agreements.

**Reason**: For the agent to work autonomously, context must be explicit.

### 5. Harness Evolution
If the agent repeatedly makes the same mistake, it is a harness problem, not an agent problem.
Failures are signals to improve the harness.

**Reason**: Improving the environment is more effective than blaming the model.

## Coding Principles

### Explicit > Implicit
```kotlin
// Bad: implicit
fun process(data: Any) { }

// Good: explicit
fun processUserRegistration(request: UserRegistrationRequest): UserRegistrationResult { }
```

### Validate at Boundaries
Validate data only at system boundaries (incoming HTTP requests, external API response parsing).
Between internal functions, trust and pass through.

### Tests Are Specifications
Tests are documents that specify "how it behaves."
Write test names that serve as feature specifications.

## Prohibitions

- `// TODO: fix later` — fix now or create a Jira ticket
- Empty catch blocks — at minimum, log the error
- Hardcoded environment values — use environment variables or config files
- Adding business logic without tests
