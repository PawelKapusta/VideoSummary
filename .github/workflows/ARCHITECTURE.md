# CI/CD Architecture

## 🏗️ Architecture Diagram

```mermaid
graph TB
    subgraph "Developer Actions"
        PR[Create Pull Request]
        PUSH[Push to main]
        DEPLOY_BTN[Click Deploy Button]
    end

    subgraph "Automated Workflows"
        CI[ci.yml<br/>Continuous Integration]
        PREVIEW[preview.yml<br/>Preview Deployment]
        TESTS[tests.yml<br/>Reusable Tests]
    end

    subgraph "Manual Workflows"
        DEPLOY[deploy.yml<br/>Production Deployment]
    end

    subgraph "Test Jobs"
        LINT[Lint]
        TYPE[Typecheck]
        UNIT[Unit Tests]
        E2E[E2E Tests]
    end

    subgraph "Deployment"
        BUILD[Build]
        CF[Cloudflare Pages]
    end

    subgraph "Artifacts"
        TAG[Deployment Tag<br/>deploy-YYYYMMDD-*]
        RELEASE[Release Tag<br/>release-YYYYMMDD-*]
    end

    PR --> PREVIEW
    PR --> CI
    PUSH --> CI
    
    CI --> TESTS
    PREVIEW --> BUILD
    DEPLOY --> TESTS
    
    TESTS --> LINT
    TESTS --> TYPE
    TESTS --> UNIT
    TESTS --> E2E
    
    LINT --> E2E
    TYPE --> E2E
    UNIT --> E2E
    
    E2E --> TAG
    TAG --> DEPLOY_BTN
    DEPLOY_BTN --> DEPLOY
    
    DEPLOY --> BUILD
    BUILD --> CF
    CF --> RELEASE

    style PR fill:#e1f5ff
    style PUSH fill:#e1f5ff
    style DEPLOY_BTN fill:#ffe1e1
    style TAG fill:#e1ffe1
    style RELEASE fill:#ffe1ff
    style CF fill:#ffd700
```

## 🔄 Workflow Flow

### 1. Pull Request Flow
```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant CI as ci.yml
    participant Preview as preview.yml
    participant Tests as tests.yml
    participant CF as Cloudflare

    Dev->>GH: Create/Update PR
    GH->>CI: Trigger (pull_request)
    GH->>Preview: Trigger (pull_request)
    
    par Fast Tests
        CI->>Tests: Call with run_e2e=false
        Tests->>Tests: Lint
        Tests->>Tests: Typecheck
        Tests->>Tests: Unit Tests
        Tests-->>CI: ✅ Tests passed
    and Preview Build
        Preview->>Preview: Build app
        Preview->>CF: Deploy preview
        CF-->>Preview: Preview URL
        Preview->>GH: Comment with URL
    end
    
    CI-->>Dev: ✅ PR ready to merge
```

### 2. Main Branch Flow (After Merge)
```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant CI as ci.yml
    participant Tests as tests.yml

    Dev->>GH: Merge PR to main
    GH->>CI: Trigger (push)
    CI->>Tests: Call with run_e2e=true
    
    Tests->>Tests: Lint
    Tests->>Tests: Typecheck
    Tests->>Tests: Unit Tests
    Tests->>Tests: E2E Tests (4 projects)
    Tests-->>CI: ✅ All tests passed
    
    CI->>GH: Create deployment tag
    Note over GH: deploy-20260130-143022-abc1234
    CI-->>Dev: ✅ Ready for deployment
```

### 3. Production Deployment Flow
```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant Deploy as deploy.yml
    participant Tests as tests.yml
    participant CF as Cloudflare

    Dev->>GH: Trigger deploy.yml
    Note over Dev: Input: deploy-20260130-143022-abc1234
    
    Deploy->>Deploy: Validate deployment tag
    
    alt Is deployment tag
        Deploy->>Deploy: Skip tests (already passed)
    else Not deployment tag
        Deploy->>Tests: Run full test suite
        Tests-->>Deploy: ✅ Tests passed
    end
    
    Deploy->>Deploy: Build application
    Deploy->>CF: Deploy to production
    CF-->>Deploy: Deployment URL
    
    Deploy->>GH: Create release tag
    Note over GH: release-20260130-143500
    Deploy-->>Dev: ✅ Deployed successfully
```

