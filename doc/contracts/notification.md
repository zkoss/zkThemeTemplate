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

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-notification` | min-height | 48px |
| c2 | `.z-notification` | padding | 12px 16px |
| c3 | `.z-notification` | border-radius | 4px |
| c4 | `.z-notification` | box-shadow | level-2 |
| c5 | `.z-notification` | font-size | 13–14px |
| c6 | `.z-notification-info` | background | rgba(2,136,209,0.1) tint or solid info |
| c7 | `.z-notification-success` | background | rgba(76,175,80,0.1) tint |
| c8 | `.z-notification-warning` | background | rgba(237,108,2,0.1) tint |
| c9 | `.z-notification-error` | background | rgba(211,47,47,0.1) tint |
| c10 | `.z-notification-icon` | size | 20–24px, matching status colour |

## States to evaluate
- [ ] info, success, warning, error
