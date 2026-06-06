# Questly

> **Turn your daily tasks into epic quests.**
> A gamified task management app that connects to Jira and transforms your work into an RPG-style experience — earn XP, unlock rewards, and track your progress.

---

## Overview

Questly bridges the gap between productivity and motivation. By connecting to your Jira workspace, it pulls your assigned tickets and presents them as quests with XP rewards based on difficulty. Complete tasks, level up, and spend your earned Coins in the Reward Shop for real-world coupons.

The platform supports two roles — **Developer** and **Admin / Manager** — each with a fully tailored experience.

This project was built as a final-year Information Systems capstone project.

**Submission package (M8):** see [docs/SUBMISSION.md](docs/SUBMISSION.md) for API docs, ER diagram, write-up, and demo script.

---

## Role System

### Developer
Developers complete quests, earn XP and Coins, and redeem rewards. Their experience includes a Dashboard, Task List, Reward Shop (with a cart and approval flow), and a Profile with XP history and earned rewards.

### Admin / Manager
Admins are pure managers — they oversee their team, approve reward requests, configure XP settings, and manage users. They have no quests or XP of their own.

| Feature | Developer | Admin |
|---|---|---|
| Dashboard | ✅ | ❌ |
| Task List | ✅ | ❌ |
| XP & Leveling | ✅ | ❌ |
| Reward Shop (cart) | ✅ | ❌ |
| Reward Shop (edit) | ❌ | ✅ |
| Admin Panel | ❌ | ✅ |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19.2.0 |
| Build Tool | Vite 7.3.1 |
| Styling | Tailwind CSS v4 |
| Language | JavaScript (JSX) |
| Routing | Custom state-based (no library) |
| State | useState only (no Redux / Zustand) |
| Icons | Inline SVGs |
| Fonts | Poppins (Google Fonts) |

---

## Features

### Developer
- **Jira Integration** — connect your Jira workspace to pull real tickets as quests
- **XP & Leveling System** — earn XP on task completion, level up at 1000 XP milestones
- **Dual Economy** — XP for leveling, Coins for spending (default: 100 XP = 10 Coins)
- **Reward Shop** — spend Coins on real-world coupons (Starbucks, Netflix, Steam, and more)
- **Pending Approval Flow** — reward requests go to admin for approval before Coins are deducted
- **Interactive Task List** — filter by difficulty and status, toggle completion
- **XP History Chart** — smooth interactive SVG line chart with hover tooltips
- **Calendar Widget** — monthly calendar highlighting task due dates
- **Profile & My Rewards** — XP progress, account details, and a live grid of pending/purchased rewards

### Admin
- **Team Tab** — leaderboard and cards view of all developers ranked by XP, with medals for top 3
- **Rewards Tab** — pending approval table with approve / deny actions; coins are deducted on approval
- **XP Settings Tab** — configure XP per difficulty (Easy / Medium / Hard) and XP→Coins conversion rate
- **Users Tab** — deactivate / reactivate developers and adjust XP inline
- **Reward Shop Edit Mode** — add, edit, and delete rewards from the catalog
- **Admin Profile** — team KPIs (developers managed, active members, pending approvals) and team summary grid

### Shared
- **Role-based Navigation** — header and sidebar links adapt to the user's role
- **Sidebar with Log Out** — slide-in drawer with role-aware nav and a Log Out button for both roles
- **Role Persistence** — selected role is saved in `localStorage` across page refreshes

---

## Pages

| Page | Route Key | Role | Description |
|---|---|---|---|
| Hero | `hero` | All | Landing page with animated gradient background and CTA |
| Sign In | `signin` | All | Login form |
| Sign Up | `signup` | All | Registration form with Developer / Admin role toggle cards |
| Jira Auth | overlay | All | Modal to connect Jira after sign-in |
| Dashboard | `dashboard` | Developer | XP progress, user stats, and high priority tasks |
| Task List | `tasklist` | Developer | Jira-synced quest cards with filters and calendar |
| Reward Shop | `rewardshop` | Both | Developer: cart + approval flow. Admin: catalog edit mode |
| Profile | `profile` | Both | Developer: XP chart + My Rewards. Admin: team summary + KPIs |
| Admin Panel | `admin` | Admin | 4 sub-tabs — Team, Rewards, XP Settings, Users |

---

## Project Structure

```
src/
├── assets/
│   ├── LOGO.svg
│   ├── LOGO-HORIZENTAL.svg
│   ├── Icons /                  # Custom icon SVGs
│   ├── cover hero.png
│   └── jira-original-wordmark.svg
├── components/
│   ├── Sidebar.jsx              # Slide-in navigation drawer (role-aware + Log Out)
│   └── PageHeader.jsx           # Inline header (role-aware nav links)
├── design-system/
│   ├── tokens.css
│   └── components/
│       ├── Button.jsx
│       ├── FormButton.jsx
│       └── JiraButton.jsx
├── overlays/
│   └── JiraAuth.jsx             # Jira connection modal
├── pages/
│   ├── Hero.jsx
│   ├── SignIn.jsx
│   ├── SignUp.jsx               # Role toggle cards (Developer / Admin)
│   ├── Dashboard.jsx            # Developer only
│   ├── TaskList.jsx             # Developer only
│   ├── RewardShop.jsx           # Dual mode: developer cart vs admin edit
│   ├── Profile.jsx              # Dual content: developer XP vs admin team summary
│   └── Admin.jsx                # Admin only — 4 sub-tabs
├── App.jsx                      # Root router + shared state
├── index.css                    # Tailwind + Google Fonts + keyframes
└── main.jsx
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Jordan1881/Questly.git
cd Questly_Development

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

---

## Design System

| Token | Value |
|---|---|
| Primary color | `#942fcd` |
| Gradient end | `#ca9af4` |
| Admin accent | `#6366f1` (indigo) |
| Card border radius | `12px` |
| Card shadow | `0px 1px 3px rgba(0,0,0,0.10)` |
| Font family | Poppins |
| Background | `#f9fafb` |

---

## Status

> **MVP v2 — UI complete, mock data only.**
> Both Developer and Admin use cases are fully implemented.
> Backend integration (real Jira OAuth, database, authentication) is planned for the next phase.

---

## Developers

This project was built by:

| Name | Role |
|---|---|
| Yarden Biton | Lead Developer |
| Or Moskowitz | Developer |
