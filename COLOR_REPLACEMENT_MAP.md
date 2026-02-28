# Apple Orchard Color Replacement Map

## Comprehensive Color Cleanup - ChatGPT Prescribed

### Mapping Rules

| Rogue Color | Apple Orchard Replacement | Use Case |
|-------------|---------------------------|----------|
| `purple-*` | `bg-[var(--ao-navy)]` / `text-[var(--ao-navy)]` | Primary actions, processing states |
| `blue-[456]*` | `bg-[var(--ao-sky)]` / `text-[var(--ao-navy)]` | Info messages, secondary |
| `indigo-*` | `bg-[var(--ao-navy)]` / `text-[var(--ao-navy)]` | Same as purple |
| `orange-*` | `bg-[var(--ao-red)]` / `text-[var(--ao-red)]` | Warnings |
| `yellow-*` | `bg-[var(--ao-cream)]` / `text-[var(--ao-text)]` | Highlights |
| `emerald-*` | `bg-[var(--ao-green)]` / `text-[var(--ao-green)]` | Success |

### Specific Replacements

#### Purple → Navy
- `bg-purple-50` → `bg-[var(--ao-navy)]/5`
- `bg-purple-100` → `bg-[var(--ao-navy)]/10`
- `bg-purple-200` → `bg-[var(--ao-navy)]/20`
- `bg-purple-600` → `bg-[var(--ao-navy)]`
- `bg-purple-700` → `bg-[var(--ao-navy)]`
- `text-purple-600` → `text-[var(--ao-navy)]`
- `text-purple-700` → `text-[var(--ao-navy)]`
- `text-purple-900` → `text-[var(--ao-navy)]`
- `border-purple-200` → `border-[var(--ao-navy)]/20`
- `border-purple-300` → `border-[var(--ao-navy)]/30`
- `border-purple-500` → `border-[var(--ao-navy)]`

#### Blue → Sky (Info)
- `bg-blue-50` → `bg-[var(--ao-sky)]`
- `bg-blue-200` → `bg-[var(--ao-sky)]`
- `bg-blue-500` → `bg-[var(--ao-navy)]`
- `bg-blue-600` → `bg-[var(--ao-navy)]`
- `text-blue-600` → `text-[var(--ao-navy)]`
- `text-blue-900` → `text-[var(--ao-navy)]`
- `border-blue-200` → `border-[var(--ao-sky)]`
- `border-blue-400` → `border-[var(--ao-navy)]/40`

#### Indigo → Navy
- `bg-indigo-50` → `bg-[var(--ao-navy)]/5`
- `text-indigo-900` → `text-[var(--ao-navy)]`
- `border-indigo-200` → `border-[var(--ao-navy)]/20`

#### Orange → Red (Warnings)
- `bg-orange-100` → `bg-[var(--ao-red)]/10`
- `bg-orange-500` → `bg-[var(--ao-red)]`
- `text-orange-600` → `text-[var(--ao-red)]`
- `border-orange-500` → `border-[var(--ao-red)]`

#### Yellow → Cream (Highlights)
- `bg-yellow-50` → `bg-[var(--ao-cream)]`
- `bg-yellow-200` → `bg-[var(--ao-cream)]`
- `text-yellow-600` → `text-[var(--ao-text)]`
- `text-yellow-900` → `text-[var(--ao-text)]`

#### Emerald → Green (Success)
- `bg-emerald-50` → `bg-[var(--ao-green)]/10`
- `text-emerald-600` → `text-[var(--ao-green)]`

## Files Affected (150+ instances)
- lesson-wizard.tsx (49 instances)
- lesson-upload-panel.tsx (15 instances)
- review-approve.tsx (20 instances)
- slide-selector.tsx (5 instances)
- upload-area.tsx (18 instances - indigo theme)
- And 15 more files...

## Status
🔴 NOT COMPLETE - In Progress
