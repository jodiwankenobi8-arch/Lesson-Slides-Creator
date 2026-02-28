Yep — based on the ZIP you uploaded, here’s what **actually needs fixing** (not what the other tool *claimed* it did).

## 1) Kill the recovery popup (it’s 100% in your code)

Right now your app **explicitly shows the recovery modal** on boot:

* `src/app/App.tsx`

  * calls `getRecoverySnapshot()` on mount
  * if it exists → `setShowRecoveryPrompt(true)`
  * renders `<RecoveryPrompt />`

* `src/app/components/recovery-prompt.tsx` (the modal)

* `src/app/utils/auto-recovery.ts` (writes snapshots every 30s)

**Fix:** remove the UI prompt entirely (or force it to return `null`) and keep recovery only as an *optional manual* tool (if you want it later).

## 2) You’re still not “ELA Lesson Plan Maker only”

Your router still ships extra stuff:

* `/templates`
* `/diagnostics`
* `/my-lessons` (duplicate of `/lessons`)
* `/auth`, `/login`, `/signup`, etc.

And you still have an entry screen:

* `/lessons/new` → `SubjectLanding` (it’s “ELA only” now, but it’s still an extra step)

**Fix:** decide the minimal flow and delete/disable the rest:

* keep: `/dashboard`, `/lessons`, `/lessons/:lessonId`
* make “New lesson” go straight to creating/opening a draft lesson (skip `SubjectLanding`)

## 3) Dev-mode hacks are ALWAYS ON (this is a big deal)

In `src/app/App.tsx` you are running:

* `enableAutoLogin();`
* logs saying it’s skipping auth

That means the app is effectively in “dev bypass” all the time, and it also renders dev UI:

* `src/app/components/dev-mode-indicator.tsx` is always mounted in `App.tsx`

**Fix:** put all dev auto-login + dev indicators behind a hard condition (e.g. `import.meta.env.DEV`) or remove them.

## 4) Theme is NOT truly locked (despite the token file)

You *do* have a nice token system in:

* `src/styles/theme.css`

But the app still uses a ton of Tailwind default colors (`text-gray-*`, `bg-gray-*`, etc.) across many components (dozens of files). That’s why you’re seeing “random non-theme” styling.

Also, there are still a few obvious disallowed color-class leftovers in:

* `src/app/components/global-job-status.tsx`
* `src/home/SubjectCard.tsx`
* `src/utils/uploadUX.ts`

**Fix:** enforce “tokens only” (or at least replace all Tailwind grays with your allowed palette tokens).

## 5) Background stuff you don’t need (adds lag)

In `src/app/App.tsx` you’re doing several background/boot behaviors that aren’t needed for “simple ELA maker”:

* `startAutoRecovery()` (interval + listeners)
* `preloadAllComponents()` after 5 seconds
* multiple always-on indicators:

  * `NetworkStatusIndicator`
  * `DevModeIndicator`
  * `BuildTimestamp`
  * `AppReadyIndicator`

And `BootGuard.tsx` does fetch + console logging.

**Fix:** strip background features to the bare minimum. Add them back later if needed.

## 6) Docs & audit files are bloating the repo (not fatal, but not “clean”)

Your root includes:

* `PROJECT_AUDIT_SUMMARY.md`
* `APPLE_ORCHARD_COLOR_CLEANUP_COMPLETE.md`
* `COLOR_REPLACEMENT_MAP.md`

Not “wrong,” but if your goal is “keep it lean,” these should be moved out or deleted after you’re done.

---

# What I would fix first (highest impact)

1. **Remove RecoveryPrompt + stop auto-recovery UI prompts**
2. **Disable/guard auto-login + dev indicators**
3. **Simplify routes to only the 3–4 you actually want**
4. **Theme enforcement sweep (replace Tailwind grays + hardcoded colors)**
5. Remove preloading/extra indicators if still laggy

If you want, I’ll give you **one paste** to send Figma Make that forces it to do **only step #1 (popup removal)** with exact file targets.
