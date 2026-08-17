export const meta = {
	name: 'iceblue-drop-less',
	description: 'Run one gated phase of the IceBlue drop-LESS conversion behind the cssdiff G-zero gate',
	whenToUse:
		'Executing doc/iceblue-drop-less-execution-plan.md on the `iceblue` branch. Pass {phase:"prereq"|"P2"|"P3"}; P3 REQUIRES {step:0|1|2|3|4} — the ladder is 1→4→15→43→11 files and one run does exactly one step. One phase (and one step) per run — the plan gates and reviews between them, so a single run that swallowed several would skip the human checkpoint that the gate exists to create.',
	phases: [
		{ title: 'Prereq: rule tables', detail: 'two generators, disjoint outputs, no build' },
		{ title: 'Prereq: audit tables', detail: 'independent recount against the LESS sources' },
		{ title: 'P2: dual-source build', detail: 'scripts/build-css.js + round-trip proof' },
		{ title: 'P2: adversarial gate check', detail: 'mutate, confirm the gate catches it' },
		{ title: 'P3: convert', detail: 'less2css.js over one step of the ladder, per-file commits' },
		{ title: 'P3: review', detail: 'read-only fan-out over the converted files' },
		{ title: 'P3: polish', detail: 'apply review findings' },
		{ title: 'P6: font-awesome generator', detail: 'gen-fa-css.js, G-zero on 4545 declarations' },
		{ title: 'P6: audit', detail: 'independent verification of the generator' },
	],
}

// ---------------------------------------------------------------------------
// Why this workflow has the shape it has
// ---------------------------------------------------------------------------
// The conversion itself is NOT parallelizable, and pretending otherwise would be the
// expensive kind of wrong:
//
//   * The whole tree compiles in ~1.4s. Converting 74 files is a serial script run, not a
//     fan-out opportunity — there is no wall-clock to reclaim.
//   * Every agent that builds writes `target/classes/web/iceblue11`, and every conversion
//     mutates the SHARED source tree. Two conversions in flight means agent A's gate compiles
//     agent B's half-deleted `.less`. The failure is nondeterministic and looks like a
//     conversion bug.
//   * Per-file commits (plan §2.5) contend on one git index.
//
// So: everything that builds, mutates source, or commits runs strictly serially, one agent at
// a time. The genuine fan-out is the REVIEW — plan §P3 lists three judgment calls a script
// cannot make (readability/sectioning, comment placement, duplicate declarations from mixin
// expansion), across 74 files, and reviewing is read-only.
//
// Phases are separately invocable rather than chained, because each phase boundary in the plan
// is a gate plus a human review, and a single background run that crossed several boundaries
// would report success having skipped exactly the checkpoints that make the result trustworthy.

const WT = '/Users/hawk/Documents/workspace/zkThemeTemplate-iceblue'

// `args` may arrive as a parsed object OR as a JSON string, depending on how the caller passed it.
// This bit me for real: a run launched with {phase:"P2"} arrived as the STRING '{"phase": "P2"}',
// so `args.phase` was undefined and the `|| 'prereq'` default silently re-ran prereq — burning two
// agents on already-committed work and reporting phase:"prereq" for a run labelled P2. The default
// being a real phase is what made it silent, so: normalize the input, and make an unparseable or
// unrecognized phase FAIL LOUDLY instead of falling back to something that looks like success.
function readArgs(raw) {
	if (raw == null) return {}
	if (typeof raw === 'object') return raw
	if (typeof raw === 'string') {
		const s = raw.trim()
		if (!s) return {}
		// Accept both '{"phase":"P2"}' and a bare 'P2'.
		if (s[0] !== '{') return { phase: s }
		try {
			return JSON.parse(s)
		} catch (e) {
			return { __parseError: `args was an unparseable string: ${s.slice(0, 120)}` }
		}
	}
	return {}
}

const ARGS = readArgs(args)
const PHASE = ARGS.phase || (ARGS.__parseError ? '__error' : 'prereq')
const BATCH = ARGS.batch
const STEP = ARGS.step

if (ARGS.__parseError) {
	log(ARGS.__parseError)
	return { status: 'bad-args', reason: ARGS.__parseError }
}
log(`phase=${PHASE}${STEP != null ? ` step=${STEP}` : ''}${BATCH ? ` batch=${BATCH}` : ''}`)

