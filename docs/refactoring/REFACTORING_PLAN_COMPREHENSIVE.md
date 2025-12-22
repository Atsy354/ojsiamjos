# 🏗️ REFACTORING PLAN - OJS 3.3 PROJECT

**Tanggal**: 21 Desember 2025  
**Tujuan**: Membersihkan, merapikan, dan mempersiapkan project untuk production deployment

---

## 📊 FASE 1: CLEANUP ROOT DIRECTORY

### Actions:
1. ✅ Pindahkan `FINAL_REFACTORING_AUDIT_REPORT.md` → `docs/refactoring/`
2. ✅ Pindahkan `REFACTORING_REPORT.md` → `docs/refactoring/`
3. ✅ Pindahkan `test-email-config.js` → `scripts/testing/`
4. ✅ Pindahkan `refactor-cleanup.ps1` → `scripts/maintenance/`
5. ✅ Hapus `types_db.ts` (tidak terpakai)
6. ✅ Hapus `.refactoring-backup-20251221-002000/` (backup lama)

### Expected Result:
```
Root directory hanya berisi:
- app/
- components/
- lib/
- public/
- docs/
- migrations/
- scripts/
- hooks/
- styles/
- prisma/
- Config files (.env, package.json, tsconfig.json, dll)
```

---

## 📚 FASE 2: REORGANISASI DOKUMENTASI

### Current Structure (Messy):
```
docs/
├── AUDIT_*.md (3 files)
├── FIX_*.md (8 files)
├── FEATURE_*.md (2 files)
├── IMPLEMENTATION_*.md (3 files)
├── PROGRESS_*.md (1 file)
├── OJS_*.md (2 files)
├── TESTING_*.md (1 file)
├── TROUBLESHOOTING_*.md (1 file)
├── audits/ (2 files)
├── bugfixes/ (8 files)
├── completion/ (6 files)
├── guides/ (3 files)
├── implementation/ (3 files)
├── refactoring/ (4 files)
├── security/ (1 file)
├── setup/ (5 files)
└── workflow/ (empty?)
```

### Target Structure (Clean):
```
docs/
├── README.md (index of all docs)
├── audits/
│   ├── backend-workflow-complete.md
│   ├── post-publication-ojs33.md
│   └── migration-audit.md
├── features/
│   ├── reviewer-accept-decline.md
│   ├── email-notifications.md
│   ├── revision-deadline.md
│   └── review-ratings.md
├── bugfixes/
│   ├── author-approval-visibility.md
│   ├── final-copyedit-validation.md
│   ├── publish-fk-constraint.md
│   ├── publish-now.md
│   ├── send-to-author-validation.md
│   ├── submit-review-error.md
│   └── table-not-found.md
├── implementation/
│   ├── 100-percent-compliance.md
│   ├── public-access.md
│   └── production-workflow.md
├── guides/
│   ├── testing-workflow.md
│   ├── troubleshooting-email.md
│   └── editorial-workflow-quick-reference.md
├── refactoring/
│   ├── refactoring-plan.md (this file)
│   ├── refactoring-report.md
│   └── final-audit-report.md
├── setup/
│   ├── installation.md
│   ├── database-setup.md
│   └── environment-variables.md
└── completion/
    ├── ojs33-publication-complete.md
    ├── implementation-status.md
    └── final-implementation-summary.md
```

### Actions:
1. ✅ Buat `docs/features/` folder
2. ✅ Pindahkan `FEATURE_*.md` → `docs/features/`
3. ✅ Pindahkan `AUDIT_*.md` → `docs/audits/`
4. ✅ Pindahkan `FIX_*.md` → `docs/bugfixes/`
5. ✅ Pindahkan `IMPLEMENTATION_*.md` → `docs/implementation/`
6. ✅ Pindahkan `TESTING_*.md` → `docs/guides/`
7. ✅ Pindahkan `TROUBLESHOOTING_*.md` → `docs/guides/`
8. ✅ Pindahkan `OJS_*.md` → `docs/completion/`
9. ✅ Rename files untuk consistency (lowercase, hyphens)
10. ✅ Buat `docs/README.md` sebagai index

---

## 🗂️ FASE 3: CLEANUP APP DIRECTORY

### Issues:
```
❌ app/debug-auth/ - Debug route (hapus di production)
❌ app/sidebar-test/ - Test route (hapus di production)
❌ app/globals-fixes.css - Merge ke globals.css
❌ app/landing.tsx - Pindah ke components/pages/
```

### Actions:
1. ✅ Hapus `app/debug-auth/`
2. ✅ Hapus `app/sidebar-test/`
3. ✅ Merge `app/globals-fixes.css` → `app/globals.css`
4. ✅ Pindahkan `app/landing.tsx` → `components/pages/landing-page.tsx`
5. ✅ Update import references

---

## 📜 FASE 4: CLEANUP SCRIPTS DIRECTORY

### Current State:
- 43 files (terlalu banyak, banyak yang obsolete)

