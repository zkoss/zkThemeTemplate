#!/bin/bash
# verify-3.12.sh — P3 row 3.12: agent `zk-theme-creator` copied into zk/.claude/agents/ and re-pointed. Body: verify-agent.sh.
exec bash "$(dirname "$0")/verify-agent.sh" 3.12 zk-theme-creator 'npm run build:css|setjdk' "$@"
