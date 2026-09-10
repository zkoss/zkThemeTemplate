#!/usr/bin/python3
"""gate-from-journal.py — write a gate verdict file from a Workflow run record (harness rule 8).

Usage:
    /usr/bin/python3 doc/migration/tools/gate-from-journal.py <runId> <item> [--out FILE] [--workflows DIR]

The Workflow tool persists every run as <workflows DIR>/<runId>.json whose `result` is the object the
script returned: {item: {row, verifyCommand, generator, verdict}} for marble-p2-verify.js. This tool
turns one item of that record into the Markdown shape used under doc/migration/gates/ (see 2.0.md):
verdict line, the row verbatim, the verification commands, the Evaluator's evidence verbatim, the
Generator's report, the Opus design notes when present, and an empty "Planner notes" section —
the only part the Planner writes by hand. Nothing here is re-judged: pass/fail is copied from the
Evaluator's verdict object.

Why: in P1 the Planner retyped evidence into gate files by hand, which cost time and invited
paraphrase. The journal is the record; the gate file is a view of it.
"""
import argparse
import datetime
import json
import os
import re
import sys

DEFAULT_WORKFLOWS = os.path.expanduser(
    "~/.claude/projects/-Users-hawk-Documents-workspace-ZK10-zk/"
    "9c78e394-64d4-46cd-8afa-374f89dcac29/workflows")

MODEL_NAMES = {"sonnet": "Sonnet 5", "opus": "Opus 5"}


def title_from_row(row):
    m = re.search(r"\*\*(.+?)\*\*", row)
    return m.group(1) if m else row[:80]


def evaluator_model(logs, item):
    for line in logs:
        m = re.match(rf"item {re.escape(item)}: Evaluator \((Sonnet 5|Opus 5)", line)
        if m:
            return m.group(1)
    return "unknown"


def fence(text, lang=""):
    text = (text or "").rstrip("\n")
    return f"```{lang}\n{text}\n```"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run_id")
    ap.add_argument("item")
    ap.add_argument("--out", help="write here instead of stdout")
    ap.add_argument("--workflows", default=DEFAULT_WORKFLOWS)
    a = ap.parse_args()

    path = os.path.join(a.workflows, f"{a.run_id}.json")
    with open(path) as f:
        run = json.load(f)
    result = run.get("result") or {}
    if a.item not in result:
        sys.exit(f"item {a.item} not in run {a.run_id}; items: {sorted(result)}")
    it = result[a.item]
    if not isinstance(it, dict) or "verdict" not in it:
        sys.exit(f"item {a.item} has no verdict (record: {json.dumps(it)[:200]})")

    verdict = it.get("verdict") or {}
    gen = it.get("generator")
    row = it.get("row", "")
    cmds = it.get("verifyCommand") or []
    if isinstance(cmds, str):
        cmds = [cmds]
    passed = bool(verdict.get("pass"))
    date = run.get("timestamp", "")[:10] or datetime.date.today().isoformat()
    ev_model = evaluator_model(run.get("logs") or [], a.item)
    gen_model = "none (gate — the tree as it stands was judged)" if gen is None else "Sonnet 5"

    out = []
    out.append(f"# Gate {a.item} — {title_from_row(row)}")
    out.append("")
    out.append(f"**Verdict: {'PASS' if passed else 'FAIL'}** · Evaluator: {ev_model} (independent; ran only "
               f"the verify script) · Generator: {gen_model} · {date} · workflow run `{a.run_id}`")
    out.append("")
    out.append("## Row (execution plan, verbatim)")
    out.append("")
    out.append(row)
    out.append("")
    out.append("## Verification commands (the Evaluator typed these and nothing else)")
    out.append("")
    for i, c in enumerate(cmds, 1):
        out.append(f"**Command {i}**")
        out.append("")
        out.append(fence(c, "bash"))
        out.append("")
    out.append("")
    out.append(f"## Evaluator evidence (verbatim; exit code {verdict.get('exitCode', '?')})")
    out.append("")
    out.append(fence(verdict.get("evidence", ""), "text"))
    if not passed:
        out.append("")
        out.append("### Cause (Evaluator)")
        out.append("")
        out.append(verdict.get("cause", "").strip() or "(none given)")
    if verdict.get("designNotes"):
        out.append("")
        out.append("## Design notes (Opus, non-binding)")
        out.append("")
        out.append(verdict["designNotes"].strip())
    out.append("")
    out.append("## Generator report")
    out.append("")
    if gen is None:
        out.append("No Generator ran for this item.")
    else:
        created = gen.get("filesCreated") or []
        edited = gen.get("filesEdited") or []
        out.append(f"- done: `{gen.get('done')}` · files created: {len(created)} · files edited: {len(edited)}")
        for p in created:
            out.append(f"  - new: `{p}`")
        for p in edited:
            out.append(f"  - edited: `{p}`")
        if gen.get("blockers", "").strip():
            out.append(f"- blockers: {gen['blockers'].strip()}")
        out.append("- self-check output:")
        out.append("")
        out.append(fence(gen.get("selfCheck", ""), "text"))
    out.append("")
    out.append("## Planner notes")
    out.append("")
    out.append("- (added by the Planner: landed commit, rulings, follow-ups)")
    out.append("")
    text = "\n".join(out)

    if a.out:
        if os.path.exists(a.out):
            sys.exit(f"refusing to overwrite {a.out}; remove it first or choose another --out")
        with open(a.out, "w") as f:
            f.write(text)
        print(f"wrote {a.out} ({len(text)} bytes, verdict {'PASS' if passed else 'FAIL'})")
    else:
        sys.stdout.write(text)


if __name__ == "__main__":
    main()
