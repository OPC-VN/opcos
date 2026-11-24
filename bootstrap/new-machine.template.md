# New machine — replicating your OpcOS setup

> Goal: a new machine inherits your ENTIRE agent system (governance + skills + MCP
> + tools) to standard, installing only what that machine needs. The single source
> of reference is **`registry.json`** (open `docs/registry.html` for the visual
> map). Adapt this checklist to your own registry contents.

## 0. Prerequisites (install first, per the layers you'll use)

| Always | Per layer, as needed |
|---|---|
| git, PowerShell 5.1+, your primary agent CLI | Python 3.10+ (MCP/tools), Node LTS (npx MCP servers), ffmpeg (media tools), GPU + drivers (local ML), your secondary agent CLIs |

## 1. Core — ALWAYS install (priority `core`)

```powershell
git clone https://github.com/your-org/your-opcos-fork.git $HOME\.opcos
Set-Location $HOME\.opcos
if (-not (Test-Path governance\core.md)) {
    Copy-Item governance\core.template.md governance\core.md
}
# Edit governance/core.md and adapt bootstrap/install.template.ps1 for your setup.
if (-not (Test-Path bootstrap\install.ps1)) {
    Copy-Item bootstrap\install.template.ps1 bootstrap\install.ps1
}
& $HOME\.opcos\bootstrap\install.ps1
```

The install script does the rest: registers the marketplace, installs your plugins
(all marketplace-capable tools), junctions skills into marketplace-less tools,
deploys governance (`~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`, …), clones any
vendored toolkits, and checks for the optional knowledge layer.

For Codex and Gemini, the installer uses a matching file in `dist/` when present,
or `governance/core.md` otherwise. If an installed tool has no rule source, the
installer stops before applying changes.

Then install core store-plugins per your registry (entries with
`storage: store, priority: core`).

## 2. Choose the rest FROM THE REGISTRY

Open `REGISTRY.md` / `docs/registry.html` and filter by priority:

- **recommended** — install unless this machine doesn't play that role
  (e.g. no BI work → skip the BI bridge).
- **optional** — install only on real need.
- **deprecated** — do NOT install.

Every entry carries its own `install` field (command or script) and `storage`
class (where it lives). Heavy tools are copy-folder + their own in-place install
script — see each entry.

## 3. Secrets & accounts (NOT in the repo — provision per machine, by hand)

- User env vars: notification tokens for your notify channel, publishing tokens
  for any pipelines.
- CLI logins: each agent CLI, plus cloud CLIs if used.
- Any private assets (voice profiles, branding) travel with their own private
  repos — never through this one.

## 4. Scheduled tasks (if this machine runs automations)

Every scheduled task goes through your notify wrapper (so every run reports
success-with-links or failure-with-step to `<your-notify-channel>`). The canonical
task list = registry entries with category `pipeline`.

## 5. Final verification

```powershell
claude plugin list          # your plugins enabled
claude mcp list             # MCP servers Connected
codex mcp list
& $HOME\.opcos\bootstrap\build-registry.ps1   # regenerate views if the registry changed
```

Open a fresh agent session and ask *"what does this machine have?"* — the agent
must be able to answer from the registry.

## Hard-won standards (learned the expensive way)

- **Encoding**: any `.ps1` with non-ASCII text must be UTF-8 **with BOM**
  (Windows PowerShell 5.1 under legacy codepages parse-fails silently without it).
- **The 3-branch storage law** (see `docs/storage-law.md`): modified content → in
  the repo · verbatim/path-bound → cloned outside + `vendor-adapt/` · store-hosted
  → the store. Heavy tools always live outside, in well-known folder families.
- Every new install goes through the **adopt-repo** skill → registry entry
  (+ provenance entry for external sources) → `build-registry.ps1` → commit.
  **Installed off the books = drift = a bug.**
- Periodic sweep: the **system-audit** skill, every 1–2 months.
