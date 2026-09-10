# Marble → zk Repository Migration Plan

**Status:** **P0 complete.** P3 under way. D14–D18, **D21, D22 ruled**; **D19 open** (blocks P4 only); **D20 resolved in practice**. Execution runs from a new Planner session rooted in `zk` (§4) per [marble-to-zk-execution-plan.md](marble-to-zk-execution-plan.md). The IceBlue-side
work that used to sit in P0 is out of scope (see the scope note).
**Written:** 2026-09-08 · **Last revised:** 2026-09-09 · **Decision series:** D13–

**Technical appendix:** [marble-to-zk-migration-appendix.md](marble-to-zk-migration-appendix.md) —
every file reference, line number, commit hash, raw measurement, closed decision and change-log
entry. Sections there are cited below as *appendix §A.n*.

**Companion documents:** [zk11-marble-migration-risk-assessment.md](zk11-marble-migration-risk-assessment.md)
(risk profile, CSS-conversion order) · [migration-manifest.md](migration-manifest.md) (per-asset
disposition) · [zk11-less-dsp-deprecation-evaluation.md](../zk11-less-dsp-deprecation-evaluation.md)
(the architecture decision this implements).

> **How to read this document.** §1 is the summary — no line numbers, no commit hashes. §2 is the
> plan of record: what each phase must produce and who produces it. §3 is what still needs a
> ruling. §4 is who does what. Everything micro lives in the **appendix**, so this document stays
> short enough to read end to end. If this document and the appendix disagree, the appendix holds
> the evidence and this one holds the conclusion — **fix the conclusion, do not annotate it.**

---

## 1. Executive Summary

### Goal

Move Marble into the `zk` repository so completely that **this workspace is never needed again** —
not just the CSS, but the preview pages, the verification harness, the specifications, the build
scripts, and the accumulated maintenance knowledge.

### Definition of done

A developer who has never seen `zkThemeTemplate` can, from a fresh `zk` checkout:

1. build the framework and get Marble as the default look-and-feel;
2. open a preview page and see every themed component;
3. edit a component's CSS and watch the change;
4. run the verification harness and get a pass/fail;
5. answer "how does this theme work, and what must I not break?" from **one skill**, without
   searching other repositories.

If any of those five still requires this workspace, the migration is not finished.

**Scope note.** This workspace stops being where Marble is *maintained*. It does **not** disappear:
`zkThemeTemplate` remains the public theme-template product, with `master` becoming Marble and a new
`iceblue` branch carrying the old content. Marble therefore exists in two repositories on purpose,
and the rule that keeps that honest is the organising principle of the whole migration:

> **Maintainer assets move. Customer-facing deliverables are copied, with `zk` as the single source
> of truth.**

Getting this the wrong way round is what would reopen the two-repository problem.

**Out of scope — the IceBlue side.** Everything to do with preserving, branching or building
IceBlue is **owned by a separate workstream and deliberately absent from this plan**: cutting the
`iceblue` branch, the Theme Pack palettes, and the `zkthemebuilder` submodule and its build script.
The measurements this project made on them are kept in the appendix for whoever picks that work up,
but no work item here depends on doing them — with one exception, recorded honestly: **P4's
promotion onto template `master` needs the `iceblue` branch to exist first**, or the LESS content
that branch is meant to preserve is lost. That is a dependency on another workstream, not a task in
this one.

### Phases

| # | Phase | Milestone | Owner | Progress |
|---|-------|-----------|-------|----------|
| **P0** | Consolidate & Freeze | This workspace holds only what is worth moving | done (old session) | **100%** |
| **P1** | Build Integration | Marble CSS builds from inside `zk`; LESS retired | Planner session | 0% |
| **P2** | Verification Environment | Preview pages and harness run inside `zk` | Planner session | 0% |
| **P3** | Knowledge Encapsulation | One skill answers every maintenance question | Planner session | **≈40%** |
| **P4** | Cutover & Archive | This workspace goes read-only; Jess work resumes in `zk` | Planner session | 0% |

### Overall progress

**≈15%**, weighting P1 and P2 as the bulk of the engineering. P0 is done: the asset triage produced
a reviewed manifest, the live documents are tracked, the archive set is disposed of, and the
session's memory is split — 48 files folded into the `marble-theme` skill (now 11 files) and the
18 that cannot travel written up for the target session to re-establish. All of that is under
version control for the first time.

