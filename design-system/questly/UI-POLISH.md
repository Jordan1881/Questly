# Questly UI Polish — ui-ux-pro-max applied

> Generated from ui-ux-pro-max checklist + UX domain search.  
> **Colors stay** on `src/design-system/tokens.css` (purple brand) — we apply interaction patterns only.

## Skill commands used

```bash
python3 ~/.cursor/skills/ui-ux-pro-max/scripts/search.py \
  "productivity gamification task manager developer XP rewards" \
  --design-system --motion 6 --variance 5 --density 5 -p "Questly"

python3 ~/.cursor/skills/ui-ux-pro-max/scripts/search.py \
  "dashboard sidebar cards hover focus accessibility" --domain ux -n 8
```

## Checklist applied

| Rule | Implementation |
|------|----------------|
| Hover 150–300ms | `--transition-ui: 200ms` on cards, nav, filters, buttons |
| `cursor-pointer` | All interactive buttons retain explicit cursor |
| Focus visible | `.ds-focus-ring` → `--focus-ring` token |
| No layout-shift hovers | Card lift uses `box-shadow` only, not scale |
| Touch-safe | `@media (hover: hover)` on card lift + filter pills |
| Keyboard | CSS `:focus-visible` replaces JS-only `onMouseEnter` hovers on buttons |

## New design-system classes (`index.css`)

| Class | Purpose |
|-------|---------|
| `.ds-focus-ring` | Accessible focus ring on all interactive elements |
| `.ds-card-lift` | Subtle shadow + brand border on hover |
| `.ds-btn-primary` | Gradient CTA with hover lift (app buttons) |
| `.ds-btn-hero` | Marketing/form gradient with overlay hover |
| `.ds-nav-item` / `--active` | Sidebar navigation |
| `.ds-header-nav` / `--active` | Top header tabs |
| `.ds-filter-pill` | Task list filter chips |
| `.ds-input-field` | Form input focus (for auth migration) |

## Files polished (this pass)

- `Sidebar.jsx` — tokens, nav classes, focus rings, level card uses `ds-brand-gradient`
- `PageHeader.jsx` — tokens, nav classes, profile chip links to `/profile`
- `Button.jsx` / `FormButton.jsx` — CSS hover + keyboard focus (no `useState`)
- `FilterBar.jsx` — inactive pill hover, focus rings
- `TaskCard.jsx` — card lift, checkbox focus/hover
- `RewardCard.jsx` — card lift, `ds-btn-primary` buy button
- `CouponCard.jsx` — `ds-card`, tokens, reveal hover
- `XPHistory.jsx` — tokens, row lift

## Still to polish (next pass)

- ~~`Admin.jsx` + admin tabs~~ — done
- ~~Auth pages (`SignIn`, `SignUp`, workspace flows)~~ — `AuthLayout` + tokens
- `MetricStatCard.jsx` — token shadow + typography
- `PurchaseConfirm.jsx` — secondary button hover/focus
- ~~Phase 1 motion from `MOTION-SPEC.md` (completion juice)~~ — done
- Legal pages — `LegalPageShell` with logo + ds-card