const RULES = `
WORKING TREE
  All work happens in ${WT} — the \`iceblue\` git worktree (branch \`iceblue\`).
  Use absolute paths. Never edit anything under
  /Users/hawk/Documents/workspace/zkThemeTemplate — that is a different branch of the same repo.

READ THESE FIRST — they are the spec; this prompt is only a task order and may be less precise:
  ${WT}/doc/iceblue-drop-less-execution-plan.md   phase definitions, G-zero/G-delta criteria, scope
  ${WT}/doc/iceblue-drop-less-progress.md         current status, phase + prereq state
  ${WT}/scripts/cssdiff.js                        the gate (read its header comment)

DO NOT READ THESE WHOLESALE — the two docs above are L1+L2 only (415 and 226 lines) and are
enough to execute a phase. Everything else — rationale, per-phase argument, the append-only
gate log, the per-file review packets, the change logs — is L3 and lives in two SEPARATE files:
  ${WT}/doc/iceblue-drop-less-plan-appendix.md      1691 lines
  ${WT}/doc/iceblue-drop-less-progress-appendix.md   986 lines
Each main doc's 「L3 技術附錄」 section is an index whose 〈何時要看〉 column states exactly when
a given section is needed. Open an appendix section only when that column matches what you are
doing, and reach for grep + a bounded read rather than loading the whole file.

THE GATE
  cd ${WT} && npm run check:gate
  Rebuilds the whole tree, then judges it. Exit 0 is the ONLY acceptable result, in every phase.

  \`npm run check:cssdiff\` is the INSTRUMENT, not the verdict — it prints the raw declaration
  diff against \`baseline/\`. In a G-zero phase the two agree and it exits 0 with the literal
  line \`files differing: 0\`. From P4a on they do NOT: the built tree is deliberately no longer
  equal to \`baseline/\`, so cssdiff exits 1 BY CONSTRUCTION (currently 48 files / 749 records
  = P4a's 728 removals + P4b's 14 removals and 7 additions) and \`check:gate\` — which ends in
  \`check:p4a\` and \`check:p4b\` — is what says whether that difference is exactly the approved
  delta. Those two shape gates each neutralise the OTHER phase's delta on the baseline side, so
  between them they claim the whole diff and neither one's assertions had to be loosened. Read
  cssdiff's output when you need to see the differences themselves; never quote its exit code as
  a pass or a failure.
  Useful extras: \`node scripts/cssdiff.js baseline/ target/classes/web/iceblue11 --list\` prints
  every file with its declaration count; \`--json <path>\` writes a machine-readable report.

HARD PROHIBITIONS
  1. NEVER run \`npm run baseline\`; never create, modify or delete anything under \`baseline/\`.
     The baseline must remain the output of UNCONVERTED source. Rebuilding it from a converted
     tree makes every later gate compare the conversion against itself — it reports
     \`files differing: 0\` and proves nothing, with no error. This is the plan's worst silent
     failure mode, and \`scripts/baseline.js\` refuses overwrites specifically to prevent it.
  2. NEVER \`git add -A\` or \`git add .\`. This working tree carries unrelated uncommitted files.
     Stage explicit paths, then verify with \`git diff --cached --name-only\`.
  3. NEVER \`git checkout\` / \`git restore\` a path to undo an experiment — uncommitted work of
     others may live there. Copy the file aside first and copy it back.
  4. NEVER relax an assertion to make it pass, and never adjust an expected number to match what
     you measured. If a measurement disagrees with the plan, THE DISAGREEMENT IS THE FINDING:
     report both numbers in \`numbersToCorrect\` and carry on.
  5. Do not touch anything the plan's §0 excludes: no \`@layer\`, no Marble utility classes, no
     token renaming, no adding or removing \`--zk-*\` tokens.

REPORTING
  Your final message is consumed by a script, not read by a human. Return the schema, nothing
  else. If you could not finish, say so with status \`blocked\` and a concrete reason — a partial
  honest result is worth more than a confident summary of work you did not verify.
`.trim()

const OUTCOME = {
	type: 'object',
	additionalProperties: false,
	required: ['status', 'summary'],
	properties: {
		status: { type: 'string', enum: ['done', 'blocked', 'gate-failed'] },
		summary: { type: 'string', description: 'What you did and what proves it. 1-4 sentences.' },
		blockedReason: { type: 'string', description: 'Required when status is blocked or gate-failed.' },
		gate: {
			type: 'object',
			additionalProperties: false,
			properties: {
				filesDiffering: { type: 'number' },
				declarations: { type: 'number' },
				filesCompared: { type: 'number' },
			},
			description: 'Verbatim numbers from the final `npm run check:cssdiff` run — the instrument. In a G-delta phase filesDiffering is SUPPOSED to be non-zero; the verdict comes from `npm run check:gate`, not from these.',
		},
		filesWritten: { type: 'array', items: { type: 'string' }, description: 'Repo-relative paths created or modified.' },
		commits: { type: 'array', items: { type: 'string' }, description: 'Short hashes you created, oldest first.' },
		numbersToCorrect: {
			type: 'array',
			description: 'Every place a measurement disagreed with the plan or progress doc.',
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['what', 'planSays', 'measured'],
				properties: {
					what: { type: 'string' },
					planSays: { type: 'string' },
					measured: { type: 'string' },
				},
			},
		},
		notes: { type: 'array', items: { type: 'string' }, description: 'Anything the next phase needs to know.' },
	},
}

const REVIEW = {
	type: 'object',
	additionalProperties: false,
	required: ['filesReviewed', 'findings'],
	properties: {
		filesReviewed: { type: 'array', items: { type: 'string' } },
		findings: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['file', 'kind', 'detail'],
				properties: {
					file: { type: 'string' },
					kind: {
						type: 'string',
						enum: ['duplicate-declaration', 'comment-placement', 'sectioning', 'unclear-token-name', 'suspected-semantic-change', 'other'],
					},
					detail: { type: 'string' },
					suggestedFix: { type: 'string' },
				},
			},
		},
	},
}

// ---------------------------------------------------------------------------
// prereq — the two rule tables. This phase has a DEADLINE: its source files die at P8.
// ---------------------------------------------------------------------------

