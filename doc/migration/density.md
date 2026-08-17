# Compact density → one library property (migration guide)

**Hand-written.** Unlike its two neighbours in this directory
([`less-var-to-token.md`](less-var-to-token.md), [`mixin-to-css.md`](mixin-to-css.md)) this file is
not generated — there is no table to derive, because the whole migration is one property.

In ZK 11 the `iceblue11` theme selects compact density from a **library property read on the
server while the stylesheet is rendered**. That single switch drives the desktop stylesheet and
`zkmax`'s tablet touch layer together. Everything it replaces — a second shipped jar, a LESS
variable, a rebuild — is gone.

Every number quoted below was measured on this tree on 2026-08-17, by
`npm run check:density-property` and `npm run check:tablet-density` (both are gates, so they are
re-measured on every change rather than transcribed) and by a direct comparison against the
`org.zkoss.theme:iceblue_c:11.0.0.FL.20260812-Eval` jar.

## What to do

Set one property in `WEB-INF/zk.xml`:

```xml
<library-property>
    <name>org.zkoss.zul.theme.density</name>
    <value>compact</value>
</library-property>
```

Leave it out for the default density. **Any unrecognised value is the default density too** — a
typo in `zk.xml` cannot silently switch an application to compact.

## Where you are coming from

| If you used to… | Now |
|---|---|
| ship `iceblue_c.jar` and set `org.zkoss.theme.preferred=iceblue_c` | ship `iceblue11.jar`, set `org.zkoss.theme.preferred=iceblue11`, add the property above. `iceblue_c` is retired: this theme plus the property is what replaces it |
| edit `@themeProfile: "compact"` in `zul/less/_zkvariables.less` and rebuild the theme jar | delete that edit. The property replaces it; `@themeProfile` no longer selects anything |
| point `zul/css/norm.css`'s first `@import` at `tokens/_compact.css` (only possible between the LESS removal and this release) | delete that edit. It changes the desktop sheet but **not** the tablet sheet — see [The trap this replaced](#the-trap-this-replaced) |
| read a pre-release note about a Java API (`IceblueDensity.apply(...)`) | there is no such class. It was built, then withdrawn before release — see [Density does not switch at runtime](#density-does-not-switch-at-runtime) |

The first two rows are the ones that describe applications people actually ship; rows three and
four only exist in the window between this theme dropping LESS and this release. For row one the
change is **equivalent in behaviour and much cheaper in delivery**: one property instead of a
second 282792-byte artifact that has to be released, versioned and kept in step with the default
theme.

To try compact without editing `zk.xml` — while comparing the two, say — the same property can be
handed to the JVM instead: `-Dorg.zkoss.zul.theme.density=compact`.

## What the property actually does

It is read in two places, and they are the two stylesheets that carry density:

| Stylesheet | Scope | Reaches the browser when |
|---|---|---|
| `zul/css/norm.css.dsp` | the `--zk-*` token layer, i.e. the whole desktop theme | always |
| `zkmax/css/tablet.css.dsp` | the touch layer — larger hit targets, spacing | **ZK EE only**, and only on a mobile user agent |

Both are rendered server-side, so compact costs **no extra request and cannot flash the default
density first**, and an application on the default density does not download the compact rules at
all.

Measured, three states each:

| `org.zkoss.zul.theme.density` | desktop bundle (`zul/css/zk.wcs`) | compact token block | tablet sheet |
|---|---|---|---|
| unset | 526988 B | absent | 26207 B — 895 declarations |
| `compact` | 541383 B | present, ×1, keyed on `:root` | 24308 B — 869 declarations |
| `foo` (unrecognised) | 526988 B | absent | 26207 B — 895 declarations |

Both compact halves are checked against external references rather than against themselves:

- the **desktop** block is 350 declarations derived from the 862 tokens of
  `zul/css/tokens/_compact.css` (333 seeds plus their closure), and every one of them is present in
  that jar's own token block with the same value — **0 missing, 349 identical character for
  character**, and the one remaining difference is a serialization of the same length
  (`16px 0px` here, `16px 0` in the jar, on `--zk-messagebox-window-content-padding`);
- the **tablet** sheet is compared declaration by declaration against that same jar:
  **869 = 869, 0 missing / 0 extra / 0 differing**. The two default states are compared against the
  sheet the theme has always served: **895 = 895**, likewise exact.

In other words, compact is not a re-interpretation of `iceblue_c` — it is the same stylesheet,
selected differently.

## Density does not switch at runtime

**There is no API to change density while an application is running, on either layer, and this is
the specification rather than an unfinished edge.**

The reason is worth stating plainly, because "one property" can read like a reduction: **the
previous version had no runtime switch either.** Changing density meant editing a LESS variable,
rebuilding the theme jar, and swapping the jar in `WEB-INF/lib`. Against that baseline, a
library property is the same capability delivered for a fraction of the cost. Nothing that used
to work has stopped working.

Consequences to plan around:

- **Density is a per-application setting.** You cannot mark one dialog or one region compact
  while the rest of the page stays default.
- **You cannot mark a subtree back to default** inside a compact application.
- **The tablet layer follows the same property and nothing else.** This matters more than it
  sounds: it is the reason a compact desktop can no longer be paired with a default-density touch
  layer.

Runtime switching may be reconsidered in a later version. If it returns it will be additive — an
application that sets only the property today will keep working unchanged.

## The trap this replaced

Before this release the desktop half was selected by editing `zul/css/norm.css`'s first `@import`
and the tablet half by editing `@themeProfile`. Two switches for one decision, and the failure was
silent: setting only `@themeProfile` produced a `norm.css.dsp` byte-identical to the default build
(still 16px) while `tablet.css.dsp` really did switch — **a compact desktop with a default-density
touch layer, visible only on a phone, and no build-time check could see it.**

That is why the desktop sheet no longer accepts a source-level switch at all. Editing that
`@import` still "works" for the sheet in front of you, which is exactly what makes it dangerous:
the tablet sheet cannot read it.

## Customizing the compact values

`zul/css/tokens/_compact.css` remains public and overridable, in two different senses. They are
not alternatives — pick the one that matches whether you maintain a fork.

**If you forked the theme** (build time): edit `tokens/_compact.css`, then **re-run
`npm run gen:density-css`**. That file is an *input* to a generator, not a stylesheet that ships;
the jar contains only `.css.dsp`. Forgetting the regeneration fails `npm run check:gate`
(`check:density-css`) rather than shipping a stale block.

**If you consume the jar** (run time): the compact block is one `:root` rule near the end of
`norm.css.dsp`. Any stylesheet your application loads after the theme overrides it by ordinary
cascade order — no hook, no API, no fork:

```css
/* loaded after the theme */
:root { --zk-base-font-size: 13px; }
```

## Verifying which density you are on

The base font size is the cheapest tell — 16px default, 12px compact. In the browser console:

```js
getComputedStyle(document.documentElement).getPropertyValue('--zk-base-font-size')
```

For the tablet layer, request the page with a mobile user agent on a ZK EE deployment; the touch
sheet is not injected otherwise, in either density.

## If you really want the old arrangement

A fork can still hard-wire one density and ship it as a separate artifact: point `norm.css`'s
first `@import` at `tokens/_compact.css` **and** swap the two blocks in `zkmax/css/tablet.css` so
the compact one is unconditional. Both edits are required — that is the point of this guide — and
you inherit the problem the property was created to remove: a second artifact to release and keep
in step. `iceblue_c` is the cautionary case — its published versions in the evaluation repository
run `…10.3.1-Eval` then straight to `11.0.0.FL.20260812-Eval`, with **no 10.4.0 line at all**,
while ZK core released `10.4.0`. A second shipped artifact drifts, because keeping it in step is
nobody's daily job.

**Upgrading to ZK 11 and adopting the property are not separable the way dropping LESS is** — the
property is the only density switch in the shipped theme. What is separable is *when* you drop
your own `.less` files; see [`less-var-to-token.md`](less-var-to-token.md#escape-hatch).
