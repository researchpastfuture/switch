"""Switch web dashboard — Flask app at localhost:7777 (by default).

Same view as the TUI dashboard, with one-click approve/reject. Bind to 0.0.0.0
if you want to see it from another device on your LAN.

Run via: switch web [--host H] [--port P]
"""

from __future__ import annotations

import asyncio
import os
import platform
import signal
import sqlite3
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, redirect, request, url_for

from ai_planner import plan_from_natural_language
from orchestrator import (
    LOGS_DIR,
    STATE_DB,
    SWITCH_ROOT,
    approve_task,
    init_db,
    load_config,
    queue_task,
    reject_task,
    run_fleet,
    save_config,
    session_spend,
)

PID_FILE = SWITCH_ROOT / "state" / "web.pid"
WEB_LOG = LOGS_DIR / "web.log"

app = Flask(__name__)

_fleet_lock = threading.Lock()
_fleet_running = False

STATUS_STYLES = {
    "queued":            ("queued",            "#888"),
    "running":           ("running",           "#2b7fff"),
    "awaiting_approval": ("awaiting approval", "#d49b00"),
    "approved":          ("approved ✓",        "#1f9e3a"),
    "rejected":          ("rejected ✗",        "#c14b4b"),
    "failed":            ("failed",            "#c14b4b"),
    "no_changes":        ("no changes",        "#888"),
}


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Switch">
<title>Switch</title>
<link rel="manifest" href="/manifest.json">
<style>
  * {{ box-sizing: border-box; }}
  body {{ font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0d1117; color: #e6edf3; margin: 0; }}
  .app {{ max-width: 1400px; margin: 0 auto; padding: 20px 24px 32px; }}
  .topbar {{ display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }}
  .brand {{ font-size: 20px; font-weight: 600; letter-spacing: -0.02em; margin-right: auto; }}
  .brand small {{ font-size: 11px; font-weight: 500; background: linear-gradient(90deg, #1f6feb, #8957e5); color: #fff; padding: 3px 8px; border-radius: 999px; margin-left: 8px; vertical-align: middle; }}
  .toolbar {{ display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }}
  select, button, input {{ font: inherit; }}
  select {{ background: #161b22; color: #e6edf3; border: 1px solid #30363d; border-radius: 6px; padding: 7px 10px; }}
  button {{ background: #21262d; color: #e6edf3; border: 1px solid #30363d; padding: 7px 12px; border-radius: 6px; cursor: pointer; }}
  button:hover {{ border-color: #58a6ff; }}
  button.primary {{ background: #1f6feb; border-color: #388bfd; color: #fff; }}
  button.primary:hover {{ background: #388bfd; }}
  button:disabled {{ opacity: 0.5; cursor: not-allowed; }}
  .statusline {{ color: #8b949e; font-size: 12px; margin-bottom: 14px; font-family: "SF Mono", Menlo, monospace; }}
  .ai-bar {{ background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 14px 16px; margin-bottom: 18px; }}
  .ai-bar label {{ display: block; color: #8b949e; font-size: 12px; margin-bottom: 8px; }}
  .ai-row {{ display: flex; gap: 8px; }}
  .ai-row input[type=text] {{ flex: 1; background: #0d1117; color: #e6edf3; border: 1px solid #30363d; border-radius: 6px; padding: 10px 12px; }}
  .ai-row input[type=text]:focus {{ outline: none; border-color: #58a6ff; }}
  table {{ border-collapse: collapse; width: 100%; background: #0d1117; }}
  th, td {{ text-align: left; padding: 10px 12px; border-bottom: 1px solid #21262d; }}
  th {{ color: #8b949e; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }}
  tr:hover {{ background: #161b22; }}
  .id {{ font-family: "SF Mono", Menlo, monospace; color: #58a6ff; }}
  .product {{ color: #d2a8ff; }}
  .cost {{ text-align: right; font-variant-numeric: tabular-nums; }}
  .preview a {{ color: #1f9e3a; text-decoration: none; }}
  form {{ display: inline; margin: 0; }}
  .approve {{ color: #1f9e3a; border-color: #1f9e3a; }}
  .reject {{ color: #c14b4b; border-color: #c14b4b; }}
  .empty {{ color: #8b949e; padding: 40px; text-align: center; }}
  .totals {{ margin-top: 16px; color: #8b949e; font-size: 12px; }}
  .flash {{ margin-bottom: 12px; padding: 10px 12px; border-radius: 8px; font-size: 13px; }}
  .flash.ok {{ background: #122117; border: 1px solid #1f9e3a; color: #7ee787; }}
  .flash.err {{ background: #2d1214; border: 1px solid #c14b4b; color: #ffa198; }}
  .card {{ border: 1px solid #21262d; border-radius: 10px; overflow: hidden; }}
  .cloud-banner {{ background: #1c2128; border: 1px solid #30363d; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; color: #8b949e; font-size: 13px; }}
</style>
</head>
<body>
<div class="app">
  <div class="topbar">
    <div class="brand">Switch<small>AI</small></div>
    <div class="toolbar">
      <select id="mode-select" aria-label="Mode"></select>
      <label style="color:#8b949e;font-size:12px;display:flex;align-items:center;gap:6px;">
        <input type="checkbox" id="dry-run"> dry run
      </label>
      <button class="primary" id="run-btn">Run fleet</button>
    </div>
  </div>
  <div class="statusline" id="statusline">loading…</div>
  <div id="cloud-banner" class="cloud-banner" style="display:none">
    Cloud dashboard — view tasks and spend. Run agents locally with <code>switch app</code> or <code>switch run</code>.
  </div>
  <div id="flash"></div>
  <div class="ai-bar">
    <label for="ask">Describe what you want — AI picks product, prompt, and queues the task</label>
    <form method="post" action="/ask" class="ai-row" id="ask-form">
      <input id="ask" type="text" name="request" placeholder="e.g. do an accessibility pass on whiteboard lesson templates" required>
      <button type="submit">Plan &amp; queue</button>
    </form>
  </div>
  <div class="card">
    <div id="table-wrap"><div class="empty">loading tasks…</div></div>
  </div>
  <div class="totals" id="totals"></div>
</div>
<script>
const STATUS = {json_status_map};
const MODES = {modes_json};

function esc(s) {{
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
}}

function statusHtml(status) {{
  const [label, color] = STATUS[status] || [status, '#e6edf3'];
  return `<span style="color:${{color}}">${{esc(label)}}</span>`;
}}

function previewHtml(url, branch) {{
  if (!url && !branch) return '';
  if (url && url.startsWith('http')) return `<a href="${{esc(url)}}" target="_blank">${{esc(url)}}</a>`;
  return esc(url || branch || '');
}}

function rowActions(id, status) {{
  if (!['awaiting_approval','no_changes'].includes(status)) return '';
  return `<form method="post" action="/approve/${{id}}"><button class="approve">approve</button></form> `
       + `<form method="post" action="/reject/${{id}}"><button class="reject">reject</button></form>`;
}}

function renderTable(tasks) {{
  const wrap = document.getElementById('table-wrap');
  if (!tasks.length) {{
    wrap.innerHTML = '<div class="empty">No tasks yet — describe one above or run <code>switch ask "..."</code></div>';
    return;
  }}
  const rows = tasks.map(t => `<tr>
    <td class="id">${{esc(t.id)}}</td>
    <td class="product">${{esc(t.product)}}</td>
    <td>${{esc(t.prompt_id)}}</td>
    <td>${{statusHtml(t.status)}}</td>
    <td class="cost">$${{(t.cost_usd || 0).toFixed(2)}}</td>
    <td class="cost" style="color:#8b949e">${{t.tokens_input || 0}}/${{t.tokens_output || 0}}</td>
    <td class="preview">${{previewHtml(t.preview_url, t.branch)}}</td>
    <td>${{rowActions(t.id, t.status)}}</td>
  </tr>`).join('');
  wrap.innerHTML = `<table><thead><tr>
    <th>ID</th><th>Product</th><th>Prompt</th><th>Status</th><th>$</th><th>In/Out</th><th>Preview</th><th></th>
  </tr></thead><tbody>${{rows}}</tbody></table>`;
}}

function renderModes(current) {{
  const sel = document.getElementById('mode-select');
  sel.innerHTML = MODES.map(m => `<option value="${{esc(m)}}"${{m === current ? ' selected' : ''}}>${{esc(m)}}</option>`).join('');
}}

async function refresh() {{
  try {{
    const r = await fetch('/api/tasks');
    const d = await r.json();
    renderModes(d.mode);
    document.getElementById('run-btn').disabled = d.fleet_running || d.cloud;
    if (d.cloud) {{
      document.getElementById('cloud-banner').style.display = 'block';
      document.getElementById('ask-form').style.opacity = '0.5';
      document.getElementById('ask').disabled = true;
    }}
    const summary = Object.entries(d.summary || {{}}).map(([k,v]) => `${{k}}: ${{v}}`).join('  ') || '(empty)';
    document.getElementById('statusline').textContent =
      `${{d.now}}    ${{summary}}${{d.fleet_running ? '    fleet running…' : ''}}`;
    document.getElementById('totals').textContent =
      `total spend: $${{d.total.toFixed(2)}}    today: $${{d.today.toFixed(2)}}`;
    renderTable(d.tasks || []);
  }} catch (e) {{
    document.getElementById('statusline').textContent = 'connection error — retrying…';
  }}
}}

document.getElementById('mode-select').addEventListener('change', async (e) => {{
  await fetch('/api/mode', {{
    method: 'POST',
    headers: {{'Content-Type': 'application/json'}},
    body: JSON.stringify({{mode: e.target.value}}),
  }});
  refresh();
}});

document.getElementById('run-btn').addEventListener('click', async () => {{
  const dry = document.getElementById('dry-run').checked;
  const btn = document.getElementById('run-btn');
  btn.disabled = true;
  const r = await fetch('/api/run', {{
    method: 'POST',
    headers: {{'Content-Type': 'application/json'}},
    body: JSON.stringify({{dry}}),
  }});
  const d = await r.json();
  const flash = document.getElementById('flash');
  flash.className = 'flash ' + (d.ok ? 'ok' : 'err');
  flash.textContent = d.message || (d.ok ? 'fleet started' : 'fleet failed');
  refresh();
}});

const params = new URLSearchParams(location.search);
if (params.get('flash')) {{
  const flash = document.getElementById('flash');
  flash.className = 'flash ' + (params.get('kind') || 'ok');
  flash.textContent = params.get('flash');
  history.replaceState(null, '', '/');
}}

refresh();
setInterval(refresh, 3000);
</script>
</body>
</html>"""


def _cloud_mode() -> bool:
    return os.environ.get("SWITCH_CLOUD", "").lower() in ("1", "true", "yes")


def _cloud_block(action: str) -> tuple[bool, str]:
    if _cloud_mode():
        return False, (
            f"{action} runs on your Mac via the Switch CLI — this Vercel dashboard is read-only. "
            "Install locally: switch app"
        )
    return True, ""


def _tasks_payload() -> dict:
    global _fleet_running
    payload = _tasks_payload_inner()
    payload["cloud"] = _cloud_mode()
    return payload


def _tasks_payload_inner() -> dict:
    global _fleet_running
    cfg = load_config()
    conn = sqlite3.connect(STATE_DB)
    rows = list(conn.execute(
        "SELECT id, product, prompt_id, status, cost_usd, tokens_input, tokens_output, "
        "preview_url, branch FROM tasks ORDER BY created_at DESC LIMIT 80"
    ))
    total = float(conn.execute("SELECT COALESCE(SUM(cost_usd),0) FROM tasks").fetchone()[0])
    today = float(session_spend(conn))
    conn.close()

    summary: dict[str, int] = {}
    tasks = []
    for r in rows:
        summary[r[3]] = summary.get(r[3], 0) + 1
        tasks.append({
            "id": r[0],
            "product": r[1],
            "prompt_id": r[2],
            "status": r[3],
            "cost_usd": float(r[4] or 0),
            "tokens_input": r[5] or 0,
            "tokens_output": r[6] or 0,
            "preview_url": r[7],
            "branch": r[8],
        })

    return {
        "mode": cfg["mode"],
        "modes": list(cfg["modes"].keys()),
        "now": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "summary": summary,
        "total": total,
        "today": today,
        "fleet_running": _fleet_running,
        "tasks": tasks,
    }


def _start_fleet_background(dry: bool = False) -> tuple[bool, str]:
    ok, msg = _cloud_block("Fleet run")
    if not ok:
        return ok, msg
    global _fleet_running
    with _fleet_lock:
        if _fleet_running:
            return False, "fleet already running"
        conn = sqlite3.connect(STATE_DB)
        queued = conn.execute("SELECT COUNT(*) FROM tasks WHERE status='queued'").fetchone()[0]
        conn.close()
        if not queued:
            return False, "no queued tasks — describe one above or run switch ask"
        _fleet_running = True

    def worker() -> None:
        global _fleet_running
        try:
            cfg = load_config()
            asyncio.run(run_fleet(cfg, dry=dry))
        finally:
            with _fleet_lock:
                _fleet_running = False

    threading.Thread(target=worker, daemon=True).start()
    tag = " (dry run)" if dry else ""
    return True, f"fleet started{tag} — {queued} task(s) queued"


def _render_page() -> str:
    import json
    cfg = load_config()
    status_map = json.dumps(STATUS_STYLES)
    modes_json = json.dumps(list(cfg["modes"].keys()))
    return PAGE.format(json_status_map=status_map, modes_json=modes_json)


@app.route("/manifest.json")
def manifest():
    return jsonify({
        "name": "Switch",
        "short_name": "Switch",
        "description": "AI-powered parallel agent orchestrator",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#0d1117",
        "theme_color": "#1f6feb",
    })


@app.route("/api/tasks")
def api_tasks():
    try:
        return jsonify(_tasks_payload())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/mode", methods=["POST"])
def api_mode():
    data = request.get_json(silent=True) or {}
    mode = (data.get("mode") or "").strip()
    cfg = load_config()
    if mode not in cfg["modes"]:
        return jsonify({"ok": False, "message": f"unknown mode: {mode}"}), 400
    cfg["mode"] = mode
    save_config(cfg)
    return jsonify({"ok": True, "mode": mode})


@app.route("/api/run", methods=["POST"])
def api_run():
    data = request.get_json(silent=True) or {}
    dry = bool(data.get("dry"))
    ok, msg = _start_fleet_background(dry=dry)
    return jsonify({"ok": ok, "message": msg}), (200 if ok else 409)


@app.route("/ping")
def ping():
    return "ok"


@app.route("/")
def index():
    try:
        load_config()
    except Exception as e:
        return f"<pre>Switch config error: {e}</pre>", 500
    return _render_page()


@app.route("/ask", methods=["POST"])
def ask():
    ok, msg = _cloud_block("Task planning")
    if not ok:
        return redirect(url_for("index", flash=msg, kind="err"))
    text = (request.form.get("request") or "").strip()
    if not text:
        return redirect(url_for("index", flash="empty request", kind="err"))
    try:
        cfg = load_config()
        plan = plan_from_natural_language(text, cfg)
        conn = init_db()
        ids = []
        for t in plan.tasks:
            tid = queue_task(
                conn,
                t.product,
                t.prompt_id,
                t.context,
                model=t.model,
                max_budget_usd=t.max_budget_usd,
            )
            ids.append(tid)
        msg = f"AI queued {len(ids)} task(s): {', '.join(ids)} — {plan.summary}"
        return redirect(url_for("index", flash=msg, kind="ok"))
    except Exception as e:
        return redirect(url_for("index", flash=f"planner failed: {e}", kind="err"))


@app.route("/approve/<task_id>", methods=["POST"])
def approve(task_id: str):
    ok, msg = approve_task(task_id)
    return redirect(request.referrer or "/")


@app.route("/reject/<task_id>", methods=["POST"])
def reject(task_id: str):
    ok, msg = reject_task(task_id)
    return redirect(request.referrer or "/")


def _open_browser_native(url: str) -> None:
    """Open `url` in the user's default browser using the OS-native command.

    macOS's `open` is more reliable than Python's `webbrowser` module, which
    can fail silently if no default browser is registered with Launch Services.
    """
    system = platform.system()
    try:
        if system == "Darwin":
            subprocess.Popen(["open", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif system == "Linux":
            subprocess.Popen(["xdg-open", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif system == "Windows":
            subprocess.Popen(["cmd", "/c", "start", "", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            webbrowser.open(url, new=2)
    except Exception:
        # Fall back to Python's webbrowser module
        try:
            webbrowser.open(url, new=2)
        except Exception:
            pass


def daemon_is_running() -> int | None:
    """Return the PID of the running Switch web daemon, or None if none."""
    if not PID_FILE.exists():
        return None
    try:
        pid = int(PID_FILE.read_text().strip())
    except (ValueError, OSError):
        return None
    try:
        os.kill(pid, 0)  # signal 0 = liveness check, doesn't actually signal
        return pid
    except OSError:
        # Stale PID file
        try:
            PID_FILE.unlink()
        except OSError:
            pass
        return None


def stop_daemon() -> tuple[bool, str]:
    pid = daemon_is_running()
    if not pid:
        return False, "no Switch web daemon is running"
    try:
        os.kill(pid, signal.SIGTERM)
        # Wait up to 3 seconds for graceful shutdown
        for _ in range(15):
            time.sleep(0.2)
            try:
                os.kill(pid, 0)
            except OSError:
                break
        else:
            # Still alive — force kill
            try:
                os.kill(pid, signal.SIGKILL)
            except OSError:
                pass
        try:
            PID_FILE.unlink()
        except OSError:
            pass
        return True, f"stopped Switch web daemon (pid {pid})"
    except OSError as e:
        return False, f"could not stop daemon (pid {pid}): {e}"


def _wait_for_ready(url: str, timeout: float = 10.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"{url}/ping", timeout=0.5) as r:
                if r.read().strip() == b"ok":
                    return True
        except Exception:
            pass
        time.sleep(0.2)
    return False


def run_web(host: str = "127.0.0.1", port: int = 7777,
            open_browser: bool = True, foreground: bool = False) -> None:
    """Start the Switch web dashboard.

    Default (no --foreground): spawns a detached background process. The server
    keeps running after you close the terminal. Stop with `switch web-stop`.

    --foreground: runs Flask in this process (Ctrl+C to stop).
    """
    url = f"http://{host}:{port}"
    bold = "\033[1m"; reset = "\033[0m"; cyan = "\033[36m"; dim = "\033[2m"

    existing = daemon_is_running()
    if existing and not foreground:
        print(f"\n  {bold}Switch web already running{reset} (pid {existing}) at {cyan}{bold}{url}{reset}")
        print(f"  {dim}Stop with: switch web-stop{reset}\n")
        if open_browser:
            _open_browser_native(url)
        return

    if foreground:
        # Run Flask in this process. Used both for debugging (`switch web --foreground`)
        # and as the daemon child when spawned via Popen below.
        print()
        print(f"  {bold}Switch web dashboard (foreground){reset}")
        print(f"  {cyan}{bold}{url}{reset}")
        print(f"  {dim}(Ctrl+C to stop){reset}")
        print()
        if open_browser:
            threading.Thread(
                target=lambda: (time.sleep(0.7), _open_browser_native(url)),
                daemon=True,
            ).start()
        try:
            app.run(host=host, port=port, debug=False, use_reloader=False)
        except OSError as e:
            print(f"\n  Flask failed to start: {e}")
            sys.exit(1)
        return

    # Daemon mode: spawn a detached subprocess running ourselves with --foreground.
    WEB_LOG.parent.mkdir(parents=True, exist_ok=True)
    log = open(WEB_LOG, "ab")
    proc = subprocess.Popen(
        [sys.executable, str(Path(__file__).resolve()),
         "--foreground", "--no-browser",
         "--host", host, "--port", str(port)],
        stdout=log, stderr=log, stdin=subprocess.DEVNULL,
        start_new_session=True,  # detaches from this terminal — survives close
        cwd=str(SWITCH_ROOT),
    )
    PID_FILE.write_text(str(proc.pid))

    print()
    print(f"  {bold}Switch web dashboard{reset}")
    print(f"  {cyan}{bold}{url}{reset}")
    print(f"  Running in background (pid {proc.pid})")
    print(f"  {dim}Stop with: switch web-stop  |  Log: {WEB_LOG}{reset}")
    print()

    if _wait_for_ready(url, timeout=10):
        if open_browser:
            _open_browser_native(url)
    else:
        print(f"  ! Web daemon didn't respond within 10s. Check {WEB_LOG}\n")
        sys.exit(1)


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--foreground", action="store_true",
                   help="Run Flask in this process instead of spawning a detached daemon")
    p.add_argument("--no-browser", action="store_true",
                   help="Don't auto-open the browser")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=7777)
    a = p.parse_args()
    run_web(host=a.host, port=a.port, open_browser=not a.no_browser, foreground=a.foreground)
