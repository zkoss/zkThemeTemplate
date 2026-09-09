# Escalation log

Append-only. The Orchestrator appends a component here when its status becomes `STALLED` or
`OSCILLATING`, together with the failure history — see `doc/orchestrator-playbook.md`. Loop
iteration stops for that component until the user is asked.

Empty is a valid state: it means nothing has stalled since this log was created.

| date | component | status | failure history |
|------|-----------|--------|-----------------|
