# Questly Motion Spec — Locked (grill-me session)

> Decisions from `/grill-me` Q&A. Implementation reference for phase 1 + 2.

## Principles

- **Polished, not circus** — GSAP dial 7/10 Standard
- **Tokens:** `src/design-system/tokens.css` (purple brand, light mode)
- **Engine:** GSAP via `src/design-system/motion/`
- **A11y:** `prefers-reduced-motion` → instant state, no celebration timelines

---

## Phase 1 — Task completion juice

**Trigger:** Developer marks task complete (reward-only; uncomplete reverses quietly, no animation)

**Surfaces:**
- `/tasks` — `TaskCard` checkbox
- `/dashboard` — high-priority inline task rows

**Timeline (~700ms, single GSAP timeline per completion):**

| Step | Duration | Effect |
|------|----------|--------|
| 1 | ~150ms | Checkbox `scale 1 → 1.15 → 1`, `power2.out` |
| 2 | ~200ms | Card border/shadow brief brand-purple glow (`box-shadow: var(--shadow-primary-sm)`) |
| 3 | ~250ms | `+{xp} XP` ghost: rises 24px on card, `autoAlpha` fade out |
| 4 | ~100ms | XP progress bar ticks forward in place (sidebar/header) |

**No:** confetti, particles, screen flash, cross-screen element flights

**Level-up collision (compressed juice):**
- If completion triggers level-up: run steps 1–3 only (~350ms), skip bar tick
- Kill completion timeline cleanly, then open level-up modal
- Never run two timelines on the same DOM nodes

---

## Phase 2 — Route / navigation polish

**No full-page overlay or brand wipe.**

| Behavior | Detail |
|----------|--------|
| Route swap | Instant (React Router) |
| New page | Existing `AnimatedReveal` stagger on enter |
| Sidebar | Soft highlight slide on active nav item |
| Data loading | Skeletons immediately; never block route for animation |

**Pages to extend stagger:** `/shop`, `/rewards`, `/profile`, `/settings`

---

## Implementation checklist

- [ ] `useTaskCompleteMotion` hook (shared TaskCard + dashboard row)
- [ ] Wire into `TaskCard.jsx` and `Dashboard.jsx` priority tasks
- [ ] Compressed path when `levelUp` pending
- [ ] Sidebar active-item highlight in `Sidebar.jsx`
- [ ] Page stagger on remaining routes
- [ ] Unit tests: reduced-motion skips timeline; level-up defers modal