if (PHASE === 'prereq') {
	phase('Prereq: rule tables')

	const varPrompt = `${RULES}

TASK — generate the LESS-variable → CSS-token rule table (plan §P8, "⚠ 前置").

This is deadline-bound work. \`_zkvariables.less\` is DELETED at P8, and after that this mapping
can only be reconstructed by archaeology. It is also the single most valuable upgrade artifact:
\`readme.md:69\` tells customers to customize by overriding variables, so a well-behaved
customer's entire customization is a pile of variable overrides, and their migration to ZK 11 is
therefore mostly a rename — \`@colorPrimary: red\` becomes \`--zk-color-primary: red\`.

Write a GENERATOR, not a hand-typed table: \`scripts/gen-var-table.js\`, runnable as
\`node scripts/gen-var-table.js\`, emitting both
  doc/migration/less-var-to-token.md     human-readable, grouped, with the exceptions called out
  doc/migration/less-var-to-token.json   machine-readable, for an upgrading AI to consume
A generator is required because it must stay re-runnable on a CUSTOMER'S fork, where the variable
set differs from ours. Add it to package.json scripts.

SOURCES — note there are TWO variables files, and the plan only accounts for one:
  src/main/resources/web/zul/less/_zkvariables.less     844 declarations
  src/main/resources/web/zkmax/less/_zkvariables.less   2 declarations, and they are NOT tokens —
    \`@iphone\` / \`@android\` are media-query strings consumed by tablet.less (P7). They are a
    category the plan's exception list does not have. Cover them and flag the omission.
Also read src/main/resources/web/zul/less/_zkcssvariables.less to understand which side of the
mapping actually emits the \`--zk-*\` custom property.

EXPECTED SHAPE (from the plan — verify, do not assume):
  844 rows, of which 834 are clean 1:1 \`@name: var(--zk-token);\` and 10 are exceptions:
    config strings (not tokens):  @themeProfile, @themePalette
    image paths:                  @loadingAnimationDefer, @loadingAnimationLoad, @sliderTicks,
                                  @progressmeterBackgroundImage
    one-to-many token lists:      @containerButtonColors, @borderlayoutCollapsedIconColors,
                                  @splitterButtonTextColors, @menuScrollableIconColors
Make the generator itself assert these counts and fail loudly on a mismatch, so the table cannot
silently drift. If your measurement differs, report it in \`numbersToCorrect\` — do not edit the
assertion to agree with reality.

ALSO DOCUMENT the escape hatch, because it is the difference between an upgrade a customer can
attempt and one they cannot: a customer may vendor the deleted partials (\`_zkvariables.less\`,
\`_zkmixins.less\`, \`_header.less\`) into their own fork and keep using LESS. Upgrading to ZK 11
and dropping LESS are SEPARABLE decisions; the guide must not imply otherwise.

Do NOT commit — the orchestrator commits. Do NOT touch any .less file. Do NOT run a build.`

	const mixinPrompt = `${RULES}

TASK — generate the LESS-mixin → CSS rule table (plan §P8, "⚠ 前置").

Same deadline as the variable table: \`_zkmixins.less\` is DELETED at P8. This table is for
customers who wrote their own component LESS and called our mixins; without it they cannot tell
what \`.borderRadius(4px)\` was supposed to produce.

Write \`scripts/gen-mixin-table.js\` (runnable, added to package.json) emitting
  doc/migration/mixin-to-css.md
For each mixin: name, parameter list, guard condition if any, and the CSS it expands to. Where a
mixin exists only to fan a value out across vendor prefixes, say so explicitly and cross-
reference P4 — a customer who has already dropped dead prefixes needs a one-line replacement,
not a five-line expansion.

SOURCE: src/main/resources/web/zul/less/_zkmixins.less

MEASURED GROUND TRUTH (I counted this before dispatching you — the plan disagrees, and the plan
is the thing that is wrong):
  24 unique mixin names across 38 definition lines. LESS permits same-name overloads that differ
  by arity or by \`when\` guard, which is why lines exceed names — e.g. \`.boxShadow(@value)\`
  has an \`isstring\` variant and a not-\`isstring\` variant.
  The plan and progress doc both say "32 個定義". That is WRONG; the real number is 38. Put this
  in \`numbersToCorrect\` so the orchestrator fixes both docs.
Have the generator assert 24 names / 38 definition lines.

Also record which mixins are DEAD — the plan already established that \`progid:DXImageTransform\`
at _zkmixins.less:240 has zero reachable call sites and contributes 0 output declarations. A
mixin with no call site is worth marking as such: it tells a customer not to bother porting it.
Determine reachability by grepping call sites across src/main/resources/web/**/*.less, and report
the count per mixin.

Do NOT commit — the orchestrator commits. Do NOT touch any .less file. Do NOT run a build.
Write ONLY doc/migration/mixin-to-css.md and scripts/gen-mixin-table.js — the other agent in this
phase owns the variable table and package.json's var-table entry; coordinate by not overlapping.`

	const [vars, mixins] = await parallel([
		() => agent(varPrompt, { label: 'gen:var-table', schema: OUTCOME }),
		() => agent(mixinPrompt, { label: 'gen:mixin-table', schema: OUTCOME }),
	])

	phase('Prereq: audit tables')

	const audit = await agent(
		`${RULES}

TASK — adversarially audit the two rule tables just generated. Assume they are wrong until you
have recomputed them YOUR OWN WAY.

  doc/migration/less-var-to-token.md + .json   (generator: scripts/gen-var-table.js)
  doc/migration/mixin-to-css.md                (generator: scripts/gen-mixin-table.js)

These tables become load-bearing at P8: the source files they describe get deleted, so an error
here is unrecoverable and will be discovered by a customer, not by us. Specifically check:

  1. COVERAGE — is every declaration in both \`_zkvariables.less\` files represented? Derive the
     count independently (do not reuse the generator's own count) and diff the name sets.
  2. CORRECTNESS OF THE 1:1 CLAIM — sample at least 15 rows spread across the file and confirm
     the stated \`--zk-*\` name is what \`_zkcssvariables.less\` actually emits. A mapping that is
     syntactically 1:1 but semantically wrong is worse than a missing row, because it will be
     applied mechanically and confidently.
  3. EXCEPTIONS — are all 10 present, correctly categorized, and is the \`zkmax\` media-query
     pair handled? Is there an 11th nobody noticed?
  4. MIXINS — recount names and definition lines yourself. Confirm the dead-mixin call-site
     counts by independent grep.
  5. RE-RUNNABILITY — actually run both generators a second time and confirm the output is
     byte-identical (\`git diff\` clean after regeneration). A generator that is not
     deterministic cannot be shipped to a customer.

One thing the plan flags as OPEN and you should NOT try to settle by reading alone: whether
overriding \`--zk-color-primary\` is BEHAVIOURALLY equivalent to overriding \`@colorPrimary\`.
Only syntactic 1:1-ness is established, and readme.md:8-10 hints the two paths are not perfectly
symmetric. If you can cheaply find a counter-example (a variable used at LESS compile time in a
way a runtime custom property cannot reproduce — import path interpolation, a guard condition, an
arithmetic operand), that is a high-value finding: report it in \`notes\`. Do not paper over it.

Report every discrepancy in \`numbersToCorrect\`. Fix outright errors in the generators if the fix
is unambiguous; otherwise report. Do NOT commit.`,
		{ label: 'audit:tables', schema: OUTCOME, effort: 'high' },
	)

	return { phase: 'prereq', vars, mixins, audit }
}

