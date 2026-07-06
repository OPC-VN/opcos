# The 3-branch storage law

*Where does a component live? One decision, made once, recorded in the registry's
`storage` field.*

## The law

> **Modify the content → copy it into your OpcOS repo.
> Use it verbatim / it is path-bound / it has a runtime → clone it OUTSIDE the repo,
> keep your patches in `vendor-adapt/`.
> The tool has a first-party store → install from the store, only record it.**

Self-written components follow the same split: small text lives in the repo; heavy
things (venvs, models, output) live outside it, in well-known folder families.

## The branches

| `storage` value | When | Where it lives | Update path |
|---|---|---|---|
| `adopted-in-repo` | cherry-picked **AND modified** — the copy has diverged; an upstream pull would destroy your edits | `plugins/<pack>/` inside the repo | manual cherry-pick from upstream, guided by the adopt-repo skill |
| `vendored-outside` | the **whole repo** is used verbatim, or it is path-bound, or it carries a runtime (venv, node_modules) | cloned outside the repo; your patches live in `vendor-adapt/` inside the repo, with a script that re-applies them after pulls | the toolkit's own update mechanism + re-apply patches |
| `store` | the tool has a first-party marketplace for it | the tool's store; your repo **only records** the entry (registry + provenance) | the store |
| `homegrown-in-repo` | self-written, small, text-based (skills, hooks, docs) | inside the repo | git |
| `homegrown-outside` | self-written but heavy: venvs, models, rendered output | outside, in a well-known folder family (e.g. `~/.mcp/<name>` for MCP servers, a media-tools family, a pipelines family) | in-place edits; the registry entry documents how a new machine reinstalls it |

## Why each branch exists

- **adopted-in-repo** — once you modify inherited content, you own it. Keeping it
  in the repo makes your edits durable and distributable; the provenance entry
  remembers where it came from so you can still cherry-pick upstream improvements
  deliberately.
- **vendored-outside** — verbatim clones don't belong in your repo (bloat, license
  surface, merge pain). But your *adaptations* do: `vendor-adapt/` + a re-apply
  script keep your patches versioned while the clone stays pristine and updatable.
- **store** — mirroring store-distributed plugins creates a stale copy the store
  can't update. Install from the store; the registry entry is your record that the
  component exists and matters.
- **homegrown split** — git is for text. Repos with venvs and model weights inside
  become undistributable. Heavy homegrown tools live outside with their own
  in-place installers; the registry makes them findable.

## The corollary that saves you pain

**Never relocate heavy tools to "tidy up" the filesystem.** Registered MCP paths,
junctions, and scheduled tasks all point at absolute locations — a rename breaks
them all silently. The registry exists precisely so you get *one place to see
everything* without needing everything to be in one place.

## Worked examples

| Component | Branch | Reasoning |
|---|---|---|
| An engineering-skills pack you cherry-picked and re-prefixed | `adopted-in-repo` | You changed names and stripped content — the copy has diverged; upstream pulls would clobber it. |
| A toolkit that must live at `~/.claude/skills/<name>` and self-updates | `vendored-outside` | Path-bound and self-updating: clone it where it wants to be; record it; keep any patches in `vendor-adapt/`. |
| A browser-automation MCP served via `npx` | `store` | First-party distribution exists; your repo records the registration command, nothing more. |
| Your own `adopt-repo` skill | `homegrown-in-repo` | Small, text, self-written — the heart of what the repo distributes. |
| Your local TTS engine with a 6 GB venv + models | `homegrown-outside` | Self-written wrapper, but far too heavy for git. Lives in a media-tools folder family; the registry entry carries its install script and size. |

## Enforcement

- The **adopt-repo** skill assigns the branch at install time (phase 4) and writes
  it into the registry.
- The **system-audit** skill flags violations ("misplaced") during the periodic
  scan — and proposes the *correct-branch* fix, never a blind move.
