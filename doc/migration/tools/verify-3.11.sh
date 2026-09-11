#!/bin/bash
# verify-3.11.sh — P3 row 3.11: agent `zk-spec-author` copied into zk/.claude/agents/ and re-pointed. Body: verify-agent.sh.
exec bash "$(dirname "$0")/verify-agent.sh" 3.11 zk-spec-author 'ZK10/zkex/|Hash the jars|Read the source from|If the resolver exits|npm run build:css' "$@"
