"""Switch orchestrator — spawns parallel Claude Code agents on git worktrees.

Each agent gets:
  - An isolated git worktree off the product's default branch
  - A product-specific system prompt with load-bearing principles
  - Tool allowlists/denylists per product (guardrails)
  - A hard --max-budget-usd cap per agent

Output: each agent's branch is committed (and pushed if a remote exists),
status set to awaiting_approval. Switch never merges to main without
human approval (see switch approve / switch reject).
"""

from __future__ import annotations

import asyncio
import fnmatch
import json
import os
import re
import shlex
import sqlite3
import subprocess
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

# Patterns we refuse to merge if they appear in a branch's diff.
# Kept narrow on purpose — false positives block real work.
SECRET_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("anthropic api key", re.compile(r"sk-ant-api[0-9a-zA-Z\-_]{30,}")),
    ("openai api key", re.compile(r"sk-[a-zA-Z0-9]{40,}")),
    ("aws access key", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("github pat", re.compile(r"gh[pousr]_[A-Za-z0-9]{30,}")),
    ("google api key", re.compile(r"AIza[0-9A-Za-z\-_]{35}")),
    ("slack token", re.compile(r"xox[abprs]-[0-9a-zA-Z\-]{10,}")),
    ("private key block", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----")),
    ("vercel token", re.compile(r"vercel_[A-Za-z0-9]{24,}")),
]

def _switch_root() -> Path:
    env = os.environ.get("SWITCH_ROOT")
    if env:
        return Path(env).expanduser().resolve()
    if os.environ.get("VERCEL") or os.environ.get("SWITCH_CLOUD"):
        return Path(__file__).resolve().parent
    return Path.home() / "switch"


SWITCH_ROOT = _switch_root()
CONFIG_PATH = SWITCH_ROOT / "config.yml"
TASKS_PATH = SWITCH_ROOT / "tasks.yml"
STATE_DB = SWITCH_ROOT / "state" / "tasks.sqlite"
LOGS_DIR = SWITCH_ROOT / "state" / "logs"


def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)


def save_config(cfg: dict) -> None:
    with open(CONFIG_PATH, "w") as f:
        yaml.safe_dump(cfg, f, sort_keys=False)


def load_tasks_file() -> list[dict]:
    if not TASKS_PATH.exists():
        return []
    with open(TASKS_PATH) as f:
        data = yaml.safe_load(f) or {}
    return data.get("tasks", []) or []


def expand_path(p: str) -> Path:
    return Path(os.path.expanduser(p)).resolve()


def init_db() -> sqlite3.Connection:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(STATE_DB)
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            product TEXT NOT NULL,
            prompt_id TEXT NOT NULL,
            context TEXT,
            model TEXT,
            max_budget_usd REAL,
            status TEXT NOT NULL,
            branch TEXT,
            worktree_path TEXT,
            preview_url TEXT,
            cost_usd REAL DEFAULT 0,
            tokens_input INTEGER DEFAULT 0,
            tokens_output INTEGER DEFAULT 0,
            started_at TEXT,
            finished_at TEXT,
            error TEXT,
            created_at TEXT NOT NULL
        );
        """
    )
    conn.commit()
    return conn


def queue_task(
    conn: sqlite3.Connection,
    product: str,
    prompt_id: str,
    context: str = "",
    model: str | None = None,
    max_budget_usd: float | None = None,
) -> str:
    task_id = uuid.uuid4().hex[:8]
    conn.execute(
        "INSERT INTO tasks (id, product, prompt_id, context, model, max_budget_usd, status, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)",
        (
            task_id,
            product,
            prompt_id,
            context,
            model,
            max_budget_usd,
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()
    return task_id


def load_prompt(product: str, prompt_id: str) -> str:
    p = SWITCH_ROOT / "prompts" / product / f"{prompt_id}.md"
    if not p.exists():
        p = SWITCH_ROOT / "prompts" / "_shared" / f"{prompt_id}.md"
    if not p.exists():
        raise FileNotFoundError(
            f"No prompt found at prompts/{product}/{prompt_id}.md or prompts/_shared/{prompt_id}.md"
        )
    return p.read_text()


def load_rules(product: str) -> dict:
    p = SWITCH_ROOT / "rules" / f"{product}.yml"
    if not p.exists():
        return {}
    with open(p) as f:
        return yaml.safe_load(f) or {}


def build_system_prompt_append(product: str, rules: dict) -> str:
    shared_voice = (SWITCH_ROOT / "prompts" / "_shared" / "af_voice.md").read_text()
    never_do = (SWITCH_ROOT / "prompts" / "_shared" / "never_do.md").read_text()
    principles = rules.get("principles", []) or []
    protected = rules.get("protected_paths", []) or []
    parts = [
        f"# Switch agent — product: {product}",
        "",
        "You are operating inside an isolated git worktree dedicated to this task. "
        "Your branch is already created. Make your changes on this branch only.",
        "",
        "## Load-bearing principles for this product (do not violate)",
        "",
    ]
    parts += [f"- {p}" for p in principles] if principles else ["(none defined)"]
    parts += [
        "",
        "## Paths you must not modify (protected — human review required)",
        "",
    ]
    parts += [f"- `{p}`" for p in protected] if protected else ["(none)"]
    parts += [
        "",
        "## AF voice",
        "",
        shared_voice,
        "",
        "## Universal don'ts",
        "",
        never_do,
        "",
        "## When you finish",
        "",
        "- Write a `SUMMARY.md` to the worktree root describing what you did, what you did not touch, and any concerns.",
        "- If you got blocked, write a `STATUS.md` to the worktree root explaining the blocker.",
        "- Do not commit. Switch handles the commit and push after you exit.",
    ]
    return "\n".join(parts)


def detect_default_branch(product_path: Path) -> str:
    """Return the product's default branch (main, master, or current HEAD)."""
    r = subprocess.run(
        ["git", "-C", str(product_path), "symbolic-ref", "refs/remotes/origin/HEAD"],
        capture_output=True,
        text=True,
    )
    if r.returncode == 0 and r.stdout.strip():
        return r.stdout.strip().split("/")[-1]
    r = subprocess.run(
        ["git", "-C", str(product_path), "rev-parse", "--abbrev-ref", "HEAD"],
        capture_output=True,
        text=True,
    )
    return (r.stdout or "main").strip() or "main"


