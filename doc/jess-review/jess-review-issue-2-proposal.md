# Issue #2 — align `secondary` and `status-info` with MD3

Tracker: `hawkchen/marble-issue#2` · severity as filed: *Polish* · page `utility/colors`
Status: **proposal — not implemented.** Awaiting D22 / D23 / D24.

---

## 1. Jess's diagnosis is correct on both counts (measured)

| | L | C | hue | hue Δ vs primary |
|---|---|---|---|---|
| `primary` `#376fd0` | 0.556 | 0.161 | 260.6° | — |
| `secondary` `#4db6ac` (today) | 0.712 | 0.098 | 186.7° | **74.0°** |
| `status-info` `#0288d1` (today) | 0.603 | 0.147 | 243.5° | **17.1°** |

- `secondary` really is in an unrelated hue family. MD3 derives secondary from the same
  source colour as primary (same hue, reduced chroma); a 74° offset reads as a second brand.
- `status-info` really is hard to separate from `primary`: 17° of hue and a perceptual
  distance of **ΔE 0.067** (OKLab), where ~0.02 is the just-noticeable threshold on large
  areas. They are distinguishable but only just.

Her proposed `secondary` value is well chosen: `#5a6f96` = L 0.541, C 0.066, hue 262.5° —
i.e. primary's hue at 41% of its chroma. That is exactly the MD3 recipe.

## 2. But her `status-info` proposal makes contrast worse everywhere

`--zk-color-status-info` feeds three functionally different paths, each with its own floor:

| path | consumers | floor | today | Jess `#0097c4` |
|---|---|---|---|---|
| solid fill + white text | `.z-button-info`, `--zk-badge-bg` | 4.5:1 | 3.86 ❌ | **3.37 ❌** |
| text / icon on white | `.z-text-info`, notification / confirmpopup / toast icons | 4.5:1 text, 3:1 icon | 3.86 | **3.37** |
| icon on its own 12% tint | `.z-notification-info` | 3:1 | 3.33 ✅ | **2.94 ❌** |
| L-capped `-fill` | `.z-bg-info` | 4.5:1 | 5.01 ✅ | 4.91 ✅ |

Her hue move (243.5° → 228.1°) is the right direction; the problem is that `#0097c4` is also
*lighter* (L 0.603 → 0.632). Every white-on-colour and colour-on-white number drops, and the
notification icon falls below the 3:1 non-text floor (WCAG 1.4.11).

**Her cap change is the sharper problem.** Raising `--zk-color-status-info-fill` from
`min(l, 0.54)` to `min(l, 0.60)` takes `.z-bg-info` from 5.01:1 to **3.83:1 — a straight AA
failure**. The 0.54 cap is the theme's one-directional legibility guarantee (see
`doc/spec/auto-contrast-text.md`); the highest cap that still clears 4.5:1 at this hue is
**0.56**. Recommendation: adopt her hue, reject the cap change.

## 3. A pre-existing defect this issue walks into

The `.z-bg-*` utilities route through the L-capped `-fill` tokens and are safe by
construction. The **solid `.z-button-*` variants use the raw seeds** with `color: #fff`:

| role | raw seed | white on raw | L-capped fill | white on fill |
|---|---|---|---|---|
| primary | `#376fd0` | 4.83 ✅ | `#326acb` | 5.17 ✅ |
| secondary | `#4db6ac` | **2.44 ❌** | `#008178` | 4.81 ✅ |
| success | `#2e7d32` | 5.13 ✅ | `#2e7d32` | 5.13 ✅ |
| warning | `#ed6c02` | **3.11 ❌** | `#bd3f00` | 5.46 ✅ |
| error | `#d32f2f` | 4.98 ✅ | `#c92226` | 5.61 ✅ |
| status-info | `#0288d1` | **3.86 ❌** | `#0075bc` | 5.01 ✅ |

Three of six solid button variants fail AA today, and `--zk-badge-bg` (default badge, white
text on `status-info`) fails the same way. `.z-messagebox-question` puts `secondary` teal on
a white surface at 2.44:1, below even the 3:1 icon floor.

