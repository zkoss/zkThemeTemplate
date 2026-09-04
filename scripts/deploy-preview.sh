#!/bin/bash
# Build the Marble preview WAR, deploy it to the design-review Tomcat and verify
# it renders. See doc/preview-deployment.md.
#
# Runs without a password: it logs in with a dedicated SSH key and reuses that one
# authenticated connection for every remote step via ControlMaster. Install the
# key once (the only time anything asks for the server password):
#
#   ./scripts/deploy-preview.sh --setup-key    # ONCE per machine, then never again
#
#   ./scripts/deploy-preview.sh                # build + backup + upload + verify + screenshots
#   ./scripts/deploy-preview.sh --no-build     # deploy target/marble.war as it already is
#   ./scripts/deploy-preview.sh --verify       # only verify + screenshot, no build, no upload
#   ./scripts/deploy-preview.sh --no-backup    # skip the remote backup step
#
# Override the target without editing this file:
#   HOST=zktest@10.1.3.241 PORT=8093 BASE=/path/to/tomcat/webapps APP=marble ./scripts/deploy-preview.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${HOST:-zktest@10.1.3.241}"
PORT="${PORT:-8093}" # the support3 Tomcat's HTTP connector, see its conf/server.xml - NOT 8080
BASE="${BASE:-/home/zktest/servers/support3-apache-tomcat-9.0.83/webapps}"
APP="${APP:-marble}" # deployed as $APP.war -> http://<host>:$PORT/$APP/
SHOTS="$ROOT/tasks/screenshots/deploy" # tasks/ is git-ignored, so these stay out of the repo
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
CTRL="/tmp/marble-deploy-$$"
WAR="$ROOT/target/$APP.war"
# Login key for the server account, not something owned by this theme - the same
# key serves any app deployed to this Tomcat. --setup-key creates it if missing.
KEY="${KEY:-$HOME/.ssh/${HOST%@*}}"
KEYCHAIN_SERVICE="${KEYCHAIN_SERVICE:-${HOST%@*}-ssh}" # optional Keychain item with the password

# -i/IdentitiesOnly so a full ~/.ssh does not offer a dozen wrong keys first and
# get us rate-limited; accept-new so a fresh machine does not stop on a prompt.
SSH_ID=(-i "$KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)

# smoke-tested after every deploy: the landing redirect, the SPA the designer
# actually browses, and two pages that exercise widget CSS + the AU channel.
PAGES=(usecase/index button grid)

DO_BUILD=1
DO_BACKUP=1
DO_UPLOAD=1
DO_SETUP_KEY=0
for arg in "$@"; do
	case "$arg" in
		--no-build)  DO_BUILD=0 ;;
		--no-backup) DO_BACKUP=0 ;;
		--verify)    DO_BUILD=0; DO_UPLOAD=0; DO_BACKUP=0 ;;
		--setup-key) DO_SETUP_KEY=1 ;;
		*) echo "unknown option: $arg" >&2; exit 2 ;;
	esac
done

step() { printf '\n=== %s\n' "$1"; }

# --- passwordless login -----------------------------------------------------
# If the server password is in the macOS Keychain, hand it to ssh through
# SSH_ASKPASS so even the one-time key install runs unattended. Store it with:
#   security add-generic-password -a zktest -s zktest-ssh -w -U
# (-w with no value prompts, so the password never enters your shell history).
# Prints the path of a throwaway helper script, or fails if there is no item.
keychain_askpass() {
	local user="${HOST%@*}" helper
	security find-generic-password -a "$user" -s "$KEYCHAIN_SERVICE" -w >/dev/null 2>&1 || return 1
	helper=$(mktemp "${TMPDIR:-/tmp}/marble-askpass.XXXXXX")
	printf '#!/bin/sh\nexec security find-generic-password -a %q -s %q -w\n' \
		"$user" "$KEYCHAIN_SERVICE" >"$helper"
	chmod 700 "$helper"
	echo "$helper"
}

# Run "$@" with the Keychain helper wired into ssh, if keychain_askpass found one.
with_askpass() {
	if [[ -n "${ASKPASS_HELPER:-}" ]]; then
		SSH_ASKPASS="$ASKPASS_HELPER" SSH_ASKPASS_REQUIRE=force "$@"
	else
		"$@"
	fi
}
drop_askpass() { [[ -n "${ASKPASS_HELPER:-}" ]] && rm -f "$ASKPASS_HELPER"; ASKPASS_HELPER=''; }

