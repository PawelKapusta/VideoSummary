# CI/CD Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_PROJECT_NAME=ytinsights
E2E_USERNAME=test@example.com
E2E_PASSWORD=testpassword123
E2E_USERNAME_ID=uuid-here
```

### Step 2: Create Production Environment

1. Go to **Settings → Environments → New environment**
2. Name: `production`
3. Add protection rules:
   - ✅ **Required reviewers:** Add yourself
   - ✅ **Wait timer:** 0 minutes (optional: add delay)
4. Add environment secrets (same as repository secrets)

### Step 3: Configure Branch Protection

1. Go to **Settings → Branches → Add rule**
2. Branch name pattern: `main`
3. Enable:
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - Select required checks:
     - `Test PR / lint`
     - `Test PR / typecheck`
     - `Test PR / unit-tests`
   - ✅ **Require conversation resolution before merging**

### Step 4: Enable Tests

Uncomment test jobs in `.github/workflows/tests.yml`:

```yaml
# Remove the comment markers from:
# - lint job
# - typecheck job
# - unit-tests job
# - e2e-tests job (when ready)
```

### Step 5: Test the Setup

```bash
# 1. Create test branch
git checkout -b test-ci-cd
echo "# Test" >> README.md
git add README.md
git commit -m "test: CI/CD setup"
git push origin test-ci-cd

# 2. Open PR on GitHub
# Verify:
# - ci.yml runs (fast tests only)
# - preview.yml deploys preview
# - PR comment shows preview URL

# 3. Merge PR
# Verify:
# - ci.yml runs (full tests with E2E)
# - Deployment tag created (deploy-YYYYMMDD-*)

# 4. Deploy to production
# Go to Actions → Deploy to Production → Run workflow
# Enter the deployment tag
# Approve deployment
# Verify deployment succeeds
```

---

## 📖 Daily Usage

### Creating a Pull Request

```bash
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature
```

**What happens:**
1. ✅ Fast tests run (lint, typecheck, unit)
2. ✅ Preview deployment created
3. ✅ PR comment shows preview URL
4. ✅ Test in preview environment
5. ✅ Get review and merge

### Merging to Main

```bash
# After PR approval
git checkout main
git pull origin main
```

**What happens:**
1. ✅ Full test suite runs (including E2E)
2. ✅ Deployment tag created: `deploy-20260130-143022-abc1234`
3. ✅ Ready for production deployment

### Deploying to Production

1. Go to **Actions → Deploy to Production**
2. Click **Run workflow**
3. Enter deployment tag: `deploy-20260130-143022-abc1234`
4. Leave "Skip tests" unchecked (or check if confident)
5. Click **Run workflow**
6. Wait for approval notification
7. Click **Review deployments → Approve**
8. ✅ Deployment completes

### Rolling Back

1. Find previous deployment tag:
   ```bash
   git tag -l "deploy-*" | tail -5
   ```

2. Go to **Actions → Deploy to Production**
3. Click **Run workflow**
4. Enter old deployment tag: `deploy-20260129-120000-xyz`
5. ✅ Check "Skip tests" (already passed)
6. Click **Run workflow**
7. Approve deployment
8. ✅ Rollback completes

---

## 🔍 Monitoring

### Check Test Status

**For PRs:**
- Go to PR → Checks tab
- View test results

**For main branch:**
- Go to Actions → CI
- View latest run

### Check Deployment History

**Deployment tags:**
```bash
git tag -l "deploy-*"
```

**Release tags:**
```bash
git tag -l "release-*"
```

**On GitHub:**
- Go to Actions → Deploy to Production
- View all deployment runs

### View Preview Deployments

**In PR:**
- Check PR comments for preview URL

**On Cloudflare:**
- Go to Cloudflare Pages dashboard
- View all deployments

---

## ⚠️ Troubleshooting

### Tests Fail on PR

**Problem:** Fast tests fail (lint, typecheck, unit)

**Solution:**
```bash
# Run locally
npm run lint
npm run typecheck
npm run test

# Fix issues
git add .
git commit -m "fix: resolve test failures"
git push
```

### Tests Pass on PR but Fail on Main

**Problem:** E2E tests fail after merge

**Solution:**
1. Check E2E test logs in Actions
2. Fix issues in new PR
3. Merge fix
4. Wait for new deployment tag

### Deployment Tag Not Created

**Problem:** No `deploy-*` tag after merge

**Solution:**
1. Check if tests passed on main
2. View Actions → CI → Latest run
3. If tests failed, fix and push again

### Preview Deployment Fails

**Problem:** Preview not created for PR

**Solution:**
1. Check Actions → Preview Deployment
2. View error logs
3. Common issues:
   - Cloudflare quota exceeded (500/month)
   - Invalid Cloudflare secrets
   - Build errors

### Deployment Fails

**Problem:** Production deployment fails

**Solution:**
1. Check Actions → Deploy to Production
2. View error logs
3. Common issues:
   - Build errors (check build logs)
   - Cloudflare API errors (check secrets)
   - Environment not approved

### Rollback Doesn't Work

**Problem:** Can't deploy old tag

**Solution:**
1. Verify tag exists:
   ```bash
   git tag -l "deploy-*" | grep <tag-name>
   ```

2. If tag doesn't exist locally:
   ```bash
   git fetch --tags
   ```

3. If tag doesn't exist remotely:
   - Can't rollback to that commit
   - Deploy current main instead

---

## 🎯 Best Practices

### ✅ DO

- **Use preview deployments** - Test before merging
- **Deploy from deployment tags** - They've passed all tests
- **Review deployment logs** - Check for warnings
- **Keep deployment tags** - Needed for rollback
- **Test locally first** - Run tests before pushing
- **Write good commit messages** - Helps with debugging

### ❌ DON'T

- **Don't push directly to main** - Always use PRs
- **Don't skip tests** - Unless using deployment tag
- **Don't delete deployment tags** - Breaks rollback
- **Don't deploy without approval** - Use environment protection
- **Don't ignore failing tests** - Fix them immediately

---

## 📊 Workflow Cheat Sheet

| Action | Workflow | Trigger | Tests | Deploy |
|--------|----------|---------|-------|--------|
| Open PR | `ci.yml` + `preview.yml` | Automatic | Fast only | Preview |
| Push to main | `ci.yml` | Automatic | Full (E2E) | No |
| Deploy prod | `deploy.yml` | Manual | Optional | Yes |
| Rollback | `deploy.yml` | Manual | Skip | Yes |
| Run tests | `tests.yml` | Manual | Configurable | No |

---

## 🆘 Getting Help

### Check Documentation
- [README.md](./README.md) - Full documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture details

### View Workflow Files
- [tests.yml](./tests.yml) - Test workflow
- [ci.yml](./ci.yml) - CI workflow
- [deploy.yml](./deploy.yml) - Deployment workflow
- [preview.yml](./preview.yml) - Preview workflow

### Common Commands

```bash
# List all workflows
ls -la .github/workflows/

# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# List deployment tags
git tag -l "deploy-*" | tail -10

# List release tags
git tag -l "release-*" | tail -10

# Trigger workflow manually
gh workflow run deploy.yml -f git_ref=deploy-20260130-143022-abc1234

# View workflow logs
gh run view --log
```

---

## 🎓 Next Steps

1. ✅ Complete 5-minute setup
2. ✅ Test with dummy PR
3. ✅ Deploy to production once
4. ✅ Practice rollback
5. ✅ Share with team
6. ✅ Document any custom processes

**You're ready to go! 🚀**
