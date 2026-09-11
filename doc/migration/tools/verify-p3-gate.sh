#!/bin/bash
# verify-p3-gate.sh — the P3 gate: a cold-start drill (D203-A) in a FRESH session rooted in zk, given only drafts/brief-p3-gate.md,
# implements scrollview's Marble CSS in ../zkcml from zk's own copies of the skill, contract, preview page and harness — reading
# nothing under zkThemeTemplate. This script judges the drill's OUTPUT and its TRANSCRIPT; it is run by the external Evaluator.
#
# Usage:   bash doc/migration/tools/verify-p3-gate.sh static <drill-transcript.jsonl>     (~20 s; files, build, transcript grep)
#          bash doc/migration/tools/verify-p3-gate.sh live                                (~2 min; zkpreview up, computed-style probe of the
#                                                                                           contract rows, gallery shot vs the re-cut baseline)
# The transcript is the drill session's own file under ~/.claude/projects/-Users-hawk-Documents-workspace-ZK10-zk/<uuid>.jsonl
# (the newest one whose first user message is the brief). `grep -c zkThemeTemplate` = 0 makes the "zero reads outside zk" clause mechanical.
# Dry-run contract (pre-drill tree): static stops at "P3 gate static FAIL at: scrollview.css exists in zkcml and is not the empty stub".
set -u
MODE=${1:-static}; TRANSCRIPT=${2:-}
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
ZK=/Users/hawk/Documents/workspace/ZK10/zk
ZKCML=/Users/hawk/Documents/workspace/ZK10/zkcml
CSS=zkmax/src/main/resources/web/js/zkmax/layout/css/scrollview.css
DSP=zkmax/codegen/resources/web/js/zkmax/layout/css/scrollview.css.dsp
BASE=zkpreview/doc/screenshots/scrollview-gallery.png
fail() { echo "P3 gate $MODE FAIL at: $1"; exit 1; }
stage() { echo "stage: $1"; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT

stage environment
for p in .claude/skills/marble-theme/SKILL.md doc/contracts/scrollview.md zkpreview/src/main/webapp/web/scrollview.zul "$BASE" .claude/agents/zk-theme-generator.md scripts/build-css.js; do
  test -f "$ZK/$p" || fail "environment (zk lacks $p — every P3 row must have landed)"
done
for it in 3.4 3.5 3.6 3.7 3.9 3.10 3.11 3.12 3.13 3.14 3.18 3.18b 3.19 3.20 3.21; do test -f "$TPL/doc/migration/gates/$it.md" || fail "environment (gate $it missing)"; done
test -d "$ZKCML/zkmax/src/main/resources/web/js/zkmax/layout/css" || fail "environment (../zkcml missing)"
echo "   every P3 gate present; zk HEAD $(git -C "$ZK" rev-parse --short HEAD), zkcml HEAD $(git -C "$ZKCML" rev-parse --short HEAD)"

if [ "$MODE" = static ]; then
  stage "scrollview.css exists in zkcml and is not the empty stub"
  test -s "$ZKCML/$CSS" || fail "scrollview.css exists in zkcml and is not the empty stub"
  /usr/bin/grep -q '\.z-scrollview' "$ZKCML/$CSS" || fail "scrollview.css has no .z-scrollview rule"
  echo "   $(wc -c < "$ZKCML/$CSS" | tr -d ' ') bytes, $(/usr/bin/grep -c '\.z-scrollview' "$ZKCML/$CSS") .z-scrollview selector line(s)"

  stage "Marble rules: --zk- tokens, no hardcoded colours, no !important"
  test "$(/usr/bin/grep -c 'var(--zk-' "$ZKCML/$CSS")" -ge 1 || fail "Marble rules (no --zk- token used)"
  test "$(/usr/bin/grep -ciE '#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(' "$ZKCML/$CSS")" = 0 || { /usr/bin/grep -niE '#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(' "$ZKCML/$CSS" | head -3; fail "Marble rules (hardcoded colour)"; }
  test "$(/usr/bin/grep -c '!important' "$ZKCML/$CSS")" = 0 || fail "Marble rules (!important)"

  stage "the stub is retired: scrollview.css.dsp no longer in build-css.js's stub lists"
  test "$(/usr/bin/grep -c 'scrollview.css.dsp' "$ZK/scripts/build-css.js")" = 0 || { /usr/bin/grep -n 'scrollview.css.dsp' "$ZK/scripts/build-css.js"; fail "stub retired (scrollview.css.dsp still listed)"; }

  stage "the build emits a real scrollview.css.dsp and the coverage check is green"
  (cd "$ZK" && node scripts/build-css.js --module zkmax > "$T/build.txt" 2>&1) || { tail -5 "$T/build.txt"; fail "build-css.js --module zkmax"; }
  test -s "$ZKCML/$DSP" && /usr/bin/grep -q 'z-scrollview' "$ZKCML/$DSP" || fail "scrollview.css.dsp is empty or lacks z-scrollview after the build"
  (cd "$ZK" && node scripts/check-css-dsp.js --module zkmax --zk-home /Users/hawk/Documents/workspace/ZK10 > "$T/dsp.txt" 2>&1) || { tail -5 "$T/dsp.txt"; fail "check-css-dsp.js --module zkmax"; }

  stage "the gallery baseline was re-cut (differs from the template's) and the working tree is limited to the drill's files"
  git -C "$TPL" show HEAD:doc/screenshots/scrollview-gallery.png > "$T/tpl.png"
  cmp -s "$T/tpl.png" "$ZK/$BASE" && fail "scrollview-gallery.png is still the template's (unstyled) baseline — not re-cut"
  (cd "$ZKCML" && git status --porcelain zkmax/src) > "$T/cml.txt"; (cd "$ZK" && git status --porcelain scripts zkpreview/doc/screenshots) > "$T/zk.txt"
  echo "   zkcml changes:"; sed 's/^/     /' "$T/cml.txt"; echo "   zk changes:"; sed 's/^/     /' "$T/zk.txt"
  /usr/bin/grep -vE "scrollview" "$T/cml.txt" | /usr/bin/grep -q . && fail "zkcml carries changes beyond scrollview"
  /usr/bin/grep -vE "scrollview|build-css.js" "$T/zk.txt" | /usr/bin/grep -q . && fail "zk carries changes beyond scrollview's baseline and build-css.js"

  stage "the drill read nothing under zkThemeTemplate (transcript grep)"
  test -n "$TRANSCRIPT" && test -f "$TRANSCRIPT" || fail "transcript path required: verify-p3-gate.sh static <drill>.jsonl"
  n=$(/usr/bin/grep -c 'zkThemeTemplate' "$TRANSCRIPT"); test "$n" = 0 || fail "the drill's transcript mentions zkThemeTemplate $n time(s)"
  test "$(/usr/bin/grep -c 'zk/.claude/skills/marble-theme\|marble-theme/SKILL.md' "$TRANSCRIPT")" -ge 1 || fail "the drill never opened zk's marble-theme skill"
  test "$(/usr/bin/grep -c 'doc/contracts/scrollview.md' "$TRANSCRIPT")" -ge 1 || fail "the drill never opened zk's scrollview contract"
  echo "P3 gate static ok — scrollview styled in zkcml from zk's own knowledge; stub retired; build and coverage green; baseline re-cut; transcript clean"
  exit 0
fi

if [ "$MODE" = live ]; then
  stage "start zkpreview, probe the contract's computed-style rows, compare the gallery shot with the re-cut baseline, stop"
  MOD=$ZK/zkpreview; PORT=8085
  . "$TPL/doc/migration/tools/preview-server.sh"
  preview_port_free
  PREVIEW_LOG=$(mktemp); F=$(mktemp -u); mkfifo "$F"; exec 3<>"$F"
  ( cd "$MOD" && ./gradlew appRun -PhttpPort=8085 --console=plain -q < "$F" > "$PREVIEW_LOG" 2>&1 ) & RUNPID=$!
  url="http://127.0.0.1:$PORT/scrollview.zul"; code=000
  for _ in $(seq 1 "${START_TIMEOUT:-300}"); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo 000); [ "$code" = 200 ] && break
    kill -0 "$RUNPID" 2>/dev/null || { tail -n 40 "$PREVIEW_LOG"; fail "appRun exited before serving"; }; sleep 1
  done
  [ "$code" = 200 ] || { tail -n 40 "$PREVIEW_LOG"; preview_stop; fail "GET $url → HTTP $code"; }
  # contract rows c1 / c2 as a computed-style probe (the contract's expected values, read by the Planner when writing this gate)
  PDIR=$ZK/zkpreview/build/probe-p3-gate; mkdir -p "$PDIR"; cp "$TPL/doc/migration/tools/forced-colors-focus-probe/playwright.config.ts" "$PDIR/"
  cat > "$PDIR/scrollview.spec.ts" <<'TS'
