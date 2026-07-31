# LESS variable → CSS custom property (migration table)

**Generated — do not hand-edit.** Regenerate with `npm run gen:var-table`
(`node scripts/gen-var-table.js`). Output is deterministic: no timestamps, so any diff here
means the source tree moved.

This table is the upgrade artifact for anyone who customized this theme the way
`readme.md:69` recommends — **by overriding LESS variables**. For the overwhelming
majority of variables the migration is a rename:

```diff
- @colorPrimary:  red;      // in your _mytheme.less, imported from _header.less
+ :root { --zk-color-primary: red; }   // in a plain .css file, no build step needed
```

Read [Behavioural caveats](#behavioural-caveats) before assuming the rename is the whole
story, and [Escape hatch](#escape-hatch) if you would rather keep using LESS — **upgrading
to ZK 11 and dropping LESS are separable decisions.**

## Summary

| | count |
|---|---|
| variable declarations mapped | **846** |
| … clean 1:1 `@name → var(--zk-token)` | 834 |
| … one variable → several tokens | 4 |
| … config strings (not tokens) | 2 |
| … image/asset paths (not tokens) | 4 |
| … media-query strings (not tokens) | 2 |
| … plain literals (fork-only category) | 0 |
| distinct `--zk-*` tokens on the right-hand side | **842** |
| tokens declared by a profile | 842 |
| mapped tokens that no profile declares | 0 |
| profile tokens that no variable maps to | 0 |

**Exceptions total 16, in two kinds** — the second kind is the one that bites, because the row looks like a clean rename:

| kind | count | where it is listed |
|---|---|---|
| categorical — the value is not a single token | 12 | [Exceptions](#exceptions) |
| behavioural — the value IS one token, but a consumption site changes what overriding it does | 4 | [Behavioural caveats](#behavioural-caveats) |

Source files (there are **two**, which is easy to miss):

- `src/main/resources/web/zkmax/less/_zkvariables.less` — 2 declaration(s)
- `src/main/resources/web/zul/less/_zkvariables.less` — 844 declaration(s)

Both are deleted by phase P8 of the drop-LESS conversion. That is why this file exists.

## Which side declares what

The mapping has two halves, and only the second one emits a custom property. Both lines
below are quoted from this tree, not invented:

```
zul/less/_zkvariables.less
  @colorPrimary: var(--zk-color-primary);   <- FORWARDS a name
zul/less/profiles/_default.less
  :root { --zk-color-primary: #0093F9; }   <- DECLARES the property
```

So "override the variable" and "override the token" are edits to different files with
different reach. Profiles found:

- `src/main/resources/web/zul/less/profiles/_compact.less` — 842 `--zk-*` declarations
- `src/main/resources/web/zul/less/profiles/_default.less` — 842 `--zk-*` declarations

## Exceptions

12 of 846 declarations do not even *look* like a 1:1 rename —
their value is not a single token. These are the easy exceptions: the table shape shows them.

A further **4** rows *are* a single token and look perfectly clean, but behave
differently when you override the token instead of the variable. Those are in
[Behavioural caveats](#behavioural-caveats) — **do not skip that section**, because nothing
in their table row hints at the problem.

### config-string (2)

Value is a quoted string consumed at LESS compile time by `@import` path interpolation. Not a token, and not tokenizable.

| LESS variable | value | verdict | how to migrate |
|---|---|---|---|
| `@themeProfile` | `"default"` | `no-token` | Mechanism change — this selects a compiled-in file. Replace by loading a different token stylesheet at runtime. |
| `@themePalette` | `"iceblue"` | `no-token` | Mechanism change — this selects a compiled-in file. Replace by loading a different token stylesheet at runtime. |

### asset-path (4)

Value is a quoted `~./` resource path, consumed at compile time as the argument of a server-side DSP call (`${c:encodeThemeURL(...)}`). Not a token.

| LESS variable | value | verdict | how to migrate |
|---|---|---|---|
| `@loadingAnimationDefer` | `'~./zul/img/misc/progress-32.gif'` | `no-token` | Mechanism change — consumed by a server-side `${c:encodeThemeURL(...)}` call. Keep it a build/DSP-time value, or point the CSS `url()` at your own asset. |
| `@loadingAnimationLoad` | `'~./zul/img/misc/progress-72.gif'` | `no-token` | Mechanism change — consumed by a server-side `${c:encodeThemeURL(...)}` call. Keep it a build/DSP-time value, or point the CSS `url()` at your own asset. |
| `@sliderTicks` | `'~./zul/img/slider/scale-ticks.png'` | `no-token` | Mechanism change — consumed by a server-side `${c:encodeThemeURL(...)}` call. Keep it a build/DSP-time value, or point the CSS `url()` at your own asset. |
| `@progressmeterBackgroundImage` | `'~./zul/img/misc/prgmeter-anim.gif'` | `no-token` | Mechanism change — consumed by a server-side `${c:encodeThemeURL(...)}` call. Keep it a build/DSP-time value, or point the CSS `url()` at your own asset. |

### token-list (4)

Value is a comma-separated list of several `var(--zk-*)`. One LESS variable fans out to N tokens.

| LESS variable | value | verdict | how to migrate |
|---|---|---|---|
| `@containerButtonColors` | `var(--zk-container-button-color), var(--zk-container-button-hover-color)` | `rename-fan-out` | Declare all 2 tokens: `--zk-container-button-color`, `--zk-container-button-hover-color`. |
| `@borderlayoutCollapsedIconColors` | `var(--zk-borderlayout-collapsed-icon-color), var(--zk-borderlayout-collapsed-icon-hover-color)` | `rename-fan-out` | Declare all 2 tokens: `--zk-borderlayout-collapsed-icon-color`, `--zk-borderlayout-collapsed-icon-hover-color`. |
| `@splitterButtonTextColors` | `var(--zk-splitter-button-text-color), var(--zk-splitter-button-text-hover-color)` | `rename-fan-out` | Declare all 2 tokens: `--zk-splitter-button-text-color`, `--zk-splitter-button-text-hover-color`. |
| `@menuScrollableIconColors` | `var(--zk-menu-scrollable-icon-color), var(--zk-menu-scrollable-icon-hover-color)` | `rename-fan-out` | Declare all 2 tokens: `--zk-menu-scrollable-icon-color`, `--zk-menu-scrollable-icon-hover-color`. |

### media-query (2)

Value is a LESS escaped string (`~"…"`) holding a media-query condition. CSS has no custom property that can appear in a media query prelude.

**Measured note:** none of these 2 is referenced anywhere in the `.less` tree.
The file that declares them is imported, but no rule reads either value, so there is
nothing for a migration to preserve. Verify before porting them.

| LESS variable | value | verdict | how to migrate |
|---|---|---|---|
| `@iphone` | `~"only screen and (min-device-width : 320px) and (max-device-width : 480px)"` | `no-token` | No equivalent — custom properties cannot appear in a media-query prelude. Write the condition out in the CSS. |
| `@android` | `~"only screen and (min-device-width : 480px) and (max-device-width : 720px)"` | `no-token` | No equivalent — custom properties cannot appear in a media-query prelude. Write the condition out in the CSS. |

## Behavioural caveats

The table above proves a **syntactic** 1:1. It does not prove that overriding the token
*behaves* like overriding the LESS variable. Every asymmetry below is asserted by the
generator, so it cannot quietly disappear, and every one of them **already exists in the
LESS tree** — none is introduced by dropping LESS. A declaration-level diff of the compiled
output cannot see any of them, because the hazardous forms pass through unchanged.

### CAVEAT-1 — overriding the LESS variable REMOVES the token hook

This is what `readme.md:8-10` is warning about. Today `@colorPrimary` forwards to
`var(--zk-color-primary)`, so component CSS carries the indirection and a runtime override
of the token works. The moment you write `@colorPrimary: red;` the compiled CSS contains
the literal `red` and the custom property is **gone from the output** — anyone downstream
who tries to re-theme by setting `--zk-color-primary` silently gets nothing.

Direction of the difference: the LESS override is *stronger and less overridable*; the
token override is *weaker and composable*. Migrating from the first to the second is
usually an improvement, but it is a change of kind, not only of spelling.

### CAVEAT-2 — values embedded in a `data:` URI cannot be re-themed by a token

This is the concrete counter-example to "the mapping is behaviourally 1:1", and it is
pre-existing in the LESS tree — not introduced by dropping LESS.

| LESS variable | token | embedded at |
|---|---|---|
| `@iconColor` | `--zk-icon-color` | `js/zul/wgt/less/selectbox.less:3` |
| `@activeColor` | `--zk-active-color` | `js/zul/wgt/less/selectbox.less:4` |
| `@inputDisableColor` | `--zk-input-disable-color` | `js/zul/wgt/less/selectbox.less:5` |

These are URL-escaped into an inline SVG `data:` URI as the `fill` attribute. The
compiled output therefore contains, URL-encoded, `fill='var(--zk-icon-color)'` — and a
`var()` inside a data-URI SVG document is **not** resolved against the host page. So:

- overriding the **LESS variable** with a real colour works (the literal lands in the URI);
- overriding the **token** does not, and never did;
- with the shipped default the glyph falls back to the SVG default fill.

**Migration consequence:** if your customization overrides one of these variables with a
colour, a pure rename to the token is a *visual regression*. Either keep a build-time
substitution for that data URI, or replace the data-URI glyph with a `mask-image` /
`background-color` pair, which a custom property can colour.

### CAVEAT-3 — a compile-time function operand: overriding the variable REVIVES a dead declaration

This one runs the *opposite* way to CAVEAT-2, and it is the most surprising entry in this
document: the declaration you are migrating **currently does nothing at all**.

| LESS variable | token | called at | function |
|---|---|---|---|
| `@baseBackgroundColor` | `--zk-base-background-color` | `js/zkmax/big/less/biglistbox.less:281` | `contrast()` |
| `@baseBackgroundColor` | `--zk-base-background-color` | `js/zkmax/big/less/biglistbox.less:389` | `contrast()` |

LESS evaluates these functions at compile time. Because the operand is `var(--zk-*)`,
LESS **cannot** evaluate it, so it emits the call verbatim — and since CSS has no such
function in that position, the browser **discards the whole declaration**. So today:

- shipped as-is → the declaration is dead; the element keeps whatever it inherits;
- override the **token** → still dead. The token never reaches an evaluated position;
- override the **LESS variable** with a literal colour — exactly what `readme.md:69`
  tells you to do — → LESS now evaluates the function at compile time and emits a real
  value, so **a declaration that never applied suddenly applies**.

**Migration consequence:** if your fork overrides one of these variables with a literal,
your build has a live declaration that upstream does not, and renaming to the token will
*remove* it. That is a visible change, and it is the correct one — but diff the rendering
rather than assuming the rename was inert. If you want to keep the effect, write the
resolved value into the CSS yourself; a custom property cannot restore it.

This is a **pre-existing latent bug in the LESS tree**, not a conversion regression.

### CAVEAT-4 — compile-time `@import` selection has no runtime equivalent

| LESS variable | used at | why no token |
|---|---|---|
| `@themeProfile` | `zkmax/less/tablet.less:4` | LESS resolves this at compile time to choose a FILE. No CSS mechanism can do this at runtime. |
| `@themeProfile` | `zul/less/_zkcssvariables.less:2` | LESS resolves this at compile time to choose a FILE. No CSS mechanism can do this at runtime. |
| `@themePalette` | `zul/less/_header.less:7` | LESS resolves this at compile time to choose a FILE. No CSS mechanism can do this at runtime. |

These pick a *file*, not a value. Their replacement is a mechanism change (load a
different override stylesheet at runtime), which is why they are an API change in the
conversion plan rather than a row in a rename table.

### CAVEAT-5 — a dead LESS name is not the same as a dead token

42 declarations forward a name that **nothing in the tree ever references**.
That is not enough to call them dead, because the token on the right-hand side may still
be consumed elsewhere — so they split in two, and the two halves need opposite advice.

**17 × dead name, LIVE token** — the LESS variable was never used, but the token is.
If your customization overrides one of these, it never did anything; the token override,
however, does. `@baseHeight` is the clearest case: unused as a LESS name, while
`--zk-base-height` drives the whole icon/button/bar/title height ladder through `calc()`
in the profile. **Set the token, and expect it to have more effect than the variable had.**

| LESS variable | token | token consumers |
|---|---|---|
| `@baseHeight` | `--zk-base-height` | 9 |
| `@baseTitleHeight` | `--zk-base-title-height` | 1 |
| `@baseWidth` | `--zk-base-width` | 6 |
| `@textColorActive` | `--zk-text-color-active` | 10 |
| `@colorAccent` | `--zk-color-accent` | 12 |
| `@colorAccent2` | `--zk-color-accent2` | 6 |
| `@colorAccent3` | `--zk-color-accent3` | 2 |
| `@colorGreyLighter` | `--zk-color-grey-lighter` | 24 |
| `@iconDisabledColor` | `--zk-icon-disabled-color` | 2 |
| `@meshFocusBoxShadowColor` | `--zk-mesh-focus-box-shadow-color` | 2 |
| `@meshTitleFocusBoxShadowColor` | `--zk-mesh-title-focus-box-shadow-color` | 2 |
| `@activeBackgroundColor` | `--zk-active-background-color` | 4 |
| `@focusBackgroundColor` | `--zk-focus-background-color` | 4 |
| `@groupboxFocusBoxShadowColor` | `--zk-groupbox-focus-box-shadow-color` | 2 |
| `@comboPopupDescSize` | `--zk-combo-popup-desc-size` | 1 |
| `@pagingButtonFocusBoxShadowColor` | `--zk-paging-button-focus-box-shadow-color` | 2 |
| `@navitemFocusBoxShadowColor` | `--zk-navitem-focus-box-shadow-color` | 2 |

**25 × dead on both sides** — neither the name nor the token is referenced anywhere.
Do not spend upgrade budget porting these. (They are still listed, because "I checked and
it is dead" is cheaper to read than "I could not find it".)

| LESS variable | token | declared at |
|---|---|---|
| `@iphone` | — | `zkmax/less/_zkvariables.less:3` |
| `@android` | — | `zkmax/less/_zkvariables.less:4` |
| `@meshContentFocusBackgroundColor` | `--zk-mesh-content-focus-background-color` | `zul/less/_zkvariables.less:92` |
| `@activeGradientStart` | `--zk-active-gradient-start` | `zul/less/_zkvariables.less:130` |
| `@activeGradientEnd` | `--zk-active-gradient-end` | `zul/less/_zkvariables.less:131` |
| `@focusColor` | `--zk-focus-color` | `zul/less/_zkvariables.less:134` |
| `@focusGradientStart` | `--zk-focus-gradient-start` | `zul/less/_zkvariables.less:137` |
| `@focusGradientEnd` | `--zk-focus-gradient-end` | `zul/less/_zkvariables.less:138` |
| `@hoverGradientStart` | `--zk-hover-gradient-start` | `zul/less/_zkvariables.less:144` |
| `@hoverGradientEnd` | `--zk-hover-gradient-end` | `zul/less/_zkvariables.less:145` |
| `@readonlyBorderColor` | `--zk-readonly-border-color` | `zul/less/_zkvariables.less:156` |
| `@readonlyBackgroundColor` | `--zk-readonly-background-color` | `zul/less/_zkvariables.less:157` |
| `@selectedFocusBorderColor` | `--zk-selected-focus-border-color` | `zul/less/_zkvariables.less:171` |
| `@containerBodyTextSize` | `--zk-container-body-text-size` | `zul/less/_zkvariables.less:190` |
| `@borderlayoutBodyLineHeight` | `--zk-borderlayout-body-line-height` | `zul/less/_zkvariables.less:218` |
| `@colorboxPadding` | `--zk-colorbox-padding` | `zul/less/_zkvariables.less:364` |
| `@dragAllowBorderColor` | `--zk-drag-allow-border-color` | `zul/less/_zkvariables.less:439` |
| `@dragDisAllowBorderColor` | `--zk-drag-disallow-border-color` | `zul/less/_zkvariables.less:442` |
| `@pagingInputPadding` | `--zk-paging-input-padding` | `zul/less/_zkvariables.less:515` |
| `@navSeparatorColor` | `--zk-nav-separator-color` | `zul/less/_zkvariables.less:658` |
| `@chosenboxInputPadding` | `--zk-chosenbox-input-padding` | `zul/less/_zkvariables.less:700` |
| `@ratingDisabled` | `--zk-rating-disabled` | `zul/less/_zkvariables.less:742` |
| `@ratingDisabledSelected` | `--zk-rating-disabled-selected` | `zul/less/_zkvariables.less:743` |
| `@stepCompleteColor` | `--zk-step-complete-color` | `zul/less/_zkvariables.less:927` |
| `@cascaderIconColor` | `--zk-cascader-icon-color` | `zul/less/_zkvariables.less:984` |

Liveness is measured over the `.less` tree only, and `_zkvariables.less` itself is
excluded from the token count (its whole job is forwarding, so counting it would make
every token look consumed). A token can also be consumed by a *host application* that
already sets it — that is outside this repository and cannot be measured here.

## Escape hatch

**Upgrading to ZK 11 and dropping LESS are two separate decisions.** If your fork has a
large LESS customization and you do not want to convert it on the upgrade schedule, you do
not have to. The deleted partials are ordinary files; vendor them into your own fork:

```
your-fork/src/main/resources/web/zul/less/
  _zkvariables.less   <- copy from the last release that had it
  _zkmixins.less      <- copy
  _header.less        <- copy (it is the hub every entry file imports)
```

Keep `zkless-engine` as your own devDependency, keep compiling your `.less` entry files,
and keep overriding `@variables`. What you give up is only the *upstream* LESS sources —
your own stay valid, because a `.less` file that resolves to `var(--zk-*)` values and a
`.css` file that contains them produce the same output.

Two things to know before choosing this:

1. **Merging upstream gets harder over time.** Once upstream ships `.css` where you have
   `.less`, git can no longer merge those files for you; you own them.
2. **CAVEAT-1 applies more, not less.** A vendored LESS override keeps stripping the token
   indirection out of the output, so consumers of your theme lose runtime re-theming for
   every variable you override.

The conversion tools are runnable on your fork, which is the middle path:

```bash
node scripts/gen-var-table.js --fork     # this table, for YOUR variable set
npm run baseline                         # compile your LESS tree to an immutable reference
node scripts/cssdiff.js baseline/ target/classes/web/<theme>   # prove your conversion changed nothing
```

## Full table

Grouped by the section comments of the source file, in source order. `refs` is how many
times the variable is referenced across the `.less` tree (`0` = dead, see CAVEAT-5).

### `zkmax/less/_zkvariables.less`

#### Variables for Tablet device

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@iphone` | — | media-query | no-token | 0 |
| `@android` | — | media-query | no-token | 0 |
### `zul/less/_zkvariables.less`

#### Global Variables

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@themeProfile` | — | config-string | no-token | 2 |
| `@themePalette` | — | config-string | no-token | 1 |
#### Typography

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@baseFontSize` | `--zk-base-font-size` | token | rename | 2 |
| `@baseTitleFontFamily` | `--zk-base-title-font-family` | token | rename | 32 |
| `@baseContentFontFamily` | `--zk-base-content-font-family` | token | rename | 55 |
| `@baseLineHeight` | `--zk-base-line-height` | token | rename | 10 |
#### Component height

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@baseHeight` | `--zk-base-height` | token | rename | 0 |
| `@baseIconHeight` | `--zk-base-icon-height` | token | rename | 14 |
| `@baseButtonHeight` | `--zk-base-button-height` | token | rename | 25 |
| `@baseBarHeight` | `--zk-base-bar-height` | token | rename | 2 |
| `@baseTitleHeight` | `--zk-base-title-height` | token | rename | 0 |
#### Component width

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@baseWidth` | `--zk-base-width` | token | rename | 0 |
| `@baseIconWidth` | `--zk-base-icon-width` | token | rename | 8 |
| `@baseButtonWidth` | `--zk-base-button-width` | token | rename | 4 |
| `@baseBarWidth` | `--zk-base-bar-width` | token | rename | 3 |
#### Component sizing

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@fontSizeXLarge` | `--zk-font-size-x-large` | token | rename | 7 |
| `@fontSizeLarge` | `--zk-font-size-large` | token | rename | 12 |
| `@fontSizeMedium` | `--zk-font-size-medium` | token | rename | 39 |
| `@fontSizeSmall` | `--zk-font-size-small` | token | rename | 2 |
| `@fontSizeXSmall` | `--zk-font-size-x-small` | token | rename | 4 |
| `@baseBorderRadius` | `--zk-base-border-radius` | token | rename | 61 |
| `@borderRadiusLarge` | `--zk-border-radius-large` | token | rename | 14 |
| `@borderRadiusSmall` | `--zk-border-radius-small` | token | rename | 1 |
#### Font color

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@textColorDefault` | `--zk-text-color-default` | token | rename | 16 |
| `@textColorLight` | `--zk-text-color-light` | token | rename | 4 |
| `@textColorLighter` | `--zk-text-color-lighter` | token | rename | 1 |
| `@textColorDefault3` | `--zk-text-color-default3` | token | rename | 14 |
| `@textColorActive` | `--zk-text-color-active` | token | rename | 0 |
| `@colorPrimary` | `--zk-color-primary` | token | rename | 12 |
| `@colorPrimaryDark` | `--zk-color-primary-dark` | token | rename | 7 |
| `@colorPrimaryLight` | `--zk-color-primary-light` | token | rename | 2 |
| `@colorPrimaryLighter` | `--zk-color-primary-lighter` | token | rename | 5 |
| `@colorAccent` | `--zk-color-accent` | token | rename | 0 |
| `@colorAccent2` | `--zk-color-accent2` | token | rename | 0 |
| `@colorAccent3` | `--zk-color-accent3` | token | rename | 0 |
| `@colorBackground1` | `--zk-color-background1` | token | rename | 1 |
| `@colorBackground3` | `--zk-color-background3` | token | rename | 2 |
| `@colorGreyDark` | `--zk-color-grey-dark` | token | rename | 3 |
| `@colorGreyLight` | `--zk-color-grey-light` | token | rename | 4 |
| `@colorGreyLighter` | `--zk-color-grey-lighter` | token | rename | 0 |
| `@baseTextColor` | `--zk-base-text-color` | token | rename | 11 |
#### Border color

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@baseBorderColor` | `--zk-base-border-color` | token | rename | 32 |
#### Background color

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@baseBackgroundColor` | `--zk-base-background-color` | token | rename-with-caveat | 27 |
#### Icon font color (used for font-awesome)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@iconColor` | `--zk-icon-color` | token | rename-with-caveat | 6 |
| `@iconHoverColor` | `--zk-icon-hover-color` | token | rename | 2 |
| `@iconDisabledColor` | `--zk-icon-disabled-color` | token | rename | 0 |
#### Mesh Table (used for grid, listbox, tree, biglistbox)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@meshAutoPagingRowHeight` | `--zk-mesh-auto-paging-row-height` | token | rename | 4 |
| `@meshAutoPagingRowPadding` | `--zk-mesh-auto-paging-row-padding` | token | rename | 4 |
| `@meshAutoPagingRowLineHeight` | `--zk-mesh-auto-paging-row-line-height` | token | rename | 4 |
| `@meshBackgroundColor` | `--zk-mesh-background-color` | token | rename | 10 |
| `@meshStripeBackgroundColor` | `--zk-mesh-stripe-background-color` | token | rename | 3 |
| `@meshTitleColor` | `--zk-mesh-title-color` | token | rename | 13 |
| `@meshTitleBackgroundColor` | `--zk-mesh-title-background-color` | token | rename | 10 |
| `@meshTitleHoverColor` | `--zk-mesh-title-hover-color` | token | rename | 2 |
| `@meshTitleHoverBackgroundColor` | `--zk-mesh-title-hover-background-color` | token | rename | 3 |
| `@meshTitleActiveColor` | `--zk-mesh-title-active-color` | token | rename | 2 |
| `@meshTitleActiveBackgroundColor` | `--zk-mesh-title-active-background-color` | token | rename | 5 |
| `@meshTitleBorderColor` | `--zk-mesh-title-border-color` | token | rename | 25 |
| `@meshContentBorderColor` | `--zk-mesh-content-border-color` | token | rename | 10 |
| `@meshContentFocusBackgroundColor` | `--zk-mesh-content-focus-background-color` | token | rename | 0 |
| `@meshFootBackgroundColor` | `--zk-mesh-foot-background-color` | token | rename | 6 |
| `@meshGroupColor` | `--zk-mesh-group-color` | token | rename | 4 |
| `@meshGroupBorderColor` | `--zk-mesh-group-border-color` | token | rename | 2 |
| `@meshGroupBackgroundColor` | `--zk-mesh-group-background-color` | token | rename | 2 |
| `@meshGroupFooterColor` | `--zk-mesh-group-footer-color` | token | rename | 2 |
| `@meshGroupFooterBackgroundColor` | `--zk-mesh-group-footer-background-color` | token | rename | 1 |
| `@meshGroupOpenColor` | `--zk-mesh-group-open-color` | token | rename | 2 |
| `@meshGroupOpenBackgroundColor` | `--zk-mesh-group-open-background-color` | token | rename | 2 |
| `@meshGroupOpenBorder` | `--zk-mesh-group-open-border` | token | rename | 2 |
| `@meshGroupFooterOpenColor` | `--zk-mesh-group-footer-open-color` | token | rename | 2 |
| `@gridDetailContentPadding` | `--zk-grid-detail-content-padding` | token | rename | 1 |
| `@gridDetailContentBeforeMargin` | `--zk-grid-detail-content-before-margin` | token | rename | 1 |
| `@auxheadContentPadding` | `--zk-auxhead-content-padding` | token | rename | 1 |
| `@meshBodyPadding` | `--zk-mesh-body-padding` | token | rename | 8 |
| `@meshEmptyBodyPadding` | `--zk-mesh-empty-body-padding` | token | rename | 2 |
| `@meshContentLineHeight` | `--zk-mesh-content-line-height` | token | rename | 3 |
| `@meshColumnSortIconTop` | `--zk-mesh-column-sort-icon-top` | token | rename | 2 |
| `@meshColumnSortButtonWidth` | `--zk-mesh-column-sort-button-width` | token | rename | 2 |
| `@meshColumnSortButtonHeight` | `--zk-mesh-column-sort-button-height` | token | rename | 4 |
| `@meshRowDetailOuterPadding` | `--zk-mesh-row-detail-outer-padding` | token | rename | 1 |
| `@treecellContentLineHeight` | `--zk-treecell-content-line-height` | token | rename | 1 |
| `@listheaderCheckedPositionLeft` | `--zk-listheader-checked-position-left` | token | rename | 1 |
| `@listboxRadioIconSize` | `--zk-listbox-radio-icon-size` | token | rename | 2 |
| `@meshFocusBoxShadowColor` | `--zk-mesh-focus-box-shadow-color` | token | rename | 0 |
| `@meshTitleFocusBoxShadowColor` | `--zk-mesh-title-focus-box-shadow-color` | token | rename | 0 |
| `@meshCellFocusBoxShadowColor` | `--zk-mesh-cell-focus-box-shadow-color` | token | rename | 8 |
| `@meshFocusBoxShadow` | `--zk-mesh-focus-box-shadow` | token | rename | 2 |
| `@meshTitleFocusBoxShadow` | `--zk-mesh-title-focus-box-shadow` | token | rename | 5 |
| `@meshCellFocusBoxShadow` | `--zk-mesh-cell-focus-box-shadow` | token | rename | 1 |
#### Active

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@activeColor` | `--zk-active-color` | token | rename-with-caveat | 2 |
| `@activeBorderColor` | `--zk-active-border-color` | token | rename | 1 |
| `@activeBackgroundColor` | `--zk-active-background-color` | token | rename | 0 |
| `@activeGradientStart` | `--zk-active-gradient-start` | token | rename | 0 |
| `@activeGradientEnd` | `--zk-active-gradient-end` | token | rename | 0 |
#### Focus

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@focusColor` | `--zk-focus-color` | token | rename | 0 |
| `@focusBorderColor` | `--zk-focus-border-color` | token | rename | 7 |
| `@focusBackgroundColor` | `--zk-focus-background-color` | token | rename | 0 |
| `@focusGradientStart` | `--zk-focus-gradient-start` | token | rename | 0 |
| `@focusGradientEnd` | `--zk-focus-gradient-end` | token | rename | 0 |
#### Hover

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@hoverColor` | `--zk-hover-color` | token | rename | 6 |
| `@hoverBorderColor` | `--zk-hover-border-color` | token | rename | 1 |
| `@hoverBackgroundColor` | `--zk-hover-background-color` | token | rename | 6 |
| `@hoverGradientStart` | `--zk-hover-gradient-start` | token | rename | 0 |
| `@hoverGradientEnd` | `--zk-hover-gradient-end` | token | rename | 0 |
#### Disabled

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@disabledColor` | `--zk-disabled-color` | token | rename | 32 |
| `@disabledBackgroundColor` | `--zk-disabled-background-color` | token | rename | 6 |
| `@disabledOpacity` | `--zk-disabled-opacity` | token | rename | 6 |
#### Invalid

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@invalidBorderColor` | `--zk-invalid-border-color` | token | rename | 5 |
#### Read-only

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@readonlyBorderColor` | `--zk-readonly-border-color` | token | rename | 0 |
| `@readonlyBackgroundColor` | `--zk-readonly-background-color` | token | rename | 0 |
#### Selected (used on listbox, tree, comboitem)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@selectedColor` | `--zk-selected-color` | token | rename | 3 |
| `@selectedBorderColor` | `--zk-selected-border-color` | token | rename | 1 |
| `@selectedBackgroundColor` | `--zk-selected-background-color` | token | rename | 3 |
#### Selected Hover (used on listbox, tree, comboitem)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@selectedHoverColor` | `--zk-selected-hover-color` | token | rename | 5 |
| `@selectedHoverBorderColor` | `--zk-selected-hover-border-color` | token | rename | 1 |
| `@selectedHoverBackgroundColor` | `--zk-selected-hover-background-color` | token | rename | 5 |
#### Selected Focus (used on listbox, tree, comboitem)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@selectedFocusColor` | `--zk-selected-focus-color` | token | rename | 2 |
| `@selectedFocusBorderColor` | `--zk-selected-focus-border-color` | token | rename | 0 |
| `@selectedFocusBackgroundColor` | `--zk-selected-focus-background-color` | token | rename | 2 |
#### Checked (used on menuitem, listbox, tree, toolbarbutton)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@checkedIconSize` | `--zk-checked-icon-size` | token | rename | 5 |
| `@checkedColor` | `--zk-checked-color` | token | rename | 17 |
| `@checkedBorderColor` | `--zk-checked-border-color` | token | rename | 5 |
| `@checkedBackgroundColor` | `--zk-checked-background-color` | token | rename | 7 |
#### Container (Window, Panel)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@containerBackground` | `--zk-container-background` | token | rename | 2 |
| `@containerPadding` | `--zk-container-padding` | token | rename | 5 |
| `@containerBorderColor` | `--zk-container-border-color` | token | rename | 5 |
| `@containerBorderRadius` | `--zk-container-border-radius` | token | rename | 4 |
| `@containerHeaderTextSize` | `--zk-container-header-text-size` | token | rename | 2 |
| `@containerHeaderColor` | `--zk-container-header-color` | token | rename | 2 |
| `@containerBodyTextSize` | `--zk-container-body-text-size` | token | rename | 0 |
| `@containerBodyColor` | `--zk-container-body-color` | token | rename | 2 |
| `@containerButtonSize` | `--zk-container-button-size` | token | rename | 2 |
| `@containerButtonColors` | `--zk-container-button-color`<br>`--zk-container-button-hover-color` | token-list | rename-fan-out | 4 |
| `@containerButtonPadding` | `--zk-container-button-padding` | token | rename | 2 |
#### Panel

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@panelHeaderPadding` | `--zk-panel-header-padding` | token | rename | 1 |
#### Window

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@windowHeaderPadding` | `--zk-window-header-padding` | token | rename | 1 |
| `@windowGhostHeaderPadding` | `--zk-window-ghost-header-padding` | token | rename | 1 |
#### Messagebox

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@messageboxPaddingHorizontal` | `--zk-messagebox-padding-horizontal` | token | rename | 1 |
| `@messageboxPadding` | `--zk-messagebox-padding` | token | rename | 1 |
| `@messageboxWindowPadding` | `--zk-messagebox-window-padding` | token | rename | 1 |
| `@messageboxWindowWidth` | `--zk-messagebox-window-width` | token | rename | 2 |
| `@messageboxWindowContentPadding` | `--zk-messagebox-window-content-padding` | token | rename | 1 |
| `@messageboxHeaderPadding` | `--zk-messagebox-header-padding` | token | rename | 1 |
| `@messageboxViewportMarginBottom` | `--zk-messagebox-viewport-margin-bottom` | token | rename | 1 |
| `@messageboxButtonsMarginLeft` | `--zk-messagebox-buttons-margin-left` | token | rename | 1 |
| `@messageboxIconMarginLeft` | `--zk-messagebox-icon-margin-left` | token | rename | 2 |
| `@messageboxIconSize` | `--zk-messagebox-icon-size` | token | rename | 3 |
#### Borderlayout

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@borderlayoutHeaderFontSize` | `--zk-borderlayout-header-font-size` | token | rename | 2 |
| `@borderlayoutHeaderHeight` | `--zk-borderlayout-header-height` | token | rename | 1 |
| `@borderlayoutHeaderPadding` | `--zk-borderlayout-header-padding` | token | rename | 1 |
| `@borderlayoutHeaderColor` | `--zk-borderlayout-header-color` | token | rename | 2 |
| `@borderlayoutHeaderBackgroundColor` | `--zk-borderlayout-header-background-color` | token | rename | 1 |
| `@borderlayoutBodyLineHeight` | `--zk-borderlayout-body-line-height` | token | rename | 0 |
| `@borderlayoutBodyPadding` | `--zk-borderlayout-body-padding` | token | rename | 1 |
| `@borderlayoutCollapsedSize` | `--zk-borderlayout-collapsed-size` | token | rename | 2 |
| `@borderlayoutCollapsedPadding` | `--zk-borderlayout-collapsed-padding` | token | rename | 1 |
| `@borderlayoutCollapsedIconColors` | `--zk-borderlayout-collapsed-icon-color`<br>`--zk-borderlayout-collapsed-icon-hover-color` | token-list | rename-fan-out | 2 |
| `@borderlayoutIconFontSize` | `--zk-borderlayout-icon-font-size` | token | rename | 1 |
| `@borderlayoutIconSize` | `--zk-borderlayout-icon-size` | token | rename | 2 |
| `@borderlayoutIconPositionTop` | `--zk-borderlayout-icon-position-top` | token | rename | 1 |
| `@borderlayoutIconPositionRight` | `--zk-borderlayout-icon-position-right` | token | rename | 1 |
#### Caption

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@captionFontSize` | `--zk-caption-font-size` | token | rename | 1 |
| `@captionElementsMargin` | `--zk-caption-elements-margin` | token | rename | 1 |
| `@captionButtonPadding` | `--zk-caption-button-padding` | token | rename | 1 |
| `@captionImageMaxSize` | `--zk-caption-image-max-size` | token | rename | 2 |
| `@captionButtonFontSize` | `--zk-caption-button-font-size` | token | rename | 1 |
#### Groupbox

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@groupboxHeaderFontSize` | `--zk-groupbox-header-font-size` | token | rename | 2 |
| `@groupboxHeaderColor` | `--zk-groupbox-header-color` | token | rename | 2 |
| `@groupboxContentPadding` | `--zk-groupbox-content-padding` | token | rename | 1 |
| `@groupboxNotitleContentPadding` | `--zk-groupbox-notitle-content-padding` | token | rename | 1 |
| `@groupbox3DHeaderPadding` | `--zk-groupbox-3d-header-padding` | token | rename | 1 |
| `@groupbox3DContentPadding` | `--zk-groupbox-3d-content-padding` | token | rename | 1 |
| `@groupboxFocusBoxShadowColor` | `--zk-groupbox-focus-box-shadow-color` | token | rename | 0 |
| `@groupboxFocusBoxShadow` | `--zk-groupbox-focus-box-shadow` | token | rename | 2 |
| `@groupboxFocusBorderRadius` | `--zk-groupbox-focus-border-radius` | token | rename | 2 |
#### Toolbar

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@toolbarHorizontalPadding` | `--zk-toolbar-horizontal-padding` | token | rename | 2 |
| `@toolbarPadding` | `--zk-toolbar-padding` | token | rename | 1 |
| `@toolbarButtonsSpacing` | `--zk-toolbar-buttons-spacing` | token | rename | 3 |
| `@toolbarInTabboxMinHeight` | `--zk-toolbar-in-tabbox-min-height` | token | rename | 1 |
| `@toolbarOverflowpopupButtonSize` | `--zk-toolbar-overflowpopup-button-size` | token | rename | 3 |
#### Input (used for textbox, intbox, spinner, ...)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@inputTextSize` | `--zk-input-text-size` | token | rename | 11 |
| `@inputBorderColor` | `--zk-input-border-color` | token | rename | 27 |
| `@inputBorderRadius` | `--zk-input-border-radius` | token | rename | 18 |
| `@inputBackgroundColor` | `--zk-input-background-color` | token | rename | 19 |
| `@inputHeight` | `--zk-input-height` | token | rename | 4 |
| `@inputPadding` | `--zk-input-padding` | token | rename | 6 |
| `@inputPaddingRight` | `--zk-input-padding-right` | token | rename | 2 |
| `@inputColor` | `--zk-input-color` | token | rename | 6 |
| `@inputPlaceholderColor` | `--zk-input-placeholder-color` | token | rename | 12 |
| `@inputHoverBorderColor` | `--zk-input-hover-border-color` | token | rename | 5 |
| `@inputFocusBorderColor` | `--zk-input-focus-border-color` | token | rename | 14 |
| `@inputDisableColor` | `--zk-input-disable-color` | token | rename-with-caveat | 15 |
| `@inputDisableBackgroundColor` | `--zk-input-disable-background-color` | token | rename | 10 |
| `@inputReadonlyColor` | `--zk-input-readonly-color` | token | rename | 5 |
| `@inputReadonlyBackgroundColor` | `--zk-input-readonly-background-color` | token | rename | 3 |
| `@inputLineHeight` | `--zk-input-line-height` | token | rename | 1 |
#### Checkbox/Radio

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@checkboxSize` | `--zk-checkbox-size` | token | rename | 10 |
| `@checkboxMargin` | `--zk-checkbox-margin` | token | rename | 2 |
| `@checkboxHoverBorderColor` | `--zk-checkbox-hover-border-color` | token | rename | 4 |
| `@checkboxSwitchMargin` | `--zk-checkbox-switch-margin` | token | rename | 1 |
| `@checkboxSwitchWidth` | `--zk-checkbox-switch-width` | token | rename | 1 |
| `@checkboxSwitchHeight` | `--zk-checkbox-switch-height` | token | rename | 2 |
| `@checkboxSwitchSize` | `--zk-checkbox-switch-size` | token | rename | 2 |
| `@checkboxSwitchStep` | `--zk-checkbox-switch-step` | token | rename | 1 |
| `@checkboxSwitchOffsetLeft` | `--zk-checkbox-switch-offset-left` | token | rename | 1 |
| `@checkboxSwitchOffsetBottom` | `--zk-checkbox-switch-offset-bottom` | token | rename | 1 |
| `@checkboxToggleSize` | `--zk-checkbox-toggle-size` | token | rename | 2 |
#### Button (used for button, combobutton)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@buttonPadding` | `--zk-button-padding` | token | rename | 3 |
| `@buttonColor` | `--zk-button-color` | token | rename | 5 |
| `@buttonBackgroundColor` | `--zk-button-background-color` | token | rename | 6 |
| `@buttonBorderWidth` | `--zk-button-border-width` | token | rename | 5 |
| `@buttonBorderColor` | `--zk-button-border-color` | token | rename | 4 |
| `@buttonHoverColor` | `--zk-button-hover-color` | token | rename | 6 |
| `@buttonHoverBackgroundColor` | `--zk-button-hover-background-color` | token | rename | 7 |
| `@buttonHoverBorderColor` | `--zk-button-hover-border-color` | token | rename | 6 |
| `@buttonFocusColor` | `--zk-button-focus-color` | token | rename | 5 |
| `@buttonFocusBackgroundColor` | `--zk-button-focus-background-color` | token | rename | 5 |
| `@buttonFocusBorderColor` | `--zk-button-focus-border-color` | token | rename | 6 |
| `@buttonActiveColor` | `--zk-button-active-color` | token | rename | 5 |
| `@buttonActiveBackgroundColor` | `--zk-button-active-background-color` | token | rename | 6 |
| `@buttonActiveBorderColor` | `--zk-button-active-border-color` | token | rename | 5 |
| `@buttonDisableColor` | `--zk-button-disable-color` | token | rename | 3 |
| `@buttonDisableBackgroundColor` | `--zk-button-disable-background-color` | token | rename | 3 |
| `@buttonDisableBorderColor` | `--zk-button-disable-border-color` | token | rename | 3 |
| `@buttonSeparatorBorderColor` | `--zk-button-separator-border-color` | token | rename | 2 |
| `@buttonDisableSeparatorBorderColor` | `--zk-button-disable-separator-border-color` | token | rename | 2 |
#### Toolbar button

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@toolbarButtonFontSize` | `--zk-toolbar-button-font-size` | token | rename | 1 |
| `@toolbarButtonPadding` | `--zk-toolbar-button-padding` | token | rename | 1 |
| `@toolbarButtonColor` | `--zk-toolbar-button-color` | token | rename | 3 |
| `@toolbarButtonBackgroundColor` | `--zk-toolbar-button-background-color` | token | rename | 2 |
| `@toolbarButtonCheckedColor` | `--zk-toolbar-button-checked-color` | token | rename | 5 |
| `@toolbarButtonCheckedBackgroundColor` | `--zk-toolbar-button-checked-background-color` | token | rename | 5 |
#### Combobutton

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@combobuttonPadding` | `--zk-combobutton-padding` | token | rename | 1 |
| `@combobuttonButtonWidth` | `--zk-combobutton-button-width` | token | rename | 1 |
| `@combobuttonButtonIconLeft` | `--zk-combobutton-button-icon-left` | token | rename | 1 |
| `@combobuttonToolbarFontSize` | `--zk-combobutton-toolbar-font-size` | token | rename | 1 |
| `@combobuttonToolbarPadding` | `--zk-combobutton-toolbar-padding` | token | rename | 1 |
#### ComboInput (combobox, datebox, bandbox, timebox, spinner...)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@comboButtonIconSize` | `--zk-combo-button-icon-size` | token | rename | 1 |
| `@comboButtonIconSizeLarge` | `--zk-combo-button-icon-size-large` | token | rename | 2 |
| `@comboButtonPadding` | `--zk-combo-button-padding` | token | rename | 1 |
| `@comboButtonMinWidth` | `--zk-combo-button-min-width` | token | rename | 1 |
| `@comboButtonIconColor` | `--zk-combo-button-icon-color` | token | rename | 2 |
| `@comboButtonHoverBorderColor` | `--zk-combo-button-hover-border-color` | token | rename | 7 |
| `@comboButtonHoverBackgroundColor` | `--zk-combo-button-hover-background-color` | token | rename | 7 |
| `@comboButtonActiveIconColor` | `--zk-combo-button-active-icon-color` | token | rename | 7 |
| `@comboButtonActiveBorderColor` | `--zk-combo-button-active-border-color` | token | rename | 7 |
| `@comboButtonActiveBackgroundColor` | `--zk-combo-button-active-background-color` | token | rename | 7 |
| `@comboPopupBorderColor` | `--zk-combo-popup-border-color` | token | rename | 4 |
| `@comboPopupItemSize` | `--zk-combo-popup-item-size` | token | rename | 6 |
| `@comboPopupItemColor` | `--zk-combo-popup-item-color` | token | rename | 3 |
| `@comboPopupIconSize` | `--zk-combo-popup-icon-size` | token | rename | 1 |
| `@comboPopupIconColor` | `--zk-combo-popup-icon-color` | token | rename | 1 |
| `@comboPopupDescSize` | `--zk-combo-popup-desc-size` | token | rename | 0 |
| `@comboPopupDescColor` | `--zk-combo-popup-desc-color` | token | rename | 1 |
| `@comboPopupItemHoverBackgroundColor` | `--zk-combo-popup-item-hover-background-color` | token | rename | 2 |
| `@comboPopupItemSelectedColor` | `--zk-combo-popup-item-selected-color` | token | rename | 2 |
| `@comboInputHeight` | `--zk-combo-input-height` | token | rename | 3 |
| `@comboInputPaddingRight` | `--zk-combo-input-padding-right` | token | rename | 1 |
| `@spinnerButtonWidth` | `--zk-spinner-button-width` | token | rename | 1 |
| `@spinnerButtonIconHeight` | `--zk-spinner-button-icon-height` | token | rename | 1 |
| `@spinnerButtonIconTransform` | `--zk-spinner-button-icon-transform` | token | rename | 1 |
| `@spinnerButtonIconPositionTop` | `--zk-spinner-button-icon-position-top` | token | rename | 1 |
| `@spinnerButtonPadding` | `--zk-spinner-button-padding` | token | rename | 1 |
| `@comboitemPadding` | `--zk-comboitem-padding` | token | rename | 4 |
| `@comboitemEmptyHeight` | `--zk-comboitem-empty-height` | token | rename | 1 |
| `@comboitemInnerFontSize` | `--zk-comboitem-inner-font-size` | token | rename | 1 |
#### Timepicker

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@timepickerButtonWidth` | `--zk-timepicker-button-width` | token | rename | 2 |
| `@timepickerHeight` | `--zk-timepicker-height` | token | rename | 3 |
| `@timepickerLineHeight` | `--zk-timepicker-line-height` | token | rename | 1 |
| `@timepickerPaddingRight` | `--zk-timepicker-padding-right` | token | rename | 1 |
| `@timepickerButtonPadding` | `--zk-timepicker-button-padding` | token | rename | 1 |
| `@timepickerPopupPadding` | `--zk-timepicker-popup-padding` | token | rename | 2 |
#### colorbox

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@colorboxButtonFontSize` | `--zk-colorbox-button-font-size` | token | rename | 2 |
| `@colorboxWidth` | `--zk-colorbox-width` | token | rename | 1 |
| `@colorboxHeight` | `--zk-colorbox-height` | token | rename | 1 |
| `@colorboxMenuImageSize` | `--zk-colorbox-menu-image-size` | token | rename | 2 |
| `@colorboxMenuImageMarginRight` | `--zk-colorbox-menu-image-margin-right` | token | rename | 1 |
| `@colorboxPadding` | `--zk-colorbox-padding` | token | rename | 0 |
| `@colorboxPopupPadding` | `--zk-colorbox-popup-padding` | token | rename | 1 |
| `@colorpickerWidth` | `--zk-colorpicker-width` | token | rename | 1 |
| `@colorpickerHeight` | `--zk-colorpicker-height` | token | rename | 1 |
| `@colorpickerPadding` | `--zk-colorpicker-padding` | token | rename | 2 |
| `@colorpickerMainPositionTop` | `--zk-colorpicker-main-position-top` | token | rename | 2 |
| `@colorpickerInfoHeight` | `--zk-colorpicker-info-height` | token | rename | 1 |
| `@colorpickerInfoMarginTop` | `--zk-colorpicker-info-margin-top` | token | rename | 1 |
| `@colorpickerColorWidth` | `--zk-colorpicker-color-width` | token | rename | 1 |
| `@colorpickerColorHeight` | `--zk-colorpicker-color-height` | token | rename | 1 |
| `@colorpickerColorPositionRight` | `--zk-colorpicker-color-position-right` | token | rename | 1 |
| `@colorpickerColorItemWidth` | `--zk-colorpicker-color-item-width` | token | rename | 2 |
| `@colorpickerColorItemHeight` | `--zk-colorpicker-color-item-height` | token | rename | 2 |
| `@colorpickerInputWidth` | `--zk-colorpicker-input-width` | token | rename | 1 |
| `@colorpickerInputHeight` | `--zk-colorpicker-input-height` | token | rename | 1 |
| `@colorpickerRGBPositionTop` | `--zk-colorpicker-rgb-position-top` | token | rename | 1 |
| `@colorpickerHSVPositionTop` | `--zk-colorpicker-hsv-position-top` | token | rename | 1 |
| `@colorpickerHEXPositionTop` | `--zk-colorpicker-hex-position-top` | token | rename | 1 |
| `@colorpickerHEXInputWidth` | `--zk-colorpicker-hex-input-width` | token | rename | 1 |
| `@colorpickerHEXInputHeight` | `--zk-colorpicker-hex-input-height` | token | rename | 1 |
| `@colorpickerButtonWidth` | `--zk-colorpicker-button-width` | token | rename | 1 |
| `@colorpickerButtonPositionTop` | `--zk-colorpicker-button-position-top` | token | rename | 1 |
| `@colorpickerButtonPositionRight` | `--zk-colorpicker-button-position-right` | token | rename | 1 |
| `@colorpaletteWidth` | `--zk-colorpalette-width` | token | rename | 1 |
| `@colorpaletteHeight` | `--zk-colorpalette-height` | token | rename | 1 |
| `@colorpaletteHeadHeight` | `--zk-colorpalette-head-height` | token | rename | 1 |
| `@colorpaletteNewColorWidth` | `--zk-colorpalette-new-color-width` | token | rename | 1 |
| `@colorpaletteNewColorHeight` | `--zk-colorpalette-new-color-height` | token | rename | 1 |
| `@colorpaletteNewColorPositionRight` | `--zk-colorpalette-new-color-position-right` | token | rename | 1 |
| `@colorpaletteInputWidth` | `--zk-colorpalette-input-width` | token | rename | 1 |
| `@colorpaletteInputHeight` | `--zk-colorpalette-input-height` | token | rename | 1 |
| `@colorpaletteColorSize` | `--zk-colorpalette-color-size` | token | rename | 2 |
| `@colorboxIconFontSize` | `--zk-colorbox-icon-font-size` | token | rename | 1 |
| `@colorboxIconPadding` | `--zk-colorbox-icon-padding` | token | rename | 1 |
| `@colorboxIconButtonWidth` | `--zk-colorbox-icon-button-width` | token | rename | 1 |
| `@colorboxIconButtonHeight` | `--zk-colorbox-icon-button-height` | token | rename | 1 |
| `@colorboxIconButtonPositionTop` | `--zk-colorbox-icon-button-position-top` | token | rename | 2 |
| `@paletteiconPositionLeft` | `--zk-paletteicon-position-left` | token | rename | 1 |
| `@pickericonPositionTopLeft` | `--zk-pickericon-position-top-left` | token | rename | 1 |
#### mask and loading

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@maskBackgroundColor` | `--zk-mask-background-color` | token | rename | 5 |
| `@loadingBackgroundColor` | `--zk-loading-background-color` | token | rename | 3 |
| `@loadingTextColor` | `--zk-loading-text-color` | token | rename | 1 |
| `@loadingAnimationDefer` | — | asset-path | no-token | 1 |
| `@loadingAnimationLoad` | — | asset-path | no-token | 4 |
| `@loadingIndicatorPadding` | `--zk-loading-indicator-padding` | token | rename | 1 |
| `@applyLoadingIndicatorPadding` | `--zk-apply-loading-indicator-padding` | token | rename | 1 |
| `@applyLoadingIconSize` | `--zk-apply-loading-icon-size` | token | rename | 3 |
| `@applyLoadingIconPositionLeft` | `--zk-apply-loading-icon-position-left` | token | rename | 1 |
| `@loadingIconSize` | `--zk-loading-icon-size` | token | rename | 3 |
| `@loadingIconMarginBottom` | `--zk-loading-icon-margin-bottom` | token | rename | 1 |
#### scrollbar

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@scrollbarSize` | `--zk-scrollbar-size` | token | rename | 2 |
| `@scrollbarEmbeddedSize` | `--zk-scrollbar-embedded-size` | token | rename | 3 |
| `@scrollbarBarSize` | `--zk-scrollbar-bar-size` | token | rename | 3 |
| `@scrollbarRailSize` | `--zk-scrollbar-rail-size` | token | rename | 3 |
| `@scrollbarEmbeddedColor` | `--zk-scrollbar-embedded-color` | token | rename | 1 |
| `@scrollbarBorderColor` | `--zk-scrollbar-border-color` | token | rename | 1 |
| `@scrollbarBackgroundColor` | `--zk-scrollbar-background-color` | token | rename | 1 |
| `@scrollbarBarBackgroundColor` | `--zk-scrollbar-bar-background-color` | token | rename | 1 |
| `@scrollbarBarHoverBackground` | `--zk-scrollbar-bar-hover-background` | token | rename | 1 |
| `@scrollbarIconDisplay` | `--zk-scrollbar-icon-display` | token | rename | 1 |
| `@scrollbarButtonBackground` | `--zk-scrollbar-button-background` | token | rename | 1 |
| `@scrollbarButtonHoverBackground` | `--zk-scrollbar-button-hover-background` | token | rename | 1 |
| `@scrollbarButtonColor` | `--zk-scrollbar-button-color` | token | rename | 1 |
| `@scrollbarButtonHoverColor` | `--zk-scrollbar-button-hover-color` | token | rename | 1 |
#### drag and drop

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@dragColor` | `--zk-drag-color` | token | rename | 2 |
| `@dragBackgroundColor` | `--zk-drag-background-color` | token | rename | 3 |
| `@dragHoverBackgroundColor` | `--zk-drag-hover-background-color` | token | rename | 1 |
| `@dragAllowIconColor` | `--zk-drag-allow-icon-color` | token | rename | 1 |
| `@dragAllowBorderColor` | `--zk-drag-allow-border-color` | token | rename | 0 |
| `@dragAllowBackgroundColor` | `--zk-drag-allow-background-color` | token | rename | 1 |
| `@dragDisAllowIconColor` | `--zk-drag-disallow-icon-color` | token | rename | 1 |
| `@dragDisAllowBorderColor` | `--zk-drag-disallow-border-color` | token | rename | 0 |
| `@dragDisAllowBackgroundColor` | `--zk-drag-disallow-background-color` | token | rename | 1 |
| `@dropContentPadding` | `--zk-drop-content-padding` | token | rename | 1 |
| `@dropContentLineHeight` | `--zk-drop-content-line-height` | token | rename | 1 |
| `@dropIconSize` | `--zk-drop-icon-size` | token | rename | 4 |
| `@dropIconVerticalAlign` | `--zk-drop-icon-vertical-align` | token | rename | 1 |
#### splitter (hbox, vbox, borderlayout)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@splitterSize` | `--zk-splitter-size` | token | rename | 18 |
| `@splitterBorderColor` | `--zk-splitter-border-color` | token | rename | 4 |
| `@splitterBackgroundColor` | `--zk-splitter-background-color` | token | rename | 3 |
| `@splitterHoverBackgroundColor` | `--zk-splitter-hover-background-color` | token | rename | 5 |
| `@splitterButtonTextSize` | `--zk-splitter-button-text-size` | token | rename | 4 |
| `@splitterButtonTextColors` | `--zk-splitter-button-text-color`<br>`--zk-splitter-button-text-hover-color` | token-list | rename-fan-out | 6 |
| `@splitterDragBackgroundColor` | `--zk-splitter-drag-background-color` | token | rename | 1 |
#### calendar

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@calendarBackgroundColor` | `--zk-calendar-background-color` | token | rename | 3 |
| `@calendarTodayColor` | `--zk-calendar-today-color` | token | rename | 1 |
| `@calendarTitleColor` | `--zk-calendar-title-color` | token | rename | 1 |
| `@calendarTitleHoverColor` | `--zk-calendar-title-hover-color` | token | rename | 1 |
| `@calendarCellColor` | `--zk-calendar-cell-color` | token | rename | 2 |
| `@calendarCellHoverBackgroundColor` | `--zk-calendar-cell-hover-background-color` | token | rename | 2 |
| `@calendarSelectedColor` | `--zk-calendar-selected-color` | token | rename | 2 |
| `@calendarSelectedHoverColor` | `--zk-calendar-selected-hover-color` | token | rename | 3 |
| `@calendarSelectedBackgroundColor` | `--zk-calendar-selected-background-color` | token | rename | 2 |
| `@calendarSelectedHoverBackgroundColor` | `--zk-calendar-selected-hover-background-color` | token | rename | 3 |
| `@calendarWeekTitleColor` | `--zk-calendar-week-title-color` | token | rename | 1 |
| `@weekendColor` | `--zk-weekend-color` | token | rename | 1 |
| `@weekendBackgroundColor` | `--zk-weekend-background-color` | token | rename | 1 |
| `@weekdayColor` | `--zk-weekday-color` | token | rename | 1 |
| `@weekdayBackgroundColor` | `--zk-weekday-background-color` | token | rename | 1 |
| `@weekofyearColor` | `--zk-weekofyear-color` | token | rename | 2 |
| `@weekofyearBackgroundColor` | `--zk-weekofyear-background-color` | token | rename | 2 |
| `@calendarFontSize` | `--zk-calendar-font-size` | token | rename | 1 |
| `@calendarIconFontSize` | `--zk-calendar-icon-font-size` | token | rename | 1 |
| `@calendarTitleFontSize` | `--zk-calendar-title-font-size` | token | rename | 1 |
| `@calendarFontSizeSmall` | `--zk-calendar-font-size-small` | token | rename | 2 |
| `@calendarPadding` | `--zk-calendar-padding` | token | rename | 1 |
| `@calendarTitleLineHeight` | `--zk-calendar-title-line-height` | token | rename | 1 |
| `@calendarTodayTitlePadding` | `--zk-calendar-today-title-padding` | token | rename | 1 |
| `@calendarCellWidth` | `--zk-calendar-cell-width` | token | rename | 1 |
| `@calendarCellHeight` | `--zk-calendar-cell-height` | token | rename | 1 |
| `@calendarLeftRightPosition` | `--zk-calendar-left-right-position` | token | rename | 2 |
| `@calendarTodayMarginTop` | `--zk-calendar-today-margin-top` | token | rename | 1 |
#### popup

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@basePopupZIndex` | `--zk-base-popup-z-index` | token | rename | 6 |
| `@popupPadding` | `--zk-popup-padding` | token | rename | 1 |
| `@popupBorderColor` | `--zk-popup-border-color` | token | rename | 3 |
| `@popupBackgroundColor` | `--zk-popup-background-color` | token | rename | 7 |
#### paging

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@pagingColor` | `--zk-paging-color` | token | rename | 3 |
| `@pagingHeight` | `--zk-paging-height` | token | rename | 1 |
| `@pagingBorderColor` | `--zk-paging-border-color` | token | rename | 8 |
| `@pagingBackgroundColor` | `--zk-paging-background-color` | token | rename | 1 |
| `@pagingItemHoverBackgroundColor` | `--zk-paging-item-hover-background-color` | token | rename | 1 |
| `@pagingItemActiveColor` | `--zk-paging-item-active-color` | token | rename | 1 |
| `@pagingItemActiveBackgroundColor` | `--zk-paging-item-active-background-color` | token | rename | 1 |
| `@pagingItemSelectedColor` | `--zk-paging-item-selected-color` | token | rename | 1 |
| `@pagingItemSelectedBackgroundColor` | `--zk-paging-item-selected-background-color` | token | rename | 1 |
| `@pagingButtonMinWidth` | `--zk-paging-button-min-width` | token | rename | 1 |
| `@pagingButtonHeight` | `--zk-paging-button-height` | token | rename | 1 |
| `@pagingButtonFontSize` | `--zk-paging-button-font-size` | token | rename | 1 |
| `@pagingButtonPadding` | `--zk-paging-button-padding` | token | rename | 1 |
| `@pagingButtonMargin` | `--zk-paging-button-margin` | token | rename | 1 |
| `@pagingButtonFocusBoxShadowColor` | `--zk-paging-button-focus-box-shadow-color` | token | rename | 0 |
| `@pagingButtonFocusBoxShadow` | `--zk-paging-button-focus-box-shadow` | token | rename | 1 |
| `@pagingButtonFocusBorderRadius` | `--zk-paging-button-focus-border-radius` | token | rename | 1 |
| `@pagingIconSize` | `--zk-paging-icon-size` | token | rename | 1 |
| `@pagingIconLineHeight` | `--zk-paging-icon-line-height` | token | rename | 1 |
| `@pagingInputHeight` | `--zk-paging-input-height` | token | rename | 1 |
| `@pagingInputPadding` | `--zk-paging-input-padding` | token | rename | 0 |
| `@pagingOsButtonPadding` | `--zk-paging-os-button-padding` | token | rename | 1 |
#### slider

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@sliderAreaSize` | `--zk-slider-area-size` | token | rename | 4 |
| `@sliderBackgroundColor` | `--zk-slider-background-color` | token | rename | 2 |
| `@sliderAreaBackgroundColor` | `--zk-slider-area-background-color` | token | rename | 2 |
| `@sliderInputColor` | `--zk-slider-input-color` | token | rename | 1 |
| `@sliderTicks` | — | asset-path | no-token | 1 |
| `@sliderPopupFontSize` | `--zk-slider-popup-font-size` | token | rename | 1 |
#### tooltip (used in slider, fisheyebar)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@tooltipColor` | `--zk-tooltip-color` | token | rename | 2 |
| `@tooltipBackgroundColor` | `--zk-tooltip-background-color` | token | rename | 2 |
#### errorbox (input constraint)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@errorboxColor` | `--zk-errorbox-color` | token | rename | 4 |
| `@errorboxBorderColor` | `--zk-errorbox-border-color` | token | rename | 2 |
| `@errorboxBackgroundColor` | `--zk-errorbox-background-color` | token | rename | 7 |
| `@errorboxInsideIconPositionTop` | `--zk-errorbox-inside-icon-position-top` | token | rename | 1 |
| `@errorboxIconPositionTop` | `--zk-errorbox-icon-position-top` | token | rename | 1 |
| `@errorboxUpIconPositionTop` | `--zk-errorbox-up-icon-position-top` | token | rename | 1 |
| `@errorboxContentPadding` | `--zk-errorbox-content-padding` | token | rename | 1 |
#### error (ZK JavaScript debug box)

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@errorPadding` | `--zk-error-padding` | token | rename | 1 |
| `@errorMessageContentPadding` | `--zk-error-message-content-padding` | token | rename | 1 |
| `@errorButtonFontSize` | `--zk-error-button-font-size` | token | rename | 1 |
| `@errorCloseButtonFontSize` | `--zk-error-close-button-font-size` | token | rename | 1 |
| `@errorNumberFontSize` | `--zk-error-number-font-size` | token | rename | 1 |
| `@errorButtonSize` | `--zk-error-button-size` | token | rename | 2 |
| `@errorButtonMarginLeft` | `--zk-error-button-margin-left` | token | rename | 1 |
#### notification

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@notificationInfoColor` | `--zk-notification-info-color` | token | rename | 5 |
| `@notificationWarningColor` | `--zk-notification-warning-color` | token | rename | 5 |
| `@notificationErrorColor` | `--zk-notification-error-color` | token | rename | 5 |
| `@notificationInfoTextColor` | `--zk-notification-info-text-color` | token | rename | 3 |
| `@notificationWarningTextColor` | `--zk-notification-warning-text-color` | token | rename | 3 |
| `@notificationErrorTextColor` | `--zk-notification-error-text-color` | token | rename | 3 |
| `@notificationInfoBackgroundColor` | `--zk-notification-info-background-color` | token | rename | 5 |
| `@notificationWarningBackgroundColor` | `--zk-notification-warning-background-color` | token | rename | 5 |
| `@notificationErrorBackgroundColor` | `--zk-notification-error-background-color` | token | rename | 5 |
| `@notificationContentPadding` | `--zk-notification-content-padding` | token | rename | 1 |
| `@notificationPointerContentHeight` | `--zk-notification-pointer-content-height` | token | rename | 2 |
| `@notificationPointerContentPadding` | `--zk-notification-pointer-content-padding` | token | rename | 1 |
| `@notificationCloseFontSize` | `--zk-notification-close-font-size` | token | rename | 2 |
| `@notificationCloseIconSize` | `--zk-notification-close-icon-size` | token | rename | 2 |
#### progressmeter

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@progressmeterBorderColor` | `--zk-progressmeter-border-color` | token | rename | 1 |
| `@progressmeterBackgroundColor` | `--zk-progressmeter-background-color` | token | rename | 1 |
| `@progressmeterBackgroundImage` | — | asset-path | no-token | 1 |
#### loadingbar

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@loadingbarColor` | `--zk-loadingbar-color` | token | rename | 1 |
| `@loadingbarSecondaryColor` | `--zk-loadingbar-secondary-color` | token | rename | 1 |
| `@loadingbarHeight` | `--zk-loadingbar-height` | token | rename | 1 |
#### tabbox

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@tabboxBackgroundColor` | `--zk-tabbox-background-color` | token | rename | 1 |
| `@tabboxIconPadding` | `--zk-tabbox-icon-padding` | token | rename | 1 |
| `@tabboxIconVerticalPadding` | `--zk-tabbox-icon-vertical-padding` | token | rename | 1 |
| `@tabboxIconSize` | `--zk-tabbox-icon-size` | token | rename | 4 |
| `@tabboxTabsBackgroundColor` | `--zk-tabbox-tabs-background-color` | token | rename | 2 |
| `@tabboxToolbarBackgroundColor` | `--zk-tabbox-toolbar-background-color` | token | rename | 1 |
| `@tabboxTabColor` | `--zk-tabbox-tab-color` | token | rename | 1 |
| `@tabboxTabBackgroundColor` | `--zk-tabbox-tab-background-color` | token | rename | 1 |
| `@tabboxTabHoverColor` | `--zk-tabbox-tab-hover-color` | token | rename | 1 |
| `@tabboxTabHoverBackgroundColor` | `--zk-tabbox-tab-hover-background-color` | token | rename | 1 |
| `@tabboxTabButtonFontSize` | `--zk-tabbox-tab-button-font-size` | token | rename | 1 |
| `@tabboxTabButtonColor` | `--zk-tabbox-tab-button-color` | token | rename | 1 |
| `@tabboxTabButtonHoverColor` | `--zk-tabbox-tab-button-hover-color` | token | rename | 1 |
| `@tabboxTabButtonTextSpacing` | `--zk-tabbox-tab-button-text-spacing` | token | rename | 2 |
| `@tabboxTabSeparatorColor` | `--zk-tabbox-tab-separator-color` | token | rename | 5 |
| `@tabboxTabMinHeight` | `--zk-tabbox-tab-min-height` | token | rename | 3 |
| `@tabboxTabPadding` | `--zk-tabbox-tab-padding` | token | rename | 1 |
| `@tabboxTabVerticalPadding` | `--zk-tabbox-tab-vertical-padding` | token | rename | 1 |
| `@tabboxTabFontSize` | `--zk-tabbox-tab-font-size` | token | rename | 1 |
| `@tabboxTabAccordionButtonRight` | `--zk-tabbox-tab-accordion-button-right` | token | rename | 1 |
| `@tabboxSelectedRadius` | `--zk-tabbox-selected-radius` | token | rename | 4 |
| `@tabboxSelectedColor` | `--zk-tabbox-selected-color` | token | rename | 2 |
| `@tabboxSelectedBorderColor` | `--zk-tabbox-selected-border-color` | token | rename | 4 |
| `@tabboxSelectedHoverColor` | `--zk-tabbox-selected-hover-color` | token | rename | 2 |
| `@tabboxSelectedBackgroundColor` | `--zk-tabbox-selected-background-color` | token | rename | 1 |
| `@tabboxSelectedHoverBackgroundColor` | `--zk-tabbox-selected-hover-background-color` | token | rename | 1 |
| `@tabboxScrollIconColor` | `--zk-tabbox-scroll-icon-color` | token | rename | 1 |
| `@tabboxScrollIconHoverColor` | `--zk-tabbox-scroll-icon-hover-color` | token | rename | 1 |
#### menu

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@menuBackground` | `--zk-menu-background` | token | rename | 1 |
| `@menuItemColor` | `--zk-menu-item-color` | token | rename | 1 |
| `@menuItemBackground` | `--zk-menu-item-background` | token | rename | 2 |
| `@menuItemHoverColor` | `--zk-menu-item-hover-color` | token | rename | 2 |
| `@menuItemHoverBackground` | `--zk-menu-item-hover-background` | token | rename | 2 |
| `@menuItemActiveColor` | `--zk-menu-item-active-color` | token | rename | 3 |
| `@menuItemActiveBackground` | `--zk-menu-item-active-background` | token | rename | 3 |
| `@menuSeparatorBorderColor` | `--zk-menu-separator-border-color` | token | rename | 2 |
| `@menuSeparatorBackgroundColor` | `--zk-menu-separator-background-color` | token | rename | 1 |
| `@menuPopupBackground` | `--zk-menu-popup-background` | token | rename | 1 |
| `@menuPopupItemColor` | `--zk-menu-popup-item-color` | token | rename | 1 |
| `@menuPopupItemBackground` | `--zk-menu-popup-item-background` | token | rename | 2 |
| `@menuPopupItemHoverColor` | `--zk-menu-popup-item-hover-color` | token | rename | 1 |
| `@menuPopupItemHoverBackground` | `--zk-menu-popup-item-hover-background` | token | rename | 1 |
| `@menuPopupItemActiveColor` | `--zk-menu-popup-item-active-color` | token | rename | 1 |
| `@menuPopupItemActiveBackground` | `--zk-menu-popup-item-active-background` | token | rename | 1 |
| `@menuPopupSeparatorBorder` | `--zk-menu-popup-separator-border` | token | rename | 1 |
| `@menuImageSize` | `--zk-menu-image-size` | token | rename | 4 |
| `@menuCheckedColor` | `--zk-menu-checked-color` | token | rename | 1 |
| `@menuCheckedBackgroundColor` | `--zk-menu-checked-background-color` | token | rename | 1 |
| `@menuScrollableIconColors` | `--zk-menu-scrollable-icon-color`<br>`--zk-menu-scrollable-icon-hover-color` | token-list | rename-fan-out | 2 |
| `@menubarPadding` | `--zk-menubar-padding` | token | rename | 1 |
| `@menubarHorizontalMargin` | `--zk-menubar-horizontal-margin` | token | rename | 1 |
| `@menubarHorizontalSeparatorLineHeight` | `--zk-menubar-horizontal-separator-line-height` | token | rename | 1 |
| `@menubarHorizontalSeparatorMargin` | `--zk-menubar-horizontal-separator-margin` | token | rename | 1 |
| `@menuTextFontSize` | `--zk-menu-text-font-size` | token | rename | 1 |
| `@menuIconSize` | `--zk-menu-icon-size` | token | rename | 1 |
| `@menuContentPadding` | `--zk-menu-content-padding` | token | rename | 1 |
| `@menuContentLineHeight` | `--zk-menu-content-line-height` | token | rename | 1 |
| `@menuContentMinHeight` | `--zk-menu-content-min-height` | token | rename | 1 |
| `@menuIconPositionTop` | `--zk-menu-icon-position-top` | token | rename | 1 |
| `@menuIconMarginRight` | `--zk-menu-icon-margin-right` | token | rename | 1 |
| `@menuContentPaddingRight` | `--zk-menu-content-padding-right` | token | rename | 1 |
| `@menuPopupItemIconSize` | `--zk-menu-popup-item-icon-size` | token | rename | 1 |
| `@menuPopupItemIconPositionTop` | `--zk-menu-popup-item-icon-position-top` | token | rename | 1 |
| `@menuPopupItemIconPositionLeft` | `--zk-menu-popup-item-icon-position-left` | token | rename | 1 |
#### navbar

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@navImageSize` | `--zk-nav-image-size` | token | rename | 3 |
| `@navColor` | `--zk-nav-color` | token | rename | 1 |
| `@navHoverColor` | `--zk-nav-hover-color` | token | rename | 2 |
| `@navBorderColor` | `--zk-nav-border-color` | token | rename | 4 |
| `@navBackgroundColor` | `--zk-nav-background-color` | token | rename | 2 |
| `@navHoverBackgroundColor` | `--zk-nav-hover-background-color` | token | rename | 2 |
| `@navSelectedColor` | `--zk-nav-selected-color` | token | rename | 2 |
| `@navSelectedBackgroundColor` | `--zk-nav-selected-background-color` | token | rename | 2 |
| `@navPopupColor` | `--zk-nav-popup-color` | token | rename | 2 |
| `@navPopupHoverColor` | `--zk-nav-popup-hover-color` | token | rename | 1 |
| `@navPopupBackgroundColor` | `--zk-nav-popup-background-color` | token | rename | 3 |
| `@navPopupHoverBackgroundColor` | `--zk-nav-popup-hover-background-color` | token | rename | 1 |
| `@navPopupSelectedColor` | `--zk-nav-popup-selected-color` | token | rename | 1 |
| `@navPopupSelectedBackgroundColor` | `--zk-nav-popup-selected-background-color` | token | rename | 1 |
| `@navPopupPadding` | `--zk-nav-popup-padding` | token | rename | 1 |
| `@navSeparatorColor` | `--zk-nav-separator-color` | token | rename | 0 |
| `@navCollapsedWidth` | `--zk-nav-collapsed-width` | token | rename | 2 |
| `@navBadgeTextColor` | `--zk-nav-badge-text-color` | token | rename | 1 |
| `@navBadgeBackgroundColor` | `--zk-nav-badge-background-color` | token | rename | 1 |
| `@navbarPadding` | `--zk-navbar-padding` | token | rename | 1 |
| `@navbarHorizontalPadding` | `--zk-navbar-horizontal-padding` | token | rename | 1 |
| `@navbarHorizontalLineHeight` | `--zk-navbar-horizontal-line-height` | token | rename | 1 |
| `@navContentPadding` | `--zk-nav-content-padding` | token | rename | 1 |
| `@navIconMarginRight` | `--zk-nav-icon-margin-right` | token | rename | 1 |
| `@navTextFontSize` | `--zk-nav-text-font-size` | token | rename | 1 |
| `@navInfoPositionTop` | `--zk-nav-info-position-top` | token | rename | 1 |
| `@navInfoPositionRight` | `--zk-nav-info-position-right` | token | rename | 1 |
| `@navTextPopupHeight` | `--zk-nav-text-popup-height` | token | rename | 1 |
| `@navTextPopupPadding` | `--zk-nav-text-popup-padding` | token | rename | 1 |
| `@navTextPopupLineHeight` | `--zk-nav-text-popup-line-height` | token | rename | 1 |
| `@navbarCollapsedInfoPositionTop` | `--zk-navbar-collapsed-info-position-top` | token | rename | 1 |
| `@navitemFocusBoxShadowColor` | `--zk-navitem-focus-box-shadow-color` | token | rename | 0 |
| `@navitemFocusBoxShadow` | `--zk-navitem-focus-box-shadow` | token | rename | 1 |
#### chosenbox

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@chosenboxIconSize` | `--zk-chosenbox-icon-size` | token | rename | 4 |
| `@chosenboxItemSize` | `--zk-chosenbox-item-size` | token | rename | 1 |
| `@chosenboxItemColor` | `--zk-chosenbox-item-color` | token | rename | 2 |
| `@chosenboxItemBorderColor` | `--zk-chosenbox-item-border-color` | token | rename | 1 |
| `@chosenboxItemBackgroundColor` | `--zk-chosenbox-item-background-color` | token | rename | 1 |
| `@chosenboxItemFocusBackgroundColor` | `--zk-chosenbox-item-focus-background-color` | token | rename | 1 |
| `@chosenboxItemDisabledColor` | `--zk-chosenbox-item-disabled-color` | token | rename | 1 |
| `@chosenboxItemDisabledBorderColor` | `--zk-chosenbox-item-disabled-border-color` | token | rename | 2 |
| `@chosenboxItemDisabledBackgroundColor` | `--zk-chosenbox-item-disabled-background-color` | token | rename | 1 |
| `@chosenboxPopupHoverBackgroundColor` | `--zk-chosenbox-popup-hover-background-color` | token | rename | 1 |
| `@chosenboxCreateIconSize` | `--zk-chosenbox-create-icon-size` | token | rename | 3 |
| `@chosenboxCreateIconColor` | `--zk-chosenbox-create-icon-color` | token | rename | 1 |
| `@chosenboxPadding` | `--zk-chosenbox-padding` | token | rename | 1 |
| `@chosenboxMinHeight` | `--zk-chosenbox-min-height` | token | rename | 1 |
| `@chosenboxItemMargin` | `--zk-chosenbox-item-margin` | token | rename | 1 |
| `@chosenboxItemPadding` | `--zk-chosenbox-item-padding` | token | rename | 1 |
| `@chosenboxItemContentPadding` | `--zk-chosenbox-item-content-padding` | token | rename | 1 |
| `@chosenboxItemContentMarginRight` | `--zk-chosenbox-item-content-margin-right` | token | rename | 1 |
| `@chosenboxButtonPositionTop` | `--zk-chosenbox-button-position-top` | token | rename | 1 |
| `@chosenboxButtonPositionRight` | `--zk-chosenbox-button-position-right` | token | rename | 1 |
| `@chosenboxInputWidth` | `--zk-chosenbox-input-width` | token | rename | 1 |
| `@chosenboxInputHeight` | `--zk-chosenbox-input-height` | token | rename | 1 |
| `@chosenboxInputPadding` | `--zk-chosenbox-input-padding` | token | rename | 0 |
| `@chosenboxPopupPadding` | `--zk-chosenbox-popup-padding` | token | rename | 1 |
| `@chosenboxOptionPadding` | `--zk-chosenbox-option-padding` | token | rename | 2 |
| `@chosenboxOptionMinHeight` | `--zk-chosenbox-option-min-height` | token | rename | 2 |
#### biglistbox

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@biglistboxFrozenBackgroundColor` | `--zk-biglistbox-frozen-background-color` | token | rename | 1 |
| `@biglistboxFrozenGhostBackgroundColor` | `--zk-biglistbox-frozen-ghost-background-color` | token | rename | 1 |
| `@biglistboxScrollBarBorderColor` | `--zk-biglistbox-scrollbar-border-color` | token | rename | 8 |
| `@biglistboxScrollBarTextColor` | `--zk-biglistbox-scrollbar-text-color` | token | rename | 3 |
| `@biglistboxScrollBarEndBarBackgroundColor` | `--zk-biglistbox-scrollbar-end-bar-background-color` | token | rename | 4 |
| `@biglistboxScrollBarHoverBackgroundColor` | `--zk-biglistbox-scrollbar-hover-background-color` | token | rename | 5 |
| `@biglistboxScrollBarActiveBackgroundColor` | `--zk-biglistbox-scrollbar-active-background-color` | token | rename | 7 |
| `@biglistboxScrollBarActiveBorderColor` | `--zk-biglistbox-scrollbar-active-border-color` | token | rename | 7 |
| `@biglistboxScrollBarHoverBorderColor` | `--zk-biglistbox-scrollbar-hover-border-color` | token | rename | 5 |
| `@biglistboxOuterPadding` | `--zk-biglistbox-outer-padding` | token | rename | 1 |
| `@biglistboxLineHeight` | `--zk-biglistbox-line-height` | token | rename | 2 |
| `@biglistboxSize` | `--zk-biglistbox-size` | token | rename | 11 |
| `@biglistboxVerticalTickWidth` | `--zk-biglistbox-vertical-tick-width` | token | rename | 1 |
| `@biglistboxVerticalTickHeight` | `--zk-biglistbox-vertical-tick-height` | token | rename | 1 |
| `@biglistboxVerticalTickPositionBottom` | `--zk-biglistbox-vertical-tick-position-bottom` | token | rename | 1 |
| `@biglistboxVerticalTickBeforePositionLeft` | `--zk-biglistbox-vertical-tick-before-position-left` | token | rename | 1 |
| `@biglistboxWscrollVerticalPositionRight` | `--zk-biglistbox-wscroll-vertical-position-right` | token | rename | 2 |
| `@biglistboxWscrollDragSize` | `--zk-biglistbox-wscroll-drag-size` | token | rename | 2 |
| `@biglistboxWscrollButtonSize` | `--zk-biglistbox-wscroll-button-size` | token | rename | 6 |
| `@biglistboxWscrollButtonBeforePositionRight` | `--zk-biglistbox-wscroll-button-before-position-right` | token | rename | 1 |
| `@biglistboxWscrollButtonBodySize` | `--zk-biglistbox-wscroll-button-body-size` | token | rename | 2 |
| `@biglistboxWscrollButtonBodyPositionTop` | `--zk-biglistbox-wscroll-button-body-position-top` | token | rename | 2 |
| `@biglistboxWscrollButtonBodyBeforePositionTop` | `--zk-biglistbox-wscroll-button-body-before-position-top` | token | rename | 2 |
| `@biglistboxWscrollButtonBodyHoverPositionTop` | `--zk-biglistbox-wscroll-button-body-hover-position-top` | token | rename | 2 |
| `@biglistboxWscrollButtonBodyBeforePositionRight` | `--zk-biglistbox-wscroll-button-body-before-position-right` | token | rename | 1 |
| `@biglistboxWscrollButtonUpHoverPositionTop` | `--zk-biglistbox-wscroll-button-up-hover-position-top` | token | rename | 2 |
| `@biglistboxWscrollHorizontalPosWidth` | `--zk-biglistbox-wscroll-horizontal-pos-width` | token | rename | 1 |
#### rating

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@ratingIcon` | `--zk-rating-icon` | token | rename | 1 |
| `@ratingIconSize` | `--zk-rating-icon-size` | token | rename | 2 |
| `@ratingIconFontSize` | `--zk-rating-icon-font-size` | token | rename | 1 |
| `@ratingIconPadding` | `--zk-rating-icon-padding` | token | rename | 1 |
| `@ratingIconHover` | `--zk-rating-icon-hover` | token | rename | 1 |
| `@ratingIconHoverTextShadow` | `--zk-rating-icon-hover-text-shadow` | token | rename | 1 |
| `@ratingIconSelected` | `--zk-rating-icon-selected` | token | rename | 1 |
| `@ratingDisabled` | `--zk-rating-disabled` | token | rename | 0 |
| `@ratingDisabledSelected` | `--zk-rating-disabled-selected` | token | rename | 0 |
#### goldenlayout

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@goldenLayoutBackgroundColor` | `--zk-golden-layout-background-color` | token | rename | 2 |
| `@goldenLayoutBorderColor` | `--zk-golden-layout-border-color` | token | rename | 10 |
| `@goldenLayoutHeaderColor` | `--zk-golden-layout-header-color` | token | rename | 4 |
| `@goldenLayoutHeaderHoverColor` | `--zk-golden-layout-header-hover-color` | token | rename | 4 |
| `@goldenLayoutHeaderActiveHoverColor` | `--zk-golden-layout-header-active-hover-color` | token | rename | 2 |
| `@goldenLayoutHeaderBackgroundColor` | `--zk-golden-layout-header-background-color` | token | rename | 4 |
| `@goldenLayoutSelectedBorderColor` | `--zk-golden-layout-selected-border-color` | token | rename | 8 |
| `@goldenLayoutSelectedBackgroundColor` | `--zk-golden-layout-selected-background-color` | token | rename | 2 |
| `@goldenLayoutPanelBackgroundColor` | `--zk-golden-layout-panel-background-color` | token | rename | 6 |
| `@goldenLayoutProxyBoxShadowColor` | `--zk-golden-layout-proxy-box-shadow-color` | token | rename | 4 |
| `@goldenLayoutDroptargetIndicatorBorderColor` | `--zk-golden-layout-droptarget-indicator-border-color` | token | rename | 2 |
| `@goldenLayoutDroptargetIndicatorBackgroundColor` | `--zk-golden-layout-droptarget-indicator-background-color` | token | rename | 2 |
| `@goldenLayoutSplitterDragging` | `--zk-golden-layout-splitter-dragging` | token | rename | 4 |
| `@goldenLayoutLineHeight` | `--zk-golden-layout-line-height` | token | rename | 8 |
| `@goldenLayoutMinHeight` | `--zk-golden-layout-min-height` | token | rename | 2 |
| `@goldenLayoutFontSize` | `--zk-golden-layout-font-size` | token | rename | 12 |
| `@goldenLayoutTabPadding` | `--zk-golden-layout-tab-padding` | token | rename | 4 |
| `@goldenLayoutCloseTabTop` | `--zk-golden-layout-close-tab-top` | token | rename | 2 |
| `@goldenLayoutActiveTabMargin` | `--zk-golden-layout-active-tab-margin` | token | rename | 2 |
| `@goldenLayoutControlPadding` | `--zk-golden-layout-control-padding` | token | rename | 2 |
| `@goldenLayoutControlLiPadding` | `--zk-golden-layout-control-li-padding` | token | rename | 2 |
| `@goldenLayoutDropTabAfterMargin` | `--zk-golden-layout-drop-tab-after-margin` | token | rename | 2 |
#### organigram

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@organigramLine` | `--zk-organigram-line` | token | rename | 3 |
| `@orgnodePadding` | `--zk-orgnode-padding` | token | rename | 1 |
| `@orgnodeColor` | `--zk-orgnode-color` | token | rename | 3 |
| `@orgnodeBackgroundColor` | `--zk-orgnode-background-color` | token | rename | 1 |
| `@orgnodeHoverBackgroundColor` | `--zk-orgnode-hover-background-color` | token | rename | 1 |
| `@orgnodeSelectedColor` | `--zk-orgnode-selected-color` | token | rename | 1 |
| `@orgnodeSelectedBackgroundColor` | `--zk-orgnode-selected-background-color` | token | rename | 1 |
| `@orgnodeDisabledColor` | `--zk-orgnode-disabled-color` | token | rename | 1 |
| `@orgnodeDisabledBackgroundColor` | `--zk-orgnode-disabled-background-color` | token | rename | 1 |
| `@orgnodeBorder` | `--zk-orgnode-border` | token | rename | 1 |
| `@orgnodeBorderRadius` | `--zk-orgnode-border-radius` | token | rename | 1 |
#### signature

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@signatureBorderColor` | `--zk-signature-border-color` | token | rename | 2 |
| `@signatureBorderRadius` | `--zk-signature-border-radius` | token | rename | 4 |
| `@signatureToolbarRight` | `--zk-signature-toolbar-right` | token | rename | 2 |
| `@signatureToolbarBottom` | `--zk-signature-toolbar-bottom` | token | rename | 2 |
| `@signatureToolbarButtonSpacing` | `--zk-signature-toolbar-button-spacing` | token | rename | 2 |
| `@signatureToolbarButtonIconFontSize` | `--zk-signature-toolbar-button-icon-font-size` | token | rename | 2 |
#### drawer

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@drawerMaskBackgroundColor` | `--zk-drawer-mask-background-color` | token | rename | 1 |
| `@drawerMaskOpacity` | `--zk-drawer-mask-opacity` | token | rename | 1 |
| `@drawerTitleTextColor` | `--zk-drawer-title-text-color` | token | rename | 1 |
| `@drawerTitleLineColor` | `--zk-drawer-title-line-color` | token | rename | 1 |
| `@drawerTitlePadding` | `--zk-drawer-title-padding` | token | rename | 1 |
| `@drawerTitleFontSize` | `--zk-drawer-title-font-size` | token | rename | 1 |
| `@drawerCloseButtonSize` | `--zk-drawer-close-button-size` | token | rename | 3 |
| `@drawerCloseButtonRight` | `--zk-drawer-close-button-right` | token | rename | 1 |
| `@drawerCloseButtonTop` | `--zk-drawer-close-button-top` | token | rename | 1 |
| `@drawerBackgroundColor` | `--zk-drawer-background-color` | token | rename | 1 |
| `@drawerShadowColor` | `--zk-drawer-shadow-color` | token | rename | 4 |
| `@drawerContainerPadding` | `--zk-drawer-container-padding` | token | rename | 1 |
#### rangeslider

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@rangesliderTrackColor` | `--zk-rangeslider-track-color` | token | rename | 2 |
| `@rangesliderEmptyBackgroundColor` | `--zk-rangeslider-empty-background-color` | token | rename | 1 |
| `@rangesliderShadowColor` | `--zk-rangeslider-shadow-color` | token | rename | 1 |
| `@rangesliderButtonSize` | `--zk-rangeslider-button-size` | token | rename | 2 |
| `@rangesliderButtonBorderWidth` | `--zk-rangeslider-button-border-width` | token | rename | 1 |
| `@rangesliderButtonColor` | `--zk-rangeslider-button-color` | token | rename | 4 |
| `@rangesliderButtonHoverColor` | `--zk-rangeslider-button-hover-color` | token | rename | 2 |
| `@rangesliderButtonActiveColor` | `--zk-rangeslider-button-active-color` | token | rename | 2 |
| `@rangesliderButtonFocusBorderColor` | `--zk-rangeslider-button-focus-border-color` | token | rename | 1 |
| `@rangesliderDisabledTrackColor` | `--zk-rangeslider-disabled-track-color` | token | rename | 2 |
| `@rangesliderDisabledButtonColor` | `--zk-rangeslider-disabled-button-color` | token | rename | 4 |
| `@rangesliderBorderRadius` | `--zk-rangeslider-border-radius` | token | rename | 1 |
| `@rangesliderTooltipBorderRadius` | `--zk-rangeslider-tooltip-border-radius` | token | rename | 1 |
| `@rangesliderTooltipBackgroundColor` | `--zk-rangeslider-tooltip-background-color` | token | rename | 1 |
| `@rangesliderDisabledTooltipBackgroundColor` | `--zk-rangeslider-disabled-tooltip-background-color` | token | rename | 1 |
| `@rangesliderInnerSize` | `--zk-rangeslider-inner-size` | token | rename | 2 |
| `@rangesliderDotSize` | `--zk-rangeslider-dot-size` | token | rename | 2 |
| `@rangesliderDotBorderWidth` | `--zk-rangeslider-dot-border-width` | token | rename | 1 |
| `@rangesliderLabelFontSize` | `--zk-rangeslider-label-font-size` | token | rename | 2 |
| `@rangesliderHorizontalButtonMarginTop` | `--zk-rangeslider-horizontal-button-margin-top` | token | rename | 4 |
| `@rangesliderHorizontalButtonMarginLeft` | `--zk-rangeslider-horizontal-button-margin-left` | token | rename | 4 |
| `@rangesliderHorizontalTooltipPositionTop` | `--zk-rangeslider-horizontal-tooltip-position-top` | token | rename | 2 |
| `@rangesliderHorizontalTooltipPadding` | `--zk-rangeslider-horizontal-tooltip-padding` | token | rename | 2 |
| `@rangesliderHorizontalMarkDotPositionTop` | `--zk-rangeslider-horizontal-mark-dot-position-top` | token | rename | 2 |
| `@rangesliderHorizontalMarkLabelPositionTop` | `--zk-rangeslider-horizontal-mark-label-position-top` | token | rename | 4 |
| `@rangesliderVerticalTooltipPositionLeft` | `--zk-rangeslider-vertical-tooltip-position-left` | token | rename | 2 |
| `@rangesliderVerticalTooltipPadding` | `--zk-rangeslider-vertical-tooltip-padding` | token | rename | 2 |
#### multislider

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@multisliderTrackColor` | `--zk-multislider-track-color` | token | rename | 1 |
| `@multisliderShadowColor` | `--zk-multislider-shadow-color` | token | rename | 1 |
| `@multisliderButtonSize` | `--zk-multislider-button-size` | token | rename | 2 |
| `@multisliderButtonBorderWidth` | `--zk-multislider-button-border-width` | token | rename | 1 |
| `@multisliderButtonColor` | `--zk-multislider-button-color` | token | rename | 3 |
| `@multisliderButtonHoverColor` | `--zk-multislider-button-hover-color` | token | rename | 2 |
| `@multisliderButtonActiveColor` | `--zk-multislider-button-active-color` | token | rename | 2 |
| `@multisliderButtonFocusBorderColor` | `--zk-multislider-button-focus-border-color` | token | rename | 1 |
| `@multisliderButtonColor2` | `--zk-multislider-button-color2` | token | rename | 3 |
| `@multisliderButtonHoverColor2` | `--zk-multislider-button-hover-color2` | token | rename | 2 |
| `@multisliderButtonActiveColor2` | `--zk-multislider-button-active-color2` | token | rename | 2 |
| `@multisliderBorderRadius` | `--zk-multislider-border-radius` | token | rename | 1 |
| `@multisliderTooltipBackgroundColor` | `--zk-multislider-tooltip-background-color` | token | rename | 1 |
| `@multisliderDisabledTooltipBackgroundColor` | `--zk-multislider-disabled-tooltip-background-color` | token | rename | 1 |
| `@multisliderInnerSize` | `--zk-multislider-inner-size` | token | rename | 2 |
| `@multisliderDisabledTrackColor` | `--zk-multislider-disabled-track-color` | token | rename | 1 |
| `@multisliderDisabledButtonColor` | `--zk-multislider-disabled-button-color` | token | rename | 3 |
| `@multisliderDisabledButtonColor2` | `--zk-multislider-disabled-button-color2` | token | rename | 3 |
#### inputgroup

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@inputgroupTextBackgroundColor` | `--zk-inputgroup-text-background-color` | token | rename | 1 |
#### pdfviewer

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@pdfviewerContainerBackgroundColor` | `--zk-pdfviewer-container-background-color` | token | rename | 1 |
| `@pdfviewerSelectionBackgroundColor` | `--zk-pdfviewer-selection-background-color` | token | rename | 1 |
| `@pdfviewerToolbarBackgroundColor` | `--zk-pdfviewer-toolbar-background-color` | token | rename | 1 |
| `@pdfviewerToolbarBorderColor` | `--zk-pdfviewer-toolbar-border-color` | token | rename | 1 |
| `@pdfviewerToolbarBorderRadius` | `--zk-pdfviewer-toolbar-border-radius` | token | rename | 1 |
| `@pdfviewerToolbarPadding` | `--zk-pdfviewer-toolbar-padding` | token | rename | 1 |
| `@pdfviewerToolbarButtonSize` | `--zk-pdfviewer-toolbar-button-size` | token | rename | 2 |
| `@pdfviewerToolbarMargins` | `--zk-pdfviewer-toolbar-margins` | token | rename | 4 |
| `@pdfviewerToolbarButtonColor` | `--zk-pdfviewer-toolbar-button-color` | token | rename | 1 |
| `@pdfviewerToolbarButtonBackgroundColor` | `--zk-pdfviewer-toolbar-button-background-color` | token | rename | 2 |
| `@pdfviewerToolbarButtonHoverColor` | `--zk-pdfviewer-toolbar-button-hover-color` | token | rename | 1 |
| `@pdfviewerToolbarButtonHoverBackgroundColor` | `--zk-pdfviewer-toolbar-button-hover-background-color` | token | rename | 1 |
| `@pdfviewerToolbarButtonActiveColor` | `--zk-pdfviewer-toolbar-button-active-color` | token | rename | 1 |
| `@pdfviewerToolbarButtonActiveBackgroundColor` | `--zk-pdfviewer-toolbar-button-active-background-color` | token | rename | 1 |
| `@pdfviewerToolbarSeparatorColor` | `--zk-pdfviewer-toolbar-separator-color` | token | rename | 1 |
| `@pdfviewerToolbarSeparatorHeight` | `--zk-pdfviewer-toolbar-separator-height` | token | rename | 1 |
| `@pdfviewerToolbarPageActiveWidth` | `--zk-pdfviewer-toolbar-page-active-width` | token | rename | 1 |
#### searchbox

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@searchboxHeight` | `--zk-searchbox-height` | token | rename | 4 |
| `@searchboxFontSize` | `--zk-searchbox-font-size` | token | rename | 3 |
| `@searchboxPadding` | `--zk-searchbox-padding` | token | rename | 2 |
| `@searchboxBorderColor` | `--zk-searchbox-border-color` | token | rename | 1 |
| `@searchboxColor` | `--zk-searchbox-color` | token | rename | 2 |
| `@searchboxPlaceholderColor` | `--zk-searchbox-placeholder-color` | token | rename | 5 |
| `@searchboxIconColor` | `--zk-searchbox-icon-color` | token | rename | 1 |
| `@searchboxIconRight` | `--zk-searchbox-icon-right` | token | rename | 4 |
| `@searchboxIconSize` | `--zk-searchbox-icon-size` | token | rename | 4 |
| `@searchboxBackgroundColor` | `--zk-searchbox-background-color` | token | rename | 1 |
| `@searchboxBorderRadius` | `--zk-searchbox-border-radius` | token | rename | 1 |
| `@searchboxHoverBorderColor` | `--zk-searchbox-hover-border-color` | token | rename | 1 |
| `@searchboxFocusBorderColor` | `--zk-searchbox-focus-border-color` | token | rename | 1 |
| `@searchboxActiveBorderColor` | `--zk-searchbox-active-border-color` | token | rename | 1 |
| `@searchboxActiveBackgroundColor` | `--zk-searchbox-active-background-color` | token | rename | 1 |
| `@searchboxActiveColor` | `--zk-searchbox-active-color` | token | rename | 2 |
| `@searchboxActiveIconColor` | `--zk-searchbox-active-icon-color` | token | rename | 1 |
| `@searchboxDisableBorderColor` | `--zk-searchbox-disable-border-color` | token | rename | 1 |
| `@searchboxDisableBackgroundColor` | `--zk-searchbox-disable-background-color` | token | rename | 1 |
| `@searchboxDisableColor` | `--zk-searchbox-disable-color` | token | rename | 1 |
| `@searchboxDisableIconColor` | `--zk-searchbox-disable-icon-color` | token | rename | 2 |
| `@searchboxPopupBackgroundColor` | `--zk-searchbox-popup-background-color` | token | rename | 1 |
| `@searchboxPopupBorderColor` | `--zk-searchbox-popup-border-color` | token | rename | 1 |
| `@searchboxPopupBorderRadius` | `--zk-searchbox-popup-border-radius` | token | rename | 1 |
| `@searchboxPopupShadow` | `--zk-searchbox-popup-shadow` | token | rename | 1 |
| `@searchboxPopupItemBorderRadius` | `--zk-searchbox-popup-item-border-radius` | token | rename | 1 |
| `@searchboxPopupItemHoverBackgroundColor` | `--zk-searchbox-popup-item-hover-background-color` | token | rename | 1 |
| `@searchboxPopupItemHoverColor` | `--zk-searchbox-popup-item-hover-color` | token | rename | 1 |
| `@searchboxPopupItemActiveBackgroundColor` | `--zk-searchbox-popup-item-active-background-color` | token | rename | 1 |
| `@searchboxPopupItemActiveColor` | `--zk-searchbox-popup-item-active-color` | token | rename | 1 |
| `@searchboxPopupItemSelectedColor` | `--zk-searchbox-popup-item-selected-color` | token | rename | 2 |
| `@searchboxPopupItemPadding` | `--zk-searchbox-popup-item-padding` | token | rename | 1 |
| `@searchboxPopupItemCheckSize` | `--zk-searchbox-popup-item-check-size` | token | rename | 3 |
| `@searchboxPopupItemCheckMarginRight` | `--zk-searchbox-popup-item-check-margin-right` | token | rename | 1 |
| `@searchboxPopupItemCheckBorderColor` | `--zk-searchbox-popup-item-check-border-color` | token | rename | 1 |
| `@searchboxPopupItemCheckBorderRadius` | `--zk-searchbox-popup-item-check-border-radius` | token | rename | 1 |
| `@searchboxPopupItemCheckBackgroundColor` | `--zk-searchbox-popup-item-check-background-color` | token | rename | 1 |
| `@searchboxPopupItemCheckCheckedColor` | `--zk-searchbox-popup-item-check-checked-color` | token | rename | 1 |
| `@searchboxPopupItemCheckCheckedBackgroundColor` | `--zk-searchbox-popup-item-check-checked-background-color` | token | rename | 1 |
#### stepbar

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@stepbarPadding` | `--zk-stepbar-padding` | token | rename | 12 |
| `@stepbarSeparatorSize` | `--zk-stepbar-separator-size` | token | rename | 7 |
| `@stepSize` | `--zk-step-size` | token | rename | 10 |
| `@stepFontSize` | `--zk-step-font-size` | token | rename | 1 |
| `@stepIconErrorSize` | `--zk-step-icon-error-size` | token | rename | 1 |
| `@stepIconCompleteSize` | `--zk-step-icon-complete-size` | token | rename | 1 |
| `@stepIconEmptyBorderWidth` | `--zk-step-icon-empty-border-width` | token | rename | 1 |
| `@stepInactiveColor` | `--zk-step-inactive-color` | token | rename | 5 |
| `@stepActiveColor` | `--zk-step-active-color` | token | rename | 6 |
| `@stepErrorColor` | `--zk-step-error-color` | token | rename | 1 |
| `@stepCompleteColor` | `--zk-step-complete-color` | token | rename | 0 |
| `@stepHoverColor` | `--zk-step-hover-color` | token | rename | 3 |
| `@stepClickColor` | `--zk-step-click-color` | token | rename | 3 |
#### portalchildren

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@portalchildrenFrameBorderColor` | `--zk-portalchildren-frame-border-color` | token | rename | 1 |
| `@portalchildrenFrameRadius` | `--zk-portalchildren-frame-radius` | token | rename | 1 |
| `@portalchildrenFrameBackgroundColor` | `--zk-portalchildren-frame-background-color` | token | rename | 1 |
| `@portalchildrenFrameMargin` | `--zk-portalchildren-frame-margin` | token | rename | 1 |
| `@portalchildrenFramePadding` | `--zk-portalchildren-frame-padding` | token | rename | 4 |
| `@portalchildrenFrameTitleFontFamily` | `--zk-portalchildren-frame-title-font-family` | token | rename | 1 |
| `@portalchildrenFrameTitleFontSize` | `--zk-portalchildren-frame-title-font-size` | token | rename | 1 |
| `@portalchildrenFrameTitleFontColor` | `--zk-portalchildren-frame-title-font-color` | token | rename | 1 |
| `@portalchildrenCounterRadius` | `--zk-portalchildren-counter-radius` | token | rename | 1 |
| `@portalchildrenCounterPadding` | `--zk-portalchildren-counter-padding` | token | rename | 2 |
| `@portalchildrenCounterBackground` | `--zk-portalchildren-counter-background` | token | rename | 1 |
| `@portalchildrenFramePanelHeaderTextColor` | `--zk-portalchildren-frame-panel-header-text-color` | token | rename | 1 |
| `@portalchildrenFramePanelHeaderTextSize` | `--zk-portalchildren-frame-panel-header-text-size` | token | rename | 1 |
| `@portalchildrenFramePanelHeaderPadding` | `--zk-portalchildren-frame-panel-header-padding` | token | rename | 1 |
| `@portalchildrenFramePanelChildrenPadding` | `--zk-portalchildren-frame-panel-children-padding` | token | rename | 1 |
| `@portalchildrenFramePanelBackgroundColor` | `--zk-portalchildren-frame-panel-background-color` | token | rename | 1 |
| `@portalchildrenFramePanelPadding` | `--zk-portalchildren-frame-panel-padding` | token | rename | 2 |
| `@portalchildrenFrameDragButtonSize` | `--zk-portalchildren-frame-drag-button-size` | token | rename | 2 |
| `@portalchildrenFrameDragButtonColor` | `--zk-portalchildren-frame-drag-button-color` | token | rename | 1 |
#### linelayout

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@linelayoutLineColor` | `--zk-linelayout-line-color` | token | rename | 1 |
| `@linelayoutLineWidth` | `--zk-linelayout-line-width` | token | rename | 4 |
| `@linelayoutCavePadding` | `--zk-linelayout-cave-padding` | token | rename | 2 |
| `@linelayoutPointBorder` | `--zk-linelayout-point-border` | token | rename | 1 |
| `@linelayoutPointRadius` | `--zk-linelayout-point-radius` | token | rename | 1 |
| `@linelayoutPointSize` | `--zk-linelayout-point-size` | token | rename | 3 |
| `@linelayoutPointIconSize` | `--zk-linelayout-point-icon-size` | token | rename | 1 |
| `@linelayoutPointIconColor` | `--zk-linelayout-point-icon-color` | token | rename | 1 |
| `@linelayoutPointIconFixTop` | `--zk-linelayout-point-icon-fix-top` | token | rename | 1 |
| `@linelayoutPointIconFixLeft` | `--zk-linelayout-point-icon-fix-left` | token | rename | 1 |
| `@linelayoutPointBackgroundColor` | `--zk-linelayout-point-background-color` | token | rename | 1 |
| `@linelayoutPointShadow` | `--zk-linelayout-point-shadow` | token | rename | 1 |
#### coachmark

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@coachmarkPadding` | `--zk-coachmark-padding` | token | rename | 6 |
| `@coachmarkPaddingLeft` | `--zk-coachmark-padding-left` | token | rename | 1 |
| `@coachmarkPaddingRight` | `--zk-coachmark-padding-right` | token | rename | 1 |
| `@coachmarkIconSize` | `--zk-coachmark-icon-size` | token | rename | 3 |
| `@coachmarkMaskBackground` | `--zk-coachmark-mask-background` | token | rename | 1 |
| `@coachmarkBackgroundColor` | `--zk-coachmark-background-color` | token | rename | 6 |
#### cascader

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@cascaderHeight` | `--zk-cascader-height` | token | rename | 1 |
| `@cascaderLineHeight` | `--zk-cascader-line-height` | token | rename | 2 |
| `@cascaderColor` | `--zk-cascader-color` | token | rename | 2 |
| `@cascaderFontSize` | `--zk-cascader-font-size` | token | rename | 3 |
| `@cascaderPadding` | `--zk-cascader-padding` | token | rename | 2 |
| `@cascaderSeparatorColor` | `--zk-cascader-separator-color` | token | rename | 1 |
| `@cascaderBorderColor` | `--zk-cascader-border-color` | token | rename | 2 |
| `@cascaderBorderRadius` | `--zk-cascader-border-radius` | token | rename | 3 |
| `@cascaderBackgroundColor` | `--zk-cascader-background-color` | token | rename | 2 |
| `@cascaderIconColor` | `--zk-cascader-icon-color` | token | rename | 0 |
| `@cascaderPlaceholderColor` | `--zk-cascader-placeholder-color` | token | rename | 1 |
| `@cascaderActiveBorderColor` | `--zk-cascader-active-border-color` | token | rename | 1 |
| `@cascaderActiveBackgroundColor` | `--zk-cascader-active-background-color` | token | rename | 1 |
| `@cascaderHoverBorderColor` | `--zk-cascader-hover-border-color` | token | rename | 1 |
| `@cascaderFocusBorderColor` | `--zk-cascader-focus-border-color` | token | rename | 2 |
| `@cascaderDisableColor` | `--zk-cascader-disable-color` | token | rename | 1 |
| `@cascaderDisableBackgroundColor` | `--zk-cascader-disable-background-color` | token | rename | 1 |
| `@cascaderPopupBorderColor` | `--zk-cascader-popup-border-color` | token | rename | 1 |
| `@cascaderPopupCavePadding` | `--zk-cascader-popup-cave-padding` | token | rename | 1 |
| `@cascaderPopupItemPadding` | `--zk-cascader-popup-item-padding` | token | rename | 1 |
| `@cascaderPopupItemHeight` | `--zk-cascader-popup-item-height` | token | rename | 4 |
| `@cascaderPopupItemHoverBackgroundColor` | `--zk-cascader-popup-item-hover-background-color` | token | rename | 1 |
| `@cascaderPopupItemSelectedColor` | `--zk-cascader-popup-item-selected-color` | token | rename | 1 |
#### cropper

| LESS variable | CSS custom property | category | verdict | refs |
|---|---|---|---|---|
| `@cropperToolbarButtonFontSize` | `--zk-cropper-toolbar-button-font-size` | token | rename | 2 |
| `@cropperToolbarButtonPadding` | `--zk-cropper-toolbar-button-padding` | token | rename | 2 |

## Method and limits

Produced by `scripts/gen-var-table.js` from source, so it cannot drift from the tree
without the generator failing. What it does:

1. finds every `_zkvariables.less` under the source root (2 here) and parses each `@name: value;`;
2. classifies the value shape (see the category list below);
3. scans all 153 `.less` files once for `@name` and `@{name}` occurrences, so every row carries a reference count and every interpolation site is inspected;
4. in the same pass, records every site where the variable is a plain operand of a LESS built-in function, and judges whether the unevaluated call is still valid CSS (this is what finds CAVEAT-3; a mixin call is excluded, since a mixin is expanded rather than evaluated);
5. cross-checks the mapped tokens against the tokens a profile actually declares, in both directions;
6. asserts the counts above and exits non-zero on a mismatch.

Categories:

- `token` — Value is exactly one `var(--zk-*)`. The clean 1:1 case.
- `token-list` — Value is a comma-separated list of several `var(--zk-*)`. One LESS variable fans out to N tokens.
- `config-string` — Value is a quoted string consumed at LESS compile time by `@import` path interpolation. Not a token, and not tokenizable.
- `asset-path` — Value is a quoted `~./` resource path, consumed at compile time as the argument of a server-side DSP call (`${c:encodeThemeURL(...)}`). Not a token.
- `media-query` — Value is a LESS escaped string (`~"…"`) holding a media-query condition. CSS has no custom property that can appear in a media query prelude.
- `literal` — Value is a plain CSS value, not a `var()`. Seen in forks that replaced the forward with a real value; there is no token to rename to, so the migration is to DECLARE the custom property.

Verdicts:

- `rename` — Mechanical rename: replace the `@name:` override with the token declaration.
- `rename-fan-out` — Rename, but one LESS variable becomes SEVERAL token declarations.
- `rename-with-caveat` — Rename is correct for ordinary uses, but at least one consumption site embeds the value where a custom property cannot resolve. Read the caveat before dropping the LESS override.
- `no-token` — No custom property equivalent exists. Needs the replacement mechanism named in the row, not a rename.
- `declare-token` — Nothing to rename — the value is already a literal. Declare the corresponding custom property instead.
- `review` — The generator found a use it does not have a rule for. A human must look.

**LIMITS — what this table does not establish:**

- **No indirect data-flow tracing.** Interpolation sites are found by looking for
  `@{name}` literally. A variable that reaches a hazardous position *through a mixin
  parameter* has no such site. `@sliderTicks` is the worked example: it is passed to
  `.encodeThemeURL(background-image, @sliderTicks)` and the interpolation there is of the
  parameter `@url`. Those rows are caught by their value shape (`asset-path`) instead. A
  fork that invents a new indirection of this kind will not be flagged.
- **No claim of behavioural equivalence** beyond the caveats above. `review` is the
  verdict for any interpolation shape the ruleset does not recognise; it is not a
  synonym for "fine".
- **The compile-time-function scan is per line and per known LESS built-in.** A call
  split across lines, or a LESS built-in this generator does not list, is not judged.
  Unlisted-but-known built-ins come out as `review` rather than as safe; a genuinely
  unknown name is treated as ordinary CSS and ignored.
- **The mixin table is a separate artifact.** `_zkmixins.less` is deleted by the same
  phase and has its own document: [mixin-to-css.md](mixin-to-css.md). This generator
  covers variables only.

