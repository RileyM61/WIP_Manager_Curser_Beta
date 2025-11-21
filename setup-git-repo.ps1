param(
    [string]$RemoteUrl = "",
    [string]$DefaultBranch = "main",
    [switch]$SkipCommit
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 3

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    $output = git @Args 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Args -join ' ') failed.`n$output"
    }
    return $output
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git is not installed or not on PATH."
}

Set-Location -Path $PSScriptRoot
Write-Host "== WIP Manager standalone repo setup ==" -ForegroundColor Cyan

if (-not (Test-Path ".git")) {
    Write-Host "Initializing new Git repository in $PSScriptRoot" -ForegroundColor Yellow
    Invoke-Git init
} else {
    Write-Host ".git already exists here. Using existing repo." -ForegroundColor Yellow
}

$currentBranch = ""
try {
    $currentBranch = (Invoke-Git symbolic-ref --short HEAD).Trim()
} catch {
    $currentBranch = ""
}

if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    Write-Host "No branch detected yet; a commit will create '$DefaultBranch'." -ForegroundColor Yellow
} elseif ($currentBranch -ne $DefaultBranch) {
    Write-Host "Renaming branch '$currentBranch' -> '$DefaultBranch'." -ForegroundColor Yellow
    Invoke-Git branch -M $DefaultBranch
}

if (-not $SkipCommit) {
    $status = (Invoke-Git status --short)
    if (-not [string]::IsNullOrWhiteSpace($status)) {
        Write-Host "Staging project files (respecting .gitignore)..." -ForegroundColor Yellow
        Invoke-Git add .
        Write-Host "Creating initial commit..." -ForegroundColor Yellow
        Invoke-Git commit -m "Initial deployable snapshot"
    } else {
        Write-Host "Nothing to commit. Pass -SkipCommit if this is intentional." -ForegroundColor Yellow
    }
} else {
    Write-Host "SkipCommit flag set. Repository initialized without commit." -ForegroundColor Yellow
}

if (-not [string]::IsNullOrWhiteSpace($RemoteUrl)) {
    $remoteExists = $false
    try {
        Invoke-Git remote get-url origin | Out-Null
        $remoteExists = $true
    } catch {
        $remoteExists = $false
    }
    if ($remoteExists) {
        Write-Host "Updating existing 'origin' remote." -ForegroundColor Yellow
        Invoke-Git remote set-url origin $RemoteUrl
    } else {
        Write-Host "Adding 'origin' remote -> $RemoteUrl" -ForegroundColor Yellow
        Invoke-Git remote add origin $RemoteUrl
    }
}

Write-Host "`nRepository setup complete!" -ForegroundColor Green
if (-not [string]::IsNullOrWhiteSpace($RemoteUrl)) {
    Write-Host "Next push command:" -ForegroundColor Cyan
    Write-Host "  git push -u origin $DefaultBranch" -ForegroundColor White
} else {
    Write-Host "Reminder: add a remote when ready, e.g.:" -ForegroundColor Cyan
    Write-Host "  git remote add origin https://github.com/<org>/<repo>.git" -ForegroundColor White
    Write-Host "  git push -u origin $DefaultBranch" -ForegroundColor White
}
Write-Host "`nTip: rerun this script with -RemoteUrl and/or -SkipCommit as needed." -ForegroundColor Gray