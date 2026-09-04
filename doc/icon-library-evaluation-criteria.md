# Evaluating a Third-Party Icon Library for ZK

**Status**: evaluation framework + scored comparison
**Scope**: free / freemium icon libraries, evaluated from the position of a UI
*framework* vendor (ZK) that redistributes the icons inside a shipped artifact,
not from the position of a single application team.
**Context**: ZK 11.0 ships two themes — Marble (Material Design / MUI-aligned) and
`iceblue11` (legacy vocabulary, retains Font Awesome). Marble currently ships
Lucide via CSS `mask-image`; see `doc/spec/icon-policy.md` and
`doc/spec/icon-index.md`.

## Decisions already taken

| ID | Decision | Consequence for this document |
|----|----------|-------------------------------|
| **D13** | **B — keep the full catalog inlined; no subsetting** | §5 must be measured *over the wire* (gzipped), because "emit everything" makes compression behaviour the dominant cost factor. See the correction in §5 |
| **D14** | **Customers who need Font Awesome (incl. brand logos) stay on `iceblue11` in ZK 11** | §2.5 (brand logos) drops out of the gate set and becomes a documentation task. Implication to confirm: ZK 11 still ships `font-awesome.css.dsp` for `iceblue11`, so FA is retired *per theme*, not from the framework — which also softens the ~50-of-149 FA name gap (D11) from a hard break into a theme-choice migration note |
| **G7** (new gate) | **The icon style must conform to the consuming theme's design language** | Added to §1 as a gate. It eliminates three candidates outright — including Font Awesome Free, otherwise the cheapest option. It does **not** eliminate the incumbent: see §11.4 for the measurement that corrected an earlier wrong verdict |
| **D15** | **Closed — premise invalid.** Asked whether G7 applies retroactively to disqualify Lucide; Lucide passes G7 (§13) | No retroactive change; keep Lucide for 11.0 |

---

## 0. How to use this document

A framework vendor's evaluation differs from an app team's in three ways, and
every criterion below exists because of one of them:

1. **We redistribute.** The icons ship inside the theme jar to thousands of
   downstream apps, many air-gapped, all running OSS licence scanners. Legal and
   packaging constraints are *gates*, not scores.
2. **We define an API.** `iconSclass="z-icon-caret-down"` is a public API that
   customer code and compiled ZK widget JS both depend on. Icon *names* are API
   surface; renaming or losing one is a breaking change.
3. **We pay the cost once, everyone pays it forever.** Payload, a11y behaviour
   and visual fit are multiplied across every ZK page ever rendered.

Run the evaluation in two passes:

- **Pass 1 — Gates (§1).** Any FAIL eliminates the candidate; do not score it.
- **Pass 2 — Weighted score (§2–§8, sheet in §9, results in §12).** Survivors only.

---

## 1. Gates — pass/fail, no negotiation

