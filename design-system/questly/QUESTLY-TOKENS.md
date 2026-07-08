# Questly Design + Motion — Master Override

> **IMPORTANT:** This file augments `design-system/questly/MASTER.md` from ui-ux-pro-max.
> **Color and typography tokens** always come from `src/design-system/tokens.css` (purple brand, Poppins/Inter, light mode).
> Do **not** apply the dark-theme palette suggested by the auto-generated MASTER — use motion, UX, and interaction patterns only.

## Token source of truth

| Concern | Source |
|---------|--------|
| Colors | `src/design-system/tokens.css` (`--color-primary-500` #942FCD, etc.) |
| Typography | Poppins headings, Inter body |
| Spacing / radius / shadows | `tokens.css` + `ds-*` classes in `index.css` |
| Motion | `src/design-system/motion/config.js` (GSAP, dial 7/10 Standard) |

## Motion principles (GSAP)

- **Entrance:** `power3.out`, stagger 0.08–0.14s, `autoAlpha` + `y` translate
- **Modals:** scale 0.92 → 1 with `back.out(1.4)` on brand-purple overlays
- **Ambient:** slow blob drift on hero (`sine.inOut`, 8–13s)
- **Accessibility:** `gsap.matchMedia` + `prefers-reduced-motion: reduce` → duration 0
- **Performance:** animate `x`, `y`, `scale`, `autoAlpha` only — never width/height

## Page rollout

| Page | Motion |
|------|--------|
| `/` Hero | Timeline entrance + ambient blobs |
| `/dashboard` | Stagger left/right columns |
| `/tasks` | Stagger task cards on load/filter |
| Level-up overlay | Modal spring entrance |

## Skills installed

- `~/.cursor/skills/ui-ux-pro-max` — design intelligence CLI (local machine, outside repo)
- `.agents/skills/grill-me` — plan stress-testing (`/grill-me`)

Run design search from anywhere:

```bash
python3 ~/.cursor/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "Questly"
```
