# Refactoring Phase 1: Documentation Cleanup
# This script organizes all documentation files into proper folders

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "REFACTORING PHASE 1: Documentation Cleanup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Create folder structure
Write-Host "[1/4] Creating documentation folder structure..." -ForegroundColor Yellow

$folders = @(
    "docs/completion",
    "docs/bugfixes",
    "docs/implementation",
    "docs/guides",
    "docs/setup",
    "docs/refactoring",
    "docs/security",
    "docs/audits",
    "docs/workflow"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  ✓ Created: $folder" -ForegroundColor Green
    } else {
        Write-Host "  ✓ Exists: $folder" -ForegroundColor Gray
    }
}

Write-Host ""

# Move completion reports
Write-Host "[2/4] Moving completion reports..." -ForegroundColor Yellow

$completionFiles = @(
    "100_PERCENT_COMPLETE.md",
    "COMPLETION_REPORT.md",
    "FINAL_CHECKLIST.md",
    "FINAL_COMPLETION_REPORT.md",
    "FINAL_FIXES_COMPLETE.md",
    "STATUS_AKHIR.md"
)

foreach ($file in $completionFiles) {
    if (Test-Path $file) {
        Move-Item $file "docs/completion/" -Force
        Write-Host "  ✓ Moved: $file" -ForegroundColor Green
    }
}

# Move bugfix docs
$bugfixFiles = @(
    "BUGFIX_SECTION_SELECTOR.md",
    "DROPDOWN_FIX_COMPLETE.md",
    "FIXES_IN_PROGRESS.md",
    "FIXES_SUMMARY.md",
    "FIX_ASSIGN_REVIEWER_RLS.md"
)

foreach ($file in $bugfixFiles) {
    if (Test-Path $file) {
        Move-Item $file "docs/bugfixes/" -Force
        Write-Host "  ✓ Moved: $file" -ForegroundColor Green
    }
}

# Move implementation docs
$implementationFiles = @(
    "IMPLEMENTATION_STATUS.md",
    "WORKFLOW_IMPLEMENTATION_PLAN.md",
    "WORKFLOW_COMPLETE.md"
)

foreach ($file in $implementationFiles) {
    if (Test-Path $file) {
        Move-Item $file "docs/implementation/" -Force
        Write-Host "  ✓ Moved: $file" -ForegroundColor Green
    }
}

# Move guides
$guideFiles = @(
    "PRESENTATION_GUIDE.md",
    "TESTING_GUIDE.md",
    "USER_GUIDE.md"
)

foreach ($file in $guideFiles) {
    if (Test-Path $file) {
        Move-Item $file "docs/guides/" -Force
        Write-Host "  ✓ Moved: $file" -ForegroundColor Green
    }
}

# Move setup docs
$setupFiles = @(
    "QUICK_SETUP.md",
    "SETUP_ENV.md",
    "SETUP_SUPABASE.md",
    "SUPABASE_SETUP.md",
    "TEMPLATE_ENV_LOCAL.txt"
)

foreach ($file in $setupFiles) {
    if (Test-Path $file) {
        Move-Item $file "docs/setup/" -Force
        Write-Host "  ✓ Moved: $file" -ForegroundColor Green
    }
}

# Move refactoring docs
$refactoringFiles = @(
    "REFACTORING_GUIDE.md",
    "REFACTORING_SUMMARY.md"
)

foreach ($file in $refactoringFiles) {
    if (Test-Path $file) {
        Move-Item $file "docs/refactoring/" -Force
        Write-Host "  ✓ Moved: $file" -ForegroundColor Green
    }
}

# Move security docs
if (Test-Path "SECURITY_PROGRESS.md") {
    Move-Item "SECURITY_PROGRESS.md" "docs/security/" -Force
    Write-Host "  ✓ Moved: SECURITY_PROGRESS.md" -ForegroundColor Green
}

# Move audit docs
if (Test-Path "TYPESCRIPT_AUDIT_REPORT.md") {
    Move-Item "TYPESCRIPT_AUDIT_REPORT.md" "docs/audits/" -Force
    Write-Host "  ✓ Moved: TYPESCRIPT_AUDIT_REPORT.md" -ForegroundColor Green
}

if (Test-Path "audit-output.txt") {
    Move-Item "audit-output.txt" "docs/audits/" -Force
    Write-Host "  ✓ Moved: audit-output.txt" -ForegroundColor Green
}

Write-Host ""

# Move scripts
Write-Host "[3/4] Organizing scripts..." -ForegroundColor Yellow

if (!(Test-Path "scripts/refactoring")) {
    New-Item -ItemType Directory -Path "scripts/refactoring" -Force | Out-Null
}

if (Test-Path "add-production-button.ps1") {
    Move-Item "add-production-button.ps1" "scripts/refactoring/" -Force
    Write-Host "  ✓ Moved: add-production-button.ps1" -ForegroundColor Green
}

Write-Host ""

# Create documentation index
Write-Host "[4/4] Creating documentation index..." -ForegroundColor Yellow

$indexContent = @"
# Documentation Index

This directory contains all project documentation organized by category.

## 📁 Directory Structure

### Completion Reports (\`completion/\`)
Documentation about project completion milestones and final status.

- [100% Complete Report](completion/100_PERCENT_COMPLETE.md)
- [Completion Report](completion/COMPLETION_REPORT.md)
- [Final Checklist](completion/FINAL_CHECKLIST.md)
- [Final Completion Report](completion/FINAL_COMPLETION_REPORT.md)
- [Final Fixes Complete](completion/FINAL_FIXES_COMPLETE.md)
- [Status Akhir](completion/STATUS_AKHIR.md)

