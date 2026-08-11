# Progress & Execution Report: `utility/icons.zul` → Font Awesome catalog

## 1. Executive Summary

* **Status:** Completed
* **Core conclusion:** `utility/icons.zul` was a stale copy of Marble's 1947-name **Lucide**
  gallery — names this theme cannot render, since it has no Lucide masks. It is now a Font
  Awesome catalog in the three categories of the zkbooks reference page, driven by **this
  theme's own compiled stylesheet** so it demos current status rather than intent. Continues
  the cleanup started in `6c6a7bcb` ("drop icons-lucide.zul — a Marble-only gallery").
* **Key outputs:**
  * `src/test/resources/web/utility/icons.zul` — 2027 → 71 lines
  * `src/test/java/zk/example/FontAwesomeIconsVM.java` — new, 125 lines

---

## 2. Completed Items

**Page rebuilt on the reference structure**, modelled on
`developersreference/.../integration/fontawesome-icons.zul`: same three categories, same
`forEach` + `template` approach.

**Names read from the theme's own build output.** `FontAwesomeIconsVM` parses
`web/iceblue_css/zul/font/font-awesome.css.dsp` off the classpath and sorts every
`.z-icon-*` rule into the three categories. If a conversion phase drops or renames an icon
rule, the catalog reflects it on the next build instead of listing names that no longer render.

**Verified end-to-end** on a clean instance (:8091 — the instance on :8080 had the previous
VM class already loaded, and a JVM will not hot-reload it):

| Category | Tiles rendered | CSS rules |
|---|---|---|
| Classic Solid | 1951 | 1951 |
| Brand Icons | 790 | 790 |
| Animation | 10 | 10 |
| **Total** | **2751** | **2751** |

Cross-check: 1951 + 790 = 2741, exactly the number of distinct `.z-icon-*` glyph selectors in
the stylesheet the app serves. Glyphs are genuinely font-painted —
`getComputedStyle(el,'::before')` gives `font-family: ZK85Icons, FontAwesome` with real
content, and `.z-icon-spin` resolves `animation-name: z-icon-spin`. `xmllint` clean,
`mvn test-compile` clean.

**Conventions honoured.** Styling composed entirely from the `z-*` utilities that
`PreviewStylesInit` supplies (no page-local `<style>` block, unlike the reference page).
Catalog entries are native `h:` markup, keeping ~2.7k entries off the widget tree.

---

## 3. Findings & Corrections

**1. The compiled CSS is self-categorising — no name list needed**
* ZK's `_icons.less` emits the two glyph maps with *different pseudo-element syntax*:
  `.fa-icons()` as `::before` and `.fa-brand-icons()` as `:before`. Animation modifiers are
  the only `.z-icon-*` rules carrying an `animation` declaration.
* That single quirk yields all three reference categories straight from the stylesheet, so
  the VM needs no ZK LESS parsing and no checked-in list.

**2. Brand count is 790, not the 506 in ZK's `.fa-brand-icons()` map**
* An earlier draft read ZK's `_variables.less` and reported 506 brands. Reading the compiled
  CSS gives 790, because `_shims.less` emits FA4 brand aliases (`facebook-official`,
  `linkedin-square`, `github-alt`, `google-plus-g`, …) with the same `:before` syntax.
* Verified these are real, not phantom entries: `facebook-official` and `linkedin-square`
  resolve to `font-family: ZK85Icons, FontAwesome`, `font-weight: 400`, with glyph content,
  and paint correct logos in the screenshot.
* **This is a correction in the page's favour** — 284 additional names that genuinely work
  today were missing from the jar-driven draft.

**3. `font-weight:400` does not mean "brand"**
* A first attempt at categorising brands by `font-weight:400` returned 321 names, most of
  them FA4 *regular*-style shims (`user-o`, `trash-o`, `vcard-o`). Discarded in favour of the
  pseudo-element rule above. Recorded so nobody retries it.

---

## 4. ⚠️ Decisions Required

None.

---

## 5. Outstanding Tasks & Next Steps

* [ ] **Restart the :8080 instance to pick up the new VM** — a running JVM keeps the previously loaded class. *Purpose: that instance still renders the earlier 506-brand version.*
* [ ] **Consider whether non-brand FA4 shims deserve a category** — the `-o` suffixed regular-style shims (`user-o`, `trash-o`, …) are served but appear in no category. *Purpose: they are valid names an existing ZK app may already use.*
