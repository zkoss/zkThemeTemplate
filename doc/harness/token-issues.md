# Token issues log

Append-only. The Orchestrator appends a component plus the failing check ids here when an
Evaluator returns `NEEDS_FIX` with `TOKEN_FIX_REQUIRED` — a `--zk-*` token diverges from the
design source, so no Generator is dispatched. See `doc/orchestrator-playbook.md`.

Empty is a valid state: it means no token divergence has been escalated since this log was created.

| date | component | check ids | token(s) | resolution |
|------|-----------|-----------|----------|------------|