The mechanism to fix it already exists and is already used by the utilities — the solid
variants simply don't point at it. Issue #2 changes two of the failing colours, so the
decision cannot be dodged: the secondary change *fixes* its instance, the info change as
filed *worsens* its instance.

---

## 4. What I propose

### `secondary` — derive it from primary instead of picking a literal

```css
/* before */
--zk-color-secondary: #4db6ac;

/* after — primary's hue at 41% chroma, L pinned to the fill cap */
--zk-color-secondary: oklch(from var(--zk-color-primary) 0.54 calc(c * 0.41) h);
```

This resolves to `#586f95` — visually the same colour Jess asked for (`#5a6f96`: L 0.541 vs
0.540, C 0.066 vs 0.066, hue 262.5° vs 260.6°) — and it is the same `oklch(from …)` idiom
the containers already use. The difference from a literal is that it **survives a brand
override**:

| brand preset | primary | derived secondary | hue Δ | white on it |
|---|---|---|---|---|
| default | `#376fd0` | `#586f95` | 0° | 5.07 ✅ |
| marine | `#00729c` | `#557384` | 0° | 5.01 ✅ |
| slate | `#506274` | `#687077` | 0° | 5.05 ✅ |
| copper | `#b45309` | `#8c6450` | 0° | 5.17 ✅ |
| rose | `#be185d` | `#965a69` | 0° | 5.29 ✅ |

With a literal, `data-brand="rose"` would put a blue-grey secondary next to a crimson
primary — reintroducing the exact "unrelated second brand" complaint Jess filed, for four of
the five shipped presets. An explicit customer `--zk-color-secondary` override still wins,
so the documented escape hatch is unchanged.

### `status-info` — keep her hue, lower the lightness instead of raising it

```css
/* before */
--zk-color-status-info: #0288d1;
--zk-color-status-info-fill: oklch(from var(--zk-color-status-info) min(l, 0.54) c h);

/* after — hue 228 as Jess proposed, L 0.56 so every path clears its floor */
--zk-color-status-info: #0081ad;
/* -fill cap unchanged at 0.54 */
```

| | today `#0288d1` | Jess `#0097c4` | proposed `#0081ad` |
|---|---|---|---|
| hue Δ vs primary | 17.1° | 32.5° | **32.5°** |
| ΔE vs primary | 0.067 | 0.116 | **0.084** |
| white on solid | 3.86 ❌ | 3.37 ❌ | **4.52 ✅** |
| on white (text) | 3.86 ❌ | 3.37 ❌ | **4.52 ✅** |
| icon on 12% tint | 3.33 ✅ | 2.94 ❌ | **3.86 ✅** |
| `.z-bg-info` fill | 5.01 ✅ | 3.83 ❌ | **4.91 ✅** |

It buys 26% more perceptual separation than today and clears every floor. Jess's literal buys
73% more separation but fails three floors.

### Housekeeping that rides along

- `button.css` carries stale hardcoded fallbacks (`var(--zk-color-secondary, #4db6ac)` ×6,
  `var(--zk-color-status-info, #0288d1)` ×4). The tokens always ship, so the fallbacks are
  unreachable — but they would now be wrong. Drop them or update them.
- `doc/spec/brand-override.md` calls each role "a *seed*" and lists `secondary` derivations
  from a literal `#4db6ac`. Both need updating if secondary becomes derived.
- `doc/spec/DESIGN.md` / the `utility/colors` preview page swatch comments quote the old hex.

## 5. How this gets verified

Not by screenshots — the baselines are already dirty (49 files) and the change is a token
value. Verification is computed-style probes on the running app:

1. `getComputedStyle` on `.z-bg-secondary` / `.z-bg-info` / `.z-button-secondary` /
   `.z-button-info` / `.z-badge` / `.z-messagebox-question`, converted to a contrast ratio,
   asserted against the floors in the tables above.
2. The same probe under each of the five `data-brand` presets, to prove the derived
   secondary tracks the seed.
3. `component-theming`, `forced-colors`, `framework`, `reset`, `print`, `responsive`,
   `smoke`, `zindex` — the eight computed-style projects — must stay green.
4. One screenshot page (`utility/colors`) refreshed deliberately, so Jess can see the result.
