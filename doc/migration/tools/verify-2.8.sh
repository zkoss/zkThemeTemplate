#!/bin/bash
# verify-2.8.sh — item 2.8: zero-tolerance comparison of the tablet screenshot family (see zero-tolerance/verify-family.sh)
exec bash "$(dirname "$0")/zero-tolerance/verify-family.sh" tablet "$@"