# Runs however the script ends, including a mid-ssh failure under `set -e`.
cleanup() {
	drop_askpass
	[[ -S "$CTRL" ]] && ssh -S "$CTRL" -O exit "$HOST" 2>/dev/null
	true
}
trap cleanup EXIT

setup_key() {
	step "One-time key setup for $HOST"
	if [[ -f "$KEY" ]]; then
		echo "  reusing existing key $KEY"
	else
		[[ -d "$(dirname "$KEY")" ]] || { mkdir -p "$(dirname "$KEY")"; chmod 700 "$(dirname "$KEY")"; }
		# No passphrase - an unattended deploy cannot answer one. The key file
		# itself is therefore the credential; it is as sensitive as the password.
		ssh-keygen -q -t ed25519 -N '' -f "$KEY"
		echo "  created $KEY"
	fi

	# The ONLY step that needs the server password - unattended if it is in the
	# Keychain, one interactive prompt otherwise.
	if ASKPASS_HELPER=$(keychain_askpass); then
		echo "  authenticating from the Keychain item '$KEYCHAIN_SERVICE'"
	else
		echo "  enter the server password once (see the internal server notes)"
	fi
	if command -v ssh-copy-id >/dev/null; then
		with_askpass ssh-copy-id -i "$KEY.pub" -o StrictHostKeyChecking=accept-new "$HOST"
	else # ssh-copy-id is not shipped everywhere; append the key ourselves
		local pub; pub=$(cat "$KEY.pub")
		with_askpass ssh -o StrictHostKeyChecking=accept-new "$HOST" \
			"umask 077; mkdir -p ~/.ssh; touch ~/.ssh/authorized_keys
			 grep -qxF '$pub' ~/.ssh/authorized_keys || echo '$pub' >> ~/.ssh/authorized_keys"
	fi
	drop_askpass

	step "Verifying passwordless login"
	ssh "${SSH_ID[@]}" -o BatchMode=yes "$HOST" 'echo "  OK: $(whoami)@$(hostname)"'
	echo "  ./scripts/deploy-preview.sh will no longer ask for anything."
}

if (( DO_SETUP_KEY )); then
	setup_key
	exit 0
fi

# --- build ------------------------------------------------------------------
if (( DO_BUILD )); then
	WAR_NAME="$APP" "$ROOT/scripts/build-preview-war.sh"
fi

if (( DO_UPLOAD )); then
	[[ -f "$WAR" ]] || { echo "missing $WAR - run without --no-build" >&2; exit 1; }
	step "Deploying"
	echo "  $APP.war <- $(basename "$WAR")  ($(du -h "$WAR" | cut -f1))"
fi

# --- one authenticated connection for every remote step ---------------------
# BatchMode: never hang on a hidden prompt in a script that then sleeps 30s and
# drives Chrome. Everything after this reuses the master socket, so scp and each
# remote command authenticate zero more times.
step "Connecting to $HOST"
if ! ssh -M -S "$CTRL" -o ControlPersist=10m "${SSH_ID[@]}" -o BatchMode=yes "$HOST" true; then
	if ASKPASS_HELPER=$(keychain_askpass); then
		echo "  key auth unavailable, falling back to the Keychain password" >&2
		with_askpass ssh -M -S "$CTRL" -o ControlPersist=10m \
			-o StrictHostKeyChecking=accept-new "$HOST" true
		drop_askpass
	else
		cat >&2 <<-MSG

		cannot log in to $HOST without a password - see the ssh error above.
		If $KEY is simply not on the server yet, install it once and re-run:

		    ./scripts/deploy-preview.sh --setup-key
		MSG
		exit 1
	fi
fi
SSH=(ssh -S "$CTRL" "$HOST")
SCP_OPT=(-o ControlPath="$CTRL")

step "Current state of $BASE"
"${SSH[@]}" "ls -lad $BASE/$APP* 2>/dev/null || echo '(no $APP deployed yet)'"

