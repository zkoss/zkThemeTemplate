## Marble theme (default look-and-feel from ZK 11.0)

Read `.claude/skills/marble-theme/SKILL.md` before touching any theme CSS, token, or `.css.dsp` registration.

- Layout: tokens/base/utility CSS under `zul/src/main/resources/web/zul/css/`; per-component CSS under `zul/src/main/resources/web/js/zul/<pkg>/css/`; EE/PE component CSS lives in `../zkcml/` (`zkmax`, `zkex`).
- Two frequent mix-ups: you edit `.css`, but the file ZK serves is the generated `.css.dsp`; no stylesheet loads by convention — each one is declared explicitly in `lang.xml` / `lang-addon.xml`.
- Every custom property uses the `--zk-` prefix; no hardcoded color values.
- Verification harness and preview module: documented in the skill's `reference/verification.md`.
- Full token/architecture rules: `doc/spec/index.md`.
