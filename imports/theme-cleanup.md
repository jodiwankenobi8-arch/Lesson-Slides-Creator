FINALIZE THE “ONE CLEAN FIX” PASS — THEME ENFORCEMENT MUST HIT ZERO

Do not summarize. Do not partially complete. Do not say “still present.” Finish it.

A) Delete dev auto-login file

Delete /src/utils/dev-auto-login.ts (unused, not classroom-ready).
Then run search to confirm 0 matches for enableAutoLogin.

B) Theme enforcement: eliminate ALL disallowed Tailwind colors

Replace every remaining instance across the entire codebase of:

bg-gray-*, text-gray-*, border-gray-*

bg-blue-*, text-blue-*, border-blue-*

bg-purple-*, text-purple-*, border-purple-*

indigo*, orange*, yellow*, emerald*

Use only Apple Orchard tokens / semantic tokens:
var(--ao-navy), var(--ao-cream), var(--ao-white), var(--ao-red), var(--ao-green), var(--ao-sky), var(--ao-pink), var(--ao-text), var(--ao-muted), var(--ao-border)
(or existing semantic vars already defined in theme.css).

Must complete these files (at minimum):

lesson-wizard.tsx

review-approve.tsx

lesson-upload-panel.tsx

slide-selector.tsx

webpage-import.tsx

slide-preview.tsx

slideshow-navigation.tsx

global-job-status.tsx

step-navigation.tsx
(and any others returned by search)

C) Proof (required)

At the end, paste ONLY:

grep/search count output showing 0 matches for all disallowed color patterns above

grep/search count output showing 0 matches for enableAutoLogin
Then reply: Done.