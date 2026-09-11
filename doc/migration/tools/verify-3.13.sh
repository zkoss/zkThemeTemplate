#!/bin/bash
# verify-3.13.sh — P3 row 3.13: agent `zk-theme-evaluator` copied into zk/.claude/agents/ and re-pointed. Body: verify-agent.sh.
exec bash "$(dirname "$0")/verify-agent.sh" 3.13 zk-theme-evaluator 'Hash the jars|Act on the script|no ZK jars|npm run build:css' "$@"
