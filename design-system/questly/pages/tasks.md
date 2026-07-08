# Task List Page — Motion Overrides

**Extends:** `design-system/questly/QUESTLY-TOKENS.md`

## Motion (implemented)

- Task cards wrapped in `AnimatedReveal` with `stagger: 0.08`
- Re-animates when filter changes (dependency on filtered list)

## Future enhancements (locked — see MOTION-SPEC.md)

- Checkbox complete: pulse + card glow + ghost `+XP` rise/fade + bar tick
- Compressed juice (~350ms) when level-up fires on same toggle
- Uncomplete: quiet reverse, no celebration

## UX (from ui-ux-pro-max checklist)

- `cursor-pointer` on all task actions ✓
- Empty/loading states included in stagger group
