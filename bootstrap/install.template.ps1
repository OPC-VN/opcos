#requires -Version 5.1
<#
  OpcOS installer TEMPLATE -- run once per machine (after adapting to your setup).

  What it does:
    1. Registers this repo as a local plugin marketplace for tools that support one
       (Claude Code, Codex CLI) and installs your plugins.
    2. Junction-links skills into tools that have NO marketplace mechanism.
    3. Clones any path-bound vendored toolkits.
    4. Deploys the governance rules to every tool via a data-driven adapter table.
    5. Checks for the optional knowledge layer.

  Contains NO secrets. Each machine supplies API keys / tokens via env vars or a
  secret store -- never in this repo.

  Uses $env:USERPROFILE so paths resolve per machine (never hardcode a username).

  Encoding note: keep this script ASCII-only, or save as UTF-8 WITH BOM --
  Windows PowerShell 5.1 silently misparses BOM-less UTF-8 under legacy codepages.
#>
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$U        = $env:USERPROFILE
Write-Host "OpcOS repo: $RepoRoot" -ForegroundColor Cyan

# -- 1. Claude Code: local marketplace + plugin install (native) --------------
if (Get-Command claude -ErrorAction SilentlyContinue) {
    Write-Host "[claude] add marketplace + install plugins..." -ForegroundColor Green
    # Local clone path. Swap in 'your-org/your-opcos-fork' for a git-hosted
    # marketplace (lets `claude plugin marketplace update` pull from the remote).
    claude plugin marketplace add "$RepoRoot"
    claude plugin install your-company-skills@opcos
    # Add more plugin installs here, one line each:
    # claude plugin install review-pack@opcos
} else {
    Write-Warning "claude CLI not on PATH -- skipping Claude step."
}

# -- 2. Codex CLI: marketplace + plugins (native, separate manifest) ----------
if (Get-Command codex -ErrorAction SilentlyContinue) {
    Write-Host "[codex] add marketplace + install plugins..." -ForegroundColor Green
    codex plugin marketplace add "$RepoRoot"
    codex plugin add your-company-skills@opcos
    # codex plugin add review-pack@opcos
} else {
    Write-Warning "codex CLI not on PATH -- skipping Codex step."
}

# -- 3. Tools WITHOUT a marketplace: junction skills into their skills dir ----
# A junction is a directory pointer: edit the source in this repo and the tool
# sees the change immediately -- no copies, no drift.
$junctionTargets = @(
    (Join-Path $U ".gemini\antigravity\skills")   # Gemini/Antigravity
    # add other marketplace-less tools' skills dirs here
)
foreach ($skillsDir in $junctionTargets) {
    if (-not (Test-Path $skillsDir)) {
        Write-Host "[junction] $skillsDir not found -- skipping." -ForegroundColor DarkGray
        continue
    }
    Write-Host "[junction] linking skills -> $skillsDir" -ForegroundColor Green
    Get-ChildItem "$RepoRoot\plugins\*\skills\*" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $dest = Join-Path $skillsDir $_.Name
        if (-not (Test-Path $dest)) {
            New-Item -ItemType Junction -Path $dest -Target $_.FullName | Out-Null
            Write-Host "  + $($_.Name)"
        }
    }
}

# -- 4. Vendored path-bound toolkits (clone outside the repo, verbatim) -------
# Example: a toolkit that must live at an exact path and self-updates.
# Your local patches to vendored code belong in vendor-adapt/ in this repo,
# with a script that re-applies them after upstream pulls.
#
# $toolkit = Join-Path $U ".claude\skills\path-bound-toolkit"
# if (-not (Test-Path $toolkit)) {
#     Write-Host "[vendored] clone upstream toolkit..." -ForegroundColor Green
#     git clone https://github.com/example-org/path-bound-toolkit "$toolkit"
# }

# -- 5. Governance parity: deploy core rules to every tool --------------------
# Claude Code receives the rules automatically via a SessionStart hook (registered
# by your plugin). Tools without hooks load rules from a native global file --
# deploy the canonical renderings from dist/ so EVERY machine stays in sync.
# The source of truth remains governance/core.md; see governance/deploy-adapters.md.
$dist = Join-Path $RepoRoot "dist"
function Deploy-Gov($src, $dest) {
    if (-not (Test-Path $src)) { return }
    $destDir = Split-Path -Parent $dest
    if (-not (Test-Path $destDir)) {
        Write-Host "[gov] $(Split-Path -Leaf $dest): tool not installed -- skipping." -ForegroundColor DarkGray
        return
    }
    if ((Test-Path $dest) -and ((Get-FileHash $src).Hash -eq (Get-FileHash $dest).Hash)) {
        Write-Host "[gov] $(Split-Path -Leaf $dest) already in sync." -ForegroundColor DarkGray
        return
    }
    if (Test-Path $dest) { Copy-Item $dest "$dest.bak" -Force }   # one-time backup of the old file
    Copy-Item $src $dest -Force
    Write-Host "[gov] deploy -> $dest" -ForegroundColor Green
}
# Adapter table (pattern inspired by rulesync): each target = one data row
# {tool, src, dest}. Adding a tool (Cursor / Copilot / Zed...) = adding a row --
# never touch the deploy logic.
$govTargets = @(
    @{ tool = "codex";  src = "codex-AGENTS.md";  dest = (Join-Path $U ".codex\AGENTS.md") },
    @{ tool = "gemini"; src = "gemini-GEMINI.md"; dest = (Join-Path $U ".gemini\GEMINI.md") }
    # Extend: @{ tool = "cursor"; src = "codex-AGENTS.md"; dest = (Join-Path $U ".cursor\rules\opcos.md") }
)
foreach ($t in $govTargets) { Deploy-Gov (Join-Path $dist $t.src) $t.dest }

# -- 6. Knowledge layer (OPTIONAL): a personal knowledge base -----------------
# OpcOS = OS layer (how agents work); the knowledge base = knowledge layer (what
# agents know). Separate by design; the knowledge base is personal and NEVER
# distributed with this repo. Present -> agents gain domain context. Absent ->
# everything still works.
$kb = Join-Path $U "knowledge"
if (Test-Path (Join-Path $kb "INDEX.md")) {
    Write-Host "[knowledge] knowledge layer OK: $kb (agents will consult it on demand)." -ForegroundColor Green
} else {
    Write-Host "[knowledge] no ~/knowledge found -- SKIPPING (optional)." -ForegroundColor DarkGray
    Write-Host "            Want one? Create ~/knowledge with an INDEX.md and your own content." -ForegroundColor DarkGray
    Write-Host "            See docs/how-it-works.md for the OS-layer vs knowledge-layer boundary." -ForegroundColor DarkGray
}

Write-Host "OpcOS install done." -ForegroundColor Cyan
