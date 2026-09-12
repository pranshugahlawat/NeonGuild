import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold tracking-wide" style={{ fontFamily: "var(--font-orbitron)" }}>
              NEON GUILD
            </div>
            <div className="text-sm text-mut">Life RPG for real-world quests</div>
          </div>
          <Link
            href="/auth"
            className="rounded-xl bg-panel2 px-4 py-2 shadow-neon hover:bg-[rgba(255,255,255,0.14)] focus-visible:outline focus-visible:outline-2"
          >
            Enter the Guild
          </Link>
        </header>

        <section className="mt-16 grid gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-semibold leading-tight">
              Stop using to-do lists that feel like chores.
              <span className="block text-neon2">Turn work into progression.</span>
            </h1>

            <p className="mt-4 text-mut">
              Create quests and daily habits, complete them for XP and gold, level up with a non-linear curve,
              maintain streaks, and buy cosmetics—secured by server-side progression (anti-cheat).
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="rounded-xl bg-neon px-4 py-2 text-black shadow-neon2 hover:opacity-90 focus-visible:outline focus-visible:outline-2"
              >
                Start Free
              </Link>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-panel2 px-4 py-2 hover:bg-[rgba(255,255,255,0.14)] focus-visible:outline focus-visible:outline-2"
              >
                Powered by Supabase
              </a>
            </div>

            <ul className="mt-10 space-y-2 text-sm text-mut">
              <li>• Secure auth + RLS</li>
              <li>• Non-linear leveling</li>
              <li>• Streaks + attributes</li>
              <li>• Gold economy + shop</li>
              <li>• Daily habits (once/day)</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-panel p-6 shadow-neon">
            <div className="text-sm text-mut">Preview</div>
            <div className="mt-3 rounded-xl bg-[rgba(0,0,0,0.35)] p-4">
              <div className="text-lg font-semibold">Character</div>
              <div className="mt-2 h-2 w-full rounded-full bg-[rgba(255,255,255,0.10)]">
                <div className="h-2 w-1/2 rounded-full bg-neon2" />
              </div>
              <div className="mt-4 text-sm text-mut">Quests</div>
              <div className="mt-2 space-y-2">
                <div className="rounded-lg bg-panel2 p-3">Daily: Meditate → +15 XP</div>
                <div className="rounded-lg bg-panel2 p-3">One-off: Gym 30 min → +60 XP</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-mut">
              Demo: login → create quest/habit → complete → refresh persistence.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}