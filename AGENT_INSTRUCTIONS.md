# AI News Hub — Agent Instructions

> **Read this file BEFORE starting any work.** This contains the rules all AI agents must follow.

## Quick Start for Agents

```bash
# 1. Check your assignment
cat PROJECT_TRACKER.md  # Find your assigned branch and task

# 2. Read your implementation plan
cat IMPLEMENTATION_PLANS.md  # Find your section

# 3. Create/checkout your branch
git checkout develop
git pull origin develop
git checkout -b feature/phase0-[your-task]

# 4. Do your work following the plan EXACTLY

# 5. Update PROJECT_TRACKER.md with your progress

# 6. Push your branch
git push -u origin feature/phase0-[your-task]
```

---

## Agent Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                     BEFORE STARTING                          │
├─────────────────────────────────────────────────────────────┤
│ 1. Read PROJECT_TRACKER.md — find your assignment           │
│ 2. Read IMPLEMENTATION_PLANS.md — find your detailed plan   │
│ 3. Verify no file conflicts with other agent scopes         │
│ 4. Update tracker: mark your task as 🔄 In Progress         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     WHILE WORKING                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Follow the plan step-by-step (don't skip verification)  │
│ 2. Only modify files in YOUR scope                          │
│ 3. Commit frequently with clear messages                    │
│ 4. Run tests after each significant change                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     WHEN COMPLETE                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Run all tests in your scope                              │
│ 2. Update PROJECT_TRACKER.md — add progress log entry       │
│ 3. Mark your task as ✅ Complete                            │
│ 4. Push your branch                                         │
│ 5. Report summary to orchestrator                           │
└─────────────────────────────────────────────────────────────┘
```

---

## The Golden Rules

### Rule 1: Stay In Your Lane

**✅ DO:**
- Only modify files listed in YOUR task scope
- Create new files only if specified in your plan
- Ask orchestrator if you need to modify shared files

**❌ DON'T:**
- Modify files assigned to other agents
- Create files outside your scope
- Refactor unrelated code "while you're at it"

### Rule 2: Follow The Plan Exactly

**✅ DO:**
- Execute each step in order
- Run verification commands as specified
- Commit at the specified moments

**❌ DON'T:**
- Skip verification steps
- Combine multiple tasks into one
- "Improve" the plan without asking

### Rule 3: Communicate Through The Tracker

**✅ DO:**
- Update your status when starting
- Log blockers immediately
- Add progress entries with timestamps

**❌ DON'T:**
- Work silently without updates
- Wait to report blockers
- Assume others know your status

### Rule 4: Test Before Completing

**✅ DO:**
- Run tests for code you wrote
- Verify your changes work locally
- Check for lint errors

**❌ DON'T:**
- Mark complete without testing
- Assume CI will catch issues
- Push code that doesn't build

---

## File Organization

```
AI News Station/
├── PROJECT_TRACKER.md       # 📊 Central status (check first)
├── IMPLEMENTATION_PLANS.md  # 📋 Detailed plans per phase
├── AGENT_INSTRUCTIONS.md    # 📖 This file (rules for agents)
├── AI_News_Hub_RPD_v2.2.md  # 📄 Original PRD (reference only)
│
└── [project files]          # Created during development
    ├── src/
    ├── supabase/
    ├── .github/
    └── ...
```

---

## Branch Naming Convention

| Pattern | Example | Used For |
|---------|---------|----------|
| `feature/phase0-infrastructure` | Phase 0 infrastructure | Feature work |
| `feature/phase1-news-fetch` | Phase 1 news fetching | Feature work |
| `fix/phase0-database-index` | Fix database indexing | Bug fixes |
| `docs/update-readme` | Update README | Documentation |

---

## Commit Message Format

```
type(scope): description

Examples:
feat(database): add articles table with search vector
fix(components): handle SafeImage onError correctly
chore(ci): add GitHub Actions deploy workflow
docs(schema): add database documentation
test(utils): add sanitization unit tests
```

---

## When You're Blocked

### If you encounter an issue:

1. **Stop immediately** — don't try to work around it
2. **Document the blocker** in PROJECT_TRACKER.md:
   ```markdown
   ### YYYY-MM-DD HH:MM — Agent [ID] — Branch: [branch]
   **Status:** 🚫 Blocked
   **Summary:** [What you were trying to do]
   **Issue:** [Exact error or problem]
   **Tried:** [What you attempted]
   **Need:** [What you need to proceed]
   ```
3. **Wait for orchestrator** to provide guidance

### Common blockers and solutions:

| Issue | Solution |
|-------|----------|
| File conflict with another agent | Wait for them or ask orchestrator to reassign |
| Missing dependency | Check if another task should complete first |
| Unclear requirement | Ask orchestrator, don't guess |
| Tests failing unexpectedly | Document and report, don't skip tests |

---

## Handoff Protocol

When your task is complete, provide this summary:

```markdown
## Task Complete: [Task Name]

**Branch:** `feature/phase0-[name]`
**Commits:** [number] commits

### What was done:
- [List of completed items]

### Files created/modified:
- `path/to/file1.ts` — [description]
- `path/to/file2.ts` — [description]

### Tests:
- [X] All tests passing
- [X] No lint errors
- [X] Builds successfully

### Verification output:
```
[paste test output]
```

### Notes for merge:
- [Any special considerations]
- [Dependencies on other branches]

### Ready for merge: ✅ Yes / ❌ No (reason)
```

---

## Skills to Use (from vibe-cortex)

| Skill | When to Use |
|-------|-------------|
| `executing-plans` | Following implementation plans |
| `test-driven-development` | Writing tests first |
| `verification-before-completion` | Final checks before marking done |
| `finishing-a-development-branch` | Preparing branch for merge |

---

## Environment Variables

All agents must use these exact names:

```env
# Database (CRITICAL: Use port 6543 Transaction Pooler!)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Supabase Client
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_KEY=[service-role-key]

# Job Security
CRON_SECRET=[generate-a-secret]

# LLM APIs
GEMINI_API_KEY=[key]
GROQ_API_KEY=[key]
```

---

## Emergency Procedures

### If you accidentally modify wrong files:
```bash
git checkout -- path/to/wrong/file
# or
git stash  # to save your work temporarily
```

### If you commit to wrong branch:
```bash
git log --oneline -5  # find commit hash
git checkout correct-branch
git cherry-pick [commit-hash]
git checkout wrong-branch
git reset --hard HEAD~1
```

### If tests fail after your changes:
1. **Stop** — don't push broken code
2. **Identify** — which test is failing
3. **Fix** — or revert if unsure
4. **Report** — if you can't resolve

---

*Last Updated: 2026-02-06*
