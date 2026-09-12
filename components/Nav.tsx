import Link from "next/link";

export default function Nav() {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-panel p-4 shadow-neon">
      <div>
        <div className="font-semibold tracking-wide" style={{ fontFamily: "var(--font-orbitron)" }}>
          NEON GUILD
        </div>
        <div className="text-xs text-mut">Life RPG</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link className="rounded-xl bg-panel2 px-3 py-2 text-sm hover:bg-[rgba(255,255,255,0.14)]" href="/app">
          Dashboard
        </Link>
        <Link className="rounded-xl bg-panel2 px-3 py-2 text-sm hover:bg-[rgba(255,255,255,0.14)]" href="/app/quests">
          Quests
        </Link>
        <Link className="rounded-xl bg-panel2 px-3 py-2 text-sm hover:bg-[rgba(255,255,255,0.14)]" href="/app/shop">
          Shop
        </Link>
        <Link
          className="rounded-xl bg-panel2 px-3 py-2 text-sm hover:bg-[rgba(255,255,255,0.14)]"
          href="/app/inventory"
        >
          Inventory
        </Link>

        <form action="/logout" method="post">
          <button
            className="rounded-xl bg-[rgba(255,77,109,0.16)] px-3 py-2 text-sm hover:bg-[rgba(255,77,109,0.24)] focus-visible:outline focus-visible:outline-2"
            type="submit"
          >
            Logout
          </button>
        </form>
      </div>
    </nav>
  );
}