// ---------------------------------------------------------------------------
// P2 — dual-source build. Serial: it owns the build output directory.
// ---------------------------------------------------------------------------

if (PHASE === 'P2') {
	phase('P2: dual-source build')

	const built = await agent(
		`${RULES}

TASK — P2, the dual-source build (plan §P2).

Add \`scripts/build-css.js\` so that plain \`.css\` sources compile to \`.css.dsp\` alongside
\`zklessc\`, which keeps handling \`.less\`. Wire both into \`npm run check:cssdiff\` and into the
pom's \`compile-less\` execution path (pom.xml:113-131 currently runs zklessc alone).

This is far simpler than Marble's equivalent builder because plan premise #6 established that
converted component files are self-contained with NO \`@import\`. So the component path is just
read → prepend taglib header → minify → write. Only \`norm.css\` will ever need concatenation,
and that is P5's problem, not yours.

BEHAVIOUR IT MUST REPRODUCE EXACTLY — I measured all of this from \`baseline/\` before dispatching
you, so take it as given rather than re-deriving it (but do verify, cheaply):

  * THE HEADER IS ONE LINE, NOT THREE. In \`--compress\` output the three directives are
    concatenated with NO separator and NO trailing newline, and CSS begins immediately after:
      <%@ taglib uri="http://www.zkoss.org/dsp/web/core" prefix="c" %><%@ taglib uri="http://www.zkoss.org/dsp/zk/core" prefix="z" %><%@ taglib uri="http://www.zkoss.org/dsp/web/theme" prefix="t" %>
    Verified: \`baseline/js/zul/wgt/css/button.css.dsp\` has ZERO newlines in its first 200 bytes.
    If you emit three lines, cssdiff's DSP-directive list still matches (it collapses whitespace)
    but the file is needlessly different from what master shipped. Match the single line.

  * EXACTLY 3 of the 77 outputs have no header at all (plan premise #9, re-verified):
      js/zkmax/sel/css/listbox.css.dsp
      js/zkmax/sel/css/tree.css.dsp
      js/zkmax/grid/css/grid.css.dsp
    73 of 77 begin with the header. The 4th file that does not BEGIN with it is
    \`zul/css/norm.css.dsp\`, and it is NOT an exception — see the next point.

  * NORM'S HEADER IS MID-FILE, AT BYTE 43088 OF 72140. This surprised me and it would have
    surprised you: \`norm.css.dsp\` opens with ~43 KB of \`:root{--zk-*}\` tokens, THEN the three
    taglib directives, THEN normalize.css and the \`<c:if>\` reset. The directives sit exactly at
    the point where \`norm.less\` pulls in \`_reset.less\`, which carries its own header that zklessc
    emits inline. JSP page directives are position-independent so this is legal, just unusual.
    You do not have to handle norm (it stays LESS until P5), but do NOT write a builder that
    assumes "header always goes at offset 0" — P5 concatenates norm from several sources and will
    need the header preserved at its concatenation boundary, not hoisted. Leave a comment saying so.

  * Minified output equivalent to zklessc's \`--compress\`.

MINIFIER TRAP — do not skip this, it is a known silent-corruption path in this codebase:
CleanCSS 5.3.3 destroys \`@scope\` and bare \`@layer a,b;\` — it empties the output and reports
the problem only in \`output.warnings\`, never in \`output.errors\`. A builder that checks
\`errors\` alone ships empty CSS at exit 0. This branch will not use either construct (§0 excludes
\`@layer\`; \`@scope\` arrives at P5), but write the guard NOW, while you are thinking about it,
and make it fail the build rather than warn.

THE GATE IS WEAK HERE AND YOU MUST COMPENSATE. At P2 there are zero \`.css\` sources, so
\`build-css.js\` processes nothing and the gate passes trivially — it proves you did not break
zklessc, and nothing at all about your new code path. That is not evidence. So prove the
instrument the way P0 proved cssdiff:

  1. Run the gate before touching anything. Confirm \`files differing: 0\`.
  2. Round-trip proof: take \`js/zkmax/layout/css/tablelayout\` (1 declaration — the smallest
     output in the tree). Copy its \`.less\` to the scratchpad. Compile that one entry file
     UNCOMPRESSED to obtain expanded CSS, save it as the \`.css\` source, remove the \`.less\`,
     rebuild, and confirm the gate STILL reports \`files differing: 0\`. That single result is
     what actually proves build-css.js reproduces zklessc's output.
  3. Then scale the proof: repeat for \`js/zul/wgt/css/button\` (36 declarations, and it exercises
     the vendor-prefix mixin expansion that P4 will later care about).
  4. Revert both by copying the saved \`.less\` back and deleting the \`.css\` — by file copy, NOT
     by git checkout. Rebuild and confirm the gate is 0 again and \`git status --porcelain\` shows
     no leftover .css/.less changes.
  5. NEGATIVE CONTROL: deliberately break your header emission (drop one taglib line) and confirm
     the gate FAILS. A gate that cannot fail is not a gate. Then restore it.

Report all five results. If step 2 or 3 cannot reach 0, that is the real finding — report
\`gate-failed\` with the actual diff records rather than continuing to step 4.

Do NOT convert any file permanently — P3 owns the conversion. Do NOT commit; the orchestrator
commits after reviewing your diff.`,
		{ label: 'P2:build-css', schema: OUTCOME, effort: 'high' },
	)

	if (built.status !== 'done') {
		log(`P2 did not complete: ${built.blockedReason || built.summary}`)
		return { phase: 'P2', built }
	}

	phase('P2: adversarial gate check')

	const adversary = await agent(
		`${RULES}

TASK — try to break \`scripts/build-css.js\`, which another agent just wrote and declared correct.
Your job is to find the case where it silently diverges from zklessc. Default to suspicion.

It claims: ${JSON.stringify(built.summary)}

Attack list — for each, either demonstrate the divergence or state that you confirmed it holds:
  1. The three no-taglib files. Convert ONE of them (js/zkmax/grid/css/grid, 6 declarations) to
     \`.css\` and confirm the output still has no header. Revert by file copy.
  2. A file whose CSS contains a \`url()\` with \`${'${'}...}\` EL inside it — DSP EL is not CSS,
     and a minifier may rewrite or escape it. Find one (grep the .css.dsp outputs) and verify
     round-trip. cssdiff deliberately does NOT strip EL, so a change here shows up as a diff.
  3. A file containing a \`data:\` URI with \`//\`, \`{\` or \`;\` inside it.
  4. CleanCSS warnings handling: feed the builder a \`.css\` containing \`@scope (.z-page) { a {
     color: red } }\` and confirm the build FAILS LOUDLY rather than emitting empty output.
     This is the specific documented trap; verify the guard exists and works, don't take it on
     faith. Remove the probe file afterwards.
  5. Idempotence: run the full build twice and confirm identical output both times.

Revert every experiment by file copy, never git checkout. Leave the tree exactly as you found it
and confirm that with \`git status --porcelain\`. Fix defects you find only if the fix is
unambiguous; otherwise report precisely. Do NOT commit.`,
		{ label: 'P2:adversary', schema: OUTCOME, effort: 'high' },
	)

	return { phase: 'P2', built, adversary }
}

