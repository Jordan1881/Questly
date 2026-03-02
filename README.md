# Questly

> **Turn your daily tasks into epic quests.**
> A gamified task management app that connects to Jira and transforms your work into an RPG-style experience — earn XP, unlock rewards, and track your progress.

---

## Overview

Questly bridges the gap between productivity and motivation. By connecting to your Jira workspace, it pulls your assigned tickets and presents them as quests with XP rewards based on difficulty. Complete tasks, level up, and redeem your earned XP for real-world coupons in the Reward Shop.

This project was built as a final-year Information Systems capstone project.

---

## UI Screenshots

### Hero Page
![Hero Page](<UI screenshots/hero page.png>)

The landing page greets users with the Questly brand and a clear value proposition. A soft purple animated gradient background with floating blob animations creates an immersive first impression. The headline — *"Turn your daily tasks into epic quests"* — immediately communicates the app's gamified concept, with CTA buttons to sign in or get started.

---

### Task List
![Task List](<UI screenshots/task list page.png>)

The Task List page displays all Jira-synced tasks as interactive quest cards. Each task shows:
- **Difficulty badge** (Easy / Medium / Hard) with color-coded borders
- **Jira ticket ID** for traceability
- **Task title and description**
- **Due date** with high-priority flags
- **XP reward** (+20 / +40 / +70 XP based on difficulty)

A filter bar at the top lets users slice tasks by status (All, Completed, High Priority) and difficulty. A live **March 2026 calendar** on the right highlights task due dates and completion status at a glance. A Jira sync status badge confirms the last sync time.

---

### Profile
![Profile](<UI screenshots/profile page.png>)

The Profile page gives users a full picture of their progress and account:
- **Profile hero card** — avatar, name, email, Level 3 badge, and a Dashboard-style XP progress bar (650 / 1000 XP) with tick markers and a glowing fill
- **Available XP badge** — shows spendable XP (1,250) that carries over from the Reward Shop
- **XP History chart** — an interactive SVG line chart showing XP earned over the last 7 days, with hover tooltips and a smooth Catmull-Rom curve
- **Account Details** — Jira integration status, total tasks completed, total XP earned, and member-since date
- **My Rewards** — a grid of coupons redeemed in the Reward Shop, updated in real time as purchases are made

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
| Icons | Inline SVGs + custom asset files |
| Fonts | Poppins, Inter, Nabla (Google Fonts) |

---

## Features

- **Jira Integration** — connect your Jira workspace to pull real tickets as quests
- **XP & Leveling System** — earn XP on task completion, level up at 1000 XP milestones
- **Reward Shop** — redeem accumulated XP for real-world coupons (Starbucks, Nike, Netflix, and more)
- **Interactive Task List** — filter by difficulty and status, toggle completion with checkbox
- **XP History Chart** — smooth interactive SVG line chart with hover tooltips
- **Calendar Widget** — monthly calendar highlighting task due dates and completion status
- **Shared State** — purchased rewards appear in the Profile "My Rewards" section in real time
- **Sidebar Navigation** — slide-in drawer accessible from any page via burger button

---

## Pages

| Page | Route Key | Description |
|---|---|---|
| Hero | `hero` | Landing page with animated background and CTA |
| Sign In | `signin` | Login form |
| Sign Up | `signup` | Registration form |
| Jira Auth | overlay | Modal to connect Jira after sign-in |
| Dashboard | `dashboard` | Main overview — XP, stats, high priority tasks |
| Task List | `tasklist` | Full Jira-synced task list with filters and calendar |
| Reward Shop | `rewardshop` | XP redemption store with cart and checkout |
| Profile | `profile` | User profile, XP history chart, account details, my rewards |

---

## Project Structure

```
src/
├── assets/
│   ├── LOGO.svg
│   ├── LOGO-HORIZENTAL.svg
│   ├── Icons /                  # Custom icon SVGs (Star, Settings, Profile, etc.)
│   ├── cover hero.png
│   └── jira-original-wordmark.svg
├── components/
│   └── Sidebar.jsx              # Slide-in navigation drawer
├── design-system/
│   ├── tokens.css               # CSS custom properties (colors, spacing, radius)
│   └── components/
│       ├── Button.jsx
│       ├── FormButton.jsx
│       └── JiraButton.jsx
├── overlays/
│   └── JiraAuth.jsx             # Jira connection modal
├── pages/
│   ├── Hero.jsx
│   ├── SignIn.jsx
│   ├── SignUp.jsx
│   ├── Dashboard.jsx
│   ├── TaskList.jsx
│   ├── RewardShop.jsx
│   └── Profile.jsx
├── App.jsx                      # Root router + shared state (userXP, purchased)
├── index.css                    # Tailwind import + global keyframes
└── main.jsx
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
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
| Card border radius | `12px` |
| Card shadow | `0px 1px 3px rgba(0,0,0,0.10)` |
| Font family | Poppins (primary), Inter |
| Background | `#f9fafb` |

---

## Status

> **MVP — UI complete, mock data only.**
> Backend integration (real Jira OAuth, database, authentication) is planned for the next phase.
