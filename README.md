# Neon Guild — Life RPG

Neon Guild is a full-stack Life RPG web app that turns real-world tasks into Quests and Daily Habits with XP, leveling, streaks, attributes, and a gold economy.

## Live Links
- Live App: (paste your Vercel URL)
- Demo Video (90–180s): (paste link)
- GitHub Repo: (paste link)

## Key Features
- Authentication (Supabase Auth)
- Secure anti-cheat progression (Postgres RPC + RLS)
- Quest CRUD + Daily Habits (daily = once/day; one-off = once ever + auto-archive)
- Non-linear leveling system
- Streak tracking (server-side)
- Attributes: Strength / Intellect / Focus / Vitality
- Gold economy + Shop + Inventory
- Responsive UI + keyboard accessible controls

## Tech Stack
- Next.js (App Router) + TypeScript
- Supabase (Auth + Postgres + RPC + RLS)
- Tailwind CSS
- Framer Motion + canvas-confetti

## Setup
1) Create a Supabase project.
2) Run SQL migrations (Supabase SQL Editor) in order:
   - `supabase/migrations/001_init.sql`
   - `supabase/migrations/002_daily_habits.sql`

3) Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."



See `DISCLOSURE.md` for third-party tools/libraries and AI usage disclosure.


Made with ❤️ by Pranshu Gahlawat — https://github.com/pranshugahlawat