#!/bin/bash
# verify-3.14.sh — P3 row 3.14: agent `zk-theme-generator` copied into zk/.claude/agents/ and re-pointed. Body: verify-agent.sh.
exec bash "$(dirname "$0")/verify-agent.sh" 3.14 zk-theme-generator 'npm run build:css|build:css' "$@"
