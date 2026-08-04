[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [switch]$Yes
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-RequiredCommand {
    param(
        [Parameter(Mandatory)]
        [string[]]$Names,
        [Parameter(Mandatory)]
        [string]$InstallHint
    )

    foreach ($name in $Names) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($command) {
            return $command.Source
        }
    }

    throw "Required command not found: $($Names -join ' or '). $InstallHint"
}

function Invoke-ExternalStep {
    param(
        [Parameter(Mandatory)]
        [string]$Title,
        [Parameter(Mandatory)]
        [string]$Command,
        [Parameter(Mandatory)]
        [string[]]$Arguments
    )

    Write-Host "`n==> $Title" -ForegroundColor Cyan
    if (-not $PSCmdlet.ShouldProcess($Title, "$Command $($Arguments -join ' ')")) {
        return
    }

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Title failed with exit code $LASTEXITCODE."
    }
}

$node = Get-RequiredCommand -Names @('node.exe', 'node') -InstallHint 'Install Node.js 20 or newer from https://nodejs.org/.'
$npx = Get-RequiredCommand -Names @('npx.cmd', 'npx') -InstallHint 'Install Node.js 20 or newer from https://nodejs.org/.'
$claude = Get-RequiredCommand -Names @('claude.exe', 'claude.cmd', 'claude') -InstallHint 'Install Claude Code first: https://docs.anthropic.com/en/docs/claude-code/setup.'

$nodeVersionText = (& $node --version).Trim().TrimStart('v')
$nodeMajor = [int]($nodeVersionText.Split('.')[0])
if ($nodeMajor -lt 20) {
    throw "Node.js 20 or newer is required. Found version $nodeVersionText."
}

Write-Host 'Claude Skills Toolkit' -ForegroundColor Green
Write-Host "Node.js: $nodeVersionText"
Write-Host 'This installs tools globally for the current user.'
Write-Host 'Privacy notice: Claude Mem stores local session observations, and Task Observer writes workflow observations for review.' -ForegroundColor Yellow

if (-not $Yes -and -not $WhatIfPreference) {
    $answer = Read-Host 'Continue with all five official tools? Type YES to continue'
    if ($answer -cne 'YES') {
        Write-Host 'Installation cancelled. No toolkit commands were run.'
        exit 0
    }
}

Invoke-ExternalStep -Title 'Install Find Skills' -Command $npx -Arguments @(
    '-y', 'skills', 'add', 'vercel-labs/skills',
    '--skill', 'find-skills', '--agent', 'claude-code',
    '--global', '--yes', '--copy'
)

Invoke-ExternalStep -Title 'Install Task Observer' -Command $npx -Arguments @(
    '-y', 'skills', 'add', 'rebelytics/one-skill-to-rule-them-all',
    '--skill', 'task-observer', '--agent', 'claude-code',
    '--global', '--yes', '--copy'
)

Invoke-ExternalStep -Title 'Install Superpowers' -Command $claude -Arguments @(
    'plugin', 'install', 'superpowers@claude-plugins-official',
    '--scope', 'user'
)

Invoke-ExternalStep -Title 'Install Claude Mem' -Command $npx -Arguments @(
    '-y', 'claude-mem', 'install'
)

Invoke-ExternalStep -Title 'Install Impeccable' -Command $npx -Arguments @(
    '-y', 'impeccable', 'install',
    '--providers=claude', '--scope=global'
)

Write-Host "`nInstallation complete." -ForegroundColor Green
Write-Host 'Restart Claude Code, then run /impeccable init in frontend projects.'
Write-Host 'For reliable Task Observer activation, copy the instruction from CLAUDE_TASK_OBSERVER.md into your project CLAUDE.md.'

