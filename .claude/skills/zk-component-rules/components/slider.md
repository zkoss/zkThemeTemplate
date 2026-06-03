# slider

A draggable handle (the "knob") on a track.

## State support: minimal

Slider does **not** emit `.z-slider-disabled` or `.z-slider-invalid` classes the way input components do. State support:

| State | Mechanism |
|-------|-----------|
| disabled | `[disabled]` attribute on root |
| readonly | not supported |
| invalid | not supported |
| inplace | not supported |

When styling disabled slider, the selector is `.z-slider[disabled]`, **not** `.z-slider-disabled`.

In preview matrices, slider gets only a "Default" column. Do not author Disabled/Readonly/Invalid/Inplace columns for slider — they would render identically to Default or break.

## Molds

Three molds change the visual style of the knob:

- **default** — round flat knob
- **sphere** — gradient sphere (mold="sphere")
- **scale** — knob with a vertical scale indicator (mold="scale")

The mold attribute adds `.z-slider-{mold}` class to the root.

## Orientation

`orient="horizontal"` (default) or `orient="vertical"`. The orientation class is on the root: `.z-slider-horizontal` / `.z-slider-vertical`. Vertical sliders need an explicit `height` to render.

### Vertical coordinate semantics: min=top, max=bottom

`Slider._fixPos()` writes:

```js
this.$n_('area').style[vert ? 'height' : 'width'] = newPos;
btn.style[vert ? 'top' : 'left'] = newPos;
```

`newPos` is the px offset of the **thumb** from the top of `.z-slider-center`. ZK's vertical convention is **min at the top, max at the bottom** — bigger value → larger `top` → larger `height` for `.z-slider-area`.

Implication for CSS: `.z-slider-vertical .z-slider-area` **must anchor at `top: 0`** (`bottom: auto`). If you anchor at `bottom: 0`, the fill renders at the opposite end from the thumb — visually the area looks "detached" from the button. (Some Sapphire-style themes flipped the semantics, but stock ZK 10 keeps min=top.)

## DOM structure

```
.z-slider[.z-slider-{horizontal|vertical}][.z-slider-{mold}]
├─ .z-slider-rail            (the track)
├─ .z-slider-runner          (the draggable area)
└─ .z-slider-button          (the knob)
```

## Optional value input

When `showTooltip="true"` or similar, an additional `input.z-slider-input` element may render alongside the slider for numeric entry.

## Class name caution

Older theme docs (including `doc/component-dom-structures.md`) may reference `.z-slider-center` (track) and `.z-slider-area` (fill). These reflect an older ZK version. ZK 10 emits `.z-slider-rail` (track) and `.z-slider-runner` (fill). Do not author rules for the old names.

`.z-slider-indeterminate` has been documented in some versions — verify against live ZK 10 output before using.

## Related: multislider, rangeslider

- **multislider** (EE) — multiple thumbs on one track
- **rangeslider** (PE) — two thumbs marking a range

Both reuse much of slider's CSS but add their own `-multi` / `-range` modifier classes.

### `.z-rangeslider-track` is the rail, **not** the filled portion

Element naming is misleading. From `mold/rangeslider.js`:

```
.z-rangeslider
└─ .z-rangeslider-inner            (sizing container)
   ├─ .z-rangeslider-track         ← FULL TRACK RAIL (not filled span)
   ├─ .z-rangeslider-marks
   └─ .z-sliderbuttons
      ├─ .z-sliderbuttons-area     ← FILLED portion between thumbs (JS sets left/width)
      ├─ .z-sliderbuttons-button   ← thumb 1
      └─ .z-sliderbuttons-button   ← thumb 2
```

CSS must give `.z-rangeslider-track` **measurable** width/height (typically `inset: 0` over the inner). `Rangeslider.ts` `getSliderSize_()` calls `jq($n_('track')).width()` to derive the slider's px size — if the track has 0 width, every drag computes percent = `mouseOffset / 0 = Infinity` and the thumb snaps to 100%.

`.z-sliderbuttons-area` gets its color (filled fill) from CSS; its position is set by ZK JS via inline `style="left: X%; width: Y%"`.

The same convention applies to **multislider**.

## Bundle

`slider.css.dsp` — one-to-one mapping. No sibling impact.
