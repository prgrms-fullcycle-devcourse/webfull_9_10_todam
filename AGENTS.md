# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## Start Here

1. Confirm the current task goal.
2. Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand module boundaries and layer responsibilities.
3. Use [docs/README.md](docs/README.md) to find only the documents relevant to the task.
4. When building a feature, requirements and the API contract come first. Attach the feature/requirements specs (Notion published links) and run `/plan` — it snapshots the data model + API contract into the execution plan, which is the source of truth BE/FE bind to. Don't invent data models; leave unclear contract points as open decisions for a human to approve.
5. Starting a feature — branch on whether an active plan exists:
   - **Plan exists** (`docs/exec-plans/active/<feature>.md`) → go straight to `/impl <be|fe>`.
   - **No plan** → `/plan` → human approves the API Contract → `/issue` → commit the plan on a work branch, push, open `/pr` **before implementing** (so the shared contract lets BE/FE work in parallel) → `/impl`.
   Then `/review` (detect drift) → `/complete`. A plan reaches `docs/exec-plans/completed/` only when API impl / UI impl / API integration are all done — the pre-commit gate enforces this. See [docs/exec-plans/README.md](docs/exec-plans/README.md).

## Codex Workflows

- Codex workflow equivalents live in `.codex/plugins/todam-workflows/skills/`.
- In Codex, use `skill-*` names for Claude command equivalents: `skill-plan`, `skill-impl`, `skill-review`, `skill-complete`, `skill-summary-daily`, `skill-commit`, `skill-issue`, and `skill-pr`.
- When the user asks for `/plan`, `/impl`, `/review`, `/complete`, `/summary-daily`, `/commit`, `/issue`, or `/pr` in Codex, map it to the matching `skill-*` workflow and record logs through `.codex/scripts/logger.mjs`.
- When using Codex subagents for those workflows, log requested/completed events with `.codex/scripts/subagent-log.mjs`.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
