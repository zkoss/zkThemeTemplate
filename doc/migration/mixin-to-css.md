# LESS mixin → CSS

**Frozen at P8 — generated once, hand-maintained from here.** `npm run gen:mixin-table`
was retired with the LESS tree it measured; it can still run against a fork that has `.less`
(`--src <fork>/src/main/resources/web`). Unlike the variable table this one has no live right-hand
side to rot: it maps mixins to plain CSS declarations, not to tokens, so nothing in this repository
can invalidate it.

Source: `src/main/resources/web/zul/less/_zkmixins.less` — **this file is deleted** when the theme drops LESS
([execution plan §P8](../iceblue-drop-less-execution-plan.md)). This table is the record of
what its mixins produced, for anyone who called them from their own component LESS.

## What you need to know first

- **You are not forced to drop LESS.** Upgrading ZK and dropping LESS are separate
  decisions. If you want to keep your `.less` files, copy the partials this theme deletes
  (`_zkmixins.less`, both `_zkvariables.less`, `_header.less`, `_zkcssvariables.less`) into
  your own fork and keep compiling them. This table is for the case where you would rather
  move to plain CSS.
- **11 of the 30 mixins are dead** — zero reachable call sites, zero
  declarations in the shipped theme. Do not spend time porting them. See
  [Dead mixins](#dead-mixins).
- **Most of the rest are one-liners.** The prefix fan-out mixins have no logic in them at
  all; the replacement is a single unprefixed declaration.
- Variable names (`@colorPrimary` → `--zk-color-primary`) are a separate table:
  [`less-var-to-token.md`](less-var-to-token.md).

## Quick replacement table

One line per mixin name. `<x>` stands for the argument you passed. Full expansions,
guards and caveats are in the per-mixin sections below.

| Mixin | Params | Defs | Call sites | Live | Replace with |
|---|---|---|---|---|---|
| `.encodeURL()` | `@property, @url, @rest...` | 2 | 5 | yes | `background: url(${c:encodeURL("<url>")}) <rest>;` |
| `.encodeThemeURL()` | `@property, @url, @rest...` | 2 | 25 | yes | `background: url(${c:encodeThemeURL("<url>")}) <rest>;` |
| `.encodeURL-verGradient()` | `@url, @start, @end` | 1 | 0 | **no** | `background: url(${c:encodeURL("<url>")}), linear-gradient(to bottom, <start> 0%, <end> 100%);` |
| `.gradient()` | `@direction, @value` | 1 | 0 | **no** | `background: linear-gradient(…) /* or radial-gradient(…) */;` |
| `.gradient-ver()` | — | 1 | 1 | **no** | `background: linear-gradient(to bottom, <stops>);` |
| `.gradient-hor()` | — | 1 | 1 | **no** | `background: linear-gradient(to right, <stops>);` |
| `.gradient-diagm()` | — | 1 | 1 | **no** | `background: linear-gradient(135deg, <stops>);` |
| `.gradient-diagp()` | — | 1 | 1 | **no** | `background: linear-gradient(45deg, <stops>);` |
| `.gradient-rad()` | — | 1 | 1 | **no** | `background: radial-gradient(ellipse at center, <stops>);` |
| `.boxOrientHor()` | — | 1 | 6 | yes | `display: flex; flex-direction: row;` |
| `.boxOrientHorFlex()` | — | 1 | 2 | yes | `display: flex; flex-direction: row; flex: 1;` |
| `.boxShadow()` | `@value` | 2 | 46 | yes | `box-shadow: <value>;` |
| `.borderRadius()` | `@size` | 2 | 103 | yes | `border-radius: <size>;` |
| `.transform()` | `@value` | 2 | 42 | yes | `transform: <value>;` |
| `.applyCSS3()` | `@key, @value` | 1 | 30 | yes | `<key>: <value>;` |
| `.horGradient()` | `@start, @end` | 2 | 0 | **no** | `background: linear-gradient(to right, <start> 0%, <end> 100%); /* start == end → background: <start>; */` |
| `.verGradient()` | `@start, @end` | 2 | 0 | **no** | `background: linear-gradient(to bottom, <start> 0%, <end> 100%); /* start == end → background: <start>; */` |
| `.base64DataUriBackground()` | `@svgToEncode, @type: ~"image/svg+xml"` | 1 | 7 | **no** | _nothing — drop the call_ |
| `.resetGradient()` | — | 1 | 0 | **no** | `background: none;` |
| `.topBorderRadius()` | `@size` | 1 | 13 | yes | `border-radius: <size> <size> 0 0;` |
| `.rightBorderRadius()` | `@size` | 1 | 5 | yes | `border-radius: 0 <size> <size> 0;` |
| `.bottomBorderRadius()` | `@size` | 1 | 5 | yes | `border-radius: 0 0 <size> <size>;` |
| `.leftBorderRadius()` | `@size` | 1 | 1 | yes | `border-radius: <size> 0 0 <size>;` |
| `.opacity()` | `@opacity` | 1 | 23 | yes | `opacity: <opacity>;` |
| `.baseIconFont()` | — | 1 | 15 | yes | _copy the declarations below verbatim_ |
| `.size()` | `@width, @height` | 1 | 186 | yes | `width: <width>; height: <height>;` |
| `.displaySize()` | `@display, @width, @height` | 1 | 25 | yes | `display: <display>; width: <width>; height: <height>;` |
| `.fontStyle()` | `@family, @size, @weight, @color`<br>`@family, @size, @weight` | 2 | 48 | yes | `font-family: <family>; font-size: <size>; font-weight: <weight>; font-style: normal; color: <color>; /* 3-argument form: omit color */` |
| `.iconFontStyle()` | `@size, @color` | 1 | 28 | yes | `font-size: <size>; color: <color>;` |
| `.userSelectNone()` | — | 1 | 4 | yes | `-webkit-touch-callout: none; -webkit-user-select: none; user-select: none;` |

`Call sites` counts calls in all `.less` files under `src/main/resources/web/`, including
calls made from inside `_zkmixins.less` itself — which is why a dead mixin can still show a
non-zero count (see [Method](#method)).

## Dead mixins

11 names (13 of the 38 definition lines) have **no reachable call site anywhere in the tree**:

| Mixin | Direct call sites | Where from |
|---|---|---|
| `.encodeURL-verGradient()` | 0 | — |
| `.gradient()` | 0 | — |
| `.gradient-ver()` | 1 | 1 from `_zkmixins.less` (callers themselves dead), 0 external |
| `.gradient-hor()` | 1 | 1 from `_zkmixins.less` (callers themselves dead), 0 external |
| `.gradient-diagm()` | 1 | 1 from `_zkmixins.less` (callers themselves dead), 0 external |
| `.gradient-diagp()` | 1 | 1 from `_zkmixins.less` (callers themselves dead), 0 external |
| `.gradient-rad()` | 1 | 1 from `_zkmixins.less` (callers themselves dead), 0 external |
| `.horGradient()` | 0 | — |
| `.verGradient()` | 0 | — |
| `.base64DataUriBackground()` | 7 | 7 from `_zkmixins.less` (callers themselves dead), 0 external |
| `.resetGradient()` | 0 | — |

They form one closed group: `.gradient()` is called by nobody, its five `.gradient-*` guard
arms are called only by `.gradient()`, and `.base64DataUriBackground()` is called only by
those arms plus `.horGradient()`/`.verGradient()` — which are themselves uncalled. The
output-side evidence agrees: the compiled theme contains no `linear-gradient`, no
`radial-gradient`, no `-webkit-gradient(`, no SVG data URI and no `progid:` filter.

This is the same conclusion plan §P4 reached about `progid:DXImageTransform`
(`src/main/resources/web/zul/less/_zkmixins.less:240`, inside `.resetGradient()`) — 0 output declarations. The reason is
simply that nothing calls it.

## Mixins by kind

### DSP EL URL helpers

These do not expand to plain CSS at all — they emit a **DSP EL expression** that ZK evaluates
when it serves the file. Dropping LESS does not remove the EL: the compiled output is
`.css.dsp`, so write the `${c:...}` call literally in your `.css` source and it keeps working.

#### `.encodeURL()`

| | |
|---|---|
| Definitions | 2 (lines 9, 12) |
| Call sites | 5 |
| Reachable | yes |
| Replace with | `background: url(${c:encodeURL("<url>")}) <rest>;` |

> Guard-dispatched on the FIRST argument, which is a property name, not a value: `background`
> and `background-image` are the only two accepted. Any other value matches no arm and the call
> silently emits nothing — LESS does not warn.

**Overload:** `.encodeURL(@property, @url, @rest...)` **when (@property = background)** — line 9

```less
    e('background: url(${c:encodeURL("@{url}")}) @{rest};');
```

**Overload:** `.encodeURL(@property, @url, @rest...)` **when (@property = background-image)** — line 12

```less
    e('background-image: url(${c:encodeURL("@{url}")});');
```

#### `.encodeThemeURL()`

| | |
|---|---|
| Definitions | 2 (lines 15, 18) |
| Call sites | 25 |
| Reachable | yes |
| Replace with | `background: url(${c:encodeThemeURL("<url>")}) <rest>;` |

> Same shape as `.encodeURL`, but `c:encodeThemeURL` resolves the path against the active theme
> folder rather than the web root. The most-called helper in this group — check the call-site
> count before assuming it is optional.

**Overload:** `.encodeThemeURL(@property, @url, @rest...)` **when (@property = background)** — line 15

```less
    e('background: url(${c:encodeThemeURL("@{url}")}) @{rest};');
```

**Overload:** `.encodeThemeURL(@property, @url, @rest...)` **when (@property = background-image)** — line 18

```less
    e('background-image: url(${c:encodeThemeURL("@{url}")});');
```

#### `.encodeURL-verGradient()`

| | |
|---|---|
| Definitions | 1 (line 22) |
| Call sites | 0 |
| Reachable | **no — dead, do not port** |
| Replace with | `background: url(${c:encodeURL("<url>")}), linear-gradient(to bottom, <start> 0%, <end> 100%);` |

Source comment: _only tablet.less uses this, no need render css for old IE_

> **The source comment above this mixin is stale.** It claims "only tablet.less uses this", but
> a grep of all 153 `.less` files finds zero call sites — including in `zkmax/less/tablet.less`,
> which contains no reference to `encodeURL` at all. Treat the measured call-site count, not the
> comment, as the truth.

**Definition:** `.encodeURL-verGradient(@url, @start, @end)` — line 22

```less
    e('background:    url(${c:encodeURL("@{url}")});');
    e('background:    url(${c:encodeURL("@{url}")}), -moz-linear-gradient(top, @{start} 0%, @{end} 100%);'); /* FF3.6+ */
    e('background:    url(${c:encodeURL("@{url}")}), -webkit-gradient(linear, left top, left bottom, color-stop(0%, @{start}),color-stop(100%, @{end}));'); /* Chrome,Safari4+ */
    e('background:    url(${c:encodeURL("@{url}")}), -webkit-linear-gradient(top, @{start} 0%, @{end} 100%);'); /* Chrome10+,Safari5.1+ */
    e('background:    url(${c:encodeURL("@{url}")}), -o-linear-gradient(top, @{start} 0%, @{end} 100%);'); /* Opera 11.10+ */
    e('background:    url(${c:encodeURL("@{url}")}), -ms-linear-gradient(top, @{start} 0%, @{end} 100%);'); /* IE10+ */
    e('background:    url(${c:encodeURL("@{url}")}), linear-gradient(to bottom, @{start} 0%, @{end} 100%);'); /* W3C */
```


### Vendor-prefix fan-out mixins

**These mixins exist for one reason only: to repeat a single declaration once per vendor
prefix.** There is no logic in them. If you have already dropped dead prefixes (see [execution
plan §P4](../iceblue-drop-less-execution-plan.md)), the replacement is the one unprefixed line
in the Replacement column — you do not need the multi-line expansion. The expansions are printed
anyway for customers who still ship prefixes. Note the fan-out is unconditional: every mixin
here emits all four prefixes, including combinations no browser ever implemented
(`-o-box-shadow`, `-ms-border-radius`). Which prefixes are genuinely dead for your users is a
browser-support decision (plan L-2), not something this table can answer.

| Mixin | Declarations per call | Call sites | Declarations emitted |
|---|---|---|---|
| `.boxShadow()` | 5 | 46 | 230 |
| `.borderRadius()` | 5 | 103 | 515 |
| `.transform()` | 5 | 42 | 210 |
| `.applyCSS3()` | 5 | 30 | 150 |
| `.topBorderRadius()` | 5 | 13 | 65 |
| `.rightBorderRadius()` | 5 | 5 | 25 |
| `.bottomBorderRadius()` | 5 | 5 | 25 |
| `.leftBorderRadius()` | 5 | 1 | 5 |
| `.userSelectNone()` | 6 | 4 | 24 |

The last column is `declarations per call × call sites`. For guard-overloaded mixins exactly one
arm fires per call, so the arms are not summed. Excluding `.userSelectNone()` (which plan §P4
does not tabulate) these come to 245 call sites and 1225 declarations — reproducing plan §P4's
table (245 / 1225) exactly, from an independent count.

#### `.boxShadow()`

| | |
|---|---|
| Definitions | 2 (lines 146, 153) |
| Call sites | 46 |
| Reachable | yes |
| Replace with | `box-shadow: <value>;` |
| Why it exists | vendor-prefix fan-out only — see [§P4](../iceblue-drop-less-execution-plan.md) |

Source comment: _box-shadow_

> Two overloads that differ ONLY in `e()` escaping, not in output shape: the `isstring` arm
> unquotes a string value before emitting it. Both arms emit the same five properties.
> `-o-box-shadow` and `-ms-box-shadow` were never implemented by any browser — that pair is pure
> noise regardless of what support policy you land on.

**Overload:** `.boxShadow(@value)` **when (isstring(@value))** — line 146

```less
    -webkit-box-shadow: e(@value);
    -moz-box-shadow: e(@value);
    -o-box-shadow: e(@value);
    -ms-box-shadow: e(@value);
    box-shadow: e(@value);
```

**Overload:** `.boxShadow(@value)` **when not (isstring(@value))** — line 153

```less
    -webkit-box-shadow: @value;
    -moz-box-shadow: @value;
    -o-box-shadow: @value;
    -ms-box-shadow: @value;
    box-shadow: @value;
```

#### `.borderRadius()`

| | |
|---|---|
| Definitions | 2 (lines 161, 168) |
| Call sites | 103 |
| Reachable | yes |
| Replace with | `border-radius: <size>;` |
| Why it exists | vendor-prefix fan-out only — see [§P4](../iceblue-drop-less-execution-plan.md) |

Source comment: _border-radius_

> The most-called mixin in the file. Two overloads, `isstring` / not-`isstring`, same five
> properties either way.

**Overload:** `.borderRadius(@size)` **when (isstring(@size))** — line 161

```less
    -webkit-border-radius: e(@size);
    -moz-border-radius: e(@size);
    -o-border-radius: e(@size);
    -ms-border-radius: e(@size);
    border-radius: e(@size);
```

**Overload:** `.borderRadius(@size)` **when not (isstring(@size))** — line 168

```less
    -webkit-border-radius: @size;
    -moz-border-radius: @size;
    -o-border-radius: @size;
    -ms-border-radius: @size;
    border-radius: @size;
```

#### `.transform()`

| | |
|---|---|
| Definitions | 2 (lines 176, 183) |
| Call sites | 42 |
| Reachable | yes |
| Replace with | `transform: <value>;` |
| Why it exists | vendor-prefix fan-out only — see [§P4](../iceblue-drop-less-execution-plan.md) |

Source comment: _transform_

> Note the missing semicolon after the final `transform: @value` in both arms — legal LESS, and
> the compiler adds it. Do not copy the omission into hand-written CSS.

**Overload:** `.transform(@value)` **when (isstring(@value))** — line 176

```less
    -webkit-transform: e(@value);
    -moz-transform: e(@value);
    -o-transform: e(@value);
    -ms-transform: e(@value);
    transform: e(@value)
```

**Overload:** `.transform(@value)` **when not (isstring(@value))** — line 183

```less
    -webkit-transform: @value;
    -moz-transform: @value;
    -o-transform: @value;
    -ms-transform: @value;
    transform: @value
```

#### `.applyCSS3()`

| | |
|---|---|
| Definitions | 1 (line 191) |
| Call sites | 30 |
| Reachable | yes |
| Replace with | `<key>: <value>;` |
| Why it exists | vendor-prefix fan-out only — see [§P4](../iceblue-drop-less-execution-plan.md) |

Source comment: _CSS3_

> The generic form of the three above: `@key` is interpolated into the property name, so
> `.applyCSS3(transition, all .2s)` produces `-webkit-transition`, `-moz-`, `-o-`, `-ms-` and
> unprefixed. **Grep your own LESS for this one before deleting anything** — because the
> property name is a parameter, a text search for e.g. `transition` will not find these call
> sites.

**Definition:** `.applyCSS3(@key, @value)` — line 191

```less
    @ekey: e(@key);
    -webkit-@{ekey}: e(@value);
    -moz-@{ekey}: e(@value);
    -o-@{ekey}: e(@value);
    -ms-@{ekey}: e(@value);
    @{ekey}: e(@value)
```

#### `.topBorderRadius()`

| | |
|---|---|
| Definitions | 1 (line 244) |
| Call sites | 13 |
| Reachable | yes |
| Replace with | `border-radius: <size> <size> 0 0;` |
| Why it exists | vendor-prefix fan-out only — see [§P4](../iceblue-drop-less-execution-plan.md) |

Source comment: _border-radius utility_

> No guard, no `e()` — one arm only.

**Definition:** `.topBorderRadius(@size)` — line 244

```less
    -webkit-border-radius: @size @size 0 0;
    -moz-border-radius: @size @size 0 0;
    -o-border-radius: @size @size 0 0;
    -ms-border-radius: @size @size 0 0;
    border-radius: @size @size 0 0;
```

#### `.rightBorderRadius()`

| | |
|---|---|
| Definitions | 1 (line 251) |
| Call sites | 5 |
| Reachable | yes |
| Replace with | `border-radius: 0 <size> <size> 0;` |
| Why it exists | vendor-prefix fan-out only — see [§P4](../iceblue-drop-less-execution-plan.md) |

**Definition:** `.rightBorderRadius(@size)` — line 251

```less
    -webkit-border-radius: 0 @size @size 0;
    -moz-border-radius: 0 @size @size 0;
    -o-border-radius: 0 @size @size 0;
    -ms-border-radius: 0 @size @size 0;
    border-radius: 0 @size @size 0;
```

#### `.bottomBorderRadius()`

| | |
|---|---|
| Definitions | 1 (line 258) |
| Call sites | 5 |
| Reachable | yes |
| Replace with | `border-radius: 0 0 <size> <size>;` |
| Why it exists | vendor-prefix fan-out only — see [§P4](../iceblue-drop-less-execution-plan.md) |

**Definition:** `.bottomBorderRadius(@size)` — line 258

```less
    -webkit-border-radius: 0 0 @size @size;
    -moz-border-radius: 0 0 @size @size;
    -o-border-radius: 0 0 @size @size;
    -ms-border-radius: 0 0 @size @size;
    border-radius: 0 0 @size @size;
```

#### `.leftBorderRadius()`

| | |
|---|---|
| Definitions | 1 (line 265) |
| Call sites | 1 |
| Reachable | yes |
| Replace with | `border-radius: <size> 0 0 <size>;` |
| Why it exists | vendor-prefix fan-out only — see [§P4](../iceblue-drop-less-execution-plan.md) |

**Definition:** `.leftBorderRadius(@size)` — line 265

```less
    -webkit-border-radius: @size 0 0 @size;
    -moz-border-radius: @size 0 0 @size;
    -o-border-radius: @size 0 0 @size;
    -ms-border-radius: @size 0 0 @size;
    border-radius: @size 0 0 @size;
```

#### `.userSelectNone()`

| | |
|---|---|
| Definitions | 1 (line 318) |
| Call sites | 4 |
| Reachable | yes |
| Replace with | `-webkit-touch-callout: none; -webkit-user-select: none; user-select: none;` |
| Why it exists | vendor-prefix fan-out only — see [§P4](../iceblue-drop-less-execution-plan.md) |

> **Partial fan-out — do not reduce this to one line.** `-webkit-touch-callout` is a
> non-standard property with no unprefixed equivalent (iOS Safari long-press menu), and
> `-webkit-user-select` is still required by older Safari. Only `-khtml-`, `-moz-` and
> `-ms-user-select` are safely droppable. See the "prefixes that must survive P4" caveat below.

**Definition:** `.userSelectNone()` — line 318

```less
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
```


### Legacy 2009 flexbox draft

Not a prefix fan-out. `display: box` / `box-orient` / `box-flex` are the **withdrawn 2009
flexbox draft**, and the unprefixed forms in these bodies were never implemented by any shipping
browser. Porting them is a rewrite to modern flexbox, which is a behaviour decision, not a
mechanical prefix drop — do not fold it into P4.

#### `.boxOrientHor()`

| | |
|---|---|
| Definitions | 1 (line 117) |
| Call sites | 6 |
| Reachable | yes |
| Replace with | `display: flex; flex-direction: row;` |

Source comment: _box layout_

> `display: box` and `box-orient` unprefixed were never implemented; only the `-webkit-`/`-moz-`
> prefixed forms ever did anything. The modern replacement is not declaration-equivalent —
> verify layout, do not assume.

**Definition:** `.boxOrientHor()` — line 117

```less
    display: -webkit-box;
    display: -moz-box;
    display: box;

    -webkit-box-orient: horizontal;
    -moz-box-orient: horizontal;
    -o-box-orient: horizontal;
    -ms-box-orient: horizontal;
    box-orient: horizontal;
```

#### `.boxOrientHorFlex()`

| | |
|---|---|
| Definitions | 1 (line 128) |
| Call sites | 2 |
| Reachable | yes |
| Replace with | `display: flex; flex-direction: row; flex: 1;` |

> Same as `.boxOrientHor()` plus `box-flex: 1` **on the same element** — i.e. the element is
> both a flex container and a growing flex item. That is why the replacement carries both
> `display: flex` and `flex: 1`.

**Definition:** `.boxOrientHorFlex()` — line 128

```less
    display: -webkit-box;
    display: -moz-box;
    display: box;

    -webkit-box-orient: horizontal;
    -moz-box-orient: horizontal;
    -o-box-orient: horizontal;
    -ms-box-orient: horizontal;
    box-orient: horizontal;

    -webkit-box-flex: 1;
    -moz-box-flex: 1;
    -o-box-flex: 1;
    -ms-box-flex: 1;
    box-flex: 1;
```


### Plain shorthands

No prefixes, no guards worth worrying about — each is a fixed set of declarations with the
parameters substituted. Inline the body and you are done.

#### `.opacity()`

| | |
|---|---|
| Definitions | 1 (line 274) |
| Call sites | 23 |
| Reachable | yes |
| Replace with | `opacity: <opacity>;` |

Source comment: _opacity utility_

> A pure 1:1 alias: one parameter, one declaration, no prefixes and no guard. Nothing to
> translate — delete the call and keep the declaration.

**Definition:** `.opacity(@opacity)` — line 274

```less
    opacity: @opacity;
```

#### `.baseIconFont()`

| | |
|---|---|
| Definitions | 1 (line 279) |
| Call sites | 15 |
| Reachable | yes |
| Replace with | _copy the declarations below verbatim_ |

Source comment: _icon font utility_

> **Contains two prefixed declarations that must NOT be stripped.** `-webkit-font-smoothing` and
> `-moz-osx-font-smoothing` are non-standard properties with no unprefixed form; removing them
> changes glyph rendering. See the caveat section below.

**Definition:** `.baseIconFont()` — line 279

```less
    display: inline-block;
    font-family: ZK85Icons, FontAwesome;
    font-style: normal;
    font-weight: normal;
    font-size: inherit;
    line-height: 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: auto; // optimizelegibility throws things off #1094
```

#### `.size()`

| | |
|---|---|
| Definitions | 1 (line 292) |
| Call sites | 186 (185 external, 1 inside `_zkmixins.less`) |
| Reachable | yes |
| Replace with | `width: <width>; height: <height>;` |

Source comment: _other utility_

> The second-most-called mixin in the file, and the one most likely to appear in customer LESS.
> Trivial to inline.

**Definition:** `.size(@width, @height)` — line 292

```less
    width: @width;
    height: @height;
```

#### `.displaySize()`

| | |
|---|---|
| Definitions | 1 (line 296) |
| Call sites | 25 |
| Reachable | yes |
| Replace with | `display: <display>; width: <width>; height: <height>;` |

> Calls `.size()` internally — that is the only intra-file call site `.size()` has.

**Definition:** `.displaySize(@display, @width, @height)` — line 296

```less
    display: @display;
    .size(@width, @height);
```

#### `.fontStyle()`

| | |
|---|---|
| Definitions | 2 (lines 300, 307) |
| Call sites | 48 |
| Reachable | yes |
| Replace with | `font-family: <family>; font-size: <size>; font-weight: <weight>; font-style: normal; color: <color>; /* 3-argument form: omit color */` |

> **Arity-overloaded, not guard-overloaded**: the 4-argument form adds `color`, the 3-argument
> form omits it. Both hard-code `font-style: normal`, which is easy to miss when inlining —
> leaving it out changes rendering inside an italic ancestor.

**Overload:** `.fontStyle(@family, @size, @weight, @color)` — line 300 (no guard; selected by argument count)

```less
    font-family: @family;
    font-size: @size;
    font-weight: @weight;
    font-style: normal;
    color: @color;
```

**Overload:** `.fontStyle(@family, @size, @weight)` — line 307 (no guard; selected by argument count)

```less
    font-family: @family;
    font-size: @size;
    font-weight: @weight;
    font-style: normal;
```

#### `.iconFontStyle()`

| | |
|---|---|
| Definitions | 1 (line 313) |
| Call sites | 28 |
| Reachable | yes |
| Replace with | `font-size: <size>; color: <color>;` |

**Definition:** `.iconFontStyle(@size, @color)` — line 313

```less
    font-size: @size;
    color: @color;
```


### Gradient / IE9 fallback machinery (all DEAD)

Every mixin in this group has **zero reachable call sites** and contributes **zero
declarations** to the theme output. They are the CSS-gradient + IE9 SVG-data-URI + IE filter
fallback stack, kept alive only by referring to each other. Do not port them. If you call one
from your own LESS, the Replacement column tells you the modern equivalent — a plain
`linear-gradient()` / `radial-gradient()`.

#### `.gradient()`

| | |
|---|---|
| Definitions | 1 (line 35) |
| Call sites | 0 |
| Reachable | **no — dead, do not port** |
| Replace with | `background: linear-gradient(…) /* or radial-gradient(…) */;` |

Source comment: _gradient_

> Dispatcher: parses `@value` with inline JavaScript (LESS backtick evaluation) into three
> derived strings, then calls all five `.gradient-*` arms and lets their guards pick one. The
> inline-JS evaluation is a LESS-only capability with no CSS equivalent — and no replacement is
> needed, because a modern `linear-gradient()` takes the stops directly.

**Definition:** `.gradient(@direction, @value)` — line 35

```less
    // can be used directly for all except old webkit
    @valueList: ~`(function(a){return a.replace(/;/g, ',')})(@{value})`;
    @fallbackColor: ~`(function(a){return a.split(';')[0].trim().split(/\s(\d+%)$/g)[0]})(@{value})`;
    // for old webkit
    @valuesWebkit: ~`(function(a){var result='';var b=a.split(';');b.forEach(function(c){var d=c.trim().split(/\s(\d+%)$/g);result+='color-stop(' + d[1] + ',' + d[0] + '),';});return result.slice(0, -1)})(@{value})`;
    // for ie9, color stop is the same in all gradient direction, only prefix/suffix are different
    @svgContent: ~`(function(a){var result='';var b=a.split(';');b.forEach(function(c){var d=c.trim().split(/\s(\d+%)$/g);result+='<stop offset="' + d[1] + '" stop-color="' + d[0] + '"/>';});return result})(@{value})`;
    .gradient-ver();
    .gradient-hor();
    .gradient-diagm();
    .gradient-diagp();
    .gradient-rad();
```

#### `.gradient-ver()`

| | |
|---|---|
| Definitions | 1 (line 49) |
| Call sites | 1 (0 external, 1 inside `_zkmixins.less`) |
| Reachable | **no — dead, do not port** |
| Replace with | `background: linear-gradient(to bottom, <stops>);` |

> Guard arm of `.gradient()`; only reachable through it.

**Definition:** `.gradient-ver()` **when (@direction = 'ver')** — line 49

```less
    background:    @fallbackColor; /* Old browsers */
    @svgPrefix: ~'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none"><linearGradient id="zkie9" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="0%" y2="100%">';
    @svgSuffix: ~'</linearGradient><rect x="0" y="0" width="1" height="1" fill="url(#zkie9)" /></svg>';
    @svg: e('@{svgPrefix}@{svgContent}@{svgSuffix}');
    .base64DataUriBackground(@svg); /* IE9 */
    background:    -moz-linear-gradient(top, @valueList); /* FF3.6+ */
    background:    -webkit-gradient(linear, left top, left bottom, @valuesWebkit); /* Chrome,Safari4+ */
    background:    -webkit-linear-gradient(top, @valueList); /* Chrome10+,Safari5.1+ */
    background:    -o-linear-gradient(top, @valueList); /* Opera 11.10+ */
    background:    -ms-linear-gradient(top, @valueList); /* IE10+ */
    background:    linear-gradient(to bottom, @valueList); /* W3C */
```

#### `.gradient-hor()`

| | |
|---|---|
| Definitions | 1 (line 63) |
| Call sites | 1 (0 external, 1 inside `_zkmixins.less`) |
| Reachable | **no — dead, do not port** |
| Replace with | `background: linear-gradient(to right, <stops>);` |

> Guard arm of `.gradient()`; only reachable through it.

**Definition:** `.gradient-hor()` **when (@direction = 'hor')** — line 63

```less
    background:    @fallbackColor; /* Old browsers */
    @svgPrefix: ~'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none"><linearGradient id="zkie9" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%">';
    @svgSuffix: ~'</linearGradient><rect x="0" y="0" width="1" height="1" fill="url(#zkie9)" /></svg>';
    @svg: e('@{svgPrefix}@{svgContent}@{svgSuffix}');
    .base64DataUriBackground(@svg); /* IE9 */
    background:    -moz-linear-gradient(left, @valueList); /* FF3.6+ */
    background:    -webkit-gradient(linear, left top, right top, @valuesWebkit); /* Chrome,Safari4+ */
    background:    -webkit-linear-gradient(left, @valueList); /* Chrome10+,Safari5.1+ */
    background:    -o-linear-gradient(left, @valueList); /* Opera 11.10+ */
    background:    -ms-linear-gradient(left, @valueList); /* IE10+ */
    background:    linear-gradient(to right, @valueList); /* W3C */
```

#### `.gradient-diagm()`

| | |
|---|---|
| Definitions | 1 (line 76) |
| Call sites | 1 (0 external, 1 inside `_zkmixins.less`) |
| Reachable | **no — dead, do not port** |
| Replace with | `background: linear-gradient(135deg, <stops>);` |

> Guard arm of `.gradient()` for direction `diag-`; only reachable through it.

**Definition:** `.gradient-diagm()` **when (@direction = 'diag-')** — line 76

```less
    background:    @fallbackColor; /* Old browsers */
    @svgPrefix: ~'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none"><linearGradient id="zkie9" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="100%">';
    @svgSuffix: ~'</linearGradient><rect x="0" y="0" width="1" height="1" fill="url(#zkie9)" /></svg>';
    @svg: e('@{svgPrefix}@{svgContent}@{svgSuffix}');
    .base64DataUriBackground(@svg); /* IE9 */
    background:    -moz-linear-gradient(-45deg, @valueList); /* FF3.6+ */
    background:    -webkit-gradient(linear, left top, right bottom, @valuesWebkit); /* Chrome,Safari4+ */
    background:    -webkit-linear-gradient(-45deg, @valueList); /* Chrome10+,Safari5.1+ */
    background:    -o-linear-gradient(-45deg, @valueList); /* Opera 11.10+ */
    background:    -ms-linear-gradient(-45deg, @valueList); /* IE10+ */
    background:    linear-gradient(135deg, @valueList); /* W3C */
```

#### `.gradient-diagp()`

| | |
|---|---|
| Definitions | 1 (line 89) |
| Call sites | 1 (0 external, 1 inside `_zkmixins.less`) |
| Reachable | **no — dead, do not port** |
| Replace with | `background: linear-gradient(45deg, <stops>);` |

> Guard arm of `.gradient()` for direction `diag+`; only reachable through it.

**Definition:** `.gradient-diagp()` **when (@direction = 'diag+')** — line 89

```less
    background:    @fallbackColor; /* Old browsers */
    @svgPrefix: ~'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none"><linearGradient id="zkie9" gradientUnits="userSpaceOnUse" x1="0%" y1="100%" x2="100%" y2="0%">';
    @svgSuffix: ~'</linearGradient><rect x="0" y="0" width="1" height="1" fill="url(#zkie9)" /></svg>';
    @svg: e('@{svgPrefix}@{svgContent}@{svgSuffix}');
    .base64DataUriBackground(@svg); /* IE9 */
    background:    -moz-linear-gradient(45deg, @valueList); /* FF3.6+ */
    background:    -webkit-gradient(linear, left bottom, right top, @valuesWebkit); /* Chrome,Safari4+ */
    background:    -webkit-linear-gradient(45deg, @valueList); /* Chrome10+,Safari5.1+ */
    background:    -o-linear-gradient(45deg, @valueList); /* Opera 11.10+ */
    background:    -ms-linear-gradient(45deg, @valueList); /* IE10+ */
    background:    linear-gradient(45deg, @valueList); /* W3C */
```

#### `.gradient-rad()`

| | |
|---|---|
| Definitions | 1 (line 102) |
| Call sites | 1 (0 external, 1 inside `_zkmixins.less`) |
| Reachable | **no — dead, do not port** |
| Replace with | `background: radial-gradient(ellipse at center, <stops>);` |

> Guard arm of `.gradient()`; only reachable through it.

**Definition:** `.gradient-rad()` **when (@direction = 'rad')** — line 102

```less
    background:    @fallbackColor; /* Old browsers */
    @svgPrefix: ~'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none"><radialGradient id="zkie9" gradientUnits="userSpaceOnUse" cx="50%" cy="50%" r="50%">';
    @svgSuffix: ~'</radialGradient><rect x="0" y="0" width="1" height="1" fill="url(#zkie9)" /></svg>';
    @svg: e('@{svgPrefix}@{svgContent}@{svgSuffix}');
    .base64DataUriBackground(@svg); /* IE9 */
    background:    -moz-radial-gradient(center, ellipse cover, @valueList); /* FF3.6+ */
    background:    -webkit-gradient(radial, center center, 0px, center center, 100%, @valuesWebkit); /* Chrome,Safari4+ */
    background:    -webkit-radial-gradient(center, ellipse cover, @valueList); /* Chrome10+,Safari5.1+ */
    background:    -o-radial-gradient(center, ellipse cover, @valueList); /* Opera 11.10+ */
    background:    -ms-radial-gradient(center, ellipse cover, @valueList); /* IE10+ */
    background:    radial-gradient(ellipse at center, @valueList); /* W3C */
```

#### `.horGradient()`

| | |
|---|---|
| Definitions | 2 (lines 204, 207) |
| Call sites | 0 |
| Reachable | **no — dead, do not port** |
| Replace with | `background: linear-gradient(to right, <start> 0%, <end> 100%); /* start == end → background: <start>; */` |

Source comment: _gradient utility_

> Two arms: when `@start = @end` it collapses to a flat `background`, otherwise it emits the
> six-line fallback stack. The equal-colours arm is worth keeping in mind — a mechanical port
> that only handles the gradient arm changes behaviour for callers that pass the same colour
> twice.

**Overload:** `.horGradient(@start, @end)` **when (@start = @end)** — line 204

```less
    background: @start;
```

**Overload:** `.horGradient(@start, @end)` **when not (@start = @end)** — line 207

```less
    background:    @start; /* Old browsers */
    @svg: ~'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none"><linearGradient id="zkie9" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%"><stop stop-color="@{start}" offset="0%"/><stop stop-color="@{end}" offset="100%"/></linearGradient><rect x="0" y="0" width="1" height="1" fill="url(#zkie9)" /></svg>';
    .base64DataUriBackground(@svg); /* IE9 */
    background:    -moz-linear-gradient(left, @start 0%, @end 100%); /* FF3.6+ */
    background:    -webkit-gradient(linear, left top, right top, color-stop(0%,@start), color-stop(100%, @end)); /* Chrome,Safari4+ */
    background:    -webkit-linear-gradient(left, @start 0%, @end 100%); /* Chrome10+,Safari5.1+ */
    background:    -o-linear-gradient(left, @start 0%, @end 100%); /* Opera 11.10+ */
    background:    -ms-linear-gradient(left, @start 0%, @end 100%); /* IE10+ */
    background:    linear-gradient(to right, @start 0%, @end 100%); /* W3C */
```

#### `.verGradient()`

| | |
|---|---|
| Definitions | 2 (lines 218, 221) |
| Call sites | 0 |
| Reachable | **no — dead, do not port** |
| Replace with | `background: linear-gradient(to bottom, <start> 0%, <end> 100%); /* start == end → background: <start>; */` |

> Vertical twin of `.horGradient()`, same two-arm structure.

**Overload:** `.verGradient(@start, @end)` **when (@start = @end)** — line 218

```less
    background: @start;
```

**Overload:** `.verGradient(@start, @end)` **when not (@start = @end)** — line 221

```less
    background:    @start; /* Old browsers */
    @svg: ~'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none"><linearGradient id="zkie9" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="0%" y2="100%"><stop stop-color="@{start}" offset="0%"/><stop stop-color="@{end}" offset="100%"/></linearGradient><rect x="0" y="0" width="1" height="1" fill="url(#zkie9)" /></svg>';
    .base64DataUriBackground(@svg); /* IE9 */
    background:    -moz-linear-gradient(top, @start 0%, @end 100%); /* FF3.6+ */
    background:    -webkit-gradient(linear, left top, left bottom, color-stop(0%, @start),color-stop(100%, @end)); /* Chrome,Safari4+ */
    background:    -webkit-linear-gradient(top, @start 0%, @end 100%); /* Chrome10+,Safari5.1+ */
    background:    -o-linear-gradient(top, @start 0%, @end 100%); /* Opera 11.10+ */
    background:    -ms-linear-gradient(top, @start 0%, @end 100%); /* IE10+ */
    background:    linear-gradient(to bottom, @start 0%, @end 100%); /* W3C */
```

#### `.base64DataUriBackground()`

| | |
|---|---|
| Definitions | 1 (line 232) |
| Call sites | 7 (0 external, 7 inside `_zkmixins.less`) |
| Reachable | **no — dead, do not port** |
| Replace with | _nothing — drop the call_ |

> Pure IE9 support: base64-encodes an inline SVG with a hand-written JS encoder inside LESS
> backticks and emits it as a `background` data URI. Nothing to port — IE9 is not a supported
> target. Its seven call sites are all inside `_zkmixins.less`, from the gradient arms, which
> are themselves unreachable.

**Definition:** `.base64DataUriBackground(@svgToEncode, @type: ~"image/svg+xml")` — line 232

```less
    @dataUriPrefix: ~"url(data:@{type};base64,";
    @dataUriSuffix: ~")";
    @b64DataUri: ~`(function(a,b,c){function e(a){a=a.replace(/\r\n/g,'\n');var b='';for(var c=0;c<a.length;c++){var d=a.charCodeAt(c);if(d<128){b+=String.fromCharCode(d)}else if(d>127&&d<2048){b+=String.fromCharCode(d>>6|192);b+=String.fromCharCode(d&63|128)}else{b+=String.fromCharCode(d>>12|224);b+=String.fromCharCode(d>>6&63|128);b+=String.fromCharCode(d&63|128)}}return b}function f(a){var b='';var c,f,g,h,i,j,l;var m=0;a=e(a);while(m<a.length){c=a.charCodeAt(m++);f=a.charCodeAt(m++);g=a.charCodeAt(m++);h=c>>2;i=(c&3)<<4|f>>4;j=(f&15)<<2|g>>6;l=g&63;if(isNaN(f)){j=l=64}else if(isNaN(g)){l=64}b=b+d.charAt(h)+d.charAt(i)+d.charAt(j)+d.charAt(l)}return b}var d='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';return a+f(b)+c})('@{dataUriPrefix}','@{svgToEncode}','@{dataUriSuffix}')`;
    background: @b64DataUri;
```

#### `.resetGradient()`

| | |
|---|---|
| Definitions | 1 (line 238) |
| Call sites | 0 |
| Reachable | **no — dead, do not port** |
| Replace with | `background: none;` |

> Holds the file's only `progid:DXImageTransform` line (IE ≤9 filter syntax). Plan §P4 already
> established this contributes **0** output declarations, and this generator confirms why: zero
> call sites. `background: none` is the whole of its still-meaningful behaviour.

**Definition:** `.resetGradient()` — line 238

```less
    background: none;
    filter: progid:DXImageTransform.Microsoft.gradient(enabled=false);
```

## Caveats

### Prefixes that must survive a prefix-removal pass

Three prefixed properties in this file are **not** legacy duplicates — they have no
unprefixed equivalent, and a blanket "delete every `-webkit-`/`-moz-`" pass breaks them:

| Property | Where | Why it must stay |
|---|---|---|
| `-webkit-font-smoothing` | `.baseIconFont()` | non-standard; no standard form exists |
| `-moz-osx-font-smoothing` | `.baseIconFont()` | non-standard; no standard form exists |
| `-webkit-touch-callout` | `.userSelectNone()` | non-standard; iOS-only, no standard form |

`-webkit-user-select` (also in `.userSelectNone()`) is a fourth borderline case: the
unprefixed property exists, but older Safari needs the prefix. That one is a support-policy
call, not a fact.

### Guard dispatch has no CSS equivalent — and fails silently

`when (isstring(@value))` and `when not (isstring(@value))` pick an arm at COMPILE time.
When you inline a mixin body you are choosing one arm permanently; check which one your
call actually hit. Worse, `.encodeURL()`/`.encodeThemeURL()` guard on a *property name*
(`background` or `background-image`), so a call passing anything else matches no arm and
emits nothing at all, with no error. If you have such a call, dropping LESS will make the
silent no-op visible — that is a fix, not a regression.

### `e()` and LESS backtick evaluation are LESS-only

`e(@value)` unquotes a value; a backtick expression runs JavaScript inside the compiler
(the gradient group uses it to build colour-stop lists and to base64-encode an SVG).
Neither has a CSS equivalent. In practice this costs nothing: everything that used them is
either dead, or used them only to pass a value through unchanged.

## Method

- **Definitions** are lines starting at column 0 with `.name(`. Nested mixin *calls* are
  always indented, which is what separates the two.
- **Call sites** are `.name(` occurrences in every `.less` file under
  `src/main/resources/web/`, excluding definition lines, with a preceding-character guard
  so `.encodeURL(` does not match inside `.encodeURL-verGradient(`.
- **Reachability** starts from mixins called from outside `_zkmixins.less` and propagates
  through intra-file calls. A mixin called only by unreachable mixins is unreachable.
- Nothing here is read from `baseline/` or `target/`; the table is reproducible from
  source alone.

### Assertion ledger

Plan §P8 requires this generator to carry assertions so the table cannot drift silently.

| Assertion | Expected (plan) | Measured | Result |
|---|---|---|---|
| definition lines | 38 | 38 | PASS |
| unique mixin names | 30 | 30 | PASS |
| prefix fan-out call sites (plan §P4) | 245 | 245 | PASS |
| prefix fan-out expansions (plan §P4) | 1225 | 1225 | PASS |
| mixins without an annotation | 0 | 0 | PASS |
| annotations with no matching mixin | 0 | 0 | PASS |
| annotations with an unknown group | 0 | 0 | PASS |
| definitions with an empty body | 0 | 0 | PASS |

---

_38 definition lines, 30 unique mixin names, 11 dead._
