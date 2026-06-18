# toast / notification

Transient overlays. Toast is fully ephemeral; notification can be sticky or dismissible.

## Toast: nine position classes

Toast supports 9 positions, set via the `position` attribute:

```
.z-toast-position-top-left
.z-toast-position-top-center
.z-toast-position-top-right
.z-toast-position-middle-left
.z-toast-position-middle-center
.z-toast-position-middle-right
.z-toast-position-bottom-left
.z-toast-position-bottom-center
.z-toast-position-bottom-right
```

Default is typically `bottom-center` or `top-center` depending on theme.

## Severity classes

Both toast and notification accept a `type` attribute that becomes a severity class:

- `.z-notification-info` (or `.z-toast-info`)
- `.z-notification-warning`
- `.z-notification-error`
- `.z-notification-success` (some versions)

Style by severity to align with theme colours (the semantic palette).

## Inner DOM structure

Toast:
```
.z-toast[.z-toast-position-*][.z-toast-*type*]
└─ .z-toast-content              (message text)
└─ .z-toast-close                (close button, when closable)
```

Notification:
```
.z-notification[.z-notification-*type*]
├─ .z-notification-icon          (severity icon)
├─ .z-notification-content       (message text)
└─ .z-notification-close         (close button)
```

## Auto-dismiss

Toasts auto-dismiss; notifications stay until the user closes them (a close button is provided when `closable="true"`).

## .z-notification is a bare layout container — NO visual styling on it

`.z-notification` is a `display: table` positioning shell. All visual card styling (background color, shadow, border-radius, padding) belongs exclusively on `.z-notification-content`.

**Never put on `.z-notification`:**
- `padding` — shifts `.z-notification-content` inside the table, breaking `.z-notification-icon` positioning (icon `left: 16px` is measured from the notification outer edge, not the content edge)
- `box-shadow` — creates a double shadow (content already has one) and the transparent padding gap shows the page background through it, creating a dark halo
- `border-radius` — redundant; only the content's radius matters visually

**Always put on `.z-notification-content`:**
```css
.z-notification-content {
    /* visual card: background, radius, shadow, padding */
    border-radius: ...;
    box-shadow: ...;
    background-color: ...;
    padding: ...; /* left-padding must include room for the icon: stripe-width + gap + icon-width */
}
```

## Icon positioning is relative to .z-notification (not to content)

`.z-notification-icon` is a direct sibling of `.z-notification-content` inside `.z-notification`, and is `position: absolute`. Its containing block is `.z-notification`. Therefore:

- If `.z-notification` has **no padding**, icon `left: 16px` = 16px from the content's left edge ✓  
- If `.z-notification` has `padding-left: 16px`, icon `left: 16px` = 0px from the content's left edge → icon sits directly on the 4px accent stripe ✗

The content's `padding-left` (typically 52px: 4px stripe + 16px gap + 20px icon + 12px) is measured from the content's own left edge, not from the notification's left edge.

## Preview gallery MUST include the icon element

Static mockups must replicate the real DOM structure. Without the `.z-notification-icon` element in the gallery, the icon-stripe overlap bug is invisible. Always author gallery entries as:

```html
<div class="z-notification z-notification-info" style="position:relative;">
  <i class="z-notification-icon z-icon-info-circle"/>
  <div class="z-notification-content">…</div>
</div>
```

## Bundle

`notification.css.dsp` and `toast.css.dsp`.
