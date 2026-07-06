# How OpcOS works

> Read this if you know **nothing** about OpcOS yet. By the end you'll understand:
> what it is, how it "orchestrates" your AI agents, how an agent reads rules
> depending on its working directory, and how plugins get wired into each app
> (Claude Code / Codex / Gemini-Antigravity / anything AGENTS.md-compatible).
>
> Naming convention: `opcos` = the identifier (folder, marketplace, path);
> `OpcOS` = the name in prose.

---

## 1. What OpcOS is (one sentence)

**OpcOS is a harness-orchestration layer: it packs all your self-built
_skills / agents / commands / hooks / MCP definitions_ into ONE git repo, then
distributes them identically to every AI agent app you use.**

In other words: instead of configuring each machine and each tool separately (and
watching them drift apart), you keep **one source of truth** (`~/.opcos`) and every
tool merely *references* it.

It is **not** an agent and **not** an app. It is a **store + loading mechanism**:
write a capability once → every agent in every tool can use it.

---

## 2. Mental model: 3 layers

```
+---------------------------------------------------------------+
|  LAYER 3 - AGENT APPS (Claude Code / Codex / Gemini ...)      |
|  Where you actually chat. Each app "loads" plugins from OpcOS.|
+---------------------------------------------------------------+
|  LAYER 2 - LOADING MECHANISM (marketplace + hooks + junctions)|
|  The install script registers this repo as a "marketplace"    |
|  for each app (or junctions skills where no marketplace exists)|
+---------------------------------------------------------------+
|  LAYER 1 - CONTENT (the ~/.opcos repo)                        |
|  plugins/*  =  skills / agents / commands / hooks / mcp       |
|  This is what you edit. One place, used everywhere.           |
+---------------------------------------------------------------+
```

All your effort goes into **Layer 1**. Layer 2 runs once per machine.
Layer 3 is the apps you already have.

(The registry generalizes this into 7 layers — tools, governance, plugins, MCP,
offline tools, pipelines, products — see the README diagram. Layers 4–7 live
*outside* the repo but are all cataloged *in* it.)

---

## 3. Repo structure (Layer 1)

```
~/.opcos/
+-- .claude-plugin/marketplace.json   # plugin catalog - Claude Code reads this
+-- .codex-plugin/marketplace.json    # the equivalent for Codex
+-- plugins/
|   +-- your-company-skills/          # self-written skills + governance hook + MCP defs
|   |   +-- skills/<name>/SKILL.md    #   -> on-demand capabilities
|   |   +-- hooks/*.ps1               #   -> run automatically on session events
|   |   +-- instructions/core.md      #   -> the base rules, injected every session
|   +-- review-pack/                  # adopted (cherry-picked + modified) skills/agents
+-- vendor-adapt/                     # your patches to vendored (outside) toolkits
+-- dist/                             # canonical rule renderings for other tools
|   +-- codex-AGENTS.md               #   -> deployed to ~/.codex/AGENTS.md
|   +-- gemini-GEMINI.md              #   -> deployed to ~/.gemini/GEMINI.md
+-- bootstrap/
|   +-- install.ps1                   # once per machine - register + install + deploy
|   +-- update.ps1                    # pull + reinstall
+-- registry.json                     # the component catalog (whole machine)
+-- docs/
```

### What kinds of "capability" can a plugin hold?

| Kind | File | When the agent uses it |
|---|---|---|
| **Skill** | `skills/<name>/SKILL.md` | Loaded **on demand**: when a task matches the skill's description, the agent invokes it. Holds procedures / deep knowledge. |
| **Agent** (sub-agent) | `agents/<name>.md` | A specialized persona (e.g. a security reviewer). The main agent can **delegate** to it, in parallel. |
| **Command** | `commands/<name>.md` | A `/name` command you type to trigger a procedure. |
| **Hook** | `hooks/*.ps1` | Runs **automatically** on session events (SessionStart, Stop, …). Never invoked by hand. |
| **Instructions** | `instructions/core.md` | The base rules, injected into **every** session by the SessionStart hook. |
| **MCP** | declared in the plugin | A server granting extra tools to the agent. |

The key idea: **skills and agents load *lazily* (only when needed) so context stays
lean; hooks and instructions load *eagerly* (every session) because they are the
frame the rest hangs on.**

---

## 4. How an agent READS rules — by working directory (important)

When you open an agent session, it assembles rules in **priority order**, low →
high (later **overrides** earlier):

```
1. core rules  (OpcOS, injected via SessionStart hook)   <- global floor
2. the tool's global user rules file                     <- machine-level rules
3. <project>/AGENTS.md or the tool's project rules file  <- project rules, HIGHEST file
4. your direct instructions in chat                      <- above everything
```

So **the same agent behaves differently depending on where it stands**:

### a) Standing at the home root

- The home root is a **container** (workspaces + tool config + personal data),
  **not a scratchpad**.
- Machine-level rules kick in: no new files at the root; products go to their
  workspace; drafts go to a designated area and get cleaned up.
- Tool config dirs: touched only on explicit request, with explanation.
- → The agent here is **cautious, writes little on its own** — it's standing in
  the shared lobby.

### b) Standing inside a project folder

- If the project has its own rules file, it **overrides** globals. The agent
  follows that project's governance.
- The agent operates freely within the project scope, but still inherits the core
  floor (Plan→Implement→Verify→Document, anti-junk, reflection).
- → The agent here is **more proactive**, but "speaks the project's dialect".

