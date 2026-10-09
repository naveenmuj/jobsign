# JobSign Production Release Build Script
# Builds Google Play Android App Bundle (.aab) and standalone APK

$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "🚀 STARTING JOBSIGN PRODUCTION RELEASE BUILD PIPELINE" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Check Prerequisites
Write-Host "`n👉 [1/4] Verifying Build Environment..." -ForegroundColor Yellow
cmd.exe /c "java -version"

if (-not (Test-Path "$env:LOCALAPPDATA\Android\Sdk") -and -not (Test-Path "C:\Android\Sdk")) {
    Write-Error "Android SDK not found in standard paths!"
    exit 1
}
Write-Host "Android SDK: Found" -ForegroundColor Green

# 2. Run Test Suite
Write-Host "`n👉 [2/4] Executing Production Test Suite..." -ForegroundColor Yellow
node scripts/run_production_tests.mjs
if ($LASTEXITCODE -ne 0) {
    Write-Error "Test suite failed! Aborting release build."
    exit 1
}

# 3. Type Checking
Write-Host "`n👉 [3/4] Running TypeScript Type Check..." -ForegroundColor Yellow
Push-Location mobile_app
npx.cmd tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Error "TypeScript check failed! Aborting release build."
    exit 1
}
Pop-Location
Write-Host "TypeScript check: 0 errors" -ForegroundColor Green

# 4. Execute Gradle Release Build
Write-Host "`n👉 [4/4] Building Android Production App Bundle (.aab)..." -ForegroundColor Yellow
Push-Location mobile_app\android
.\gradlew.bat bundleRelease --no-daemon
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Error "Gradle bundleRelease failed!"
    exit 1
}
Pop-Location

$aabPath = "mobile_app\android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aabPath) {
    $aabSize = (Get-Item $aabPath).Length / 1MB
    Write-Host "`n====================================================" -ForegroundColor Green
    Write-Host "🎉 PRODUCTION APP BUNDLE BUILT SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "Output: $aabPath" -ForegroundColor White
    Write-Host "Size:   $([math]::Round($aabSize, 2)) MB" -ForegroundColor White
    Write-Host "====================================================" -ForegroundColor Green
} else {
    Write-Warning "Bundle completed, check mobile_app/android/app/build/outputs/bundle/release"
}
