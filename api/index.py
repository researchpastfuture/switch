"""Vercel serverless entry — exposes the Switch web dashboard."""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
os.environ["SWITCH_ROOT"] = str(ROOT)
os.environ["SWITCH_CLOUD"] = "1"
sys.path.insert(0, str(ROOT))

from orchestrator import init_db  # noqa: E402
from web import app  # noqa: E402

init_db()
