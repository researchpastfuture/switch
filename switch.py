"""Switch CLI — parallel Claude Code orchestrator for AF mission products.

Run as:  python ~/switch/switch.py <command> [args]
Or alias: alias switch='python3 ~/switch/switch.py'

Commands:
  init                                    Set up products (git init where missing)
  mode [cautious|working|production]      Show or set the current mode
  task add <product> <prompt-id> [ctx...] Queue a task
                                            [--model M] [--budget $]
  task list                               List all tasks
  task remove <task-id>                   Remove a queued task
  task load                               Load any seeds from tasks.yml into the queue
  run [--dry]                             Launch the fleet (--dry = no API spend, simulate only)
  dashboard                               Live terminal view
  web [--host H] [--port P]               Flask web dashboard (default localhost:7777)
  logs <task-id>                          Print an agent's full log
  tail <task-id>                          tail -f the live agent log
  status                                  Snapshot
  budget                                  Show today's spend vs mode thresholds
  approve <task-id>                       Merge approved task (enforces protected paths + secret scan)
  reject <task-id>                        Discard task's branch and worktree
  ask "..."                               AI plans and queues task(s) from natural language
  plan "..."                              Alias for ask
  app [--install]                         Open Switch as a desktop app (macOS)
"""

from __future__ import annotations

import argparse
import asyncio
import json
import subprocess
import sqlite3
import sys
from pathlib import Path

# Make orchestrator + dashboard importable when run as a script
sys.path.insert(0, str(Path(__file__).resolve().parent))

from orchestrator import (
    LOGS_DIR,
    SWITCH_ROOT,
    STATE_DB,
    approve_task,
    detect_default_branch,
    expand_path,
    init_db,
    load_config,
    load_tasks_file,
    queue_task,
    reject_task,
    remove_worktree,
    run_fleet,
    save_config,
    session_spend,
)


def cmd_init(_args) -> None:
    config = load_config()
    init_db()
    print("Switch: initializing products")
    for name, pcfg in config["products"].items():
        path = expand_path(pcfg["path"])
        if not path.exists():
            print(f"  !  {name:22s} {path} does not exist — skipping")
            continue
        if not (path / ".git").exists():
            print(f"  →  {name:22s} initializing git in {path}")
            subprocess.run(["git", "-C", str(path), "init"], check=True, capture_output=True)
            subprocess.run(["git", "-C", str(path), "add", "-A"], check=True, capture_output=True)
            r = subprocess.run(
                ["git", "-C", str(path), "commit", "-m", "Initial commit (Switch setup)"],
                capture_output=True,
                text=True,
            )
            if r.returncode != 0 and "nothing to commit" not in (r.stdout + r.stderr):
                print(f"     (commit note: {r.stderr.strip() or r.stdout.strip()})")
        else:
            base = detect_default_branch(path)
            print(f"  ✓  {name:22s} git OK (default branch: {base})")
    print("Switch init complete.")


def cmd_mode(args) -> None:
    cfg = load_config()
    if args.mode_name is None:
        print(f"Current mode: {cfg['mode']}")
        for name, m in cfg["modes"].items():
            star = "  ← current" if name == cfg["mode"] else ""
            print(
                f"  {name:12s} concurrent={m['max_concurrent_agents']:>2}  "
                f"budget_per_agent=${m['max_budget_usd_per_agent']:<5}  "
                f"metering={m['metering']}{star}"
            )
        return
    if args.mode_name not in cfg["modes"]:
        print(f"Unknown mode: {args.mode_name}. Available: {list(cfg['modes'].keys())}")
        sys.exit(1)
    cfg["mode"] = args.mode_name
    save_config(cfg)
    print(f"Mode set to: {args.mode_name}")


def cmd_task_add(args) -> None:
    conn = init_db()
    cfg = load_config()
    if args.product not in cfg["products"]:
        print(f"Unknown product: {args.product}. Available: {list(cfg['products'].keys())}")
        sys.exit(1)
    context = " ".join(args.context) if args.context else ""
    task_id = queue_task(
        conn,
        args.product,
        args.prompt_id,
        context,
        model=args.model,
        max_budget_usd=args.budget,
    )
    extras = []
    if args.model: extras.append(f"model={args.model}")
    if args.budget: extras.append(f"budget=${args.budget}")
    extra_str = f"  ({', '.join(extras)})" if extras else ""
    print(f"queued  {task_id}  {args.product}/{args.prompt_id}{extra_str}")


