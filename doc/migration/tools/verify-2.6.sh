#!/bin/bash
# verify-2.6.sh — item 2.6: zero-tolerance comparison of the gallery screenshot family (see zero-tolerance/verify-family.sh)
exec bash "$(dirname "$0")/zero-tolerance/verify-family.sh" gallery "$@"
