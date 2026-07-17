# Remove badge / avatar / chip utility CSS — DONE (superseded)

**This runbook is complete.** It has been superseded by the ZK 10.4 native-component migration.

The theme's hand-rolled `.z-badge` / `.z-chip` / `.z-avatar` utility CSS was **not** simply
deleted — with the **ZK 10.4.0.FL.20260713-Eval** upgrade these became native ZK components
(`badge`, `chip`, `avatar`, `avatargroup`), and the theme now styles the native widgets.

See **[doc/spec/native-modern-ui-components.md](spec/native-modern-ui-components.md)** for the
current contract, class/attribute reference, and the old-utility → native-severity mapping.

(The earlier phase of this runbook — removing the `usecase2/` SPA and `doc/mira/` — was carried
out in commit `fc464d8`.)