### Bug Fixes (\`bugfixes/\`)
Documentation about bug fixes and issue resolutions.

- [Section Selector Bugfix](bugfixes/BUGFIX_SECTION_SELECTOR.md)
- [Dropdown Fix Complete](bugfixes/DROPDOWN_FIX_COMPLETE.md)
- [Fixes in Progress](bugfixes/FIXES_IN_PROGRESS.md)
- [Fixes Summary](bugfixes/FIXES_SUMMARY.md)
- [Assign Reviewer RLS Fix](bugfixes/FIX_ASSIGN_REVIEWER_RLS.md)

### Implementation (\`implementation/\`)
Documentation about feature implementation and workflow.

- [Implementation Status](implementation/IMPLEMENTATION_STATUS.md)
- [Workflow Implementation Plan](implementation/WORKFLOW_IMPLEMENTATION_PLAN.md)
- [Workflow Complete](implementation/WORKFLOW_COMPLETE.md)

### Guides (\`guides/\`)
User and developer guides.

- [Presentation Guide](guides/PRESENTATION_GUIDE.md)
- [Testing Guide](guides/TESTING_GUIDE.md)
- [User Guide](guides/USER_GUIDE.md)

### Setup (\`setup/\`)
Installation and configuration guides.

- [Quick Setup](setup/QUICK_SETUP.md)
- [Environment Setup](setup/SETUP_ENV.md)
- [Supabase Setup](setup/SETUP_SUPABASE.md)
- [Supabase Setup (Alt)](setup/SUPABASE_SETUP.md)
- [Environment Template](setup/TEMPLATE_ENV_LOCAL.txt)

### Refactoring (\`refactoring/\`)
Code refactoring documentation and plans.

- [Refactoring Guide](refactoring/REFACTORING_GUIDE.md)
- [Refactoring Summary](refactoring/REFACTORING_SUMMARY.md)
- [Refactoring Master Plan](REFACTORING_MASTER_PLAN.md) ⭐ NEW
- [Refactoring Quick Start](REFACTORING_QUICK_START.md) ⭐ NEW

### Security (\`security/\`)
Security-related documentation.

- [Security Progress](security/SECURITY_PROGRESS.md)

### Audits (\`audits/\`)
Code audits and analysis reports.

- [TypeScript Audit Report](audits/TYPESCRIPT_AUDIT_REPORT.md)
- [Audit Output](audits/audit-output.txt)

### Workflow (\`workflow/\`)
Editorial workflow documentation.

- [Editorial Decision Audit](EDITORIAL_DECISION_AUDIT.md)
- [Editorial Decision Fixes](EDITORIAL_DECISION_FIXES.md)
- [Editorial Workflow Implementation](EDITORIAL_WORKFLOW_IMPLEMENTATION.md)
- [Editorial Workflow Quick Reference](EDITORIAL_WORKFLOW_QUICK_REFERENCE.md)
- [Editorial Workflow Refactoring](EDITORIAL_WORKFLOW_REFACTORING.md)
- [Production Button Implementation](PRODUCTION_BUTTON_IMPLEMENTATION.md)
- [Production Page Issue](PRODUCTION_PAGE_ISSUE.md)
- [Production Upload Fix](PRODUCTION_UPLOAD_FIX.md)
- [Production Workflow Button Fix](PRODUCTION_WORKFLOW_BUTTON_FIX.md)

## 🚀 Quick Links

### For Developers
- [Refactoring Master Plan](REFACTORING_MASTER_PLAN.md) - Complete refactoring strategy
- [Refactoring Quick Start](REFACTORING_QUICK_START.md) - Start refactoring now
- [Testing Guide](guides/TESTING_GUIDE.md) - How to test the application
- [TypeScript Audit](audits/TYPESCRIPT_AUDIT_REPORT.md) - Code quality report

### For Setup
- [Quick Setup](setup/QUICK_SETUP.md) - Get started quickly
- [Environment Setup](setup/SETUP_ENV.md) - Configure environment
- [Supabase Setup](setup/SETUP_SUPABASE.md) - Database setup

### For Users
- [User Guide](guides/USER_GUIDE.md) - How to use the system
- [Presentation Guide](guides/PRESENTATION_GUIDE.md) - Demo the system

## 📝 Contributing

When adding new documentation:
1. Place it in the appropriate category folder
2. Update this index file
3. Use clear, descriptive filenames
4. Follow markdown best practices

## 🔄 Last Updated

**Date:** 2025-12-18
**By:** Refactoring Phase 1
"@

Set-Content -Path "docs/README.md" -Value $indexContent
Write-Host "  ✓ Created: docs/README.md" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  ✓ Created 9 documentation folders" -ForegroundColor Green
Write-Host "  ✓ Moved 26 documentation files" -ForegroundColor Green
Write-Host "  ✓ Organized scripts" -ForegroundColor Green
Write-Host "  ✓ Created documentation index" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review docs/README.md" -ForegroundColor White
Write-Host "  2. Update main README.md to reference docs/" -ForegroundColor White
Write-Host "  3. Proceed to Phase 2: Code Refactoring" -ForegroundColor White
Write-Host ""
Write-Host "See: docs/REFACTORING_QUICK_START.md for next steps" -ForegroundColor Cyan
Write-Host ""