import { test, expect } from '@playwright/test';
test('scrollview contract rows c1 / c2 and a served stylesheet rule', async ({ page }) => {
  await page.goto('/scrollview.zul', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.z-scrollview', { timeout: 15000 });
  const m = await page.evaluate(() => {
    const el = document.querySelector('.z-scrollview')!; const cs = getComputedStyle(el);
    let served = 0; for (const s of document.styleSheets) { try { for (const r of (s as CSSStyleSheet).cssRules) { if ((r as CSSStyleRule).selectorText?.includes('.z-scrollview')) served++; } } catch {} }
    return { overflow: cs.overflow, bg: cs.backgroundColor, served };
  });
  console.log(`scrollview: overflow ${m.overflow}, background ${m.bg}, ${m.served} served rule(s) naming .z-scrollview`);
  expect(['auto', 'hidden', 'auto auto', 'hidden hidden', 'hidden auto', 'auto hidden']).toContain(m.overflow);   // c1
  expect(m.bg).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);                                                          // c2
  expect(m.served).toBeGreaterThan(0);
});
TS
  (cd "$MOD" && PREVIEW_URL=http://127.0.0.1:8085 npx playwright test --config build/probe-p3-gate/playwright.config.ts --reporter=list > "$T/probe.txt" 2>&1); prc=$?
  /usr/bin/grep -E 'scrollview:|passed|failed' "$T/probe.txt" | head -4
  (cd "$MOD" && PREVIEW_URL=http://127.0.0.1:8085 npx playwright test --config src/test/playwright/playwright.config.ts --project=gallery -g 'gallery scrollview$' --reporter=line > "$T/gal.txt" 2>&1); grc=$?
  /usr/bin/grep -E '[0-9]+ (passed|failed)' "$T/gal.txt" | head -2
  preview_stop; preview_assert_free
  test "$prc" = 0 || { tail -15 "$T/probe.txt"; fail "contract probe (exit $prc)"; }
  test "$grc" = 0 && /usr/bin/grep -q '1 passed' "$T/gal.txt" || { tail -15 "$T/gal.txt"; fail "gallery scrollview against the re-cut baseline (exit $grc)"; }
  echo "P3 gate live ok — contract rows hold on the served page; the gallery shot matches the re-cut baseline"
  exit 0
fi
fail "unknown mode $MODE"
