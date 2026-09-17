param (
    [string]$GitHubToken = $env:GITHUB_TOKEN,
    [string]$Tag = "v1.0.0",
    [string]$Title = "MonoReciept v1.0.0 — Kiosk Android Release"
)

$ErrorActionPreference = "Stop"
$RepoOwner = "burikethhh"
$RepoName = "MonoReciept"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MonoReciept Release Publisher: $Tag" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 1. Check Git & Push
Write-Host "`n[1/4] Pushing code & tags to GitHub ($RepoOwner/$RepoName)..." -ForegroundColor Yellow
try {
    & "C:\Program Files\Git\bin\git.exe" push origin main --tags
    Write-Host "✓ Successfully pushed main branch and tags ($Tag)!" -ForegroundColor Green
} catch {
    Write-Warning "Git push failed or required authentication: $_"
    Write-Host "Please ensure you have authenticated with git or run 'git push origin main --tags' in an interactive terminal." -ForegroundColor DarkYellow
}

# 2. Locate built APK
Write-Host "`n[2/4] Locating APK..." -ForegroundColor Yellow
$ReleaseApk = Join-Path $ProjectRoot "android\app\build\outputs\apk\release\app-release.apk"
$DebugApk = Join-Path $ProjectRoot "android\app\build\outputs\apk\debug\app-debug.apk"

$TargetApk = $null
if (Test-Path $ReleaseApk) {
    $TargetApk = $ReleaseApk
    Write-Host "✓ Found Release APK: $ReleaseApk" -ForegroundColor Green
} elseif (Test-Path $DebugApk) {
    $TargetApk = $DebugApk
    Write-Host "✓ Found Debug APK: $DebugApk" -ForegroundColor Green
} else {
    Write-Host "No pre-built APK found. Building release APK with gradlew..." -ForegroundColor Yellow
    $nodeDir = "C:\Users\ketha\AppData\Local\Temp\opencode\nodejs\node-v20.19.0-win-x64"
    $jdk = "C:\Users\ketha\AppData\Local\Temp\opencode\jdk17\jdk-17.0.20.1+1"
    $sdk = "C:\Users\ketha\AppData\Local\Android\Sdk"
    $env:JAVA_HOME = $jdk
    $env:ANDROID_HOME = $sdk
    $env:ANDROID_SDK_ROOT = $sdk
    $env:Path = "$nodeDir;$jdk\bin;$sdk\cmdline-tools\latest\bin;$sdk\platform-tools;" + $env:Path
    
    & ".\android\gradlew.bat" -p android assembleRelease --console=plain
    if (Test-Path $ReleaseApk) {
        $TargetApk = $ReleaseApk
    } elseif (Test-Path $DebugApk) {
        $TargetApk = $DebugApk
    } else {
        throw "Build finished but APK was not found at $ReleaseApk"
    }
}

# Copy APK to convenient root output
$DestApk = Join-Path $ProjectRoot "MonoReciept-$Tag.apk"
Copy-Item $TargetApk $DestApk -Force
Write-Host "✓ Copied release APK to: $DestApk" -ForegroundColor Green

# 3. Release Notes Body
$ReleaseBody = @"
# MonoReciept $Tag

**MonoReciept** is a Bare React Native Android kiosk photobooth designed for Android tablets and paired with the MXW01 thermal mini-printer over BLE.

### Features
- **Camera & Viewfinder**: VisionCamera integration with front/back camera support, 384px-locked receipt aspect ratio mask, animated 3-2-1 countdown, and shutter flash.
- **Image Processing & Dither Engine**: Live Floyd-Steinberg error diffusion dithering, pure-JS tone adjustments (brightness & contrast sliders), and instant 1-bit monochrome BMP preview.
- **MXW01 BLE Stack**:
  - Automatic GATT discovery (`0xAE30` / `0xAF30`)
  - V5X HMAC-SHA256 handshake engine (`CryptoUtils.ts`)
  - Real-time battery telemetry via `0xAE02` notifications
  - Auto-reconnect on boot using MMKV storage
