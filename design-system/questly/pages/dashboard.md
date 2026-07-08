# Dashboard Page — Motion Overrides

**Extends:** `design-system/questly/QUESTLY-TOKENS.md`

## Motion (implemented)

- Page title: single `AnimatedReveal` fade-up
- Two-column layout: stagger left sidebar cards then right content (`stagger: 0.12`)

## Future enhancements

- Animate progress bar fill on data load (`gsap.to` width %)
- XP history rows: stagger on fetch complete
- MetricStatCard hover: subtle `y: -2` lift (transform only)

## Density

- Standard (5/10) — keep existing `ds-card` padding from tokens