### Where the risk actually is

**Not the CSS.** The 132 theme stylesheets copy in an afternoon, and the registration surface they
must satisfy needs **zero** changes, because Marble already emits the `.css.dsp` filenames ZK asks
for. That is verified, not assumed.

**The knowledge.** 66 memory files, 26 specifications, 94 component contracts, 5 subagents and a
large root `CLAUDE.md` — none of which travels by copying, and all of which is what actually lets
someone maintain this theme. P3 decides whether this migration succeeds.

**The safety net, which nearly got discarded.** The 199 screenshot baselines are the only asset that
can answer "did moving Marble change how Marble looks?". Because the move keeps both the minifier
and the page shell, the rendered output should be *identical* — so any pixel difference is the
migration reporting a defect. The first draft of this plan recommended throwing them away; D16
records why that was wrong.

### What is blocked, and on whom

| Blocked item | Owner | Blocked on |
|---|---|---|
| P4's promotion onto template `master` | Source | **D19** — still open, and it now also needs the `iceblue` branch, which the other workstream owns |
| Nothing else | — | — |

**P0 is no longer blocked on anything.** Its three authorisation-gated items were the IceBlue-side
ones, and they have left this plan.

---

## 2. Phase Breakdown

Counts in this section follow appendix §A.2's unified vocabulary. Where an earlier revision of this document
used a different number, appendix §A.2 says which was measuring what.

### P0 — Consolidate & Freeze

**Goal:** stop accumulating state here, and decide what is worth carrying.

| | |
|---|---|
| **Owner** | **Source** — undivided; every write lands in this repository |
| **Input** | 91 `tasks/` files, 488 `doc/` files, 66 memory files, 7 skills, 5 subagents |
| **Output** | A reviewed per-asset manifest; only live assets left on disk here |
| **Gate** | Nothing left unclassified, and no live document left in untracked scratch |

Work items:

- [x] **Triage `tasks/`, `doc/` and the memory files** → [migration-manifest.md](migration-manifest.md),
      classifying every asset under seven dispositions (MOVE / STAGED COPY / COPY / SKILL / ARCHIVE
      / DROP / RE-ESTABLISH).
- [x] **Rescue the 12 live documents from untracked scratch.** `tasks/` is ignored wholesale, so
      **none of its 91 files was under version control** — including this plan. The 12 live ones
      moved into `doc/` by category and are now tracked.
- [x] **Fold the knowledge documents into the skill.** 10 source documents became the
      `marble-theme` skill's 9 files, committed here. This is P3 step 1 (§4).
- [x] **Dispose of the archive set.** 44 completed-investigation documents were verified
      byte-for-byte into a single archive and the originals deleted, taking `tasks/` from 91 files
      to 2. This is what **retired D20**.
- [x] **Classify the 7 skills** — only two are Marble content; two are ZK-portable and belong in
      `zk` regardless of this migration; three are third-party or personal and should be installed
      or left alone. Table in appendix §A.7.
- [x] **Freeze Jess design-review work.** The 50 in-scope issues are solved *after* the
      migration, and in `zk`. The freeze had been recorded only in session memory, so a reader of
      the triage board would not have known; the board now carries the notice at the top and
      points back to P4, where resuming the work is the last item.
- [x] **Execute the manifest's memory split.** Done 2026-09-09. Of 66 files, **48 folded into the
      skill** — two new reference pages (`layers.md`, `zul-authoring.md`), substantial additions to
      `verification.md` and `tokens.md`, and the ZK version coordinates and MUI reference in
      `SKILL.md`. **18 cannot travel** — the user's working preferences, this machine's quirks and
      the project's commercial context — and are written up in
      [session-memory-transfer.md](session-memory-transfer.md) for the target session to
      re-establish as its own memory. The remainder are migration state that the plan now carries,
      or migration-time knowledge already in the appendix.

### P1 — Build Integration

**Goal:** Marble CSS is built by `zk`'s own build, and the LESS tree is gone.