// ---------------------------------------------------------------------------
// P3 — the bulk. Conversion is serial by construction; review fans out.
// ---------------------------------------------------------------------------

if (PHASE === 'P3') {
	// STEPS, not batches. Plan §2.6: the batch is the GATE AND REVIEW boundary (by output-side
	// declaration count, unchanged); the step is HOW MUCH IS DONE AT ONCE AND WHEN TO STOP.
	// The distinction exists because batch 1 = 20 files was still too big for a first run: a
	// systematic bug in less2css.js would cost 20 redone files and 20 review packets at once.
	//
	// Steps 0+1+2 = batch 1. Step 3 = batch 2. Step 4 = batch 3. Ladder: 1 → 4 → 15 → 43 → 11.
	// Counts measured on the P0 baseline via `cssdiff --list`; re-verified 2026-07-31 (20/43/11).
	const STEPS = [
		{
			n: 0, batch: 1, expect: 1, reviewers: 1,
			range: 'exactly one file',
			select: 'ONLY `js/zkmax/layout/css/tablelayout.css.dsp` — 1 declaration, the smallest output in the theme.',
			why: `Validate the MECHANISM, not make progress: the six steps of less2css.js, the shape of the
commit message, the shape of the review packet. A 1-declaration file means reviewing the whole
output takes seconds, so if anything about the mechanism is wrong you pay for one file.`,
		},
		{
			n: 1, batch: 1, expect: 4, reviewers: 1,
			range: 'four files chosen for BRANCH COVERAGE, not for size',
			select: `EXACTLY these four:
    js/zkmax/layout/css/cardlayout.css.dsp      (4 decl)
    js/zul/layout/css/absolutelayout.css.dsp    (5 decl)
    js/zul/layout/css/anchorlayout.css.dsp      (5 decl)
    js/zkmax/grid/css/grid.css.dsp              (6 decl)`,
			why: `These are NOT merely "the next smallest" — they are picked to reach code paths step 0 cannot.
\`js/zkmax/grid/css/grid.css.dsp\` is one of the three NO_HEADER outputs (build-css.js:116), so it
is the only way to exercise that script's single conditional; tablelayout takes the header branch.
The other three bring the first real mixin/vendor-prefix expansion. Same reasoning as the vacuous-
gate finding that produced check:build-css — choose inputs that reach the code, not inputs that
are convenient.`,
		},
		{
			n: 2, batch: 1, expect: 15, reviewers: 2,
			range: 'the rest of batch 1',
			select: 'every remaining unconverted output with ≤20 declarations (15 files; batch 1 totals 20 across steps 0–2).',
			why: 'Corpus enlargement at unchanged per-file risk — still ≤20 declarations each, so every file is still readable end to end.',
		},
		{
			n: 3, batch: 2, expect: 43, reviewers: 3,
			range: 'batch 2 — output-side 21–200 declarations',
			select: 'every remaining unconverted output with 21–200 declarations (43 files).',
			why: 'The main body of ordinary components. By now the mechanism has survived 20 files.',
		},
		{
			n: 4, batch: 3, expect: 11, reviewers: 2,
			range: 'batch 3 — output-side >200 declarations',
			select: 'every remaining unconverted output with >200 declarations (11 files).',
			why: 'The largest files last, when the mechanism is at its most trustworthy.',
		},
	]

	// `{batch:N}` is how this workflow used to be driven. Batch 1 no longer maps to a single run,
	// so accepting it silently would reintroduce exactly the thing the ladder exists to prevent
	// (20 files before the first human look). Batches 2 and 3 ARE single steps, so they alias.
	if (STEP == null) {
		if (BATCH === 2 || BATCH === 3) {
			log(`batch ${BATCH} == step ${BATCH + 1}; treating it as that step`)
		} else {
			const reason =
				BATCH === 1
					? 'batch 1 is no longer one run: plan §2.6 splits it into step 0 (1 file), step 1 (4 files) and step 2 (15 files). Pass {step:0} — and do not skip ahead, because each step ends at a human confirmation.'
					: 'P3 needs an explicit step. Ladder: {step:0}=1 file, {step:1}=4, {step:2}=15, {step:3}=43, {step:4}=11. Start at {step:0}.'
			log(`P3 refused: ${reason}`)
			return { phase: 'P3', status: 'needs-step', reason }
		}
	}

	const stepN = STEP != null ? Number(STEP) : BATCH + 1
	const b = STEPS.find((s) => s.n === stepN)
	if (!b) {
		const reason = `unknown step "${STEP}". Valid: 0 (1 file), 1 (4), 2 (15), 3 (43), 4 (11).`
		log(`P3 refused: ${reason}`)
		return { phase: 'P3', status: 'bad-step', reason }
	}

	const results = []
	let carriedFindings = []

	// Exactly one step per run. There is deliberately no loop: plan §2.6 —「每一步結束就停,
	// 等人工確認才進下一步」. A run that continued into step N+1 would report success having
	// skipped the confirmation that is the entire point of the ladder.
	{
		phase('P3: convert')

		const first = b.n === 0
		const conv = await agent(
			`${RULES}

TASK — P3 step ${b.n} (batch ${b.batch}): convert ${b.range} to plain CSS (plan §P3, §2.6).

WHY THIS STEP HAS THIS SIZE
${b.why}

THE FILES — this is a step, so the set is FIXED, not derived by you:
${b.select}

${
	first
		? `You are FIRST, so you also write the converter: \`scripts/less2css.js\`. Step 0 exists to
validate the mechanism, not to make progress — ONE file, ONE declaration. Read the expanded
result yourself before gating.

The insight that makes P3 a script rather than weeks of hand-rewriting (plan §1.1): zklessc's
UNCOMPRESSED output is already usable CSS source — LESS variables have already resolved to
\`var(--zk-*)\`, mixins are already expanded, indentation is readable. So conversion is "adopt
the compiler output as the new source", and its correctness is guaranteed BY CONSTRUCTION before
you touch a byte.

Per-file procedure:
  1. Copy the entry .less alone (NOT its shared partials) and rewrite its \`//\` line comments to
     \`/* */\` so LESS carries them into the output.
     TRAP (plan §1.2, already paid for once): apply this ONLY to the entry file. Applying it to
     shared partials injects _zkvariables.less's 40-odd section comments into EVERY component
     output.
  2. Compile that copy with zklessc, uncompressed.
  3. Strip the taglib header — build-css.js injects it now.
  4. Write src/main/resources/web/<path>/css/<name>.css
  5. Delete the original .less
  6. Gate that single file. Must be 0.

Add \`less2css.js\` to package.json.`
		: `\`scripts/less2css.js\` already exists from step 0. Reuse it; improve it only where this
step's files need something the earlier steps did not.`
}

CONFIRM THE SET against the live tree before converting anything:
  node scripts/cssdiff.js baseline/ target/classes/web/iceblue11 --list
and EXCLUDE the three holdouts that stay in LESS:
  zul/css/norm.css.dsp (P5), zul/font/font-awesome.css.dsp (P6), zkmax/css/tablet.css.dsp (P7).
This step is ${b.expect} file(s). If the tree gives you a different number, STOP and report both
numbers — a changed count means either the tree moved or the derivation is wrong, and converting
the wrong set is not recoverable by re-running.

TWO FILES NEED A DECISION, NOT A SCRIPT (plan premises #11/#12):
  * goldenlayout.css.dsp has TWO outputs — js/zkmax/goldenlayout/css/ and js/zkmax/layout/css/ —
    413 declarations each, declaration-for-declaration identical. Convert BOTH together, or first
    establish that one is a dead path. Do not convert one and leave the other.
  * tbeditor.css.dsp also has two, but they are NOT identical: 380 vs 375 declarations, 67
    differences. These are two genuinely different sources. Do not treat them as duplicates.
  Both land in batch 3 = step 4.

COMMITS — one per converted file, ${b.expect} for this step (plan §2.5). The reason is
fork-merge, not history-keeping: readme.md:20 tells customers to fork, so a customer who
customized \`button.less\` merges upstream, and one monolithic 74-file commit guarantees a
conflict against everything they touched. Per-file commits let git auto-resolve the untouched
majority. Generate the message uniformly from less2css.js; each must carry the converted filename,
the output-side declaration count, and that file's cssdiff result. Batches remain the review and
gate unit, but are no longer the commit unit.
Stage explicit paths only — never \`git add -A\`.

GATE — per file, then this step's files together, then the whole tree. All \`files differing: 0\`.

REVIEW PACKET — the gate is not the whole bar (plan §2.6 layer 3). For EACH converted file report:
filename; output-side declaration count; whether the built \`.css.dsp\` is BYTE-IDENTICAL to
\`baseline/\` and, if not, which of the 5 named serialization classes the difference falls into
(\`npm run check:build-css\` documents them); source \`.less\` line count -> generated \`.css\` line
count. A byte difference that fits none of the 5 classes is a STOP, not a footnote.

Report the gate numbers verbatim and every commit hash.`,
			{ label: `P3:convert-step${b.n}`, schema: OUTCOME, effort: 'high' },
		)

		results.push({ step: b.n, batch: b.batch, conv })

		if (conv.status !== 'done') {
			log(`P3 step ${b.n} stopped: ${conv.blockedReason || conv.summary}`)
			return { phase: 'P3', step: b.n, status: 'stopped', steps: results }
		}

		const converted = (conv.filesWritten || []).filter((f) => f.endsWith('.css'))
		if (converted.length !== b.expect) {
			log(`step ${b.n}: converted ${converted.length} .css files, expected ${b.expect} — review coverage may be incomplete`)
		}

		phase('P3: review')

		const per = Math.ceil(converted.length / b.reviewers) || 1
		const slices = []
		for (let i = 0; i < converted.length; i += per) slices.push(converted.slice(i, i + per))

		const reviews = await parallel(
			slices.map((slice, i) => () =>
				agent(
					`${RULES}

TASK — review these freshly converted CSS files. You are READ-ONLY: do not edit, do not build, do
not commit, do not run the gate. Another agent already proved these files are declaration-for-
declaration identical to the baseline, so correctness is NOT your question. Quality is.

FILES:
${slice.map((f) => `  ${f}`).join('\n')}

The gate cannot see any of the following, which is exactly why a human review step exists
(plan §P3, "人工複審重點"):

  1. DUPLICATE DECLARATIONS. Mixin expansion routinely emits the same property twice in one
     block. Semantically harmless — later wins — so this is non-blocking, but it is noise a
     maintainer will trip over. Quote the block and both declarations.
  2. COMMENT PLACEMENT. Section comments survived the \`//\`→\`/* */\` rewrite but may have landed
     in the wrong place relative to the rules they described, because expansion moved code.
  3. SECTIONING AND READABILITY. This file is now the SOURCE a human maintains. Does it read like
     source, or like compiler output? Where does it need blank lines or a section header?
  4. TOKEN NAME CLARITY. \`_zkvariables.less\`'s name-forwarding layer is gone, so the raw
     \`var(--zk-*)\` name is all a reader gets. Flag any place where the surviving name is
     materially less clear than the LESS variable it replaced — but do NOT propose renaming any
     token: §0 excludes that from this branch.
  5. SUSPECTED SEMANTIC CHANGE. You should find none — report it loudly if you do, since it would
     mean the gate has a blind spot, which matters far more than any style finding.

Report only findings you would actually act on. An empty findings array is a perfectly good
result and much better than padding.`,
					{ label: `P3:review-s${b.n}-${i + 1}`, phase: 'P3: review', schema: REVIEW },
				),
			),
		)

		carriedFindings = reviews
			.filter(Boolean)
			.flatMap((r) => r.findings || [])
			.filter((f) => f.kind !== 'other' || f.detail)

		log(`step ${b.n}: ${converted.length} files converted, ${carriedFindings.length} review findings`)
		results[results.length - 1].reviewFindings = carriedFindings
	}

	if (carriedFindings.length) {
		phase('P3: polish')
		const polish = await agent(
			`${RULES}

TASK — apply the outstanding review findings on already-converted CSS files.

${JSON.stringify(carriedFindings, null, 2)}

These are readability defects in files that are already declaration-equivalent to the baseline.
So the bar is absolute: after every edit the gate must STILL report \`files differing: 0\`. If a
fix would change even one declaration, it is out of scope for this branch — skip it and say so.
Reordering declarations within a block counts as a change; cssdiff is deliberately order-sensitive
because CSS order is semantic.

Removing a genuinely duplicated declaration DOES change the declaration list, so it will fail the
gate. That is correct and expected: duplicate removal is a deliberate output change and belongs in
a later G-delta phase, not here. Fix comment placement and sectioning; report the rest as deferred.

Commit as one \`style(drop-less): ...\` commit, explicit paths only. Report the final gate numbers.`,
			{ label: 'P3:polish', schema: OUTCOME },
		)
		return { phase: 'P3', step: b.n, steps: results, polish, nextStep: STEPS.find((s) => s.n === b.n + 1) ? b.n + 1 : null }
	}

	// The run ENDS here even though steps remain. Plan §2.6: the next step starts only after a
	// human has read this step's review packets and said so.
	return { phase: 'P3', step: b.n, steps: results, nextStep: STEPS.find((s) => s.n === b.n + 1) ? b.n + 1 : null }
}

