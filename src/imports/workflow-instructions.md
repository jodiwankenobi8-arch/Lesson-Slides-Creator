STRICT EXECUTION + BATCH APPLY MODE (NO NARRATION, NO “DONE” LIES)

You are in a loop of narrating + partial work + claiming completion. Stop.

GLOBAL RULES

No analysis text, no explanations, no “more”, no summaries.

Do not output plans. Do not output audits. Do not propose next steps.

Only output exactly what I ask for in “OUTPUT” sections.

If you can’t complete a requirement, say “BLOCKED:” and paste the exact blocking error/log.

WORKFLOW (MUST FOLLOW)

You will do the work in this order, and you will not change the order:

1) BUILD-UNBLOCK FIRST

Fix any “Failed to fetch dynamically imported module /App.tsx” or routing crash BEFORE any theme work.

2) REMOVE RECOVERY POPUP COMPLETELY (NO UI PROMPTS EVER)

In src/app/App.tsx: remove all auto-recovery code:

remove imports from ./utils/auto-recovery

remove any getRecoverySnapshot() calls

remove restore/discard handlers

remove any stopAutoRecovery() calls

Delete src/app/components/recovery-prompt.tsx

Ensure startAutoRecovery() is not called anywhere (no popup can ever appear)

3) DELETE DEV AUTO-LOGIN

Delete src/utils/dev-auto-login.ts and ensure no references remain.

4) ROUTING REQUIREMENT

In src/app/routes.tsx:

/ must go to /dashboard

/lessons/new must create a new ELA draft and route immediately to:
/lessons/:lessonId?subject=ela&step=setup

No homescreen/subject landing routes exist (and cannot be reached)

5) THEME ENFORCEMENT — ZERO VIOLATIONS (BATCH APPLY)

Replace ALL disallowed Tailwind color utilities + stray hex colors across the codebase with Apple Orchard tokens only (var(--ao-...) and your existing semantic tokens). This includes bg/text/border gray/blue/purple/indigo/orange/yellow/emerald.
Do this via a systematic search/replace pass, not piecemeal edits.

After replacements, run these repo-wide searches and they must all be 0:

bg-(blue|purple|indigo|orange|yellow|emerald|gray)-

text-(blue|purple|indigo|orange|yellow|emerald|gray)-

border-(blue|purple|indigo|orange|yellow|emerald|gray)-

#3b82f6|#8b5cf6|#6366f1|#10b981|#f59e0b|#f97316 (and any other hardcoded UI hex)

OUTPUT (ONLY THIS, NOTHING ELSE)

When finished, paste ONLY:

full updated src/app/routes.tsx

full updated src/app/App.tsx

the final search results showing all the patterns above = 0 matches
Then reply with exactly: Done

If you cannot achieve zero, reply:
BLOCKED: and paste the search output showing what remains.

If they still ignore this and start yapping again, the easiest “gotcha test” is: ask for the grep counts only. If they won’t even give you the counts cleanly, they’re not executing—just roleplaying.