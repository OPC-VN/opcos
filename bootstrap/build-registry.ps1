# build-registry.ps1 -- generate REGISTRY.md + docs/registry.html from registry.json.
#
# registry.json is the SINGLE SOURCE -- edit it, then re-run this script.
# Never edit the generated files by hand.
#
# Usage:  powershell -File bootstrap\build-registry.ps1 [-RegistryPath <path>]
#
# Encoding note: this script is deliberately ASCII-only. If you ever add non-ASCII
# strings to any .ps1 in this repo, save it as UTF-8 WITH BOM -- Windows
# PowerShell 5.1 silently misparses BOM-less UTF-8 under legacy codepages.

param(
    [string]$RegistryPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

# Default: registry.json at the repo root (your live registry). Fall back to the
# bundled example so the script works out of the box in a fresh clone.
if (-not $RegistryPath) {
    $RegistryPath = Join-Path $RepoRoot "registry.json"
    if (-not (Test-Path $RegistryPath)) {
        $RegistryPath = Join-Path $RepoRoot "registry\registry.example.json"
        Write-Host "[info] no registry.json at repo root -- using the bundled example: $RegistryPath" -ForegroundColor Yellow
    }
}

$reg  = Get-Content $RegistryPath -Raw -Encoding UTF8 | ConvertFrom-Json
$json = Get-Content $RegistryPath -Raw -Encoding UTF8

$prioOrder = @{ "core" = 0; "recommended" = 1; "optional" = 2; "deprecated" = 3 }
$prioBadge = @{ "core" = "CORE"; "recommended" = "RECOMMENDED"; "optional" = "optional"; "deprecated" = "deprecated" }
$catLabel  = [ordered]@{
    "governance" = "Governance & foundation"
    "plugin"     = "Plugin & skill packs"
    "mcp"        = "MCP servers"
    "offline"    = "Offline tools"
    "pipeline"   = "Pipelines & automation"
    "product"    = "Products"
}

# ---------- REGISTRY.md ----------
$md = New-Object System.Collections.Generic.List[string]
$md.Add("# Registry -- components installed on this machine")
$md.Add("")
$md.Add("> GENERATED from ``registry.json`` by ``bootstrap/build-registry.ps1`` -- do NOT edit by hand.")
$md.Add("> Updated: $($reg.updated). Priority: CORE (install first on a new machine) > RECOMMENDED > optional (install on need) > deprecated (do not install / awaiting cleanup).")
$md.Add("> Visual map: ``docs/registry.html``. New installs go through the ``adopt-repo`` skill (install, then add a registry entry and re-run this build).")
$md.Add("")
foreach ($cat in $catLabel.Keys) {
    $items = @($reg.components | Where-Object { $_.category -eq $cat } | Sort-Object { $prioOrder[$_.priority] }, name)
    if (-not $items) { continue }
    $md.Add("## $($catLabel[$cat])")
    $md.Add("")
    $md.Add("| Component | Priority | Storage | Purpose | When to use | Location | Install | Upstream |")
    $md.Add("|---|---|---|---|---|---|---|---|")
    foreach ($c in $items) {
        $sz = if ($c.PSObject.Properties["size"]) { " ($($c.size))" } else { "" }
        $md.Add("| **$($c.name)**$sz | $($prioBadge[$c.priority]) | ``$($c.storage)`` | $($c.purpose) | $($c.when_to_use) | ``$($c.location)`` | $($c.install) | $($c.upstream) |")
    }
    $md.Add("")
}
$mdOut = Join-Path $RepoRoot "REGISTRY.md"
[IO.File]::WriteAllText($mdOut, ($md -join "`n"), (New-Object System.Text.UTF8Encoding $true))
Write-Host "[ok] $mdOut" -ForegroundColor Green

# ---------- docs/registry.html ----------
# docs/registry-viewer.html doubles as the template: the JSON between the
# REGISTRY:BEGIN / REGISTRY:END markers is replaced with your live registry.
$tplPath = Join-Path $RepoRoot "docs\registry-viewer.html"
$tpl     = Get-Content $tplPath -Raw -Encoding UTF8
$begin   = "/*REGISTRY:BEGIN*/"
$end     = "/*REGISTRY:END*/"
$i0 = $tpl.IndexOf($begin)
$i1 = $tpl.IndexOf($end)
if ($i0 -lt 0 -or $i1 -lt 0) { throw "Markers $begin / $end not found in $tplPath" }
$html = $tpl.Substring(0, $i0) + $begin + "`n" + $json + "`n" + $end + $tpl.Substring($i1 + $end.Length)
$htmlOut = Join-Path $RepoRoot "docs\registry.html"
[IO.File]::WriteAllText($htmlOut, $html, (New-Object System.Text.UTF8Encoding $true))
Write-Host "[ok] $htmlOut" -ForegroundColor Green