| | |
|---|---|
| **Owner** | **Target** — undivided; every artifact lands in `zk` or `zkcml` |
| **Input** | 132 theme CSS sources, the CSS builder script, 5 Java integration classes, 160 LESS files across the three modules |
| **Output** | Marble CSS under the core layout, a Gradle task that builds it, the LESS compile task retired |
| **Gate** | The `zk` + `zkcml` composite build succeeds and the jar contains the expected `.css.dsp` set |

**The landing split is mechanical, not a CE/EE judgement call.** This answers the target side's
"which repository does the first file go to":

| Destination | Sources | Content |
|---|---|---|
| `zk` → `zul` module (CE) | **87** | component CSS 62 + foundation 25 (tokens 12, utility 9, base 4) |
| `zkcml` → `zkmax` (EE) | **40** | component CSS 27 + tablet 13 |
| `zkcml` → `zkex` (PE) | **5** | colorbox, columnlayout, fisheye, pdfviewer, rangeslider |

132 of 132, no remainder. Marble is ZK 11.0's *default* look-and-feel, so the CE base must live in
`zk/zul`; EE/PE component styling follows its own module. All three modules convert on one branch,
which the composite build forces anyway.

**P1's shape is settled: wrap the existing CSS builder in its own Gradle task.** Three measurements
ruled out the alternative of widening an existing task — the pure-CSS task in `zk` is a no-op today,
the LESS task structurally cannot see a `.css` file, and today's `css/` directories are LESS
*output* rather than source. Evidence in appendix §A.4.

This is the cheaper branch: the builder is self-contained and already carries the bundling rules,
the orphan guard, the layer assertion and both minifier-corruption workarounds — all of which D14
elected to keep, and which the D16 comparison depends on.

**Two hard constraints follow:**

- **The LESS tree must be deleted in the same commit that lands Marble**, not run alongside it.
  Both pipelines emit `.css.dsp` into the same generated directory, resource processing is set to
  include duplicates, and there is **no ordering constraint** between the two tasks — so running
  both makes the output depend on task execution order.
- **P1 edits two build files, not one.** `zkcml` carries a *duplicate* definition of both tasks
  with the same blind spot, differing only in include paths.

**Also: never point the LESS compiler or gulp at Marble's source tree.** Files beginning with `_`
are treated as LESS partials and skipped, and Marble's tokens, utilities and tablet files are all
`_`-prefixed. The failure would be silent.

**The registration surface needs zero changes — verified, not assumed.** ZK does not discover
widget CSS by convention: 78 registration entries name each stylesheet individually, 100%
hard-wired to the `.css.dsp` extension. Marble already builds *to* that surface — its source is
`.css`, its **output is `.css.dsp`**, and the builder holds the expected filename list explicitly
against those registrations. The project's own checker reports **zero missing**, and it reads the
real ZK language files rather than an internal copy, so that result is verified against ZK's actual
requests. A build-time orphan guard **fails the build** on any component stylesheet that is neither
registered, bundled, nor served in the aggregate, which makes a silently dead file impossible by
construction.

Work items:

- [ ] Relocate CSS sources to the unprefixed core layout — no `marble/` path segment — and delete
      the theme provider's prefix rewrite.
- [ ] Port the builder's bundling rules and its two empirically-found minifier workarounds. **Do
      not treat these as optional**: both were silent-corruption bugs, and both are
      minifier-specific, so a pipeline change re-opens them.
- [ ] Convert all three modules in one commit range; keep LESS in place until all three are green
      (a core-only conversion does not compile).
- [ ] **Author a second variant of the 5 Java classes**, rather than re-homing them. Theme
      registration in core is not the same as registration from a theme jar — and under D18 the
      jar-registration variant must keep existing here for the forkable template. Both variants
      are live; neither is a copy of the other.
- [ ] Port the stylesheet-registration checker into the `zk` build. Without it a mis-pathed
      stylesheet silently 404s. **Note: there is no version-drift checker to port — it does not
      exist.** That gap is worth closing on the way through (appendix §A.4).

### P2 — Verification Environment

**Goal:** you can *see* and *measure* Marble from inside `zk`.

