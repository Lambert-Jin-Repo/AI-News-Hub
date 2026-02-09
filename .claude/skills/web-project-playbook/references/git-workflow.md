# Git Workflow Reference

## Branching Strategy

### Three-Tier Model

```
main          (production — always deployable)
  └── develop   (integration — merge features here)
        ├── feature/phase1-data-layer
        ├── feature/phase2-auth
        └── feature/fix-pagination-bug
```

### Branch Rules

| Branch | Push directly? | Delete after merge? | Force push? |
|--------|---------------|--------------------|----|
| `main` | Never | N/A | Never |
| `develop` | Never | N/A | Never |
| `feature/*` | Yes | Yes | Only before PR |

### Simplified Two-Tier (Small Teams / Solo)

For solo or small team projects, `main` <- `feature/*` is acceptable. Use `develop` when multiple features are in flight simultaneously or when you need a staging environment.

## Commit Conventions

### Prefix Format

```
<type>(<scope>): <description>

<optional body>

Co-Authored-By: Name <email>
```

### Types

| Type | When to use |
|------|------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `test` | Adding or updating tests |
| `ci` | CI/CD pipeline changes |
| `docs` | Documentation only |
| `chore` | Dependencies, config, cleanup |
| `refactor` | Code change that doesn't add features or fix bugs |
| `perf` | Performance improvement |

### Scope Examples

```
feat(db): add category column to articles
feat(api): add cursor pagination to news endpoint
feat(home): render structured digest sections
fix(tts): handle missing credentials gracefully
test(summariser): add relevance filtering tests
ci(deploy): add Cloud Run health check probe
chore(deps): upgrade next to 16.1.6
```

### Rules

1. **One logical change per commit.** If you're writing "and" in the message, split it.
2. **Imperative mood.** "Add pagination" not "Added pagination" or "Adds pagination".
3. **No period at the end** of the subject line.
4. **Body for context**, not a diff summary. Explain *why*, not *what*.

## Merge Procedures

### Feature -> Develop

```bash
git checkout develop
git merge feature/phase1-data-layer --no-ff -m "Merge Phase 1: Data Layer"
npm test          # Verify on develop
```

`--no-ff` preserves the merge commit so the feature branch history is visible in the graph.

### Develop -> Main

```bash
git checkout main
git merge develop --no-ff -m "Merge develop into main: Phase 1 complete"
npm run build     # Full verification
npm run lint
npm test
```

### Post-Merge Cleanup

```bash
git branch -d feature/phase1-data-layer    # Delete local
git push origin --delete feature/phase1-data-layer  # Delete remote (if pushed)
```

## Handling Common Scenarios

### Merge Conflicts in package-lock.json

Never manually edit the lockfile. Instead:

```bash
# Accept either version, then regenerate
git checkout --theirs package-lock.json
npm install
git add package-lock.json
git commit
```

### Work Landed on Wrong Branch

```bash
git stash --include-untracked
git checkout correct-branch
git stash pop
```

### Amending After Pre-Commit Hook Failure

**Never amend after a hook failure.** The failed commit didn't happen, so `--amend` would modify the *previous* commit. Instead:

```bash
# Fix the issue
git add <fixed-files>
git commit -m "feat: the same message"    # NEW commit, not --amend
```

### Interactive Rebase Before PR

Only on feature branches that haven't been shared:

```bash
git rebase -i develop
# Squash fixup commits, reword messages
git push --force-with-lease origin feature/my-branch
```

## Tag Strategy (Optional)

For projects that need versioned releases:

```bash
git tag -a v1.0.0 -m "Phase 1 release"
git push origin v1.0.0
```

Use `v<phase>.<iteration>.<patch>` if phases map to versions.