### Actions:
1. ✅ Audit semua scripts
2. ✅ Hapus scripts yang tidak terpakai
3. ✅ Reorganisasi:
   ```
   scripts/
   ├── database/
   │   ├── seed.ts
   │   ├── migrate.ts
   │   └── backup.ts
   ├── testing/
   │   ├── test-email-config.js
   │   └── test-workflow.ts
   ├── maintenance/
   │   ├── cleanup.ps1
   │   └── reset-dev-db.ts
   └── deployment/
       ├── build-check.ts
       └── pre-deploy.ts
   ```

---

## 🔧 FASE 5: CODE REFACTORING

### 5.1 Standardize Naming Convention

**Current Issues**:
- Mixed snake_case and camelCase
- Inconsistent file naming

**Actions**:
1. ✅ Standardize all TypeScript files: `kebab-case.ts`
2. ✅ Standardize all components: `PascalCase.tsx`
3. ✅ Standardize all API routes: `route.ts` (Next.js convention)

### 5.2 Extract Business Logic

**Current**: Business logic mixed dengan UI components

**Target Structure**:
```
lib/
├── api/
│   └── client.ts (API client utilities)
├── workflow/
│   ├── submission.ts (Submission workflow logic)
│   ├── review.ts (Review workflow logic)
│   ├── copyediting.ts (Copyediting workflow logic)
│   └── production.ts (Production workflow logic)
├── services/
│   ├── email-service.ts
│   ├── file-service.ts
│   └── notification-service.ts
├── repositories/
│   ├── submission-repository.ts
│   ├── review-repository.ts
│   └── user-repository.ts
└── utils/
    ├── date-utils.ts
    ├── validation.ts
    └── formatting.ts
```

### 5.3 Remove Hardcoded Values

**Actions**:
1. ✅ Extract all constants → `lib/constants/`
2. ✅ Extract all config → `lib/config/`
3. ✅ Use environment variables for sensitive data

---

## 🚀 FASE 6: VERCEL DEPLOYMENT PREPARATION

### 6.1 File Upload Strategy

**Issue**: Vercel tidak support filesystem writes

**Solution**:
1. ✅ Implement Supabase Storage untuk file uploads
2. ✅ Update semua file upload endpoints
3. ✅ Add fallback untuk development (local storage)

### 6.2 Environment Variables

**Actions**:
1. ✅ Audit semua env vars
2. ✅ Buat `.env.example` dengan dokumentasi
3. ✅ Pastikan tidak ada hardcoded secrets

### 6.3 Build Configuration

**Actions**:
1. ✅ Test `npm run build` locally
2. ✅ Fix all build errors
3. ✅ Optimize bundle size
4. ✅ Add `vercel.json` configuration

### 6.4 Database Connection

**Actions**:
1. ✅ Ensure Supabase connection pooling
2. ✅ Add connection retry logic
3. ✅ Test dengan Vercel environment

---

## ✅ FASE 7: TESTING & VALIDATION

### 7.1 Build Test
```bash
npm run build
```
Expected: ✅ No errors

### 7.2 Lint Test
```bash
npm run lint
```
Expected: ✅ No critical errors

### 7.3 Type Check
```bash
npx tsc --noEmit
```
Expected: ✅ No type errors

### 7.4 Local Production Test
```bash
npm run build && npm start
```
Expected: ✅ App runs correctly

---

## 📊 SUCCESS CRITERIA

### Refactoring Complete When:
- [ ] Root directory clean (max 20 items)
- [ ] Docs organized by category
- [ ] No debug/test routes in production
- [ ] All hardcoded values extracted
- [ ] Business logic separated from UI
- [ ] Build passes without errors
- [ ] Ready for Vercel deployment

### Deployment Ready When:
- [ ] No filesystem dependencies
- [ ] All env vars documented
- [ ] Supabase Storage integrated
- [ ] Build size optimized
- [ ] `vercel.json` configured
- [ ] Database connection tested

### Workflow Validated When:
- [ ] Submission → Review → Copyediting → Production → Publish
- [ ] All email notifications working
- [ ] File uploads working (Supabase Storage)
- [ ] Role-based access working
- [ ] OJS 3.3 compliance verified

---

## 📅 TIMELINE

**Estimasi**: 4-6 jam

1. **Fase 1-2**: Cleanup & Reorganisasi (1 jam)
2. **Fase 3-4**: App & Scripts Cleanup (1 jam)
3. **Fase 5**: Code Refactoring (2 jam)
4. **Fase 6**: Vercel Preparation (1 jam)
5. **Fase 7**: Testing & Validation (1 jam)

---

## 🎯 NEXT STEPS

Setelah refactoring plan ini disetujui:
1. Execute Fase 1-2 (Cleanup)
2. Execute Fase 3-4 (App reorganization)
3. Execute Fase 5 (Code refactoring)
4. Execute Fase 6 (Vercel prep)
5. Execute Fase 7 (Testing)
6. Audit workflow OJS 3.3
7. Deploy to Vercel

---

**Status**: 📝 PLAN READY - Awaiting Execution
