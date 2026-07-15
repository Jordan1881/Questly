# Questly Motion Spec — Locked (grill-me + polish #258)

> Decisions from grilling + surface/app-loop polish program. See also `CONTEXT.md`.

## Principles

- **Polished, not circus** — GSAP dial 7/10 Standard
- **Tokens:** `src/design-system/tokens.css` (purple brand, light mode, soft-depth surfaces)
- **Engine:** GSAP via `src/design-system/motion/` only — no Framer/Webflow/Lottie stack
- **A11y:** `prefers-reduced-motion` → instant state, no celebration timelines
- **Two tracks:** Surface polish (look/texture) ships before app loop juice fidelity — see `CONTEXT.md` glossary

### Soft-depth token contract (surface track)

| Token | Role |
|-------|------|
| `--color-bg-canvas` | Page canvas (`.ds-page`) |
| `--color-card-surface` | Card fill (`.ds-card`) |
| `--color-border-soft` | Quiet card/chrome edge |
| `--shadow-soft-sm` / `--shadow-soft-md` | Layered card depth; hover lift uses md |
| `--focus-ring-soft` | Focus ring on `.ds-focus-ring` |
| `--color-chrome-surface` / `--color-chrome-tint` | Header/sidebar (`.ds-chrome`, `.ds-chrome-tint`) |

Contract tests: `src/tests/design-system/softDepthTokens.test.js`. No glass blur or grain system tokens.

---

## Phase 1 — Quest-complete juice

**Trigger:** Developer marks quest complete (reward-only).

**Quest uncomplete (quiet):** Revoke complete is instant checkbox/state only — `useTaskCompleteMotion` is not called; no ghost, glow, bar tick, or LevelUp.

**Surfaces:**
- `/tasks` — Task List cards (`TaskCard`)
- `/dashboard` — high-priority inline quest rows  
Same shared hook: `src/hooks/useTaskCompleteMotion.js`.

**Timeline (~700ms full path, single GSAP timeline per completion):**

| Step | Duration | Effect |
|------|----------|--------|
| 1 | 150ms | Checkbox `scale 1 → 1.15 → 1`, `power2.out` |
| 2 | 200ms | Card `--shadow-soft-sm` → brief brand glow (`--shadow-primary-sm`) → soft default |
| 3 | 250ms | `+{xp} XP` ghost only — **no coins line**; rises 24px (`ghostRise`), `autoAlpha` fade out |
| 4 | 100ms | Level progress bar tick **only if on-screen** (see gate below) |

Durations from `MOTION.taskComplete` in `src/design-system/motion/config.js`.

**On-screen Level bar gate:** Step 4 runs only when an element with `[data-xp-progress-bar]` is in the document **and** its bounding rect intersects the viewport (`width/height > 0`, `top < innerHeight`, `bottom > 0`). Tick targets `[data-xp-bar-fill]` inside that bar. Do not hunt a global/header bar that is off-screen or in another route.

**No:** confetti, particles, screen flash, cross-screen element flights, coin ghost text

**Loop peak (LevelUp):**
- If completion triggers level-up: pass `compressed: true` — run steps 1–3 only (~350ms, `levelUpDeferMs`), **skip bar tick**
- Kill completion timeline cleanly (`killTimeline`), then open `LevelUp` modal — stronger celebration + Shop handoff / Keep questing CTAs
- Never run two timelines on the same DOM nodes
- Do **not** make every complete louder; LevelUp is the loop peak (see `CONTEXT.md`)

---

## Phase 2 — Route / navigation polish

**Held** — not part of polish #258. Do not expand scope under this program.

Existing behavior may remain unchanged:
- Route swap instant; `AnimatedReveal` on enter; sidebar active highlight; skeletons for loading

Do not expand Hero ambient or new route-stagger work until Phase 2 is explicitly scheduled.

---

## Implementation checklist

- [x] Soft-depth tokens + `ds-*` surface contract
- [x] `useTaskCompleteMotion` hook (shared TaskCard + dashboard row)
- [x] On-screen Level progress bar tick only
- [x] Compressed path when LevelUp pending
- [x] LevelUp loop peak CTAs (Reward Shop / Keep questing)
- [x] Unit tests: reduced-motion skips timeline; soft-depth token contract
