#!/bin/bash
# verify-2.7.sh — item 2.7: zero-tolerance comparison of the state screenshot family (see zero-tolerance/verify-family.sh)
exec bash "$(dirname "$0")/zero-tolerance/verify-family.sh" state "$@"