| | |
|---|---|
| **Owner** | **Target** stands it up; **Source** supplies the artifacts and the failure modes |
| **Input** | 159 preview and use-case pages, 13 Playwright specs, **199 compared** screenshot baselines, the build and check scripts |
| **Output** | Preview pages served from a `zk` module; the harness runnable there |
| **Gate** | The 199 baselines re-run **at zero tolerance** against the migrated build, with every difference explained (D16) |

**The module recipe is settled — take one piece from each of three existing precedents rather than
copying any one of them.** Details and line references in appendix §A.5.

| Element | Copy from | Why that one |
|---|---|---|
| Module structure | An **independent root build**, included into the composite | A plain subproject would inherit the root build's LESS and CSS tasks, which is the exact source of the output collision P1 must avoid. An independent root build makes that structurally impossible. |
| Dependency wiring | **`zktest`'s dependency substitution** | The only mechanism that declares dependencies by *published coordinate* while binding them to *live source*, so a one-line CSS edit is visible without publishing to the local repository. |
| Container skeleton | **`zksandbox`'s 64-line build file** | The smallest configuration proven to serve pages here; strip the heavy extras. |
| Page shell | **`zktest`'s 31-line servlet** | It already *is* a theme-switching harness, driven by a URL parameter that sets a cookie — precisely the control surface the D16 comparison needs. |

**`zksandbox` is disqualified as the base for a second reason, independent of D15's.** It declares
ZK by published coordinate with no substitution, so it builds against whatever was last published
locally, and its theme comes from a theme *jar* rather than the source tree. A preview module whose
CSS edits require a publish step is unusable for this work.

Work items:

- [ ] Stand up the new preview module per the recipe above, carrying the page shell **verbatim** —
      the shell is what makes the baselines comparable, so this is a copy, not a redesign.
- [ ] Move the preview and use-case pages, including the single-page-application host and its
      bookmark navigation.
- [ ] Move the Playwright harness and re-point its base URL and configuration at the new host.
- [ ] Drop `zksandbox`'s external theme-jar pin — it depends on the very theme this migration
      removes.
- [ ] **Solve the servlet-flavour mismatch — bounded, and the boundary is measured.** `zk` compiles
      against the older servlet namespace; the current preview app is Spring Boot 3 on the newer
      one. The preview module therefore cannot be a straight copy of the Spring Boot host, and the
      workable combination is narrow (appendix §A.5). This affects the *host*, not the rendered pixels, so
      it does not threaten the D16 comparison — but the live-reload workflow must be either rebuilt
      or consciously dropped, and the skill must document whichever is true.
- [ ] **Run the migration comparison at zero tolerance** and explain every difference. Expect the
      font-URL signature first: a uniform vertical drift on every page means the web font failed to
      load. Only after every difference is explained should the normal tolerances be restored.

### P3 — Knowledge Encapsulation

**Goal:** one skill carries everything a maintainer needs. This is the phase that discharges the
actual requirement.

| | |
|---|---|
| **Owner** | **Source authors, Target commits** — neither side can do this phase alone (§4) |
| **Input** | 66 memory files, 26 specifications, 94 component contracts, 19 contract mockups, 5 subagents, the root `CLAUDE.md` |
| **Output** | `.claude/skills/marble-theme/` in `zk`, plus the two ZK-portable skills re-homed |
| **Gate** | **Cold-start drill** — a session launched in `zk` with no prior context is given a real theme task and completes it using only the skill |

Target skill shape:

```
zk/.claude/skills/
├── marble-theme/                 # the maintenance skill
│   ├── SKILL.md                  # when to use; build and verify commands; the file-layout map
│   └── reference/
│       ├── tokens.md             # the --zk-* vocabulary, cascade and override rules
│       ├── css-dsp.md            # what decides each stylesheet's output path
│       ├── verification.md       # the harness, baseline tolerance, the font-load race
│       ├── density.md            # the compact-density ladder
│       ├── brand-override.md     # seed-colour overrides
│       ├── iceblue-parity.md     # how Marble's vocabulary relates to IceBlue's
│       ├── bug-filing.md         # filing a ZK bug found while theming
│       └── pitfalls.md           # silent-corruption traps, ordered by cost
├── zk-component-rules/           # MOVED — theme-independent, belongs in zk permanently
├── zul-writer/                   # MOVED — ZK-portable
└── show-me/                      # already present in zk
```

