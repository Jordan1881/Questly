# Questly

Gamified Jira task app: workspaces turn issues into quests with XP, season ranking, and a coin shop.

## Language

**Two tracks (polish #258)**:
Surface polish (look/texture) ships first; app loop juice (quest-complete + LevelUp peak) follows. Separate budgets — do not trade loop fidelity for chrome-only passes.
_Avoid_: Mixing tracks in one ticket, landing-first motion before authenticated surfaces

**Soft depth**:
Surface-polish texture language via design tokens in `src/design-system/tokens.css` and `ds-*` utilities in `src/index.css`. Canvas `--color-bg-canvas`, card `--color-card-surface`, quiet edge `--color-border-soft`, layered `--shadow-soft-sm` / `--shadow-soft-md`, refined `--focus-ring-soft`, header/sidebar chrome `--color-chrome-surface` + `--color-chrome-tint`. Lilac whisper on canvas only — not glass blur, grain, or full lilac page wash.
_Avoid_: Glass blur, grain overlays, editorial hairlines, per-page one-off shadows

**App loop juice**:
Motion and feedback that reinforce the in-app cycle: complete quest → earn XP/coins → season climb → spend in Reward Shop → level up. Prefer this over marketing-shell polish when budgets conflict. Separate from surface polish (look/texture).
_Avoid_: Webflow polish, landing-first motion, chrome-only animation passes

**Surface polish**:
Token/`ds-*` visual refinement so the whole UI looks more elegant without redesigning layouts or IA. Texture language: soft depth — quieter borders, layered soft shadows, richer card fills, refined focus — not glass blur, page grain, or editorial hairlines. Page canvas: soft neutral with slight brand tint in header/sidebar; cards carry depth. Coverage: authenticated app + auth + Hero/marketing + legal. Ships before app loop juice fidelity. Keeps purple light-mode brand.
_Avoid_: Redesign, layout reflows, dark mode, full lilac page wash, glass blur, grain overlays, Webflow rebuild, per-page one-off styling

**Season score**:
Sprint XP for the current open sprint; ranks the team climb and resets when the sprint closes.
_Avoid_: Available XP (as shop currency), spendable sprint XP

**Quest-complete juice**:
Developer marks a quest done: checkbox confirm → card glow → rising `+{xp} XP` ghost → Level progress bar tick only if that bar is on-screen. Same path on Task List and Dashboard. Standard ~7/10 fidelity polish first; compress when LevelUp follows. Ghost shows XP only (not coins).
_Avoid_: Completion animation, task animation (as product terms)

**Loop peak**:
LevelUp modal amplify after quest-complete juice — stronger celebration and shop handoff. Not a louder every-complete.
_Avoid_: Celebration on every complete, cutscene

**Quest uncomplete**:
Revoke complete: instant checkbox only, no juice.
_Avoid_: Undo celebration, reverse juice
