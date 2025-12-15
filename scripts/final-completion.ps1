# ================================================
# COMPREHENSIVE SECURITY & COMPLETION SCRIPT
# Fixes: Authorization, Transforms, Type Safety
# ================================================

Write-Host "`n=== IAMMJOSSS FINAL COMPLETION SCRIPT ===" -ForegroundColor Cyan
Write-Host "Target: 100% Secure + Working Workflow`n" -ForegroundColor Yellow

$apiPath = "c:/Users/Nugroho Anjar Abidin/Pictures/Screenshots/ojsclonenextjs/iammJOSSS/app/api"
$routeFiles = Get-ChildItem -Path $apiPath -Filter "route.ts" -Recurse

$statsFixed = 0
$statsSkipped = 0
$statsErrors = 0

Write-Host "Found $($routeFiles.Count) route files to process`n" -ForegroundColor White

foreach ($file in $routeFiles) {
    $relativePath = $file.FullName.Replace($apiPath, "").TrimStart('\')
    
    try {
        $content = Get-Content -Path $file.FullName -Raw
        $modified = $false
        $changes = @()
        
        # FIX 1: Add transformFromDB import if missing
        if (($content -match 'NextResponse\.json') -and ($content -notmatch 'transformFromDB')) {
            if ($content -match '(import.*from.*\n)+') {
                $content = $content -replace '(import.*from.*\@/lib/utils/logger["\'];?\s*\n)', "`$1import { transformFromDB } from '@/lib/utils/transform'`n"
                $changes += "Added transform import"
                $modified = $true
            }
        }
        
        # FIX 2: Security - Fix user.role to user.roles array
        if ($content -match 'user\?\.role\s*\|\|') {
            $content = $content -replace 'user\?\.role\s*\|\|\s*[''"]author[''"]', 'user?.roles || []'
            $content = $content -replace 'userRole\s*!==\s*[''"]admin[''"]', '!userRoles.includes(''admin'')'
            $content = $content -replace 'userRole\s*!==\s*[''"]editor[''"]', '!userRoles.includes(''editor'')'
            $content = $content -replace 'userRole\s*!==\s*[''"]manager[''"]', '!userRoles.includes(''manager'')'
            $changes += "Fixed role security"
            $modified = $true
        }
        
        # FIX 3: Transform responses - Simple pattern
        # Pattern: return NextResponse.json(variableName)
        if ($content -match 'return\s+NextResponse\.json\(([a-zA-Z_][a-zA-Z0-9_]*)\)' -and $content -notmatch '//\s*transformed') {
            $content = $content -replace '(\s+)return\s+NextResponse\.json\(([a-zA-Z_][a-zA-Z0-9_]*)\)(?!\s*\/\/)', "`$1const transformed = transformFromDB(`$2); return NextResponse.json(transformed) // transformed"
            $changes += "Added transform"
            $modified = $true
        }
        
        if ($modified) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "[FIXED] $relativePath" -ForegroundColor Green
            if ($changes.Count -gt 0) {
                Write-Host "        Changes: $($changes -join ', ')" -ForegroundColor Gray
            }
            $statsFixed++
        } else {
            $statsSkipped++
        }
        
    } catch {
        Write-Host "[ERROR] $relativePath - $($_.Exception.Message)" -ForegroundColor Red
        $statsErrors++
    }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Fixed:   $statsFixed" -ForegroundColor Green
Write-Host "Skipped: $statsSkipped" -ForegroundColor Yellow  
Write-Host "Errors:  $statsErrors" -ForegroundColor Red
Write-Host "Total:   $($routeFiles.Count)" -ForegroundColor White
Write-Host "`nTesting recommended:
1. Login as Author - should see ONLY own submissions
2. Login as Editor - should see ALL submissions
3. Test workflow end-to-end
" -ForegroundColor Cyan
