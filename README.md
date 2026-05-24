# Switch

A parallel Claude Code orchestrator for the AF mission products.

The "remote" you wanted: one screen, many agents working at once on Whiteboard, TruthMark, Halo, Conduit, and TruthMark Signals — each on its own git worktree, each bound by the load-bearing principles of its product (Berkeley Protocol Principle 1 for TruthMark, E2EE preservation for Halo, compartmentation for Conduit, accessibility for Whiteboard, AF protective voice for all of them).

Why this exists: every week Whiteboard isn't shipped is a week a kid doesn't have it. Every week Halo and Conduit aren't shipped is a week someone unsafe stays unsafe. Every week TruthMark sits is a week of avoidable fights online. Switch is the throughput tool — as long as the guardrails hold.

## What it is

- Spawns N parallel `claude -p` agents, each in an isolated git worktree.
- Each agent gets a product-specific prompt + system-prompt-append with load-bearing principles.
- Each agent's allowed/disallowed shell tools are scoped per product (no `rm -rf`, no force-push, no `pip install -g`).
- Per-task hard budget caps via `claude --max-budget-usd`.
- Three modes — `cautious` (hard cap), `working` (metered, alerts), `production` (metered, big fleet). Toggle with `switch mode <name>`.
- Switch never merges to main automatically. You tap `switch approve <id>` or `switch reject <id>`.

## Install (one-time)

The venv and dependencies are already set up at `~/switch/.venv`. To make `switch` available on your PATH:

```sh
echo 'export PATH="$HOME/switch/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Or alias it instead:

```sh
echo 'alias switch="$HOME/switch/bin/switch"' >> ~/.zshrc
source ~/.zshrc
```

Then:

```sh
switch init       # one-time — git-inits Whiteboard, confirms each product is reachable
switch status     # no tasks yet
switch mode       # shows all three modes; cautious is current
```

## Run your first task

```sh
# Smoke test first — verifies every CLI path WITHOUT spending a cent on the API.
sh ~/switch/scripts/smoke.sh

# Then a real task. The third argument and onward is free-form context appended to the prompt.
switch task add whiteboard accessibility_pass "do an a11y pass on templates/lesson.html"
# Optionally override model and budget for harder tasks:
switch task add halo add_feature --model claude-opus-4-7 --budget 20 "add ephemeral self-destructing messages preserving E2EE"

switch task list
switch run                  # launches the fleet
switch run --dry            # OR: simulate without spending (creates worktrees + dummy commit)

# Watch progress live (pick one):
switch dashboard            # terminal TUI
switch web                  # Flask dashboard at http://localhost:7777
switch logs   <task-id>     # print the agent's full log
switch tail   <task-id>     # tail -f the live log

# After agents finish (status = awaiting_approval):
switch approve <task-id>    # safety-checks protected paths + scans for secrets, then merges
switch reject  <task-id>    # discards branch and worktree
```

## The three modes (and your toggle)

| Mode | Metering | Max concurrent | Budget per agent | Notes |
|---|---|---|---|---|
| `cautious` | Hard cap | 4 | $5 | Session cap $50. Default. |
| `working` | Usage-metered | 12 | $15 | Alerts at $100/$500/$1000. |
| `production` | Usage-metered | 60 | $30 | Alerts at $500/$1k/$3k/$5k. |

`switch mode working` flips the mode. Two of three (working, production) are metered by actual usage — they alert but never auto-stop. Cautious is the only hard-cap mode.

## What's in this repo

```
~/switch/
├── config.yml             # Modes + products + branch prefixes
├── tasks.yml              # Optional seed file (use `switch task load`)
├── orchestrator.py        # Core engine — spawns claude processes on worktrees
├── switch.py              # CLI
├── dashboard.py           # Live rich-based table
├── bin/switch             # Entry point (uses bundled venv)
├── prompts/
│   ├── _shared/           # af_voice + universal don'ts (injected into every agent)
│   ├── truthmark/         # add_card, fix_bug
│   ├── halo/              # add_feature, fix_bug
│   ├── conduit/           # add_feature
│   └── whiteboard/        # add_lesson, accessibility_pass
├── rules/
│   ├── truthmark.yml      # Principle 1 + allowed/disallowed tools + protected paths
│   ├── truthmark_signals.yml
│   ├── halo.yml           # E2EE invariants + crypto_engine.py protected
│   ├── conduit.yml        # Compartmentation + crypto_utils.py protected
│   └── whiteboard.yml     # Accessibility-first + models.py protected
├── worktrees/             # Each agent's isolated worktree lives here
└── state/
    ├── tasks.sqlite       # Task DB
    └── logs/              # Per-agent stream-json log
