# Component: inputgroup
tier: T2
category: input
shared-css-file: src/main/resources/web/js/zul/wgt/css/inputgroup.css
siblings: []
closest-sibling: textbox
decomposition: textbox (centre input) + prefix/suffix adornments (text or icon)
preview: http://localhost:8080/inputgroup.zul

## References
- DESIGN.md sections: §1, §5, §7, §11
- Closest-sibling CSS to read first: `src/main/resources/web/js/zul/inp/css/input.css`
- MUI reference for adornments: `/Users/hawk/.../static-css-output/TextField.css` (InputAdornment section)
- Close to MUI InputAdornment pattern.

## DOM key selectors
```
.z-inputgroup                      ← wrapper
.z-inputgroup-content
.z-inputgroup-prefix / -suffix     ← adornments (icons/text)
```

## Expected values (T2 — DESIGN.md tokens only)
- Border / radius / focus state should match other inputs (combobox/textbox).
- Adornment text uses on-surface-variant colour.

## States to evaluate
- [ ] default, hover, focus, disabled, sibling-coherence (compare to textbox)
