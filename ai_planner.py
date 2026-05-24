"""AI task planner — turns natural language into queued Switch tasks.

Uses the local `claude` CLI (same auth as agent runs) with a small budget cap.
No file edits: planner is disallowed from tool use.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from orchestrator import SWITCH_ROOT, load_config

SHARED_SKIP = {"af_voice", "never_do", "planner"}


@dataclass
class PlannedTask:
    product: str
    prompt_id: str
    context: str
    model: str | None = None
    max_budget_usd: float | None = None
    rationale: str = ""


@dataclass
class PlanResult:
    tasks: list[PlannedTask]
    summary: str
    raw_response: str = ""


def discover_prompts(config: dict) -> dict[str, list[str]]:
    """Return {product: [prompt_id, ...]} plus _shared prompts."""
    prompts_dir = SWITCH_ROOT / "prompts"
    catalog: dict[str, list[str]] = {}
    for product in config.get("products", {}):
        pdir = prompts_dir / product
        if pdir.is_dir():
            catalog[product] = sorted(p.stem for p in pdir.glob("*.md"))
    shared_dir = prompts_dir / "_shared"
    if shared_dir.is_dir():
        catalog["_shared"] = sorted(
            p.stem for p in shared_dir.glob("*.md") if p.stem not in SHARED_SKIP
        )
    return catalog


def _prompt_blurb(product: str, prompt_id: str) -> str:
    for base in (SWITCH_ROOT / "prompts" / product, SWITCH_ROOT / "prompts" / "_shared"):
        path = base / f"{prompt_id}.md"
        if path.exists():
            lines = path.read_text().splitlines()
            title = lines[0].lstrip("# ").strip() if lines else prompt_id
            body = " ".join(l.strip() for l in lines[1:6] if l.strip() and not l.startswith("#"))
            return f"{title}. {body[:200]}".strip()
    return prompt_id


def build_catalog_text(config: dict) -> str:
    catalog = discover_prompts(config)
    parts = ["## Products and prompts\n"]
    for product, pcfg in config.get("products", {}).items():
        stack = pcfg.get("stack", "?")
        path = pcfg.get("path", "?")
        parts.append(f"### {product}\n- stack: {stack}\n- path: {path}")
        prompts = catalog.get(product, [])
        shared = catalog.get("_shared", [])
        all_prompts = prompts + [p for p in shared if p not in prompts]
        if all_prompts:
            parts.append("- prompts:")
            for pid in all_prompts:
                parts.append(f"  - `{pid}`: {_prompt_blurb(product, pid)}")
        parts.append("")
    return "\n".join(parts)


def _planner_system(config: dict) -> str:
    template_path = SWITCH_ROOT / "prompts" / "_shared" / "planner.md"
    if template_path.exists():
        return template_path.read_text().format(catalog=build_catalog_text(config))
    return (
        "You are Switch's task router. Given a user request, pick the best product(s) "
        "and prompt_id(s) from the catalog below. Return ONLY valid JSON.\n\n"
        f"{build_catalog_text(config)}"
    )


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        return json.loads(match.group(0))
    raise ValueError(f"Planner did not return JSON. Got:\n{text[:500]}")


def _call_claude_planner(user_request: str, config: dict) -> str:
    if subprocess.run(["which", "claude"], capture_output=True).returncode != 0:
        raise RuntimeError(
            "claude CLI not found on PATH. Install Claude Code or add it to PATH."
        )

    model = config.get("planner_model") or config.get("default_model", "claude-haiku-4-5")
    budget = float(config.get("planner_budget_usd", 0.50))
    system = _planner_system(config)

    prompt = (
        f"{system}\n\n"
        "## User request\n\n"
        f"{user_request.strip()}\n\n"
        "## Output format\n\n"
        "Return ONLY a JSON object (no markdown fences) with this shape:\n"
        "{\n"
        '  "summary": "one sentence plan",\n'
        '  "tasks": [\n'
        "    {\n"
        '      "product": "<product name from catalog>",\n'
        '      "prompt_id": "<prompt id from catalog>",\n'
        '      "context": "<specific instructions for the agent>",\n'
        '      "model": null,\n'
        '      "max_budget_usd": null,\n'
        '      "rationale": "<why this task>"\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Rules:\n"
        "- Use only products and prompt_ids from the catalog.\n"
        "- Prefer the smallest number of tasks that cover the request (usually 1).\n"
        "- Put detailed scope in `context`; keep product/prompt selection accurate.\n"
        "- For bugs use fix_bug or fix_specific; for new work use add_feature or product-specific prompts.\n"
        "- For audits/docs/a11y use safe_audit, docs_pass, or accessibility_pass when they fit.\n"
        "- Set model to claude-opus-4-7 only for hard crypto/architecture tasks; otherwise null.\n"
    )

    cmd = [
        "claude",
        "-p",
        prompt,
        "--output-format",
        "text",
        "--model",
        model,
        "--max-budget-usd",
        str(budget),
        "--no-session-persistence",
        "--disallowedTools",
        "Bash",
        "Edit",
        "Write",
        "MultiEdit",
        "NotebookEdit",
        "Glob",
        "Grep",
        "Read",
        "Task",
        "WebFetch",
        "WebSearch",
    ]

    r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        err = (r.stderr or r.stdout or "unknown error").strip()
        raise RuntimeError(f"Planner claude call failed: {err}")
    return (r.stdout or "").strip()


def _validate_planned(data: dict[str, Any], config: dict) -> PlanResult:
    products = set(config.get("products", {}))
    catalog = discover_prompts(config)
    shared = set(catalog.get("_shared", []))

    tasks: list[PlannedTask] = []
    for item in data.get("tasks") or []:
        product = (item.get("product") or "").strip()
        prompt_id = (item.get("prompt_id") or "").strip()
        if product not in products:
            raise ValueError(f"Unknown product in plan: {product!r}. Available: {sorted(products)}")
        product_prompts = set(catalog.get(product, [])) | shared
        if prompt_id not in product_prompts:
            raise ValueError(
                f"Unknown prompt {prompt_id!r} for {product!r}. "
                f"Available: {sorted(product_prompts)}"
            )
        tasks.append(
            PlannedTask(
                product=product,
                prompt_id=prompt_id,
                context=(item.get("context") or "").strip(),
                model=item.get("model"),
                max_budget_usd=item.get("max_budget_usd"),
                rationale=(item.get("rationale") or "").strip(),
            )
        )
    if not tasks:
        raise ValueError("Planner returned no tasks.")
    return PlanResult(
        tasks=tasks,
        summary=(data.get("summary") or "").strip() or f"{len(tasks)} task(s) planned",
        raw_response=json.dumps(data, indent=2),
    )


def plan_from_natural_language(user_request: str, config: dict | None = None) -> PlanResult:
    """Turn plain English into a validated Switch task plan."""
    if not user_request.strip():
        raise ValueError("Request cannot be empty.")
    cfg = config or load_config()
    raw = _call_claude_planner(user_request, cfg)
    data = _extract_json(raw)
    return _validate_planned(data, cfg)


def format_plan(plan: PlanResult) -> str:
    lines = [f"Plan: {plan.summary}", ""]
    for i, t in enumerate(plan.tasks, 1):
        lines.append(f"  {i}. {t.product}/{t.prompt_id}")
        if t.rationale:
            lines.append(f"     why: {t.rationale}")
        if t.context:
            snippet = t.context.replace("\n", " ")
            lines.append(f"     ctx: {snippet[:120]}{'…' if len(snippet) > 120 else ''}")
        if t.model:
            lines.append(f"     model: {t.model}")
        if t.max_budget_usd:
            lines.append(f"     budget: ${t.max_budget_usd}")
    return "\n".join(lines)