**In short:** the core rules give the work ethic everywhere; the tool's global
file gives machine-level law; the project file gives project law. OpcOS owns only
the floor (level 1) — which is exactly why it must be **tool-agnostic**.

### One rule set for ALL tools — loading & sync

The core rules file is the **single source of truth**, but each tool loads it
through a different native channel:

| Tool | Channel for the base rules | Automatic? |
|---|---|---|
| **Claude Code** | `SessionStart` hook injects the source directly (+ a `Stop` hook can remind about reflection/cleanup) | yes, once the plugin is installed |
| **Codex CLI** | `~/.codex/AGENTS.md` (read every session), deployed from `dist/` | yes, via deploy |
| **Gemini / Antigravity** | `~/.gemini/GEMINI.md` (these tools run no hooks → this file is the ONLY channel) | yes, via deploy |

**The drift problem:** the deployed files are *derived* from the source. Hand-edit
them per machine and you soon have three diverging rule sets — the exact disease
OpcOS exists to cure. **The cure** is the adapter pattern: canonical renderings in
`dist/`, deployed by the install script. Details: `../governance/deploy-adapters.md`.

> **Golden rule when changing base rules:** edit the source **and** the matching
> `dist/*` renderings, then run the update script. NEVER hand-edit a deployed
> file — the next update overwrites it (the installer backs the old file up to
> `.bak` once before overwriting).

---

## 5. What "plugging into each app" means

Each agent app loads plugins its own way. The install script does it all
automatically; here is the *meaning* of each step.

### Tools with a native marketplace (Claude Code, Codex CLI)

```powershell
claude plugin marketplace add "$RepoRoot"        # "this folder is a plugin store - read its manifest"
claude plugin install your-company-skills@opcos  # "install this plugin from the opcos store"
```

Because the marketplace points at a **local path**, editing files under `plugins/`
takes effect immediately (reinstall to refresh). Codex reads its own manifest file
in the same repo — **one source, two doors**.

### Tools with NO marketplace → junctions

```powershell
New-Item -ItemType Junction -Path <tool-skills-dir>\<skill> -Target ~\.opcos\plugins\*\skills\<skill>
```

A junction is a directory pointer: edit the source in `.opcos` and the tool sees
it instantly — no copies, no drift.

### Path-bound toolkits → vendored clones

Some upstream toolkits must live at an exact path and self-update; they can't be
packaged into the marketplace. The install script **clones upstream directly** to
where they demand. This is the deliberate exception — see the storage law
(`storage-law.md`).

---

## 6. Lifecycle of one agent session (putting it together)

```
You open an agent in directory X
      |
      v
[SessionStart hook]  -> injects the core rules into context
      |
      v
Agent assembles rules: core -> global user file -> X's project file -> your chat
      |
      v
You assign a task
      |
      +- task matches a Skill's description?  -> agent loads SKILL.md, follows it
      +- needs a specialist?                  -> agent delegates to a sub-agent
      +- you type /command?                   -> runs that command's procedure
      |
      v
[Stop hook]  -> reminds about reflection + warns about uncleaned scratch files
```

That is the "**orchestration**": OpcOS does no work itself — it **conducts**.
Every session gets the base rules; the right skill fires at the right time;
sub-agents get delegated; every turn ends with reflection and cleanup.

---

## 7. The knowledge layer — optional but recommended

OpcOS is the **OS layer** (*how* agents work). There is one more layer: the
**knowledge layer** — a personal knowledge base (e.g. `~/knowledge/`) holding what
agents should *know*: identity, projects, domain notes, opinions. The two layers
are **separate by design**:

- The knowledge base **does not live in the OpcOS repo** — it is personal data
  with its own governance, never distributed.
- OpcOS governance *points* agents at it: need domain context → consult the
  knowledge base, starting from its `INDEX.md`, respecting its rules.
- **New machine / new person:** the install script checks for it. Present → agents
  gain the knowledge layer. Absent → **skip without error** — OpcOS works fully.
- **Two-way ban:** never copy knowledge-base content into the OpcOS repo, plugins,
  or deployed files (personal-data leak); never stuff skills/tooling into the
  knowledge base (wrong layer — that belongs to OpcOS).

---

## 8. What you — the maintainer — actually do

| Want to… | Do |
|---|---|
| Install on a new machine | `git clone` your fork → run `bootstrap/install.ps1` |
| Propagate after edits | `bootstrap/update.ps1` (pull + reinstall everywhere) |
| Add a skill | create `plugins/<pack>/skills/<name>/SKILL.md` → update script → done in every tool |
| Add a specialist agent | create `plugins/<pack>/agents/<name>.md` |
| Change the base rules | edit the source `core.md` **+** the `dist/*` renderings → update script |
| Bring in an external repo | the **adopt-repo** skill (research → advise → GATE → install → verify → record) |
| Know what this machine has | `registry.json` / `REGISTRY.md` / `docs/registry.html` |
| Keep reality = registry | the **system-audit** skill, every 1–2 months |
| Clean config junk | the **config-gc** skill |
| Watch upstreams for updates | a report-only checker script, ~monthly; adoption decisions stay human |

**Three things not to forget:**

1. Edit at the source (`plugins/`), **never** the installed copies — they get overwritten.
2. Non-ASCII `.ps1` files need UTF-8 BOM (Windows PowerShell 5.1 parse trap) — verify after editing.
3. Never commit secrets; keep the core rules tool-agnostic.
