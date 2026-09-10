#!/bin/bash
# preview-server.sh — start / stop the zkpreview gretty server for the P2 verify scripts.
# Sourced, not executed:  . "$TOOLS/preview-server.sh"  (needs MOD, PORT and fail() from the caller)
#
# The lifecycle is the one item 2.1 proved (verify-2.1.sh, F51): `appRun` in the background with a FIFO held
# open on fd 3 as its stdin (appRun treats EOF as "any key" and would stop at once), readiness by HTTP, every
# wait bounded. Not `appStart`: with gretty 3.1.1 under Gradle 8.10 the appStart client never returns.
#
#   preview_ours          pids of listeners on $PORT that are THIS module's gretty runner (cwd = $MOD)
#   preview_port_free     fails (via fail) if a foreign process holds $PORT; reclaims our own leftover first
#   preview_start URL     appRun in the background; returns when GET URL is 200, else fails with the log tail
#   preview_stop          close fd 3, wait, bounded appStop, kill only our own runner
#   preview_assert_free   fails if $PORT is still listening
# The only process these functions ever kill is a gretty Runner JVM whose working directory is $MOD.

preview_ours() {
  for p in $(/usr/sbin/lsof -nP -t -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null); do
    ps -ww -o command= -p "$p" | /usr/bin/grep -q 'org.akhikhl.gretty.Runner' \
      && test "$(/usr/sbin/lsof -a -p "$p" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')" = "$MOD" && echo "$p"
  done
}

preview_stop() {
  exec 3>&- 2>/dev/null                                   # EOF on appRun's stdin = "any key": graceful stop
  for _ in $(seq 1 30); do [ -n "${RUNPID:-}" ] && kill -0 "$RUNPID" 2>/dev/null || break; sleep 1; done
  if [ -n "$(preview_ours)" ]; then                      # still up: ask gretty (bounded), then kill our own runner
    ( cd "$MOD" && ./gradlew appStop --console=plain -q >/dev/null 2>&1 ) & sp=$!
    for _ in $(seq 1 30); do kill -0 "$sp" 2>/dev/null || break; sleep 1; done
    kill "$sp" 2>/dev/null; sleep 2
    for p in $(preview_ours); do echo "   stopping zkpreview gretty runner pid $p"; kill "$p"; done
  fi
  [ -n "${RUNPID:-}" ] && kill "$RUNPID" 2>/dev/null; true
}

preview_port_free() {
  if [ -n "$(preview_ours)" ]; then echo "   port $PORT held by this module's own earlier runner — stopping it first"; preview_stop; sleep 3; fi
  local busy; busy=$(/usr/sbin/lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | tail -n +2)
  test -z "$busy" || { echo "$busy"; fail "port $PORT held by a foreign process before start (export PREVIEW_PORT=<free port>)"; }
}

preview_start() {
  local url=$1 code=000
  cd "$MOD" || fail "cd $MOD"
  trap preview_stop EXIT
  PREVIEW_LOG=$(mktemp); local F; F=$(mktemp -u); mkfifo "$F" || fail "mkfifo"
  ./gradlew appRun -PhttpPort="$PORT" --console=plain -q < "$F" > "$PREVIEW_LOG" 2>&1 &
  RUNPID=$!
  exec 3>"$F"; rm -f "$F"
  for _ in $(seq 1 "${START_TIMEOUT:-300}"); do
    kill -0 "$RUNPID" 2>/dev/null || { tail -n 40 "$PREVIEW_LOG"; fail "gretty appRun exited before serving (log above)"; }
    code=$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)
    test "$code" = 200 && return 0
    sleep 1
  done
  tail -n 40 "$PREVIEW_LOG"; fail "GET $url → HTTP $code after ${START_TIMEOUT:-300} s (appRun log above)"
}

preview_assert_free() {
  for _ in $(seq 1 30); do
    test -z "$(/usr/sbin/lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | tail -n +2)" && return 0
    sleep 1
  done
  fail "port $PORT still listening after stop"
}