### 4. Rollback Flow
```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant Deploy as deploy.yml
    participant CF as Cloudflare

    Dev->>GH: Find previous deployment tag
    Note over Dev: deploy-20260129-120000-xyz
    
    Dev->>GH: Trigger deploy.yml
    Note over Dev: Input: deploy-20260129-120000-xyz<br/>skip_tests: true
    
    Deploy->>Deploy: Validate (is deployment tag ✅)
    Deploy->>Deploy: Skip tests
    Deploy->>Deploy: Build from old commit
    Deploy->>CF: Deploy to production
    CF-->>Deploy: Deployment URL
    
    Deploy->>GH: Create release tag
    Note over GH: release-20260130-150000
    Deploy-->>Dev: ✅ Rollback successful
```

## 🎯 Key Design Decisions

### 1. **Reusable Test Workflow**
**Decision:** Extract tests into separate `tests.yml` workflow

**Pros:**
- ✅ DRY principle - single source of truth for tests
- ✅ Easy to maintain and update test logic
- ✅ Can be called from multiple workflows
- ✅ Can be triggered manually for debugging

**Cons:**
- ❌ Slightly more complex workflow structure
- ❌ Requires understanding of `workflow_call`

**Verdict:** ✅ Worth it for maintainability

---

### 2. **E2E Tests Only on Main**
**Decision:** Skip E2E tests on PRs, run only on main

**Pros:**
- ✅ Fast feedback on PRs (< 2 min vs 15+ min)
- ✅ Saves GitHub Actions minutes
- ✅ Reduces flakiness impact on PRs
- ✅ Main branch is still fully tested

**Cons:**
- ❌ E2E bugs discovered after merge
- ❌ Might need to revert broken commits

**Mitigation:**
- Preview deployments allow manual testing
- Can trigger `tests.yml` manually with E2E before merge if needed

**Verdict:** ✅ Standard practice in industry

---

### 3. **Deployment Tags**
**Decision:** Auto-create `deploy-*` tags after tests pass on main

**Pros:**
- ✅ Clear marker of tested commits
- ✅ Easy rollback (just deploy old tag)
- ✅ Deployment history in git tags
- ✅ Can deploy any tested commit, not just latest

**Cons:**
- ❌ Creates many tags over time
- ❌ Requires tag cleanup strategy

**Mitigation:**
- Tags are lightweight (just pointers)
- Can clean up old tags periodically (keep last 50)

**Verdict:** ✅ Elegant solution for deployment tracking

---

### 4. **Manual Deployment Only**
**Decision:** No auto-deploy to production, only `workflow_dispatch`

**Pros:**
- ✅ Control over when to deploy
- ✅ Can batch multiple commits
- ✅ Can schedule deployments
- ✅ Requires explicit approval

**Cons:**
- ❌ Extra manual step
- ❌ Slower time-to-production

**Verdict:** ✅ Right choice for production apps

---

### 5. **Preview Deployments**
**Decision:** Auto-deploy every PR to Cloudflare Pages preview

**Pros:**
- ✅ Test in production-like environment
- ✅ Share with stakeholders
- ✅ Visual QA before merge
- ✅ Free on Cloudflare (500 builds/month)

**Cons:**
- ❌ Uses build quota
- ❌ Exposes preview URLs (not behind auth)

**Mitigation:**
- Preview URLs are random/hard to guess
- Can add basic auth if needed

**Verdict:** ✅ Huge productivity boost

---

### 6. **Build Artifacts Retention**
**Decision:** Keep build artifacts for 7 days, test reports for 3 days

**Pros:**
- ✅ Can debug recent deployments
- ✅ Saves storage costs
- ✅ Enough time for investigation

**Cons:**
- ❌ Can't debug very old deployments

**Verdict:** ✅ Good balance

---

## 🔒 Security Considerations

### Secrets Management
- ✅ All secrets stored in GitHub Secrets (encrypted)
- ✅ Production secrets in `production` environment
- ✅ Testing secrets in `testing` environment
- ✅ Preview deployments use production secrets (read-only operations)

### Branch Protection
- ✅ Main branch protected (requires PR + tests)
- ✅ Can't push directly to main
- ✅ Requires status checks to pass

### Environment Protection
- ✅ Production requires manual approval
- ✅ Can add wait timer (e.g., 5 min cooldown)
- ✅ Can restrict to specific users/teams

### Deployment Safety
- ✅ Tests must pass before deployment
- ✅ Build must succeed before deploy
- ✅ Can rollback quickly if issues found

