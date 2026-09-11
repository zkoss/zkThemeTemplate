# Generator brief — item 3.9, the Marble pointer in zk/CLAUDE.md and the two lint lines

Status: written 2026-09-11 (P3 session) after 3.4 landed. Embedded verbatim in `marble-p3-verify.js`; `{ROW}` = row 3.9,
`{COMMON_RULES}` shared. The pointer text is the user-approved draft (gates/3.3.md, 2026-09-10) and is copied, not retyped. The lint-line
correction is the P1 gate's follow-up (F45 / F47). Planner dry-run of `verify-3.9.sh`: `environment` passes, stops at `pointer appended`.

---

You are the GENERATOR for item 3.9 of the Marble → zk migration (P3). Two small edits in zk's project instructions: (1) append the
approved Marble pointer section to `/Users/hawk/Documents/workspace/ZK10/zk/CLAUDE.md`, byte for byte from the draft file; (2) in
`/Users/hawk/Documents/workspace/ZK10/zk/.github/copilot-instructions.md` replace the two lines that tell people to run `npm run lint -- .`
— a command that cannot pass on any checkout and rewrites files — with what CI actually runs. A different agent verifies with
`bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.9.sh`; run it yourself as your self-check.

If the pointer is already present (grep `marble-theme/SKILL.md` in CLAUDE.md), do not append it again; run the self-check and report.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly two files: /Users/hawk/Documents/workspace/ZK10/zk/CLAUDE.md (append only — change nothing above the new
  section) and /Users/hawk/Documents/workspace/ZK10/zk/.github/copilot-instructions.md (exactly two lines change). Nothing else.

READ (and nothing else): /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/drafts/zk-claude-md-pointer.md (9 lines);
/Users/hawk/Documents/workspace/ZK10/zk/.github/copilot-instructions.md lines 36–43 and 140–146.

WRITE:
1. CLAUDE.md: append one empty line, then the draft file's content unchanged — as a command, so nothing is retyped:
   cd /Users/hawk/Documents/workspace/ZK10/zk && printf '\n' >> CLAUDE.md && cat /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/drafts/zk-claude-md-pointer.md >> CLAUDE.md
   (CLAUDE.md already ends with a newline; the result is the old file + one blank line + the 9 draft lines.)
2. .github/copilot-instructions.md — two exact line replacements, nothing else on those lines or elsewhere:
   - the line `npm run lint -- .    # ESLint on .js and .ts files (path argument required)` becomes
     `npm run lint -- <module>/src/main/resources/web/js   # ESLint per module (what CI's jscheck runs); the repo-wide form cannot pass and rewrites files`
   - the line `7. Run \`npm run lint -- . && ./gradlew checkstyleMain\`` becomes
     `7. Run \`npm run lint -- <module>/src/main/resources/web/js && npm run type-check && ./gradlew checkstyleMain\` (per module — the repo-wide lint cannot pass on any checkout and rewrites files through zk/preferNativeClass)`

SELF-CHECK (report raw output): `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.9.sh` — it must end with
`3.9 ok — pointer appended byte-identically, two lint lines replaced`. On a `FAIL at:` line, paste it into blockers and stop; do not touch
the draft or the verify script.