def cmd_task_list(_args) -> None:
    conn = init_db()
    rows = list(
        conn.execute(
            "SELECT id, product, prompt_id, status, cost_usd, preview_url, branch "
            "FROM tasks ORDER BY created_at DESC"
        )
    )
    if not rows:
        print("(no tasks)")
        return
    print(f"  {'ID':10s} {'PRODUCT':20s} {'PROMPT':24s} {'STATUS':20s} {'$':>8s}  HINT")
    for r in rows:
        cost = f"${r[4]:.2f}" if r[4] else "-"
        hint = r[5] or r[6] or ""
        print(f"  {r[0]:10s} {r[1]:20s} {r[2]:24s} {r[3]:20s} {cost:>8s}  {hint}")


def cmd_task_remove(args) -> None:
    conn = init_db()
    cur = conn.execute("DELETE FROM tasks WHERE id=? AND status='queued'", (args.task_id,))
    conn.commit()
    if cur.rowcount == 0:
        print(f"No queued task with id {args.task_id} (use approve/reject for running or finished tasks)")
    else:
        print(f"Removed queued task {args.task_id}")


def cmd_ask(args) -> None:
    from ai_planner import format_plan, plan_from_natural_language

    request = " ".join(args.request).strip()
    if not request:
        print("Usage: switch ask \"<what you want done>\"")
        sys.exit(1)

    try:
        plan = plan_from_natural_language(request)
    except (RuntimeError, ValueError, json.JSONDecodeError) as e:
        print(f"! planner failed: {e}")
        sys.exit(1)

    print(format_plan(plan))
    if args.dry_plan:
        print("\n(dry plan — nothing queued)")
        return

    if not args.yes:
        try:
            answer = input("\nQueue these task(s)? [y/N] ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print("\ncancelled")
            sys.exit(1)
        if answer not in ("y", "yes"):
            print("cancelled")
            return

    conn = init_db()
    ids: list[str] = []
    for t in plan.tasks:
        task_id = queue_task(
            conn,
            t.product,
            t.prompt_id,
            t.context,
            model=t.model,
            max_budget_usd=t.max_budget_usd,
        )
        ids.append(task_id)
        print(f"queued  {task_id}  {t.product}/{t.prompt_id}")

    if args.run:
        cfg = load_config()
        asyncio.run(run_fleet(cfg, dry=getattr(args, "dry", False)))
    elif ids:
        print(f"\n{len(ids)} task(s) queued. Run with: switch run")


def cmd_task_load(_args) -> None:
    conn = init_db()
    cfg = load_config()
    seeds = load_tasks_file()
    if not seeds:
        print("tasks.yml has no seeds. Nothing to load.")
        return
    added = 0
    for t in seeds:
        if t.get("product") not in cfg["products"]:
            print(f"  skip: unknown product '{t.get('product')}'")
            continue
        task_id = queue_task(
            conn,
            t["product"],
            t["prompt"],
            context=t.get("context", "") or "",
            model=t.get("model"),
            max_budget_usd=t.get("max_budget_usd"),
        )
        print(f"  queued  {task_id}  {t['product']}/{t['prompt']}")
        added += 1
    print(f"Loaded {added} task(s) from tasks.yml")


def cmd_run(args) -> None:
    init_db()
    cfg = load_config()
    asyncio.run(run_fleet(cfg, dry=getattr(args, "dry", False)))


def cmd_approve(args) -> None:
    init_db()
    ok, msg = approve_task(args.task_id)
    print(("✓ " if ok else "! ") + msg)
    if not ok:
        sys.exit(1)


def cmd_reject(args) -> None:
    init_db()
    ok, msg = reject_task(args.task_id)
    print(("✗ " if ok else "! ") + msg)
    if not ok:
        sys.exit(1)


def cmd_logs(args) -> None:
    log_path = LOGS_DIR / f"{args.task_id}.log"
    if not log_path.exists():
        print(f"No log for task {args.task_id} at {log_path}")
        sys.exit(1)
    sys.stdout.write(log_path.read_text())


def cmd_tail(args) -> None:
    log_path = LOGS_DIR / f"{args.task_id}.log"
    if not log_path.exists():
        print(f"No log for task {args.task_id} at {log_path}")
        sys.exit(1)
    # Hand off to system tail -f
    os_exec = subprocess.run(["tail", "-f", str(log_path)])
    sys.exit(os_exec.returncode)


def cmd_app(args) -> None:
    if args.install:
        script = SWITCH_ROOT / "scripts" / "build-macos-app.sh"
        if not script.exists():
            print(f"! missing build script: {script}")
            sys.exit(1)
        r = subprocess.run(["sh", str(script), "--install"], cwd=str(SWITCH_ROOT))
        sys.exit(r.returncode)

    if args.build:
        script = SWITCH_ROOT / "scripts" / "build-macos-app.sh"
        r = subprocess.run(["sh", str(script)], cwd=str(SWITCH_ROOT))
        sys.exit(r.returncode)

    try:
        from desktop import run_desktop
    except ImportError as e:
        print(f"Switch app requires pywebview: ~/switch/.venv/bin/pip install pywebview  ({e})")
        sys.exit(1)
    run_desktop(host=args.host, port=args.port)


def cmd_web(args) -> None:
    try:
        from web import run_web
    except ImportError as e:
        print(f"web dashboard requires `flask`: pip install flask  ({e})")
        sys.exit(1)
    run_web(
        host=args.host, port=args.port,
        open_browser=not args.no_open,
        foreground=args.foreground,
    )


def cmd_web_stop(_args) -> None:
    try:
        from web import stop_daemon
    except ImportError as e:
        print(f"web stop needs Flask installed ({e})")
        sys.exit(1)
    ok, msg = stop_daemon()
    print(("✓ " if ok else "! ") + msg)
    sys.exit(0 if ok else 1)


def cmd_web_status(_args) -> None:
    from web import daemon_is_running, PID_FILE
    pid = daemon_is_running()
    if pid:
        print(f"Switch web is running (pid {pid}) — http://127.0.0.1:7777")
    else:
        print(f"Switch web is not running. Start it with: switch web")


def cmd_status(_args) -> None:
    conn = init_db()
    cfg = load_config()
    print(f"Switch — mode: {cfg['mode']}")
    counts = dict(conn.execute("SELECT status, COUNT(*) FROM tasks GROUP BY status").fetchall())
    for s in ("queued", "running", "awaiting_approval", "approved", "rejected", "failed", "no_changes"):
        if counts.get(s):
            print(f"  {s:20s} {counts[s]}")
    total = conn.execute("SELECT COALESCE(SUM(cost_usd),0) FROM tasks").fetchone()[0]
    today = session_spend(conn)
    print(f"  total spend (all time): ${total:.2f}")
    print(f"  today's spend:          ${today:.2f}")


def cmd_budget(_args) -> None:
    conn = init_db()
    cfg = load_config()
    mode_cfg = cfg["modes"][cfg["mode"]]
    today = session_spend(conn)
    print(f"Mode: {cfg['mode']} ({mode_cfg['metering']})")
    print(f"Today's spend: ${today:.2f}")
    if mode_cfg["metering"] == "hard_cap":
        cap = mode_cfg.get("session_budget_usd_cap", 0)
        print(f"Hard cap:      ${cap}  ({'over' if today >= cap else 'under'})")
    else:
        thresholds = mode_cfg.get("alert_thresholds_usd", [])
        crossed = [t for t in thresholds if today >= t]
        print(f"Alert thresholds: {thresholds}")
        if crossed:
            print(f"  crossed: {crossed}")


def cmd_dashboard(_args) -> None:
    try:
        from dashboard import run_dashboard
    except ImportError as e:
        print(f"dashboard requires `rich`: pip install rich  ({e})")
        sys.exit(1)
    run_dashboard()


def main() -> None:
    p = argparse.ArgumentParser(
        prog="switch",
        description="AI-powered parallel Claude Code orchestrator (Switch)",
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init").set_defaults(func=cmd_init)

    p_mode = sub.add_parser("mode")
    p_mode.add_argument("mode_name", nargs="?")
    p_mode.set_defaults(func=cmd_mode)

    p_task = sub.add_parser("task")
    task_sub = p_task.add_subparsers(dest="task_cmd", required=True)
    p_add = task_sub.add_parser("add")
    p_add.add_argument("product")
    p_add.add_argument("prompt_id")
    p_add.add_argument("context", nargs="*")
    p_add.add_argument("--model", help="Override default model (e.g. claude-opus-4-7 for hard tasks)")
    p_add.add_argument("--budget", type=float, help="Per-task budget cap in USD (overrides mode default)")
    p_add.set_defaults(func=cmd_task_add)
    task_sub.add_parser("list").set_defaults(func=cmd_task_list)
    p_rm = task_sub.add_parser("remove")
    p_rm.add_argument("task_id")
    p_rm.set_defaults(func=cmd_task_remove)
    task_sub.add_parser("load").set_defaults(func=cmd_task_load)

    p_run = sub.add_parser("run")
    p_run.add_argument("--dry", action="store_true",
                       help="Simulate fleet (creates worktrees + commits placeholder) without spawning real Claude agents")
    p_run.set_defaults(func=cmd_run)

    p_app = sub.add_parser("approve")
    p_app.add_argument("task_id")
    p_app.set_defaults(func=cmd_approve)

    p_rej = sub.add_parser("reject")
    p_rej.add_argument("task_id")
    p_rej.set_defaults(func=cmd_reject)

    p_logs = sub.add_parser("logs")
    p_logs.add_argument("task_id")
    p_logs.set_defaults(func=cmd_logs)

    p_tail = sub.add_parser("tail")
    p_tail.add_argument("task_id")
    p_tail.set_defaults(func=cmd_tail)

    p_web = sub.add_parser("web", help="Start the web dashboard (background daemon by default)")
    p_web.add_argument("--host", default="127.0.0.1")
    p_web.add_argument("--port", type=int, default=7777)
    p_web.add_argument("--no-open", action="store_true",
                       help="Don't auto-open the browser; just start the server")
    p_web.add_argument("--foreground", "-f", action="store_true",
                       help="Run Flask in this process (Ctrl+C to stop) instead of as a background daemon")
    p_web.set_defaults(func=cmd_web)

    sub.add_parser("web-stop", help="Stop the background web dashboard").set_defaults(func=cmd_web_stop)
    sub.add_parser("web-status", help="Show whether the web dashboard daemon is running").set_defaults(func=cmd_web_status)

    p_ask = sub.add_parser("ask", help="AI plans and queues task(s) from natural language")
    p_ask.add_argument("request", nargs="+", help="What you want done, in plain English")
    p_ask.add_argument("--dry-plan", action="store_true", help="Show the AI plan without queuing")
    p_ask.add_argument("-y", "--yes", action="store_true", help="Queue without confirmation")
    p_ask.add_argument("--run", action="store_true", help="Queue and immediately run the fleet")
    p_ask.add_argument("--dry", action="store_true", help="With --run: simulate agents without API spend")
    p_ask.set_defaults(func=cmd_ask)

    p_plan = sub.add_parser("plan", help="Alias for ask")
    p_plan.add_argument("request", nargs="+")
    p_plan.add_argument("--dry-plan", action="store_true")
    p_plan.add_argument("-y", "--yes", action="store_true")
    p_plan.add_argument("--run", action="store_true")
    p_plan.add_argument("--dry", action="store_true")
    p_plan.set_defaults(func=cmd_ask)

    p_app = sub.add_parser("app", help="Open Switch as a native desktop app")
    p_app.add_argument("--host", default="127.0.0.1")
    p_app.add_argument("--port", type=int, default=7777)
    p_app.add_argument("--build", action="store_true", help="Build Switch.app to ~/switch/dist/")
    p_app.add_argument("--install", action="store_true", help="Build and install to ~/Applications/")
    p_app.set_defaults(func=cmd_app)

    sub.add_parser("status").set_defaults(func=cmd_status)
    sub.add_parser("budget").set_defaults(func=cmd_budget)
    sub.add_parser("dashboard").set_defaults(func=cmd_dashboard)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