| # | Gate | Why it is a gate | How to test |
|---|------|------------------|-------------|
| G1 | **Licence permits redistribution inside a commercial closed-source artifact**, perpetually, no per-seat or per-app fee | ZK EE is sold commercially; zkmax.jar is not open source. A "free for personal/open-source use" set is unusable at any quality level | Read the LICENSE file in the published package, not the marketing page. Prefer MIT / ISC / Apache-2.0 / SIL-OFL |
| G2 | **Attribution requirement is satisfiable by a NOTICE file** — not by visible UI credit | FA Free's icons are CC BY 4.0; survivable via NOTICE. A set demanding on-screen credit is not shippable in a customer's product | Check the licence text for "visible"/"reasonable credit" wording; confirm the vendor's FAQ accepts NOTICE-only |
| G3 | **Fully offline / self-hostable** — no CDN, no account, no "kit" or API key | Enterprise ZK deployments are routinely air-gapped and disallow third-party runtime calls | Install the package, cut the network, render a page |
| G4 | **Works with CSS only — no mandatory JS runtime** | ZK applies icons server-side via `iconSclass` and re-patches DOM on every AU response. A library needing JS to rewrite `<i>` into `<svg>` (FA's SVG+JS mode) fights ZK's DOM patching and breaks on partial updates | Render an icon with nothing but a stylesheet and a class name |
| G5 | **Covers the T1 required inventory** (§3) with no gap that leaves a widget visually broken | A missing sort arrow or tree caret is a broken component, not a cosmetic issue | Diff the library's name list against the T1 list; every gap needs an acceptable substitute or a hand-authored glyph |
| G6 | **Package is versioned and immutable** (npm/Maven, pinnable) | Reproducible builds; a moving target cannot ship in an LTS | Pin an exact version, rebuild twice, diff the output |
| **G7** | **Icon style conforms to the consuming theme's design language** | A theme's credibility is its coherence. Marble claims Material Design; an icon set drawn in a competing design language's voice contradicts that claim on every screen, and no amount of token work fixes it. Evaluated **per shipped theme** — with D14, `iceblue11` keeps FA, so only Marble/Material is in scope | Three-level verdict, see below |

### G7 verdict levels

Style conformance is a spectrum, so a binary gate would be decided by taste.
Three testable levels instead:

| Verdict | Definition | Test |
|---------|------------|------|
| **PASS** | The design language's own reference icon system, or documented by its authors as conformant | Is it the set the design spec itself points at? |
| **CONDITIONAL** | Stylistically compatible — same grid family, geometric/neutral voice, no clash — but not the reference set, **and/or** missing a state-expression mechanism the design language requires | Does it carry a *different* framework's visual identity? Can it express selected-state the way the design language mandates? |
| **FAIL** | Carries a competing design language's identity, or clashes with the theme's style | Would a designer recognise it as "that other framework's icons"? |

For **Marble / Material Design** the sub-tests are:

1. **Drawing style** — 24×24 grid, ~2dp stroke, consistent terminals and corner
   treatment. This is the sub-test the gate is actually *for*: does a designer
   read the icons as belonging to the same system as the components?
2. **Fill-as-state capability** — MD3 expresses selected state by switching an
   icon from outlined to filled. The set must be *able* to supply a filled
   counterpart for the closed-path icons that carry state (star, heart,
   bookmark, flag). Note this is a capability test, not an "official set" test —
   see the correction in §11.4.

> **Do NOT use "is it the design language's official icon set" as the test.**
> An earlier revision of this document did, and it produced a wrong verdict.
> "Official set" is a much stronger requirement than style conformance, and it
> collapses the gate into a single-vendor tautology: for Material Design only
> Material Symbols can ever pass, which tells you nothing about whether a
> candidate *looks right*. Judge the drawing, not the provenance.

---

## 2. Coverage — replace "how many icons" with "does it cover what we need"

Raw icon count is the weakest useful signal in this document. A 5,000-icon set
lacking `caret-down` is worse than a 900-icon set that has every glyph ZK emits.
Score coverage against a **fixed required list**; treat total count only as
headroom for *application* developers.

| Criterion | What to measure | Notes for ZK |
|-----------|-----------------|--------------|
| **2.1 Framework-required coverage** | % of ZK's widget-emitted names resolvable (directly or by a defensible alias) | ZK 10 emits **32** unique `z-icon-*` names from compiled JS (§3, measured). Marble resolves them with **51** FA→Lucide aliases + **1** hand-authored glyph (`exclamation`) + `z-icon-fw` (no-glyph width modifier) |
| **2.2 FA-compatibility surface** | % of the FA names ZK's documented API and existing customer apps use that have a 1:1 visual equivalent | The migration bill. ~50 of ~149 FA names in the wider zk/zkcml surface are unresolved (D11) — **softened by D14**: those customers can stay on `iceblue11` |
| **2.3 Application-developer headroom** | Total count, and coverage of business domains (finance, logistics, media, dev-ops) | Lucide ships **1947** icons (measured). Headroom matters because customers extend the same idiom |
| **2.4 State variants in the *free* tier** | Are outlined/filled pairs (and any weight axes) all free? | **Promoted in importance by G7** — for Material this is the fill-as-state mechanism, not a nice-to-have. FA Pro locks regular/light/duotone; FA Free is solid-only |
| **2.5 Brand / trademark logos** | Present? Separately licensed? | **Resolved by D14** — no longer scored. Customers needing FA brand logos use `iceblue11`; document the alternative (e.g. Simple Icons) for Marble |
| **2.6 RTL / directional mirrors** | Chevrons, indent, undo/redo mirrorable; guidance on which must mirror | ZK supports RTL; a `mask-image` icon does not auto-mirror |
| **2.7 Metaphor neutrality** | Culture-specific metaphors (mailbox, trash shapes, currency, gestures) | Global enterprise customer base |

---

## 3. The required-icon inventory (measured)

The inventory is the test corpus. Without it every candidate scores 100% on "has
lots of icons" and you learn nothing.

```bash
# T1 — what ZK's compiled widget JS actually emits (cannot be renamed)
grep -rhoE 'z-icon-[a-z0-9-]+' \
  /Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/ | sort -u
```

**T1 = 32 names, all Font Awesome vocabulary** (measured 2026-09-04; the raw grep
also yields 3 truncated prefixes from JS string concatenation — `caret-`,
`chevron-`, `ellipsis-` — which are not real names):

```
angle-double-down  angle-double-left  angle-double-right  angle-double-up
angle-down  angle-left  angle-right  angle-up  calendar
caret-down  caret-left  caret-right  caret-up  check
chevron-left  chevron-right  compress  ellipsis-h  ellipsis-v
exclamation-circle  exclamation-triangle  expand  fw  info-circle
minus  radio  reorder  search  stack  star  times  times-circle
```

**Consequence worth stating plainly**: because T1 is entirely FA vocabulary,
*every* non-FA candidate needs an alias layer. Font Awesome is the only candidate
with zero T1 mapping cost — which is precisely why its G7 failure (§12) is the
interesting result rather than a formality.

| Tier | Definition | Gap severity |
|------|------------|--------------|
| **T1 — structural** | Emitted by widget JS; absence breaks a component | Blocking (G5) |
| **T2 — API surface** | Named in ZK docs / used by existing customer apps | Breaking change; alias or migration note |
| **T3 — content** | Used only by examples, demos, preview pages | Substitutable |

---

## 4. Integration & delivery mechanics ("easy to integrate", decomposed)

"Easy to integrate" hides at least eight independent decisions with different
failure modes. Score them separately.

| Criterion | What to measure |
|-----------|-----------------|
| **4.1 Delivery formats published** | Individual SVGs / webfont / SVG sprite / framework components. Framework-component-only (React/Vue) sets are unusable for ZK. **Publishing both SVGs and a font is a real advantage** — it keeps §7 a reversible mechanism choice instead of a library lock-in |
| **4.2 Rendering mechanism it permits** | `content:` codepoint (font), `mask-image` (Marble's current choice), `background-image`, inline `<svg>`. Note SVG sprites are effectively out for ZK: `mask-image` cannot reliably address a sprite fragment, and `<use>` needs markup ZK won't emit from `iconSclass` |
| **4.3 Colour control** | Must recolour from CSS via `currentColor` or a custom property. Multi-colour/duotone icons cannot be themed and cannot survive forced-colors |
| **4.4 Sizing behaviour** | Scales with `font-size` (`1em`) vs fixed `width`/`height`; baseline alignment with adjacent text |
| **4.5 Subsetting / tree-shaking** | Superseded by **D13=B** — we ship everything. Retained as a criterion for future re-evaluation |
| **4.6 Build-pipeline fit** | Fits Maven + npm (`scripts/build-css.js`, `npm run build:css`) without a new toolchain (font compilers, native binaries) or build-time network access |
| **4.7 Machine-readable metadata** | JSON/YAML catalog of names + tags + aliases + codepoints. Required to generate CSS, the icon index doc, the lint rule, and any future icon picker. A website-only library is a maintenance tax |
| **4.8 Extensibility for customers** | Documented recipe for adding one more glyph in the same idiom. Customers always need one more |

---

## 5. Runtime cost — measure it *gzipped*, and do not estimate

### Correction (2026-09-04): raw bytes badly misrepresent this cost

An earlier revision of this document reported the icon payload as **946 KB** and
concluded that font delivery would be dramatically cheaper. Measured over the
wire, that conclusion is **wrong and inverted**:

| Delivery | Raw | Over the wire |
|----------|----:|--------------:|
| Current — `norm.css.dsp` with 1947 SVG data URIs | 1,062,313 B | **104,753 B gzipped** |
| Alternative — `lucide.css` codepoint map | 94,752 B | 14,358 B gzipped |
| Alternative — `lucide.woff2` (already compressed) | 266,476 B | 266,476 B |
| **Font total** | | **≈ 280,834 B** |

URL-encoded SVG path data is highly repetitive text and gzips ~10:1; a woff2 is
already Brotli-compressed and cannot be squeezed further. **Font delivery is
~2.7× more expensive over the wire than the current data-URI approach.**

Two conclusions follow, both of which change earlier reasoning:

1. **D13=B is better justified than it looked.** The real cost of "emit
   everything" is ~105 KB gzipped for the *entire* base stylesheet, not 946 KB.
2. **Font delivery's case is accessibility, not payload** (§7.1/§7.2) — and it
   costs ~+176 KB over the wire to buy it.

| Criterion | What to measure |
|-----------|-----------------|
| **5.1 Shipped bytes, gzipped *and* raw** | Measure the built artifact. Report gzipped as the headline; raw only for jar size |
| **5.2 Request count** | One stylesheet vs stylesheet + font file vs one request per icon |
| **5.3 Cacheability** | A separate font file caches independently; data URIs inside a large CSS invalidate the whole file when any icon changes |
| **5.4 First-paint impact** | Webfonts add a FOIT/FOUT race — this project has already lost time to a font-load race in screenshot baselines. `mask-image` data URIs have no such race |
| **5.5 Catalog-size multiplier** | Under D13=B the cost scales with catalog size for SVG delivery. A 6-weight set emits 6× the rules; count this explicitly |
| **5.6 Jar size** | The raw payload lands in the shipped jar and in every customer's WAR |

---

## 6. Visual & design fit

G7 is the pass/fail floor; this category scores *how well* above the floor.

| Criterion | What to measure |
|-----------|-----------------|
| **6.1 Single design grid** | All icons on one grid (e.g. 24×24) with consistent live-area padding |
| **6.2 Stroke consistency and scaling** | Uniform stroke width, and does it hold at 16px? Lucide's 2px stroke at 24px becomes 1.33px at 16px and blurs on non-retina. An optical-size axis solves this properly |
| **6.3 Legibility at ZK's real sizes** | Render the T1 set at 12/14/16/20px and inspect. Small structural glyphs (carets, sort arrows) are where stroke-based sets are weakest |
| **6.4 Baseline / optical alignment** | Alignment with adjacent label text (`vertical-align: -0.125em` in Marble's case) |
| **6.5 Per-theme acceptability** | With D14, `iceblue11` keeps FA, so this reduces to Marble/Material — but re-open it if a third theme appears |
| **6.6 Swappability** | Is the set an implementation detail behind `z-icon-*`, so a future theme can substitute another without touching component CSS? Score the *abstraction*, not just the set |

---

## 7. Accessibility & environment robustness

Routinely skipped, routinely expensive. Marble already has a scar here.

| Criterion | What to measure |
|-----------|-----------------|
| **7.1 Windows High Contrast / `forced-colors`** | `mask-image` icons paint `background-color: currentColor`; forced-colors overrides backgrounds and **every icon vanishes**. Marble needed a dedicated *unlayered* guard in `tokens/_forced-colors.css` (~15 selectors) to restore them. Font glyphs survive natively. Test every candidate *mechanism* under `@media (forced-colors: active)` |
| **7.2 Print** | Browsers with "no background graphics" drop mask/background icons; font glyphs print |
| **7.3 Screen readers** | Decorative-vs-meaningful must be expressible. A `::before` pseudo-element is inherently invisible to AT — an advantage of both font and mask approaches over inline `<svg>` with stray text nodes |
| **7.4 Zoom & high-DPI** | Vector at all zoom levels, no bitmap fallback |
| **7.5 Reduced motion** | Animated icons (spinners) must be stoppable by CSS. IceBlue ships 5 animated GIFs that CSS cannot stop — do not repeat that |
| **7.6 Dark theme / contrast** | Single-colour icons inheriting `currentColor` pass automatically; duotone/multi-colour need a second asset and may fail contrast |

**Discrimination warning**: every candidate that survives §1 publishes *both*
SVGs and a webfont, so §7 barely differentiates between *libraries* — it
differentiates between *mechanisms*. Marble's forced-colors guard is a sunk,
reusable cost that applies to any mask-based set. Weight §7 accordingly, and
treat "which mechanism" as its own decision (D15/D16) rather than a library score.

---

## 8. Longevity, governance & DX

An LTS framework commits to an icon set for years.

| Criterion | What to measure |
|-----------|-----------------|
| **8.1 Name stability across major versions** | Does the project rename or *remove* icons between majors, and are old names **kept as aliases**? Every unaliased rename is a breaking change to `iconSclass`. Read the changelog — and verify empirically (see the Lucide correction in §11) |
| **8.2 Deprecation policy** | Are removed icons retained as aliases, and for how long? |
| **8.3 Release cadence & responsiveness** | Commits in the last 6 months; median issue response. A dormant set is a slow-motion liability |
| **8.4 Bus factor / governance** | Single maintainer vs foundation vs company. Lucide is a community fork of Feather *because* Feather stalled — that is the failure mode |
| **8.5 Funding model & freemium erosion risk** | Will today's free tier stay free? FA moved styles into Pro; a company-owned set with a paid tier has a structural incentive to keep doing that. Community/MIT sets carry the opposite risk (abandonment) |
| **8.6 Licence-change risk** | Has the project relicensed before? Is the licence global or per-file? |
| **8.7 Developer familiarity & search UX** | Name quality, aliases/tags, a good browse site. Users search by *meaning*, not by name |
| **8.8 Our own documentation cost** | What must ZK document itself? Marble needed `icon-policy.md` + generated `icon-index.md` + `check-icon-coverage.sh`. Budget it per candidate |

---

## 9. Scoring sheet

Gates first; a single FAIL ends the row. Weights agreed *before* scoring so the
numbers are not reverse-engineered from a favourite.

| Category | Weight | Rationale |
|----------|-------:|-----------|
| Coverage (§2, T1/T2 weighted) | 25% | A gap is a broken component or a broken API |
| Integration & delivery (§4) | 15% | Mechanism choice constrains everything downstream |
| Runtime cost (§5, gzipped) | 15% | Paid by every page of every customer app |
| Visual fit (§6) | 15% | It is a design decision, above the G7 floor |
| Accessibility & robustness (§7) | 15% | Retro-fitting a11y is the most expensive kind of fix |
| Longevity & governance (§8) | 15% | LTS horizon is years |

Score each 0–5, multiply, total. Record the *evidence* per cell — a measured
number or a quoted licence clause, never an impression.

---

## 10. Gate results — all nine free candidates

Licences as commonly published; **re-verify from the package's own LICENSE at
adoption time**. Only the Lucide row is measured in this repo; the rest are
assessed from published catalogs and must be re-verified before any switch.

| Library | Licence | Count | G1–G6 | **G7 (Marble/Material)** | Scored? |
|---------|---------|------:|:--:|:--|:--|
| **Material Symbols** | Apache-2.0 | ~2.5k × 3 styles | ✅ | **PASS** — MD3's reference set; fill/weight/optical-size axes | **yes** |
| **Lucide** | ISC | **1947** (measured) | ✅ | **PASS** — 24×24 grid, `stroke-width="2"`, round caps/joins (measured); numerically matches Material's outlined spec, and round terminals match the Material Symbols *Rounded* style rather than clashing. Fill-as-state is achievable by flipping the SVG `fill` attribute — **already shipped in `rating.css`** (§11.4) | **yes** |
| **Remix Icon** | Apache-2.0 | ~3k (line+fill pairs) | ✅ | **PASS** — neutral 24-grid voice; systematic line/fill pairing | **yes** |
| **Tabler Icons** | MIT | ~5.8k | ✅ | **PASS** — neutral 24-grid, 2px stroke | **yes** |
| **Phosphor** | MIT | ~1.5k × 6 weights | ✅ | **CONDITIONAL** — a distinctive house style (wide, geometric, low-contrast terminals) that reads as "Phosphor" rather than as Material | **yes** |
| **Font Awesome Free** | CC BY 4.0 + OFL + MIT | ~2k free | ✅ | **FAIL** — the free tier is **solid-only**, so it cannot supply Material's outlined default at all (nor the outlined→filled pair), and FA's silhouette-heavy drawing is its own recognisable identity | no |
| **Bootstrap Icons** | MIT | ~2k | ✅ | **FAIL** — recognisably Bootstrap's identity; fill/outline exist but are not systematically paired | no |
| **Heroicons** | MIT | ~300 × 3 | ✅ | **FAIL** — recognisably Tailwind's identity. (Would also score poorly on §2.3 headroom) | no |
| **Feather** | MIT | ~290 | ✅ | PASS on style, but **strictly dominated by Lucide** — its own maintained fork, 6.7× the icons, same drawing — and dormant (§8.3/8.4) | no (dominated) |

**What G7 actually eliminated**: Font Awesome Free, Bootstrap Icons and
Heroicons. Before G7, FA Free was the cheapest option by a wide margin (zero T1
mapping cost — §3). It is the gate's real casualty. G7 does **not** eliminate the
incumbent; the first revision of this document claimed it did, wrongly (§11.4).

---

## 11. Empirical corrections found while scoring

Four of my own priors were wrong and were corrected by measurement. All four
changed a score; the fourth changed the recommendation.

1. **Lucide *does* ship a webfont.** `node_modules/lucide-static/font/` contains
   `lucide.woff2` (266,476 B), `lucide.css` (a 1947-rule codepoint map),
   `codepoints.json` (47 KB), plus `sprite.svg` and `tags.json`. The
   mask-image-vs-font mechanism choice (§7.1, §7.2) is therefore **reversible
   without changing library** — raising Lucide's §7 score.
2. **Lucide's renames keep the old names as aliases.** `alert-circle` *and*
   `circle-alert`, `alert-triangle` *and* `triangle-alert`, `x-circle` *and*
   `circle-x`, `help-circle` *and* `circle-help` all exist as files. §8.1 was my
   highest-weighted longevity risk for Lucide; measurement mitigates it (§8 score
   2 → 4).
3. **Raw bytes badly misrepresent runtime cost.** See §5 — gzipped, the current
   data-URI approach (104,753 B) beats font delivery (~280,834 B) by 2.7×.
4. **Lucide is not blocked from fill-as-state, and Marble already does it.**
   This was the load-bearing claim behind an earlier "CONDITIONAL" verdict, and
   it was false:
   - Every Lucide SVG carries an explicit `fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round"` (measured
     on `icons/star.svg`). Flipping `fill="none"` → `fill="currentColor"`
     produces the filled counterpart of any **closed-path** icon from the same
     asset — no new artwork, no second library.
   - `src/main/resources/web/js/zul/wgt/css/rating.css` **already ships exactly
     this**: `.z-rating-icon` masks an outlined star, and
     `.z-rating-selected`/`.z-rating-hover` mask the same geometry with
     `fill='currentColor'`. The MD3 outlined→filled state pattern is in
     production today.
   - Scope limit, stated honestly: the flip is meaningful only for closed-path
     icons. Open-path glyphs (chevron, check, minus, the search handle) cannot be
     filled — but they never express fill-as-state either, so the technique
     covers precisely the set that needs it.
   - Consequence: Lucide's §2.4 (state variants) is not 0, and the G7 capability
     sub-test passes. **Coverage 3 → 4, Visual fit 2 → 4, verdict CONDITIONAL →
     PASS.**

### Side finding — `.z-rating-icon` star geometry has drifted

`rating.css` hand-inlines a Feather-era 5-point star
(`<polygon points='12 2 15.09 8.26 22 9.27 …'>`), while the generated
`z-icon-star` rule comes from Lucide v1.11's newer star — a rounded-join `<path>`
with `.53a` curve segments (both measured). **The two render visibly different
star shapes on the same page.** This is unrelated to the library choice; it is a
consequence of hand-inlining instead of generating, and it is the kind of drift
the fill-flip should be mechanised in `build-css.js` to prevent.

---

## 12. Scores (survivors only)

Evidence key: **M** = measured in this repo, **A** = assessed from published
catalog (verify before acting). Cells changed by §11.4 are marked ↑.

| Category (weight) | Material Symbols | Lucide | Remix Icon | Tabler | Phosphor |
|---|--:|--:|--:|--:|--:|
| Coverage (25%) | 4 | 4 ↑ | 5 | 5 | 4 |
| Integration (15%) | 5 | 5 | 4 | 4 | 4 |
| Runtime, gzipped (15%) | 3 | **5** | 3 | 3 | 2 |
| Visual fit (15%) | **5** | 4 ↑ | 4 ↑ | 3 ↑ | 3 |
| A11y & robustness (15%) | 5 | 4 | 4 | 4 | 4 |
| Longevity (15%) | 4 | 4 | 3 | 3 | 3 |
| **Weighted total** | **4.30** | **4.30** | **3.95** | **3.80** | **3.40** |
| **Rank** | **1 (tie)** | **1 (tie)** | 3 | 4 | 5 |

### Where the two leaders actually differ

The tie is not a fudge — they win on different cells, and the difference is
narrow and specific:

| | Material Symbols | Lucide |
|---|---|---|
| **Wins on** | Visual fit 5 vs 4 — the **optical-size axis** is purpose-built for 16–20px legibility, which is exactly where a 2px-stroke set is weakest (§6.2/6.3). A11y 5 vs 4 — font delivery survives forced-colors and printing natively | Runtime 5 vs 3 — **measured** 104,753 B gzipped; Material Symbols' font size is the one unmeasured cell in this table (§13) |
| **Neutral** | Coverage, integration and longevity score identically | |
| **Not a differentiator** | Being MD3's official set — see the §1 warning and §11.4 | Already being implemented — that is a switching-cost argument, not a quality score |

So the entire quality case for switching reduces to **small-size legibility**,
and the entire quality case for staying reduces to **measured payload**. Neither
is a landslide.

---

## 13. Conclusion

**Lucide passes G7.** Measured against the gate as the user stated it — *icon
style must conform to the theme's design language* — Lucide's drawing is a
24×24 grid with 2px strokes and rounded terminals, which matches Material's
outlined specification numerically and matches the Material Symbols *Rounded*
style in terminal treatment. And the one capability MD3 genuinely requires,
outlined→filled state, is not merely available but **already shipping** in
`rating.css` (§11.4).

**Decision D15 is moot.** It asked whether G7 should be applied retroactively to
disqualify Lucide. It should not, because Lucide does not fail the gate. Recorded
as *closed — premise invalid* rather than deleted, so the reasoning is not
re-litigated.

**Recommendation: keep Lucide for 11.0.** The two leaders tie at 4.30. When a
tie-break is needed, switching cost decides it: Material Symbols' single quality
advantage (optical-size axis) is narrow, its runtime cell is unmeasured and
likely worse over the wire, and an icon-layer rebuild plus full screenshot
re-baselining does not fit a 2-engineer, end-October schedule.

**What G7 was worth**: it eliminated Font Awesome Free, Bootstrap Icons and
Heroicons — including the option that was otherwise cheapest by a wide margin.
That is a real result, and it is the gate's justification even though it left the
incumbent standing.

### Remaining work (unchanged by this correction)

1. **Render the T1 32 at 12/14/16/20px** and inspect (§6.3). This is now the
   *only* open quality question between the two leaders, so it is the highest-value
   next step. If Lucide's 1.33px effective stroke at 16px is visibly poor on
   non-retina, revisit; if not, the matter is closed.
2. **Measure the Material Symbols font** (variable and static-single-style,
   gzipped) — the last unmeasured cell in §12.
3. **Fix the `.z-rating-icon` star drift** and mechanise the fill-flip in
   `build-css.js` so filled counterparts are generated, not hand-inlined (§11.4
   side finding).
4. **Document the FA-retirement story per theme** (D14): Marble drops FA,
   `iceblue11` keeps it. Confirm ZK 11 still ships `font-awesome.css.dsp` for
   `iceblue11`.
5. **Decide D16** (mask-image vs webfont delivery) — independent of library, and
   recommendation there is unchanged: keep mask-image.
