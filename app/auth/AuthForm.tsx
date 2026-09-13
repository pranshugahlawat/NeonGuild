"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Mode = "login" | "signup";

export default function AuthForm({ nextPath }: { nextPath: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ok">("idle");
  const [message, setMessage] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      if (!email.trim() || password.length < 6) {
        setStatus("error");
        setMessage("Enter a valid email and password (min 6 chars).");
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setStatus("ok");
        setMessage("Account created. You can login now.");
        setMode("login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      window.location.href = nextPath || "/app";
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message ?? "Something went wrong.");
    } finally {
      if (mode !== "login") setStatus((s) => (s === "loading" ? "idle" : s));
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <Button type="button" variant={mode === "login" ? "solid" : "ghost"} onClick={() => setMode("login")}>
          Login
        </Button>
        <Button type="button" variant={mode === "signup" ? "solid" : "ghost"} onClick={() => setMode("signup")}>
          Signup
        </Button>
      </div>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-sm text-mut" htmlFor="email">Email</label>
          <Input id="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-mut" htmlFor="password">Password</label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button className="w-full" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Working..." : mode === "signup" ? "Create Character" : "Login"}
        </Button>

        <p className="min-h-[1.25rem] text-sm" aria-live="polite">
          {status === "error" ? <span className="text-danger">{message}</span> : null}
          {status === "ok" ? <span className="text-ok">{message}</span> : null}
        </p>
      </form>
    </div>
  );
}