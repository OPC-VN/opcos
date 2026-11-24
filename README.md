# OpcOS — an operating system for your AI coding agents

**One governance source + a component registry + install discipline, shared across
Claude Code, Codex, Gemini/Antigravity, and any AGENTS.md-compatible tool.**

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![PRs: welcome (with review)](https://img.shields.io/badge/PRs-welcome_with_review-brightgreen.svg)

OpcOS is not an agent and not an app. It is a **framework for governing the agents
you already use**: a single repo that holds your working rules, your skill/plugin
catalog, and the scripts that deploy both identically to every tool on every machine.

---

## Why

If you use AI coding agents seriously, three problems appear within months:

1. **Sprawl** — skills, MCP servers, plugins, offline tools, and pipelines accumulate
   across `~/.claude`, `~/.codex`, `~/.gemini`, and random folders. Nobody can answer
   "what is installed on this machine, and why?"
2. **Drift** — each tool has its own rules file. You fix a rule in one, forget the
   others, and three agents now behave three different ways.
3. **Duplication** — the same skill exists as a copy in two tools and a fork in a
   third; upstream ships a fix and none of your copies get it.

OpcOS answers all three with one repo, one registry, and a handful of disciplined
procedures.

## What you get

| Piece | What it does |
|---|---|
| **Governance parity** | One rules file (`governance/core.template.md`, AGENTS.md-style) deployed 1-source → N-tools via an adapter table. Fix a rule once; every agent inherits it. |
| **Central registry** | `registry.json` catalogs every component (plugin / MCP / offline tool / pipeline / product) with a **priority** (core / recommended / optional / deprecated) and a **storage** class. One file answers "what does this machine have, and what should a new machine install?" |
| **adopt-repo discipline** | A 6-phase research → advise → **human gate** → install → verify → record procedure for bringing any external repo or skill into your system. Nothing gets installed off the books. |
| **system-audit** | A periodic 7-step whole-machine scan: inventory everything, diff against the registry, find duplicates and drift, clean up safely (soft-delete, human-gated). |
| **config-gc** | Garbage collection for agent config: orphaned skills, dead memory files, unused MCP servers, stale caches — human-in-loop, soft-delete first. |

## Architecture — the 7 layers

```
┌──────────────────────────────────────────────────────────────┐
│ 7  PRODUCTS      your actual repos — what the agents build   │
├──────────────────────────────────────────────────────────────┤
│ 6  PIPELINES     scheduled automation (reports, publishing)  │
├──────────────────────────────────────────────────────────────┤
│ 5  OFFLINE TOOLS local engines: TTS, render, transcription   │
├──────────────────────────────────────────────────────────────┤
│ 4  MCP SERVERS   bridges from tools to capabilities          │
├──────────────────────────────────────────────────────────────┤
│ 3  PLUGINS       skills / agents / commands / hooks          │
├──────────────────────────────────────────────────────────────┤
│ 2  GOVERNANCE    core rules, deployed to every tool          │
├──────────────────────────────────────────────────────────────┤
│ 1  TOOLS         Claude Code · Codex · Gemini/Antigravity …  │
└──────────────────────────────────────────────────────────────┘
```

Layers 2–3 live **inside** your OpcOS repo. Layers 4–7 live **outside** it (they are
heavy: venvs, models, output) but every one of them has an entry in the registry —
the registry is the single place where you can see the whole machine.

## Quickstart

```powershell
# 1. Clone this framework and make it yours
git clone https://github.com/OPC-VN/opcos my-opcos
cd my-opcos

# 2. Create and edit your core rules file
if (-not (Test-Path governance\core.md)) {
    Copy-Item governance\core.template.md governance\core.md
}

# 3. Adapt the installer — fill in your plugin names and gov targets
#    Review bootstrap/install.template.ps1 before running it once per machine.
powershell -File bootstrap\install.template.ps1

# 4. Describe what you have in registry.json (start from registry/registry.example.json),
#    then generate the human-readable views:
powershell -File bootstrap\build-registry.ps1
```

For Codex and Gemini, the installer prefers a tool-specific file in `dist/` when
one is present and otherwise copies `governance/core.md`. Prepare the rules before
running the installer. It stops before making changes if an installed target has
no rule source.
If a marketplace or plugin command fails, the installer reports the failure and
stops. Review the CLI output before retrying.

From then on: every install goes through the **adopt-repo** procedure, every rule
change goes through the **deploy adapters**, and every month or two you run
**system-audit** to keep reality and registry identical.

## The 3-branch storage law

Where does a new component live? One rule decides it:

> **Modify the content → copy it into your OpcOS repo (`adopted-in-repo`).
> Use it verbatim / it is path-bound / it has a runtime → clone it OUTSIDE the repo
> and keep your patches in `vendor-adapt/` (`vendored-outside`).
> The tool has a first-party store → install from the store and only record it
> (`store`).**

Self-written components follow the same split: small text → in-repo
(`homegrown-in-repo`); heavy (venv / models / output) → outside, in a well-known
folder family (`homegrown-outside`). Full rationale and examples:
[docs/storage-law.md](docs/storage-law.md).

## Docs

- **Website:** [docs/index.html](docs/index.html) (served via GitHub Pages)
- [How it works](docs/how-it-works.md) — the full architecture explainer
- [The storage law](docs/storage-law.md) — where things live, and why
- [Deploy adapters](governance/deploy-adapters.md) — 1 rule source → N tools
- [Registry schema](registry/registry.schema.json) · [example](registry/registry.example.json) · [viewer](docs/registry-viewer.html)
- [New-machine checklist](bootstrap/new-machine.template.md)

## Design principles

- **Human-gated outward actions.** Agents research, analyze, and advise freely;
  installing, committing, publishing, and deleting always wait for a human "go".
- **Soft-delete, never hard-delete.** Cleanup moves things to a dated trash folder
  with a retention window. Unsure = hold, not guess.
- **Provenance first.** Everything inherited from outside carries its upstream,
  license, and baseline commit — so you can watch upstream and cherry-pick updates
  deliberately, never auto-merge.
- **Smallest tool that works.** A ladder from "just answer" up to "scheduled loop";
  never create a skill for a one-off, never schedule what a note can do.

## Attribution & license

MIT — see [LICENSE](LICENSE). Ideas distilled from prior art are credited in
[NOTICE.md](NOTICE.md). PRs welcome; all contributions are reviewed before merge.