# --- backup whatever is already deployed ------------------------------------
if (( DO_BACKUP )); then
	STAMP=$(date +%Y%m%d-%H%M%S)
	step "Backing up existing $APP.war to ~/marble-war-backup/$STAMP"
	"${SSH[@]}" "set -e
		if [ -f $BASE/$APP.war ]; then
			mkdir -p ~/marble-war-backup/$STAMP
			cp -p $BASE/$APP.war ~/marble-war-backup/$STAMP/
			ls -la ~/marble-war-backup/$STAMP
		else
			echo 'nothing to back up'
		fi"
fi

# --- upload -----------------------------------------------------------------
if (( DO_UPLOAD )); then
	step "Uploading $APP.war"
	scp "${SCP_OPT[@]}" "$WAR" "$HOST:$BASE/$APP.war"

	# Tomcat's autoDeploy notices the newer WAR, undeploys the old context
	# (which also removes the old exploded directory) and expands the new one.
	step "Uploaded, letting Tomcat auto-deploy (30s)"
	sleep 30

	step "Deployed artifacts on the server"
	"${SSH[@]}" "ls -lad $BASE/$APP* 2>/dev/null"
fi

# --- verify -----------------------------------------------------------------
step "HTTP check"
rc=0
check() {
	local url="http://${HOST#*@}:$PORT/$APP/$1"
	local code
	code=$(curl -s -o /dev/null -w '%{http_code}' -m 40 -L "$url" || echo 000)
	printf '  %-34s -> HTTP %s\n' "/$APP/$1" "$code"
	[[ "$code" == 200 ]] || rc=1
}
check ""
for p in "${PAGES[@]}"; do check "$p.zul"; done

# The theme is served as one big widget-CSS bundle. A WAR that starts fine but
# lost its compiled CSS still answers 200 everywhere and merely looks unstyled,
# so assert a Marble token is actually inside the bundle.
step "Theme CSS check"
wcs="http://${HOST#*@}:$PORT/$APP/zkau/web/zul/css/zk.wcs"
tokens=$(curl -s -m 60 "$wcs" | grep -c -- '--zk-color-primary' || true)
printf '  zk.wcs --zk-color-primary hits: %s\n' "$tokens"
[[ "$tokens" -gt 0 ]] || { echo "  theme CSS is NOT in the served bundle" >&2; rc=1; }

if [[ ! -x "$CHROME" ]]; then
	echo "  (Chrome not found at $CHROME - skipping screenshots)" >&2
else
	step "Screenshots -> $SHOTS"
	mkdir -p "$SHOTS"
	# --virtual-time-budget never expires on a ZK page (the AU channel holds a
	# connection open) and headless Chrome writes the PNG but then hangs on
	# shutdown here. So launch it detached, wait for the file to stop growing,
	# and kill it.
	for p in "${PAGES[@]}"; do
		out="$SHOTS/${p//\//-}.png"
		rm -f "$out"
		"$CHROME" --headless --disable-gpu --hide-scrollbars --no-first-run \
			--user-data-dir="$(mktemp -d)" --window-size=1440,900 \
			--screenshot="$out" "http://${HOST#*@}:$PORT/$APP/$p.zul" >/dev/null 2>&1 &
		pid=$!
		prev=-1 stable=0
		for _ in $(seq 1 60); do
			sleep 1
			sz=$(stat -f%z "$out" 2>/dev/null || echo 0)
			if [[ "$sz" != 0 && "$sz" == "$prev" ]]; then
				(( ++stable >= 2 )) && break
			else
				stable=0
			fi
			prev=$sz
		done
		kill $pid 2>/dev/null || true
		wait $pid 2>/dev/null || true
		if [[ -s "$out" ]]; then
			echo "  $out ($(stat -f%z "$out") bytes)"
		else
			echo "  FAILED: $p" >&2; rc=1
		fi
	done
fi

step "Recent Tomcat log lines mentioning $APP"
"${SSH[@]}" "tail -300 ${BASE%/webapps}/logs/catalina.out 2>/dev/null \
	| grep -Ei '$APP|SEVERE|Exception' | tail -20 || echo '(nothing)'"

if (( rc == 0 )); then
	step "DONE - http://${HOST#*@}:$PORT/$APP/ answered 200 and serves the Marble bundle"
	echo "  open the PNGs in $SHOTS to confirm it looks right"
else
	step "DONE WITH PROBLEMS - see the HTTP codes / log lines above"
fi
exit $rc
