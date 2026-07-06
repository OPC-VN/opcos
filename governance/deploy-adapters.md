# Deploy adapters — one rule source, N tools

The core rules file (`core.template.md`, adapted to your setup) is the **single
source of truth**. But every agent tool loads its base rules through a different
native channel. The adapter pattern keeps them in sync without hand-editing.

## The problem: derived files drift

If you maintain a separate rules file per tool, they diverge within weeks — the
exact failure mode this framework exists to prevent. So: **edit one canonical
source, and let a script deploy derived copies to each tool's native location.**

```
governance/core.md  (your adapted copy — THE source; edit here first)
        │
        ├─ Claude Code : injected directly each session via a SessionStart hook
        │                (no file deploy needed — the hook reads the source)
        │
        ├─ dist/codex-AGENTS.md      ──(install script copies)──►  ~/.codex/AGENTS.md
        └─ dist/gemini-GEMINI.md     ──(install script copies)──►  ~/.gemini/GEMINI.md
```

## How each tool loads the base rules

| Tool | Native channel | Automatic? |
|---|---|---|
| **Claude Code** | `SessionStart` hook injects the source file into every session (register the hook via your plugin) | yes — once the plugin is installed |
| **Codex CLI** | `~/.codex/AGENTS.md` — read at the start of every session | yes — via deployed file |
| **Gemini / Antigravity** | `~/.gemini/GEMINI.md` — these tools don't run hooks, so the deployed file is the **only** channel | yes — via deployed file |
| **Cursor / Copilot / others** | their own rules-file location | extensible — add one adapter row |

## The adapter table (data, not logic)

The install script drives deployment from a plain data table — one row per target.
Adding a tool means adding a row, never touching the copy logic:

```powershell
# Each target = one row of data {tool, src, dest}.
$govTargets = @(
    @{ tool = "codex";  src = "codex-AGENTS.md";  dest = (Join-Path $HOME ".codex\AGENTS.md") },
    @{ tool = "gemini"; src = "gemini-GEMINI.md"; dest = (Join-Path $HOME ".gemini\GEMINI.md") }
    # Extend: @{ tool = "cursor"; src = "codex-AGENTS.md"; dest = (Join-Path $HOME ".cursor\rules\core.md") }
)
foreach ($t in $govTargets) { Deploy-Gov (Join-Path $dist $t.src) $t.dest }
```

`Deploy-Gov` (see `bootstrap/install.template.ps1`) is deliberately conservative:

- **Skips** targets whose tool isn't installed (destination directory missing).
- **Skips** targets already in sync (hash comparison) — idempotent, safe to re-run.
- **Backs up** the existing file to `.bak` once before overwriting.

## The golden rule when changing base rules

1. Edit the **source** (`governance/core.md` in your repo).
2. Update the corresponding `dist/*` derived files (they may carry small per-tool
   framing, but the substance must match the source).
3. Run your update script to redeploy everywhere.

**Never hand-edit a deployed file** (`~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`) —
the next deploy overwrites it, and your edit silently disappears.

## Why keep `dist/` copies in the repo at all?

Because the derived files are per-tool *renderings*, not byte copies: each may need
a short tool-specific preamble, and some tools cap file size. Keeping the canonical
renderings in the repo means every machine deploys **identical** derived files —
the repo, not any single machine, is the source of truth.
