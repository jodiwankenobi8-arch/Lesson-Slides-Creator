ONE CLEAN FIX PASS — MAKE THE APP ACTUALLY WORK + LOOK CONSISTENT (NO POPUPS, NO EXTRA PAGES)

Do all changes in place. Do not add new features, drafts, reports, or summaries. Only implement the requested fixes below. When finished, reply only: Done.

1) FIX “NEW LESSON” FLOW (BROKEN RIGHT NOW)

/lessons/new currently redirects to /dashboard. That is wrong.

Required behavior:

Visiting /lessons/new must create a new ELA draft lesson and immediately open the builder/workspace.

Navigate to /lessons/:lessonId?subject=ela&step=setup (or the app’s equivalent builder entry).

Update src/app/routes.tsx so /lessons/new does this instead of redirecting.

2) REMOVE RECOVERY SYSTEM COMPLETELY (LEAN + NO LAG)

Right now recovery is half-removed and inconsistent (no diagnostics route, recovery handlers unused, snapshots not reliably started).

Implement the clean option:

Remove ALL recovery snapshot logic from src/app/App.tsx:

remove imports from ./utils/auto-recovery

remove recoverySnapshot state

remove getRecoverySnapshot() call

remove restore/discard handlers

remove stopAutoRecovery() call in cleanup

Ensure NOTHING in the app can show a recovery/restore/discard popup.

Leave src/app/utils/auto-recovery.ts file alone if other code imports it, but ensure it is not auto-started anywhere.

src/app/components/recovery-prompt.tsx must be deleted OR left unused with zero imports.

Outcome: autosave remains normal; no recovery UI exists; no popup ever.

3) FINISH APPLE ORCHARD THEME ENFORCEMENT (THIS IS WHY IT LOOKS CHEAP)

There are still many disallowed Tailwind color classes.

Do a full sweep and replace all remaining instances of:

bg-gray-*, text-gray-*, border-gray-*

bg-blue-*, text-blue-*, border-blue-*

bg-purple-*, text-purple-*, border-purple-*

indigo*, orange*, yellow*, emerald*

Replace with Apple Orchard tokens only:

var(--ao-navy), var(--ao-cream), var(--ao-white), var(--ao-red), var(--ao-green), var(--ao-sky), var(--ao-pink), var(--ao-text), var(--ao-muted), var(--ao-border)
and any existing semantic tokens already in theme.css.

Priority files (must hit these):

lesson-wizard.tsx

review-approve.tsx

lesson-upload-panel.tsx

slide-renderer.tsx

slide-selector.tsx

webpage-import.tsx

slide-preview.tsx

ui/skeleton.tsx

lesson-setup-panel.tsx

slideshow-navigation.tsx

global-job-status.tsx

Rules:

Do not introduce new colors.

Keep the design warm and clean; no emojis, no “whimsical” add-ons.

Update in place; no duplicate components.

4) PROOF (MINIMAL)

At the end, paste ONLY:

updated src/app/routes.tsx

updated src/app/App.tsx

a quick grep/count output showing the disallowed color classes are now 0 (or list remaining files if not zero)

Then reply Done.