def make_worktree(product_path: Path, branch: str, worktree_path: Path) -> None:
    worktree_path.parent.mkdir(parents=True, exist_ok=True)
    base = detect_default_branch(product_path)
    subprocess.run(
        ["git", "-C", str(product_path), "worktree", "add", "-b", branch, str(worktree_path), base],
        check=True,
        capture_output=True,
    )


def remove_worktree(product_path: Path, worktree_path: Path) -> None:
    subprocess.run(
        ["git", "-C", str(product_path), "worktree", "remove", "--force", str(worktree_path)],
        check=False,
        capture_output=True,
    )


def session_spend(conn: sqlite3.Connection) -> float:
    row = conn.execute(
        "SELECT COALESCE(SUM(cost_usd),0) FROM tasks WHERE date(created_at) = date('now')"
    ).fetchone()
    return float(row[0] or 0)


def changed_files(product_path: Path, branch: str) -> list[str]:
    """Files modified by `branch` relative to the default branch."""
    target = detect_default_branch(product_path)
    r = subprocess.run(
        ["git", "-C", str(product_path), "diff", "--name-only", f"{target}...{branch}"],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        # Worktree-local fallback (when branch isn't yet on the main repo)
        return []
    return [f for f in r.stdout.split("\n") if f]


def branch_diff_text(product_path: Path, branch: str) -> str:
    target = detect_default_branch(product_path)
    r = subprocess.run(
        ["git", "-C", str(product_path), "diff", f"{target}...{branch}"],
        capture_output=True, text=True,
    )
    return r.stdout if r.returncode == 0 else ""


def check_protected_paths(product_path: Path, branch: str, rules: dict) -> list[str]:
    """Return files this branch modifies that match any protected_paths glob."""
    patterns = rules.get("protected_paths") or []
    if not patterns:
        return []
    files = changed_files(product_path, branch)
    hits: list[str] = []
    for f in files:
        for pat in patterns:
            if fnmatch.fnmatch(f, pat) or fnmatch.fnmatch(f, f"**/{pat}"):
                hits.append(f)
                break
    return hits


def scan_diff_for_secrets(product_path: Path, branch: str) -> list[tuple[str, str]]:
    """Return (label, sample) pairs for any secret-shaped strings in the diff.

    Looks only at added lines (lines starting with '+' that are not the '+++ ' file header).
    """
    diff = branch_diff_text(product_path, branch)
    if not diff:
        return []
    findings: list[tuple[str, str]] = []
    for line in diff.split("\n"):
        if not line.startswith("+") or line.startswith("+++"):
            continue
        added = line[1:]
        for label, pat in SECRET_PATTERNS:
            m = pat.search(added)
            if m:
                # Don't echo the full secret — just enough to identify the line
                sample = m.group(0)
                redacted = sample[:6] + "…" + sample[-4:] if len(sample) > 12 else "(redacted)"
                findings.append((label, redacted))
    return findings


def resolve_vercel_preview_url(product_path: Path, branch: str) -> str | None:
    """Try to fetch the live Vercel preview URL for a branch via `vercel ls --json`.

    Returns None if vercel CLI is missing, project isn't linked, or no matching deployment yet.
    """
    if subprocess.run(["which", "vercel"], capture_output=True).returncode != 0:
        return None
    try:
        r = subprocess.run(
            ["vercel", "ls", "--json"],
            cwd=str(product_path),
            capture_output=True, text=True, timeout=20,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None
    if r.returncode != 0:
        return None
    try:
        data = json.loads(r.stdout)
    except json.JSONDecodeError:
        return None
    # Vercel CLI output shape varies — try a few common keys defensively
    deployments = data if isinstance(data, list) else data.get("deployments") or data.get("data") or []
    for d in deployments:
        meta = d.get("meta") or {}
        if meta.get("githubCommitRef") == branch or meta.get("gitCommitRef") == branch:
            return d.get("url") or d.get("alias") or None
    return None


def approve_task(task_id: str) -> tuple[bool, str]:
    """Approve and merge a task. Returns (ok, message). Safe to call from CLI or web."""
    cfg = load_config()
    conn = sqlite3.connect(STATE_DB)
    row = conn.execute(
        "SELECT product, branch, worktree_path, status FROM tasks WHERE id=?", (task_id,)
    ).fetchone()
    if not row:
        conn.close()
        return False, f"No task with id {task_id}"
    product, branch, worktree_path, status = row
    if status not in ("awaiting_approval", "no_changes"):
        conn.close()
        return False, f"Task {task_id} status is '{status}', not approvable"

    product_path = expand_path(cfg["products"][product]["path"])
    rules = load_rules(product)

    if status == "awaiting_approval":
        # Safety: protected paths
        violations = check_protected_paths(product_path, branch, rules)
        if violations:
            conn.close()
            return False, f"refusing merge — branch touches protected paths: {', '.join(violations[:5])}"
        # Safety: secret scan
        secrets = scan_diff_for_secrets(product_path, branch)
        if secrets:
            labels = ", ".join(f"{l} ({s})" for l, s in secrets[:5])
            conn.close()
            return False, f"refusing merge — secret-shaped strings found in diff: {labels}"
        # Merge
        target = detect_default_branch(product_path)
        r = subprocess.run(
            ["git", "-C", str(product_path), "checkout", target],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            conn.close()
            return False, f"checkout failed: {r.stderr.strip()}"
        r = subprocess.run(
            ["git", "-C", str(product_path), "merge", "--no-ff", branch],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            conn.close()
            return False, f"merge failed: {r.stderr.strip()}"

    if worktree_path:
        remove_worktree(product_path, Path(worktree_path))
    conn.execute("UPDATE tasks SET status='approved' WHERE id=?", (task_id,))
    conn.commit()
    conn.close()
    return True, f"approved {task_id}"


def reject_task(task_id: str) -> tuple[bool, str]:
    cfg = load_config()
    conn = sqlite3.connect(STATE_DB)
    row = conn.execute(
        "SELECT product, branch, worktree_path FROM tasks WHERE id=?", (task_id,)
    ).fetchone()
    if not row:
        conn.close()
        return False, f"No task with id {task_id}"
    product, branch, worktree_path = row
    product_path = expand_path(cfg["products"][product]["path"])
    if worktree_path:
        remove_worktree(product_path, Path(worktree_path))
    if branch:
        subprocess.run(
            ["git", "-C", str(product_path), "branch", "-D", branch],
            check=False, capture_output=True,
        )
    conn.execute("UPDATE tasks SET status='rejected' WHERE id=?", (task_id,))
    conn.commit()
    conn.close()
    return True, f"rejected {task_id}"


async def run_agent(config: dict, task: dict, dry: bool = False) -> None:
    """Run a single Claude Code agent for one task.

    If dry=True, no real claude process is spawned — Switch just creates the worktree,
    writes a placeholder SUMMARY.md, and marks the task awaiting_approval. Used by
    `switch run --dry` to exercise the full pipeline without API spend.
    """
    mode_cfg = config["modes"][config["mode"]]
    product_cfg = config["products"][task["product"]]
    product_path = expand_path(product_cfg["path"])

    rules = load_rules(task["product"])
    prompt_text = load_prompt(task["product"], task["prompt_id"])
    if task.get("context"):
        prompt_text += "\n\n## Specific task\n\n" + task["context"]

    branch = f"{product_cfg['branch_prefix']}-{task['id']}"
    worktree_path = SWITCH_ROOT / "worktrees" / task["id"]

    conn = sqlite3.connect(STATE_DB)
    conn.execute(
        "UPDATE tasks SET status='running', branch=?, worktree_path=?, started_at=? WHERE id=?",
        (branch, str(worktree_path), datetime.now(timezone.utc).isoformat(), task["id"]),
    )
    conn.commit()
    conn.close()

    try:
        make_worktree(product_path, branch, worktree_path)
    except subprocess.CalledProcessError as e:
        conn = sqlite3.connect(STATE_DB)
        conn.execute(
            "UPDATE tasks SET status='failed', error=?, finished_at=? WHERE id=?",
            (
                f"worktree creation failed: {(e.stderr or b'').decode(errors='replace') or e}",
                datetime.now(timezone.utc).isoformat(),
                task["id"],
            ),
        )
        conn.commit()
        conn.close()
        return

    # Dry-run short-circuit: no claude spawn, no spend, just simulate the artifact.
    if dry:
        (worktree_path / "SUMMARY.md").write_text(
            f"# Dry-run summary\n\n"
            f"Task: {task['id']}\nProduct: {task['product']}\nPrompt: {task['prompt_id']}\n\n"
            "This is a Switch --dry simulation. No Claude agent ran. "
            "The orchestration pipeline (worktree → commit → push → preview-URL lookup → approval gate) "
            "is being exercised end to end without any API spend.\n"
        )
        porcelain_dry = "M  SUMMARY.md"  # truthy
        subprocess.run(["git", "-C", str(worktree_path), "add", "-A"], capture_output=True)
        subprocess.run(
            ["git", "-C", str(worktree_path), "commit", "-m",
             f"Switch dry-run: {task['prompt_id']} ({task['id']})"],
            capture_output=True,
        )
        conn = sqlite3.connect(STATE_DB)
        conn.execute(
            "UPDATE tasks SET status='awaiting_approval', preview_url=?, cost_usd=0, finished_at=? WHERE id=?",
            ("(dry-run — no preview)", datetime.now(timezone.utc).isoformat(), task["id"]),
        )
        conn.commit()
        conn.close()
        return

    system_append = build_system_prompt_append(task["product"], rules)
    budget = task.get("max_budget_usd") or mode_cfg["max_budget_usd_per_agent"]
    model = task.get("model") or config.get("default_model", "claude-sonnet-4-6")

    cmd: list[str] = [
        "claude",
        "-p",
        prompt_text,
        "--output-format",
        "stream-json",
        "--verbose",  # required with stream-json
        "--add-dir",
        str(worktree_path),
        "--permission-mode",
        "acceptEdits",
        "--max-budget-usd",
        str(budget),
        "--append-system-prompt",
        system_append,
        "--model",
        model,
        "--no-session-persistence",
        "--name",
        f"switch-{task['product']}-{task['id']}",
    ]

    allowed = rules.get("allowed_tools") or []
    if allowed:
        cmd.append("--allowedTools")
        cmd.extend(allowed)
    disallowed = rules.get("disallowed_tools") or []
    if disallowed:
        cmd.append("--disallowedTools")
        cmd.extend(disallowed)

    log_path = LOGS_DIR / f"{task['id']}.log"
    cost = 0.0
    tokens_in = 0
    tokens_out = 0
    exit_code = -1

    with open(log_path, "w") as logf:
        logf.write(
            f"# Switch agent log\n# Task: {task['id']}\n# Product: {task['product']}\n"
            f"# Started: {datetime.now(timezone.utc).isoformat()}\n"
            f"# Command: {shlex.join(cmd)}\n\n"
        )
        logf.flush()

        # 16MB stdout buffer — stream-json events can be very large (tool results,
        # file contents). Asyncio's default 64KB caused LimitOverrunError that
        # killed the orchestrator mid-fleet on 2026-05-21.
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(worktree_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            limit=16 * 1024 * 1024,
        )
        assert proc.stdout is not None
        while True:
            try:
                line = await proc.stdout.readline()
            except (ValueError, asyncio.LimitOverrunError):
                # Buffer overflow on a single giant line. Drain the raw bytes
                # to clear the buffer and continue. We'll still pick up the
                # final cost from the result event in the log file later.
                try:
                    await proc.stdout.read(16 * 1024 * 1024)
                except Exception:
                    pass
                continue
            if not line:
                break
            decoded = line.decode(errors="replace")
            logf.write(decoded)
            logf.flush()
            try:
                event = json.loads(decoded)
            except json.JSONDecodeError:
                continue
            if not isinstance(event, dict):
                continue
            if event.get("type") == "result":
                cost = float(event.get("total_cost_usd", cost) or cost)
                usage = event.get("usage") or {}
                tokens_in = int(usage.get("input_tokens", tokens_in) or tokens_in)
                tokens_out = int(usage.get("output_tokens", tokens_out) or tokens_out)
        exit_code = await proc.wait()

    # Commit + push (if any changes exist)
    porcelain = subprocess.run(
        ["git", "-C", str(worktree_path), "status", "--porcelain"],
        capture_output=True,
        text=True,
    ).stdout.strip()

    preview_url: str | None = None
    if porcelain:
        subprocess.run(["git", "-C", str(worktree_path), "add", "-A"], check=False, capture_output=True)
        subprocess.run(
            [
                "git",
                "-C",
                str(worktree_path),
                "commit",
                "-m",
                f"Switch: {task['prompt_id']} ({task['id']})\n\nProduct: {task['product']}\nGenerated by Switch orchestrator.",
            ],
            check=False,
            capture_output=True,
        )
        remotes = subprocess.run(
            ["git", "-C", str(worktree_path), "remote"], capture_output=True, text=True
        ).stdout.strip()
        if remotes:
            push = subprocess.run(
                ["git", "-C", str(worktree_path), "push", "-u", "origin", branch],
                capture_output=True,
                text=True,
            )
            if product_cfg.get("deploy") == "vercel" and mode_cfg.get("auto_preview_deploy", True) and push.returncode == 0:
                # Vercel auto-builds a preview on push when the project is linked.
                # Try to resolve the live URL; otherwise leave a hint.
                resolved = resolve_vercel_preview_url(product_path, branch)
                preview_url = resolved or f"(vercel preview building for {branch})"

    if exit_code != 0:
        status = "failed"
    elif not porcelain:
        status = "no_changes"
    else:
        status = "awaiting_approval"

    conn = sqlite3.connect(STATE_DB)
    conn.execute(
        "UPDATE tasks SET status=?, preview_url=?, cost_usd=?, tokens_input=?, tokens_output=?, finished_at=? WHERE id=?",
        (
            status,
            preview_url,
            cost,
            tokens_in,
            tokens_out,
            datetime.now(timezone.utc).isoformat(),
            task["id"],
        ),
    )
    conn.commit()
    conn.close()


async def run_fleet(config: dict, dry: bool = False) -> None:
    mode_cfg = config["modes"][config["mode"]]
    max_concurrent = int(mode_cfg["max_concurrent_agents"])

    conn = sqlite3.connect(STATE_DB)
    queued = list(
        conn.execute(
            "SELECT id, product, prompt_id, context, model, max_budget_usd "
            "FROM tasks WHERE status='queued' ORDER BY created_at"
        )
    )
    conn.close()

    if not queued:
        print("Switch: no queued tasks. Add one with: switch task add <product> <prompt-id> \"context...\"")
        return

    # Session-budget cap (cautious mode only — hard stop)
    if mode_cfg.get("metering") == "hard_cap":
        cap = float(mode_cfg.get("session_budget_usd_cap", 0))
        if cap > 0:
            conn = sqlite3.connect(STATE_DB)
            already = session_spend(conn)
            conn.close()
            if already >= cap:
                print(f"Switch: session spend ${already:.2f} >= cap ${cap:.2f}. Refusing to launch new agents.")
                print("Switch to a metered mode with: switch mode working")
                return

    sem = asyncio.Semaphore(max_concurrent)
    tasks_data = [
        {
            "id": r[0],
            "product": r[1],
            "prompt_id": r[2],
            "context": r[3] or "",
            "model": r[4],
            "max_budget_usd": r[5],
        }
        for r in queued
    ]

    dry_tag = " [DRY]" if dry else ""
    print(
        f"Switch: launching {len(tasks_data)} agent(s){dry_tag} "
        f"(mode={config['mode']}, max concurrent={max_concurrent})"
    )

    async def with_sem(task: dict) -> None:
        async with sem:
            await run_agent(config, task, dry=dry)

    await asyncio.gather(*(with_sem(t) for t in tasks_data))
    print("Switch: fleet finished. Run `switch dashboard` or `switch status` to review.")


if __name__ == "__main__":
    # Self-check
    init_db()
    cfg = load_config()
    print(f"Switch self-check OK")
    print(f"  mode: {cfg['mode']}")
    print(f"  products: {list(cfg['products'].keys())}")
    print(f"  state db: {STATE_DB}")
