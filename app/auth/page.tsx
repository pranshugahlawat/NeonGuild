import AuthForm from "./AuthForm";

export default function AuthPage() {
  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl bg-panel p-6 shadow-neon">
          <div className="text-center">
            <div className="text-xl font-semibold" style={{ fontFamily: "var(--font-orbitron)" }}>
              Enter Neon Guild
            </div>
            <div className="mt-1 text-sm text-mut">Login or create your character.</div>
          </div>
          <div className="mt-6">
            <AuthForm />
          </div>
        </div>
      </div>
    </main>
  );
}