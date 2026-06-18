# Component: notification (theme design)
tier: T1
category: feedback
preview: http://localhost:8080/notification.zul
rules: see .claude/skills/zk-component-rules/components/toast-notification.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- MUI CSS: Snackbar.css / Alert.css
- Mira HTML: doc/mira/alerts.html, doc/mira/snackbars.html
- DESIGN.md sections: §3, §6, §11

## Expected values

> `.z-notification` is a bare layout shell — NO background, padding, shadow or
> radius (see skill `toast-notification.md`). All visual card styling lives on
> `.z-notification-content`. Putting padding on the shell shifts the absolute
> `.z-notification-icon` onto the accent stripe; putting a background on it
> double-paints behind the card. (Gap 2026-06-18: a duplicate `.z-notification`
> rule in misc.css regressed exactly this.)

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-notification-content` | min-height | 48px |
| c2 | `.z-notification` | padding | 0 (shell carries no padding) |
| c2b | `.z-notification` | background-color | transparent (no frame behind the card) |
| c3 | `.z-notification-content` | border-radius | 4px |
| c4 | `.z-notification-content` | box-shadow | level-2 |
| c5 | `.z-notification-content` | font-size | 13–14px |
| c6 | `.z-notification-info .z-notification-content` | background | rgba(2,136,209,0.12) tint |
| c7 | `.z-notification-success .z-notification-content` | background | surface-container-highest (no info/success-tint rule defined) |
| c8 | `.z-notification-warning .z-notification-content` | background | rgba(237,108,2,0.12) tint |
| c9 | `.z-notification-error .z-notification-content` | background | rgba(211,47,47,0.12) tint |
| c10 | `.z-notification-icon` | size | 20–24px, matching status colour; left edge clears the 4px stripe |

## States to evaluate
- [ ] info, success, warning, error
