"""Switch live dashboard — the 'mainframe screen' the user asked for.

Refreshes every 2 seconds. Shows each agent's status, cost so far, and preview URL
when ready. Ctrl+C to exit.

Run via: switch dashboard
"""

from __future__ import annotations

import sqlite3
import time
from datetime import datetime, timezone

from rich.console import Console
from rich.live import Live
from rich.table import Table
from rich.text import Text

from orchestrator import STATE_DB, load_config


def _status_cell(status: str) -> Text:
    palette = {
        "queued": ("queued", "dim"),
        "running": ("running", "bold blue"),
        "awaiting_approval": ("awaiting approval", "bold yellow"),
        "approved": ("approved ✓", "green"),
        "rejected": ("rejected ✗", "red"),
        "failed": ("failed", "red"),
        "no_changes": ("no changes", "dim"),
    }
    label, style = palette.get(status, (status, "white"))
    return Text(label, style=style)


def _build_table(conn: sqlite3.Connection, config: dict) -> Table:
    title = f"Switch — mode: {config['mode']}    {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}"
    table = Table(title=title, show_lines=False, expand=True)
    table.add_column("ID", style="cyan", no_wrap=True, width=10)
    table.add_column("Product", style="magenta", width=18)
    table.add_column("Prompt", style="white", width=22)
    table.add_column("Status", width=20)
    table.add_column("$", justify="right", width=8)
    table.add_column("In/Out", justify="right", style="dim", width=14)
    table.add_column("Preview / Branch", style="green")

    rows = list(
        conn.execute(
            "SELECT id, product, prompt_id, status, cost_usd, tokens_input, tokens_output, "
            "preview_url, branch FROM tasks ORDER BY created_at DESC LIMIT 60"
        )
    )

    total = 0.0
    by_status: dict[str, int] = {}
    for r in rows:
        tid, product, prompt, status, cost, tin, tout, url, branch = r
        cost = float(cost or 0)
        total += cost
        by_status[status] = by_status.get(status, 0) + 1
        table.add_row(
            tid,
            product,
            prompt,
            _status_cell(status),
            f"${cost:.2f}",
            f"{tin or 0}/{tout or 0}",
            url or (branch or ""),
        )

    summary = "  ".join(f"{k}: {v}" for k, v in sorted(by_status.items()))
    table.caption = (
        f"{summary or '(no tasks yet)'}    total spend: ${total:.2f}    "
        f"tap: switch approve <id> | switch reject <id>"
    )
    return table


def run_dashboard() -> None:
    console = Console()
    config = load_config()
    try:
        with Live(refresh_per_second=0.5, console=console, screen=False) as live:
            while True:
                conn = sqlite3.connect(STATE_DB)
                live.update(_build_table(conn, config))
                conn.close()
                time.sleep(2)
    except KeyboardInterrupt:
        console.print("\n[dim]dashboard closed.[/dim]")


if __name__ == "__main__":
    run_dashboard()
