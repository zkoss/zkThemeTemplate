#!/bin/bash
# verify-3.10.sh — P3 row 3.10: agent `md3-design-verifier` copied into zk/.claude/agents/ and re-pointed. Body: verify-agent.sh.
exec bash "$(dirname "$0")/verify-agent.sh" 3.10 md3-design-verifier '' "$@"
