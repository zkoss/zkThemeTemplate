# Jess design review — deferred list

Split out of `tasks/jess-review-triage.md` on 2026-08-19. **26 of the 77 open
issues.** Hawk's current scope is P1 (component defects) plus the DECIDE lane;
everything on this page is deliberately out of that scope.

Nothing here is closed or dismissed — these issues stay open in
`hawkchen/marble-issue`. This page records *why* they are parked and what each one
needs, so picking them up later does not mean re-deriving the analysis.

| Group | Count | Disposition |
|---|---|---|
| **A — ZK core** | 12 | file as ZK Jira issues (decision A, 2026-08-19); not fixable in the theme |
| **B — preview page** | 14 | low priority; the theme is correct, the demo page is wrong |

---

## Group A — ZK core (12): to be filed as ZK Jira issues

Behaviour owned by ZK's own JavaScript/Java. No amount of theme CSS fixes these, so
they do not belong in the theme backlog.

**Before filing, each still needs its ZK-source claim confirmed** — the classification
below is triage, not a verified root cause. Use the `zk-bug-filing` skill: project
`ZK`, type Bug, the `# Steps to Reproduce / # Current Result / # Expected Result`
template, a self-contained `<zk>` snippet rather than a zkfiddle link, and the
mandatory **Affects Version/s** field.

| Issue | Symptom | Filing note |
|---|---|---|
| #58 | Collapsed borderlayout region can never be re-docked — the flyout header's restore chevron is `display: none`, so the docked layout is unreachable through the UI | **Highest severity in the whole review** — a functional dead end, not a cosmetic one. Reclassified from THEME: `z-borderlayout-icon` appears nowhere in the theme CSS, so the rule hiding it is not ours. Confirm the source before filing |
| #32 | biglistbox `frozenCols=3` renders frozen and scrollable panes as two stacked header rows instead of one continuous row | Standard freeze-panes behaviour is broken; check whether theme CSS contributes before blaming core |
| #9 | cascader commits a parent-only selection (e.g. Japan without Tokyo) — field renders blank but shows a clear "×"; reopen state is inconsistent between sessions | Two defects in one report: partial commit, and open/close not resetting transient state |
| #21 | daterangebox time setting cannot be saved — no save button, and closing the picker discards it | |
| #20 | daterangebox paints extra dates as selected (Jan 1 / Feb 1 as filled circles identical to real endpoints) | **Already known** to be a ZK artifact, not a theme bug: the empty/seeded popup paints "1st of the anchor month" as `z-calendar-selected`. Probe page `daterangebox-default-probe.zul` exists. May already have a ZK issue — check before filing a duplicate |
| #28 | searchbox keeps stale input on reopen (type, dismiss, reopen → text still there) | |
| #44 | anchornav updates the active highlight but does not scroll to the target section | |
| #50 | navbar dropdown cannot be closed once opened | |
| #56 | window popup opens far down the page, outside the viewport | Confirm the theme contributes no stray `position`/`transform`/`height` first |
| #69 | errorboxes overlap each other and block adjacent inputs | Tied to #30 (DECIDE) — if error feedback moves to inline supporting text, this disappears |
| #75 | confirmpopup left/top placement overlaps its own trigger button | Check whether the theme's arrow/margin sizing causes it before filing |
| #14 | chosenbox shows no "no result" empty state when a search matches nothing | May be an absent feature rather than a bug — decide framing before filing |

## Group B — preview page (14): low priority

The theme renders correctly; the demo page misleads. Jess reviewed the deployed
preview app, so she had no way to tell these apart from theme defects.

Fixes live under `src/test/resources/web/`. Cheap, and they carry no theme risk.

| Issue | What to change | Verified |
|---|---|---|
| #7 | `calendar.zul:11` hardcodes `_c.set(2020, Calendar.MARCH, 15)` — use the current date so constraint demos read correctly | ✔ |
| #70 | `loading.zul:9` `<timer delay="14000">` → `3000` | ✔ |
| #60 | `linelayout.zul` uses 24 `<button>` elements for non-interactive timeline nodes → labels | ✔ |
| #5 | `calendar.zul:21-38` shows bare calendars above a "With Datebox" section; the two don't interact, which reads as a bug | ✔ |
| #62 | cardlayout demo hardcodes card backgrounds → `--zk-color-*-container` | ✔ |
| #63 | rowlayout demo hardcodes column backgrounds → `--zk-color-*-container` | ✔ |
| #45 | coachmark: move "Start tour" above "Steps" (the demo only renders after the tour starts) | ✔ |
| #82 | avatar: use a filled/solid demo image so the component reads properly | ✔ |
| #15 | colorbox: "With value" and "Open swatch" demos are indistinguishable | ✔ |
| #42 | organigram demo renders an extra connector line | ? |
| #46 | drawer: move "close" onto its own line | ? |
| #33 | biglistbox `fixFrozenCols` and `Invalidate` toggles produce no visible change, so their purpose is unreadable | ? |
| #59 | hlayout mixed components are not vertically centred | ? see below |
| #64 | space demo bar height doesn't fit its content | ? see below |

**#62 / #63 carry a project-rule check.** Preview pages must compose existing `z-*`
utilities rather than page-local CSS. Confirm a `z-bg-*-container` utility actually
exists before writing one into the ZUL — if it doesn't, that gap is signal a new
utility belongs in `zul/css/utility/_colors.css`, which makes it a theme change, not
a demo change.

**#59 and #64 hide a theme question.** Should the *theme* default these layouts to
centre alignment, or should the demo pass `valign="middle"` / an explicit height?
Answering that decides whether they stay in Group B or move to P1. Do not patch the
ZUL before deciding.