- **Kiosk Settings & Print Sheet**:
  - PIN-gated (default: `1234`) operator dashboard
  - Burn density & copy count controls
  - One-tap diagnostic self-test print
  - Immersive full-screen mode & `react-native-keep-awake`

### Installation
Download `MonoReciept-$Tag.apk` below and install directly onto your Android tablet:
```bash
adb install -r MonoReciept-$Tag.apk
```
"@

# 4. Publish via GitHub API or Web Fallback
Write-Host "`n[3/4] Publishing GitHub Release..." -ForegroundColor Yellow

if (-not $GitHubToken) {
    Write-Host "No GitHub Personal Access Token provided." -ForegroundColor Yellow
    $TokenInput = Read-Host "Enter GitHub Personal Access Token (or press Enter to create release via browser)"
    if ($TokenInput) {
        $GitHubToken = $TokenInput.Trim()
    }
}

if ($GitHubToken) {
    Write-Host "Creating release via GitHub REST API..." -ForegroundColor Cyan
    $Headers = @{
        "Authorization" = "Bearer $GitHubToken"
        "Accept"        = "application/vnd.github.v3+json"
        "User-Agent"    = "MonoReciept-Release-Script"
    }

    $ReleasePayload = @{
        tag_name         = $Tag
        target_commitish = "main"
        name             = $Title
        body             = $ReleaseBody
        draft            = $false
        prerelease       = $false
    } | ConvertTo-Json

    try {
        $CreateResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$RepoOwner/$RepoName/releases" -Method Post -Headers $Headers -Body $ReleasePayload -ContentType "application/json"
        $UploadUrl = $CreateResponse.upload_url -replace '\{\?name,label\}', "?name=MonoReciept-$Tag.apk"
        $ReleaseHtmlUrl = $CreateResponse.html_url
        Write-Host "✓ Release created: $ReleaseHtmlUrl" -ForegroundColor Green

        Write-Host "`n[4/4] Uploading APK asset..." -ForegroundColor Yellow
        $UploadHeaders = @{
            "Authorization"  = "Bearer $GitHubToken"
            "Content-Type"   = "application/vnd.android.package-archive"
            "User-Agent"     = "MonoReciept-Release-Script"
        }
        $UploadResponse = Invoke-RestMethod -Uri $UploadUrl -Method Post -Headers $UploadHeaders -InFile $DestApk
        Write-Host "✓ Successfully uploaded APK: $($UploadResponse.browser_download_url)" -ForegroundColor Green
        Write-Host "`n================================================" -ForegroundColor Green
        Write-Host "  RELEASE COMPLETE! $ReleaseHtmlUrl" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Green
        Start-Process $ReleaseHtmlUrl
    } catch {
        Write-Warning "Failed to publish via GitHub API: $_"
        Write-Host "Falling back to web release interface..." -ForegroundColor Yellow
        Start-Process "https://github.com/$RepoOwner/$RepoName/releases/new?tag=$Tag&title=$([Uri]::EscapeDataString($Title))"
    }
} else {
    Write-Host "`n[4/4] Opening GitHub Release creation page in browser..." -ForegroundColor Cyan
    Write-Host "Instructions:" -ForegroundColor Yellow
    Write-Host "1. Tag: $Tag"
    Write-Host "2. Title: $Title"
    Write-Host "3. Drag and drop the APK file: $DestApk"
    Write-Host "4. Paste release notes from release-notes.md"
    
    # Save notes to file for easy copy
    $NotesPath = Join-Path $ProjectRoot "RELEASE_NOTES.md"
    Set-Content -Path $NotesPath -Value $ReleaseBody
    Write-Host "Release notes saved to: $NotesPath" -ForegroundColor Green

    Start-Process "https://github.com/$RepoOwner/$RepoName/releases/new?tag=$Tag&title=$([Uri]::EscapeDataString($Title))"
}
