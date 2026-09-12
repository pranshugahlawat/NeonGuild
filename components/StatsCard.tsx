"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";

type Profile = {
  level: number;
  xp: number;
  gold: number;
  streak_count: number;
  display_name: string | null;
};

type Attributes = {
  strength_xp: number;
  intellect_xp: number;
  focus_xp: number;
  vitality_xp: number;
};

function totalXpForLevel(level: number) {
  return Math.floor(75 * Math.pow(level - 1, 2) + 100 * (level - 1));
}

export default function StatsCard() {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attr, setAttr] = useState<Attributes | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: p } = await supabase.from("profiles").select("*").single();
    const { data: a } = await supabase.from("attributes").select("*").single();
    setProfile((p as any) ?? null);
    setAttr((a as any) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // lightweight polling to avoid requiring realtime setup
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !profile) return <Card className="min-h-[280px]">Loading character...</Card>;

  const nextLevelXp = totalXpForLevel(profile.level + 1);
  const currLevelXp = totalXpForLevel(profile.level);
  const intoLevel = Math.max(0, profile.xp - currLevelXp);
  const needed = Math.max(1, nextLevelXp - currLevelXp);
  const pct = Math.min(100, Math.round((intoLevel / needed) * 100));

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-mut">Character</div>
          <div className="text-xl font-semibold" style={{ fontFamily: "var(--font-orbitron)" }}>
            {profile.display_name ?? "Unnamed Adventurer"}
          </div>
        </div>
        <div className="rounded-xl bg-panel2 px-3 py-2 text-sm">
          <div className="text-mut text-xs">Streak</div>
          <div className="font-semibold">{profile.streak_count} day(s)</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <div className="text-mut">Level</div>
          <div className="font-semibold">Lv. {profile.level}</div>
        </div>

        <div className="mt-2 h-3 w-full rounded-full bg-[rgba(255,255,255,0.10)]">
          <motion.div
            className="h-3 rounded-full bg-neon2"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            aria-label={`XP progress ${pct}%`}
          />
        </div>

        <div className="mt-2 text-xs text-mut">
          XP: {profile.xp} (next at {nextLevelXp})
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-panel2 p-3">
          <div className="text-xs text-mut">Gold</div>
          <div className="text-lg font-semibold">{profile.gold}</div>
        </div>
        <div className="rounded-xl bg-panel2 p-3">
          <div className="text-xs text-mut">Attributes</div>
          <div className="text-xs text-mut mt-1">
            STR {attr?.strength_xp ?? 0} · INT {attr?.intellect_xp ?? 0}
            <br />
            FOC {attr?.focus_xp ?? 0} · VIT {attr?.vitality_xp ?? 0}
          </div>
        </div>
      </div>
    </Card>
  );
}