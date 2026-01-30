# CI/CD Workflows Documentation

## 📋 Overview

This project uses a modular CI/CD architecture with separate workflows for testing, continuous integration, deployment, and previews.

## 🔄 Workflows

### 1. `tests.yml` - Reusable Test Workflow
**Purpose:** Centralized testing logic used by other workflows

**Triggers:**
- `workflow_call` - Called by other workflows
- `workflow_dispatch` - Manual execution

**Jobs:**
- `lint` - ESLint code quality checks
- `typecheck` - TypeScript type checking
- `unit-tests` - Vitest unit tests
- `e2e-tests` - Playwright E2E tests (optional, controlled by `run_e2e` input)

**Inputs:**
- `run_e2e` (boolean) - Whether to run E2E tests (default: false)
- `git_ref` (string) - Git reference to test (commit SHA, tag, or branch)

---

### 2. `ci.yml` - Continuous Integration
**Purpose:** Automated testing on every push and PR

**Triggers:**
- `push` to `main` branch
- `pull_request` to `main` branch

**Behavior:**
- **On PR:** Runs fast tests only (lint, typecheck, unit tests) - no E2E
- **On main:** Runs full test suite including E2E tests
- **On main (after tests pass):** Creates deployment tag `deploy-YYYYMMDD-HHMMSS-{sha}`

**Why deployment tags?**
- Tags mark commits that passed all tests
- Easy to identify safe-to-deploy commits
- Enables rollback by redeploying previous tags
- Provides deployment history

---

### 3. `deploy.yml` - Production Deployment
**Purpose:** Manual deployment to production

**Triggers:**
- `workflow_dispatch` (manual only)

**Inputs:**
- `git_ref` (string, required) - Git reference to deploy
  - Use deployment tags (`deploy-*`) for tested commits
  - Can use any commit SHA, tag, or branch
- `skip_tests` (boolean) - Skip tests if using deployment tag (default: false)

**Jobs:**
1. `validate` - Checks if git_ref is a deployment tag
2. `test` - Runs full test suite (skipped if deployment tag + skip_tests=true)
3. `build` - Builds the application
4. `deploy` - Deploys to Cloudflare Pages

**Environment Protection:**
- Requires `production` environment approval (configure in GitHub Settings)
- Creates release tag `release-YYYYMMDD-HHMMSS` after successful deployment

**Rollback Strategy:**
1. Go to Actions → Deploy to Production
2. Click "Run workflow"
3. Enter previous deployment tag (e.g., `deploy-20260130-143022-abc1234`)
4. Check "Skip tests" (tests already passed for that tag)
5. Approve deployment

---

### 4. `preview.yml` - Preview Deployments
**Purpose:** Automatic preview deployments for pull requests

**Triggers:**
- `pull_request` to `main` (opened, synchronize, reopened)

**Behavior:**
- Builds and deploys PR to Cloudflare Pages preview environment
- Creates unique URL: `https://pr-{number}.{project}.pages.dev`
- Posts preview URL as PR comment
- Automatically updates on new commits

**Benefits:**
- Test changes in production-like environment
- Share preview with team/stakeholders
- No manual deployment needed
- Free on Cloudflare Pages (500 builds/month)

---

## 🚀 Deployment Workflow

### Normal Flow (Recommended)
```
1. Create PR → preview.yml deploys preview
2. Review & test preview
3. Merge to main → ci.yml runs full tests
4. Tests pass → ci.yml creates deployment tag
5. Go to Actions → Run deploy.yml workflow
6. Enter deployment tag → Deploy to production
```

### Hotfix Flow
```
1. Fix bug on main
2. Push to main → ci.yml runs tests
3. Tests pass → deployment tag created
4. Run deploy.yml with new tag
```

### Rollback Flow
```
1. Find previous deployment tag (e.g., deploy-20260130-120000-xyz)
2. Run deploy.yml with that tag
3. Check "Skip tests" (already passed)
4. Approve deployment
```

---

## 🏷️ Tag Conventions

- `deploy-YYYYMMDD-HHMMSS-{sha}` - Deployment candidate (passed all tests)
- `release-YYYYMMDD-HHMMSS` - Production release (successfully deployed)

**Example:**
```
deploy-20260130-143022-abc1234  ← Created by ci.yml after tests pass
release-20260130-143500         ← Created by deploy.yml after deployment
```

---

## 🔒 Required GitHub Secrets

### Supabase
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (admin)

### Cloudflare Pages
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Pages permissions
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_PROJECT_NAME` - Cloudflare Pages project name

### E2E Testing
- `E2E_USERNAME` - Test user email
- `E2E_PASSWORD` - Test user password
- `E2E_USERNAME_ID` - Test user UUID

---

## 🛠️ GitHub Settings Configuration

### Branch Protection Rules (main)
1. Go to Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select required checks:
     - `Test PR / lint`
     - `Test PR / typecheck`
     - `Test PR / unit-tests`
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings

### Environment Protection (production)
1. Go to Settings → Environments → New environment
2. Name: `production`
3. Enable:
   - ✅ Required reviewers (add yourself or team)
   - ✅ Wait timer: 0 minutes (or add delay if needed)
4. Add environment secrets (same as repository secrets)

### Environment for Testing (optional)
1. Go to Settings → Environments → New environment
2. Name: `testing`
3. Add testing-specific secrets if different from production

---

## 📊 Monitoring & Debugging

### Check Test Results
- Go to Actions → CI workflow
- Click on latest run
- View job logs for failures

### Check Deployment Status
- Go to Actions → Deploy to Production
- View deployment history
- Check Cloudflare Pages dashboard

### View Preview Deployments
- Check PR comments for preview URLs
- Go to Cloudflare Pages → Deployments

### Find Deployment Tags
```bash
# List all deployment tags
git tag -l "deploy-*"

# List all release tags
git tag -l "release-*"

# Show tag details
git show deploy-20260130-143022-abc1234
```

---

## 🎯 Best Practices

1. **Always deploy from deployment tags** - They've passed all tests
2. **Use preview deployments** - Test before merging to main
3. **Keep deployment tags** - Don't delete them (needed for rollback)
4. **Monitor CI runs** - Fix failing tests immediately
5. **Use environment protection** - Require approval for production deployments
6. **Document deployments** - Add notes in GitHub releases

---

## 🔧 Troubleshooting

### Tests fail on main but passed on PR
- E2E tests only run on main, not on PRs
- Check E2E test logs in ci.yml workflow

### Deployment tag not created
- Tests must pass on main branch
- Check ci.yml workflow logs

### Preview deployment fails
- Check Cloudflare Pages quota (500 builds/month)
- Verify Cloudflare secrets are correct

### Rollback doesn't work
- Ensure deployment tag exists: `git tag -l "deploy-*"`
- Check if tag was pushed to remote: `git ls-remote --tags origin`

---

## 📝 Future Improvements

- [ ] Add smoke tests after deployment
- [ ] Implement blue-green deployments
- [ ] Add deployment notifications (Slack/Discord)
- [ ] Automated rollback on error rate spike
- [ ] Performance budgets in CI
- [ ] Visual regression testing