```

## How agents are constrained

Every agent runs as:

```sh
claude -p "<prompt>" \
  --output-format stream-json \
  --add-dir <worktree> \
  --permission-mode acceptEdits \
  --max-budget-usd <N> \
  --append-system-prompt "<product principles + AF voice + never_do>" \
  --allowedTools <list from rules/{product}.yml> \
  --disallowedTools <list from rules/{product}.yml> \
  --model claude-sonnet-4-6 \
  --no-session-persistence \
  --name switch-<product>-<task-id>
```

The `--max-budget-usd` is a true ceiling — the agent is killed by Claude Code when the spend hits it. Even if 60 agents are running, each is bounded individually.

## Adding a new product

1. Add it to `config.yml` under `products:` with `path`, `stack`, `deploy`, `branch_prefix`.
2. Add `rules/{name}.yml` with allowed_tools, disallowed_tools, protected_paths, principles.
3. Add at least one prompt under `prompts/{name}/`.
4. `switch init` to git-init the product directory if needed.

## Adding a new prompt

`prompts/{product}/{prompt_id}.md` — that's it. Reference it with `switch task add <product> <prompt_id> "extra context..."`.

## Safety stance (the boring but load-bearing part)

- **Auto-commit and auto-push** — yes, but only to a feature branch named `{prefix}-{task-id}`. Never directly to main.
- **Auto-merge to main** — never. A human taps `switch approve`.
- **Protected paths** (e.g. `crypto_engine.py`, `.env`, `vercel.json`) — `switch approve` refuses to merge a branch that modifies any path listed in `rules/{product}.yml`. This is enforced at merge time, not just suggested in the prompt.
- **Secret scan** — `switch approve` greps the branch diff for Anthropic / OpenAI / AWS / GitHub PAT / Google API / Slack / Vercel / private-key patterns. If any match, the merge is refused and the suspect labels are printed (the actual secret value is redacted in the message).
- **Force-push / `rm -rf` / global installs** — refused at the `--disallowedTools` layer per product.
- **Budget caps** — `claude --max-budget-usd` is a hard ceiling per agent. Even at 60 agents, each one is bounded.

If you ever want to see *why* something was refused, the rejection message names the file(s) or pattern(s) it caught.

## What v1 added over v0

- Protected-paths enforcement at merge time (not just system-prompt suggestion).
- Secret scan over branch diff before approve.
- Real Vercel preview URL resolution via `vercel ls --json` (falls back to a hint if the CLI isn't installed).
- `switch run --dry` — orchestrate without spending API money.
- `switch logs <id>` / `switch tail <id>` for per-agent log inspection.
- `--model` and `--budget` overrides on `task add` (opus for hard tasks, custom budget per task).
- `switch web` — Flask dashboard at `localhost:7777` with one-click approve/reject buttons.
- `install.sh` — one-liner setup on a fresh machine.
- `scripts/smoke.sh` — end-to-end pipeline verification, zero API spend, auto-cleans the test merge.

## Known v1 limits

- Cloud half of the hybrid runtime is not wired yet. v1 is local Mac only. Cloud sandboxing (Vercel Sandbox / Docker containers) is the next step once local proves itself across a real working-mode session.
- No automatic task generation. You add tasks by hand, via `tasks.yml` seeds, or via the web dashboard (future).
- The Vercel preview URL resolution depends on the `vercel` CLI being installed and authed. If it isn't, you'll see `(vercel preview building for {branch})` as a hint and can check the Vercel dashboard by hand.

These are intentional cuts. Local + manual task seeding is the right starting point. Scale comes after the review loop is real.
