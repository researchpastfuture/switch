"""Switch desktop app — native window via pywebview + local Flask server.

Run:  switch app
Build: sh ~/switch/scripts/build-macos-app.sh
"""

from __future__ import annotations

import sys
import threading
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from web import _wait_for_ready, app, run_web


def run_desktop(host: str = "127.0.0.1", port: int = 7777) -> None:
    try:
        import webview
    except ImportError:
        print("Switch app requires pywebview. Install with:")
        print("  ~/switch/.venv/bin/pip install pywebview")
        print("\nOr run the browser dashboard: switch web")
        sys.exit(1)

    url = f"http://{host}:{port}"

    def start_server() -> None:
        app.run(host=host, port=port, debug=False, use_reloader=False, threaded=True)

    server = threading.Thread(target=start_server, daemon=True)
    server.start()

    if not _wait_for_ready(url, timeout=15):
        print(f"Switch app: server did not start at {url}")
        sys.exit(1)

    window = webview.create_window(
        "Switch",
        url,
        width=1280,
        height=860,
        min_size=(900, 620),
        text_select=True,
    )
    webview.start(debug=False)


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser(description="Switch desktop app")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=7777)
    args = p.parse_args()
    run_desktop(host=args.host, port=args.port)
