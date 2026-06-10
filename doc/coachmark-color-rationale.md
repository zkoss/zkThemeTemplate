# Coachmark background color — design rationale & consistency question

## The observation
Coachmark's card (`.z-coachmark-content`) is filled with `--zk-color-primary` (blue) +
`--zk-color-on-primary` (white) text. Every other popup-family component in Marble is a
neutral surface, a status tint, or a dark grey tooltip — none uses a saturated brand fill.

| Component | Background | Text |
|-----------|-----------|------|
| **coachmark** | `--zk-color-primary` (blue) | `on-primary` (white) |
| notification | `surface-container-highest` / status-tinted | `on-surface` |
| toast | dark `rgba(50,50,50,.95)` / status-container | white / on-container |
| popup (tooltip) | `surface` + border, or dark `rgba(97,97,97,.92)` | `on-surface` / white |
| bandpopup | `surface` + border | `on-surface` |

## Why coachmark is different (the deliberate reasoning)

1. **Different intent.** Tooltips/popovers/notifications are *passive* — they appear in response
   to the user (hover, an event) and inform. A coachmark is *proactive guided discovery*: it
   interrupts, dims the whole page with a scrim mask, and says "look **here**." It is a
   call-to-action, not an info surface.

2. **It fights a mask.** Coachmark is the only popup that ships with a full-page scrim
   (`.z-coachmark-mask`, `--zk-color-scrim`). The card has to win attention *against* a darkened
   page. A neutral `surface` card on a dimmed page reads as muted; a primary fill pops.

3. **Material heritage.** Material Design's original *Feature Discovery* pattern (tap-target
   reveal) used a **primary-color overlay with white text** for exactly this job. MD3/MUI v7
   dropped the dedicated component, so there is **no canonical MD3 token answer** — it's a theme
   judgment call. Primary-fill is the historically-grounded choice for this specific pattern.

This is why the contract (`doc/contracts/coachmark.md`) already flags `mockup-needed: Y` with the
rationale "Marble's primary-filled card … significantly diverges from iceblue's neutral default;
mockup needed to pin the primary-surface design intent." The divergence is intentional and recorded.

## The consistency tradeoff (your call)

**Option A — keep primary-blue (recommended).**
The distinction is *semantically meaningful*: brand fill = proactive interruption, neutral surface
= passive info. Consistency-by-sameness would actually erase a useful signal. The pattern is
defensible against Material's feature-discovery heritage. No code change.

**Option B — make it a neutral surface (consistent with other popups).**
Coachmark becomes `surface` / `surface-container-highest` + `on-surface` text, matching
notification/popup. Pro: one coherent "popup look." Con: on the dimmed mask it reads quieter, and
it loses the call-to-action quality. Would require restyling `coachmark.css` (bg, text, pointer
border-color, close color) + updating contract assertions c1, c2, c6–c10, M1, M6 + a new mockup.

**Option C — keep the brand emphasis but soften** (e.g. `primary-container` + `on-primary-container`,
a tonal/pale-blue instead of full saturation). A middle ground: still "the special one," but less
loud. MD3-idiomatic (container roles are the softer tonal tier). Same files touched as B.

## Recommendation
Keep **Option A**. The rule worth encoding: *consistency should be by **role**, not by **sameness***.
Coachmark plays a different role (proactive, mask-backed, call-to-action) than the passive popups,
so a different surface treatment is correct — the same way a filled primary button differs from a
text button on purpose. If anything is "inconsistent," it's worth a one-line note in DESIGN.md that
coachmark is intentionally the lone brand-filled popup, so a future pass doesn't "fix" it back to
neutral by reflex.
