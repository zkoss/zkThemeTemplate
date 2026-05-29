# Component: captcha
tier: T3
category: utility
shared-css-file: src/main/resources/web/js/zul/wgt/css/captcha.css
siblings: []
preview: (no dedicated preview yet — captcha is in CE `org.zkoss.zul.Captcha`)

## T3 metadata

library: server-rendered image (zul CaptchaEngine renders a PNG/JPEG on the server; client receives an `<img>`)
library-version: ZK 10.x core
theme-bridge:
  available: false           # the image content is pixels — no CSS hooks
  variables: {}
wrapper-selectors:
  - .z-captcha               # root `<img>` element
forbidden-selectors:
  - (none — the image content is opaque pixels, not DOM. No internal selectors exist.)
escalation-path: ESCALATED_LIBRARY_CONFIG  # changing the rendered image (font, colour, distortion) requires CaptchaEngine.java changes, not CSS

## References
- ZK source: /Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/java/org/zkoss/zul/Captcha.java
- ZK widget: /Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/zul/wgt/Captcha.ts
- DESIGN.md sections: §5, §11

## DOM key selectors (wrapper-only)
```
img.z-captcha               ← the rendered captcha image
```
The captcha may be surrounded by an inputgroup (label + textbox for the answer + captcha image + refresh button) but each piece is a separate ZK widget. This contract only covers the `<img class="z-captcha">`.

## Expected values

| id | selector | property | expected | source |
|----|----------|----------|----------|--------|
| c1 | `img.z-captcha` | border | 1px solid rgba(0, 0, 0, 0.12) (subtle outline-variant) | DESIGN.md §11 |
| c2 | `img.z-captcha` | border-radius | 4px | DESIGN.md §5 |
| c3 | `img.z-captcha` | display | inline-block OR block | infer |
| c4 | `img.z-captcha` | background-color | rgb(255,255,255) | DESIGN.md §1 |
| c5 | `img.z-captcha` | min-height | 39–48px (matches input rhythm so it lines up with the answer textbox beside it) | DESIGN.md §10 |

## States to evaluate
- [ ] default rendered (image visible, wrapper bordered)
- [ ] (no hover / focus / disabled states meaningful on an image)

## Notes for Generator
- Image refresh affordance (if implemented) is typically a separate `<button>` next to the image, not part of this widget. Style that as a regular icon-button via toolbarbutton rules.
- The actual captcha glyph styling (font, colour distortion) is server-side. Any "make the captcha letters match Mira" feedback escalates to `ESCALATED_LIBRARY_CONFIG`.
