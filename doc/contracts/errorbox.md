# Component: errorbox
tier: T2
category: feedback
shared-css-file: src/main/resources/web/js/zul/wgt/css/errorbox.css
siblings: []
closest-sibling: notification
decomposition: tooltip surface (small floating callout with pointer caret) + error variant of notification (red bg + white text)
preview: trigger validation in any input preview that uses Constraint (e.g., http://localhost:8080/textbox.zul)

## References
- DESIGN.md sections: §3, §6, §7
- Closest-sibling CSS to read first: `src/main/resources/web/js/zul/wgt/css/notification.css` (specifically the `-error` variant) — reuse colour + radius + shadow
- For the pointer/caret triangle: use a `::before` or `::after` pseudo-element with `border` trick; no MD3 spec for this — keep minimal.
- Closest MUI: FormHelperText (semantics) + Tooltip arrow (caret).

## DOM key selectors
```
.z-errorbox
.z-errorbox-pointer                   ← arrow caret
.z-errorbox-content                   ← message wrapper
.z-errorbox-close
```

## Expected values (T2)
- Background: rgb(211, 47, 47) (error) OR rgba(211,47,47,0.9).
- Color: rgb(255, 255, 255).
- Padding: 8px 12px.
- Border-radius: 4px.
- Font-size: 12–13px.
- Box-shadow: level-2.

## States to evaluate
- [ ] visible on validation failure, with pointer caret, dismissible
