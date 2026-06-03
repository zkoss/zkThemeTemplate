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

## Bundle

`notification.css.dsp` and `toast.css.dsp`.