Work items:

- [x] **Author `marble-theme` from the memory triage, not from scratch.** Nine files, committed in
      this repository. The memory index's own section headings already partitioned the knowledge
      along almost exactly these reference files, which is what made this a re-homing exercise
      rather than an authoring one (appendix §A.8).
- [x] **Fold in what the skill itself declared missing** — cascade-layer mechanics, the ZUL
      authoring rules, the visual-regression gotchas, the ZK version coordinates. Done with the P0
      memory split. What the skill still names as unmerged is the two tooling skills below.
- [ ] **Copy the skill into `zk` and commit it there.** Step 2 of the two-step sequence in §4.
- [ ] **Merge the two tooling skills** — `css-theme-audit` and `important-reduction` — into
      `marble-theme`, as classified in appendix §A.7.
- [ ] Move the 26 specifications (normative) and the 94 component contracts with their 19 mockups.
      The contracts are the harness's expected values; without them the harness has nothing to
      compare against.
- [ ] Move the 5 subagents, and re-point every path they cite. **Two of them still cite a report
      directory that was deleted in P0 and has no counterpart in the tracked tree** — a two-line
      fix, but until it is made their output would land in two places.
- [ ] Fold the Marble-relevant parts of this repository's root `CLAUDE.md` into `zk`'s much smaller
      one — as a pointer to the skill, not as a second copy of it.
- [ ] **Rewrite every repository-relative path.** Memories and specifications cite paths that
      resolve against the *wrong repository* without erroring once the session is rooted in `zk`.
      This is a silent-failure class of its own.

### P4 — Cutover & Archive

**Goal:** close the door.

| | |
|---|---|
| **Owner** | **Split by repository** — template promotion is Source; everything in `zk`/`zkcml` is Target |
| **Input** | A green P1–P3 |
| **Output** | Merged Marble branch; this workspace read-only; Jess work resumed in `zk` |
| **Gate** | A full `zktest` run triaged against the pre-migration baseline |

Work items:

- [ ] Baseline the unmodified fork with a full `zktest` run **before** the Marble commits land —
      without a before-picture a Marble regression is indistinguishable from a pre-existing flake.
- [ ] Fix the `zktest` icon fallout (roughly 50 unresolved icon classes, plus the sizing and
      stacking classes, which are API rather than artwork). Bounded by the test suite.
- [ ] Close the 6 measured component coverage gaps: codeeditor, scrollview, video, skeleton,
      sliderbuttons.
- [ ] Port the tablet layer onto Marble's runtime density model.
- [ ] **Execute D17:** promote Marble onto template `master`. **Two preconditions:** the
      `iceblue` branch must already exist — that is the other workstream's task, not ours — and
      the promotion mechanism is **D19**, still open. **Not a fast-forward**: the two branches have
      divergent histories.
- [ ] **Write the D18 sync script**, hosted in `zk` beside the release tooling: it reads core's
      Marble CSS and writes template `master`. Run a version check on the *synced result*, not only
      on core — a version drift between the coordinated locations silently un-themes an
      application.
- [ ] **Mark template `master` as generated** so no one hand-edits the upstream copy. The first
      sync happens at the ZK 11.0 release, so this is the tail of the work, not a blocker.
- [ ] Resume the 50 in-scope Jess issues, in `zk`.

---

## 3. Open Decisions

Ruled decisions D14–D18 are recorded in appendix §A.9. Only what still needs a ruling appears here.

### D19 — How does Marble get onto `zkThemeTemplate` `master`? — **OPEN**

**Background.** D17 says template `master` becomes Marble. Marble actually lives on the theme
branch, and the two branches have **divergent histories**: `master` holds 153 LESS files and no
CSS; the theme branch holds no LESS and 132 theme stylesheets. So "promote onto master" is not a
fast-forward — it is a history-level decision about a repository customers fork.

**Impact.** This is the branch customers will clone and whose history they will read. It matters
only at P4, so it blocks nothing now. Note that the LESS content is preserved under every option
**only if the `iceblue` branch has been cut first**, and that is owned by the IceBlue workstream
rather than by this plan.

