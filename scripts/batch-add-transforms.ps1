# Batch Add transformFromDB to ALL API Routes
# This script adds the transform import and wraps responses

$routesPath = "c:/Users/Nugroho Anjar Abidin/Pictures/Screenshots/ojsclonenextjs/iammJOSSS/app/api"
$transformImport = 'import { transformFromDB } from "@/lib/utils/transform"'

# Get all route.ts files
$routeFiles = Get-ChildItem -Path $routesPath -Filter "route.ts" -Recurse

Write-Host "Found $($routeFiles.Count) route files" -ForegroundColor Cyan

$fixed = 0
$skipped = 0
$errors = 0

foreach ($file in $routeFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw
        
        # Skip if already has transform
        if ($content -match 'transformFromDB') {
            Write-Host "SKIP: $($file.Name) - already has transform" -ForegroundColor Yellow
            $skipped++
            continue
        }
        
        # Skip if no NextResponse.json
        if ($content -notmatch 'NextResponse\.json') {
            Write-Host "SKIP: $($file.Name) - no NextResponse.json" -ForegroundColor Gray
            $skipped++
            continue
        }
        
        $modified = $false
        
        # Add import after last import
        if ($content -match '(import.*from.*\n)+') {
            $lastImportEnd = $Matches[0].Length
            $before = $content.Substring(0, $lastImportEnd)
            $after = $content.Substring($lastImportEnd)
            
            if ($before -notmatch 'transform') {
                $content = $before + $transformImport + "`n" + $after
                $modified = $true
            }
        }
        
        # Transform simple patterns: return NextResponse.json(data)
        # Pattern 1: return NextResponse.json(variable)
        $content = $content -replace 'return NextResponse\.json\(([a-zA-Z_][a-zA-Z0-9_]*)\)(?!\s*\/\/\s*transformed)', 'const transformed = transformFromDB($1); return NextResponse.json(transformed)'
        
        # Pattern 2: return NextResponse.json(variable, { status: ... })
        $content = $content -replace 'return NextResponse\.json\(([a-zA-Z_][a-zA-Z0-9_]*),\s*\{\s*status:', 'const transformed = transformFromDB($1); return NextResponse.json(transformed, { status:'
        
        if ($modified -or ($content -ne (Get-Content -Path $file.FullName -Raw))) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "FIXED: $($file.Name)" -ForegroundColor Green
            $fixed++
        }
    }
    catch {
        Write-Host "ERROR: $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Fixed: $fixed" -ForegroundColor Green
Write-Host "Skipped: $skipped" -ForegroundColor Yellow
Write-Host "Errors: $errors" -ForegroundColor Red
Write-Host "Total: $($routeFiles.Count)" -ForegroundColor White