// ---------------------------------------------------------------------------
// Phases this workflow will not run. Mostly gated on a human decision rather
// than on work — but `status` must say which, because "blocked" and "already
// finished" are not the same answer and a caller acts differently on each.
// ---------------------------------------------------------------------------

const NOT_RUNNABLE = {
	P1: { status: 'done', reason: 'ALREADY DONE (2026-07-31), not runnable and not blocked — nothing to do here. Shipped as S0+S1 in one commit: npm `overrides` pinning zkless-engine\'s less to 4.8.1, plus scripts/check-less-conventions.js enforcing the entry-file-only `~./` import invariant. Gate: files differing 0 (77 files / 14323 declarations), with a negative control on the S1 guard. Note the pin did NOT disappear at P8 — it became a direct `"less": "4.8.1"` devDependency. The reason recorded here originally ("because build-css.js\'s .less branch calls less.render itself") turned out to be wrong: P8 wrote no .less branch (C26). The pin survives for a different reason — scripts/less2css.js, the conversion tool a fork re-runs on its own sources, requires `less` directly.' },
	P6: { status: 'done', reason: 'ALREADY DONE (2026-08-04), not runnable and not blocked. The task order used to live here and was deleted with the phase, because it pointed at src/main/resources/web/zul/font/font-awesome.less and the 15 partials in zul/less/font/ — all 16 are gone. Outcome: scripts/gen-fa-css.js splices scripts/fa-icons.json (1951 icons + 506 brand icons + 308 FA4 aliases + 786 FA4 style classes) into the hand-written template zul/font/_font-awesome.css and writes the committed zul/font/font-awesome.css. Of the two options the order asked to choose between, (b) won: a committed .css, with `npm run check:fa-css` wired into check:cssdiff so drift aborts the gate rather than being tolerated. Gate: files differing 0 (77 files / 14323 declarations), font-awesome.css.dsp ok at 4545 declarations, build-css 74 -> 75 files and zklessc 3 -> 2. The decisive evidence is stronger than the gate: the generator\'s output is byte-identical to less.render() of the deleted .less minus its taglib header, so fidelity is guaranteed by construction. Also removed one dead `@import "~./zul/less/font/_variables.less"` from zul/less/norm.less (zero references tree-wide; norm.css.dsp stayed byte-identical, which is the proof it was dead).' },
	P4a: { status: 'blocked', reason: 'BLOCKED on L-2 — IceBlue\'s browser-support declaration as a ZK 11 add-on. P4a is the mechanical 83%: 945 declarations (border-radius 532, transform 181, box-shadow 168, box-sizing 60), every one with an unprefixed sibling in the same rule, so exactly one diff shape is legal and any `+` record is a bug. Trivial once the policy exists. A screenshot cannot answer "is this prefix dead"; only the support policy can.' },
	P4b: { status: 'blocked', reason: 'BLOCKED on L-2, same decision as P4a. P4b is the 143 hand-written prefixes where all the judgement lives, including 26 sites needing paired replacement rather than removal. The 44-declaration carve-out (-webkit-font-smoothing, -moz-osx-font-smoothing, -webkit-touch-callout and friends) must not appear in the diff at all: those have no standard equivalent, so removing them deletes a feature — and their diff shape is identical to the removable ones.' },
	P4: { status: 'blocked', reason: 'SPLIT into P4a and P4b (2026-07-30). Ask for one of those instead — the split exists because a single phase with three legal diff shapes cannot enforce "any unexpected shape is a bug", which is the whole content of the G-delta gate.' },
	P5: { status: 'blocked', reason: 'BLOCKED on the visual A/B harness, which is a real prerequisite rather than a decision. P5 restructures browserDefault from a descendant selector to @scope, which changes WHICH ELEMENTS MATCH — declaration diff is structurally blind to that, so this is the one phase where computed-style and screenshot A/B are necessary evidence rather than a nice-to-have.' },
	P7: { status: 'blocked', reason: 'BLOCKED on L-4 — the replacement mechanism for the compact profile. LESS import-path interpolation (@import "profiles/_@{themeProfile}") has no pure-CSS equivalent, and does not need one: the two profiles are just different values for the same 842 tokens, so a runtime override sheet covers it. But that is an outward API change and needs a migration-guide entry.' },
	P8: { status: 'done', reason: 'ALREADY DONE (2026-08-17), not runnable and not blocked. Deleted the last 4 LESS partials (zul/less/), removed the zkless-engine devDependency + overrides + the pom `compile-less` execution + the zklessc/zklessc-dev/check:var-table/check:mixin-table npm scripts, made `less` a direct 4.8.1 devDependency, dropped check:less-conventions from the gate (0 .less = no subject), removed the LESS-reconstruction half of check-build-css.js, pointed baseline.js/baseline-ab.js at `npx --yes zkless-engine@1.1.13` so the historical baseline can still be rebuilt without the dependency, untracked baseline/ again (S47 retirement), rewrote readme.md, and wrote doc/migration/less-to-css.md. G-zero reconciliation: 85 files / 14941 declarations / 49 differing / 1756 diff records = 745 removed (P4a 731 + P4b 14) + 1011 added (P4b 7 + D1 350+2 DSP + D4 628+24 DSP) — zero unexplained. TWO SPEC CORRECTIONS: (C26) build-css.js did NOT grow a .less branch, because entry .less hit 0 at P7 and the branch would have been a code path with no input — the plan\'s three landmines for it are void; (C27) the two rule tables were FROZEN rather than regenerated, because regenerating against the converted tree loses every behavioural caveat (their consumption sites are compiled away) — the 20 rows the ZK 10.4 backfill added are supplied as a hand-derived addendum in the migration guide instead.' },
}

if (NOT_RUNNABLE[PHASE]) {
	const { status, reason } = NOT_RUNNABLE[PHASE]
	log(`${PHASE} will not run — ${status === 'done' ? 'it is already complete' : 'still gated'}.`)
	return { phase: PHASE, status, reason }
}

return {
	phase: PHASE,
	status: 'unknown-phase',
	reason: `Unknown phase "${PHASE}". Runnable now: prereq, P2, P3 (REQUIRES step 0|1|2|3|4). Not runnable: ${Object.keys(NOT_RUNNABLE).join(', ')}.`,
}