**Scope: `zkThemeTemplate` only.** In `zk` and `zkcml` the Marble branch sits on the *same commit*
as its own `master`, so there is no divergence there and the eventual merge is a plain
fast-forward. The divergent-history problem exists in exactly one of the three repositories.

**Options.**

- **【A】Merge the theme branch into `master`** (recommended): one merge commit recording 153
  deletions and 132 additions. **Cost:** honest but noisy history; customers see a LESS→CSS
  transition in their fork's log, which is arguably the correct story to tell.
- **【B】Fast-forward by renaming**: make the theme branch the new `master` and repoint the default
  branch. **Cost:** cleanest resulting history, but `master`'s existing history stops being
  reachable from `master`, and anyone with an old clone gets a non-fast-forward surprise.
- **【C】Squash the tree onto `master`**: a single "ZK 11.0 Marble" commit replacing the tree.
  **Cost:** loses Marble's own development history from the customer-facing branch — and that
  history is where the design rationale lives.

### D20 — How do the archive-classified working notes get archived? — **RESOLVED 2026-09-09**

Recorded here rather than in the appendix's closed-decision log because it was open in the previous revision of this document.

**The problem was real:** `tasks/` is ignored wholesale, so ARCHIVE — defined as "stays in this
repository's git history" — had no history to stay in. Deferring 44 files on disk in a workspace
whose whole purpose is to become unnecessary is deferral, not archiving.

**Resolution: option C, executed with a verified fallback.** The 44 files were compressed into a
single archive, every file compared byte-for-byte against the archive before deletion, and the
originals removed. `tasks/` went from 91 files to 2. The 12 live documents had already been moved
into the tracked tree, so nothing load-bearing depended on the deleted set.

**One residual choice, not a decision:** the archive currently sits untracked at the repository
root. If it should be versioned, `doc/` is a better home than the root; if not, it should be either
ignored explicitly or moved outside the repository.

---

## 4. Session Topology

**Revised 2026-09-10 (D21).** The migration is run by **one Planner session rooted in `ZK10/zk`**,
with this repository added as a working directory. Role separation comes from subagents — every
item gets a fresh Generator and a *different* fresh Evaluator — not from a second session. The
execution detail is in [marble-to-zk-execution-plan.md](marble-to-zk-execution-plan.md); this
section records only who is where and why.

| Session | Root | Role | Writes |
|---|---|---|---|
| **Planner** | `ZK10/zk` (+ `zkThemeTemplate` via `/add-dir`) | Plans, briefs, dispatches every item through a per-phase workflow; reads every verdict | Everything — `zk`, `zkcml`, and the five template-side items (3.1–3.3, 4.6–4.7) |
| **External Evaluator** | `zkThemeTemplate` (this session's lineage) | Judges the four gates — P1 build, P2 ledgers, P3 cold-start, P4 triage — from verdict files alone | Nothing |

**Why rooted in `zk`.** Forty of the forty-five sized items write there; `zk`'s own `CLAUDE.md`,
rules and (after P3) skill load automatically; and an irreversible write is authorised in the
repository it touches. **Why a new session.** Every ruling now lives in tracked files and the old
session's memory has been split (48 entries into the skill, 18 into a transfer document), so a
Planner that can start from the files alone is the migration's cold-start drill run early — a gap
it hits is a documentation finding, which is exactly the kind the migration exists to close.

Never launch in `ZK10/` itself — it is not a git repository, so there is no branch awareness and
git commands are ambiguous.

Three constraints still carry consequences:

1. **Memory does not merge across sessions.** The new Planner re-establishes the 18 non-portable
   entries from `session-memory-transfer.md` as its first act; everything else it needs is in the
   skill or the plan.
2. **Permission boundaries are per-session and cannot be laundered.** The external Evaluator's
   verdict is a judgement, never an approval; the Planner's writes are authorised by the user in
   the Planner session.
3. **Several sessions may still touch this repository.** Never infer file ownership from git
   status; stage explicit paths.

**What this retires.** The earlier Source / Target ownership split, the per-phase split table, and
the "skill authored here, copied by the Target" two-step — the copy (item 3.4) is now just another
Planner-dispatched item. The observation that drove the change stands: with two Planners, messages
interleaved and work was duplicated; with one, the coordination cost is gone and the isolation that
matters is provided by subagents that never see each other.
