# Hero Page — Motion Overrides

**Extends:** `design-system/questly/MASTER.md` + `QUESTLY-TOKENS.md`

## Visual

- Keep existing lavender gradient background and purple blob palette
- Logo scales responsively; no dark-mode swap

## Motion (implemented)

1. GSAP timeline: logo → title → subtitle → CTAs → footer (overlap `-=0.45`)
2. Ambient blobs: random `x`/`y` drift, `sine.inOut`, infinite yoyo
3. Replace CSS `heroFadeUp` keyframes on this page

## CTA behavior

- Buttons use existing `Button` component (brand gradient)
- Optional next step: `scale(0.97)` press feedback via GSAP `contextSafe`

## Do not

- Switch to dark cinematic theme from generic MASTER palette
- Add layout-shifting hover scales on hero CTAs
