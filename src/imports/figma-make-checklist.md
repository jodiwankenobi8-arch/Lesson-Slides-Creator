Paste this into Figma Make:

---

**VERIFY SERVICE WORKER + FINAL UI STABILITY CHECK**

### SERVICE WORKER

* do NOT register a service worker in dev or preview
* only register in production if `/service-worker.js` exists
* skip registration if file is missing or MIME type is not JavaScript
* prevent MIME type errors

---

### FINAL LAYOUT VERIFICATION

* confirm no titles overlap buttons
* confirm buttons do not overlap descriptions
* confirm clear hierarchy:

icon → title → badge → description → button

* ensure generous spacing and natural text wrapping

---

### FINAL THEME COMPLIANCE CHECK

* confirm only Apple Orchard palette colors are used
* remove any remaining purple, indigo, blue, orange, yellow, or emerald classes
* ensure all components use theme tokens

---

### SIMPLIFY & STABILIZE

* maintain ELA-only entry flow
* remove any remaining subject selection logic
* avoid adding new components or styles

---

### OUTPUT

Return confirmation that:

✓ service worker will not trigger MIME errors
✓ layout is stable and overlap-free
✓ theme is fully compliant
✓ interface is clean and calm

---

**CORE RULE: stability, clarity, and consistency over new changes.**

---
