"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import LevelUpModal from "@/components/LevelUpModal";
import confetti from "canvas-confetti";
import { relTime } from "@/lib/format";

type Quest = {
  id: string;
  title: string;
  notes: string | null;
  kind: "oneoff" | "daily";
  category: "strength" | "intellect" | "focus" | "vitality";
  difficulty: "easy" | "medium" | "hard";
  is_archived: boolean;
  created_at: string;
};

type CompletionLegacy = {
  id: string;
  completed_at: string;
  xp_earned: number;
  gold_earned: number;
  quest_id: string | null;
  quests: { title: string } | null;
};

// If you ran the "security hardening" migration, completions will also have quest_title.
// We keep it optional so the UI works either way.
type CompletionHardened = CompletionLegacy & {
  quest_title?: string | null;
};

function todayUtcKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function QuestList({ mode }: { mode: "today" | "all" | "recent" }) {
  const supabase = useMemo(() => createClient(), []);

  const [quests, setQuests] = useState<Quest[]>([]);
  const [recent, setRecent] = useState<CompletionHardened[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [newLevel, setNewLevel] = useState(1);

  async function loadRecent() {
    // Try hardened schema first (quest_title exists). If it fails, fallback to legacy select.
    const hardened = await supabase
      .from("quest_completions")
      .select("id, quest_id, completed_at, xp_earned, gold_earned, quest_title, quests(title)")
      .order("completed_at", { ascending: false })
      .limit(8);

    if (!hardened.error) {
      setRecent((hardened.data ?? []) as any);
      return;
    }

    const legacy = await supabase
      .from("quest_completions")
      .select("id, quest_id, completed_at, xp_earned, gold_earned, quests(title)")
      .order("completed_at", { ascending: false })
      .limit(8);

    if (legacy.error) {
      console.error(legacy.error);
      setRecent([]);
      return;
    }

    setRecent((legacy.data ?? []) as any);
  }

  async function loadQuestsAndTodayCompletions() {
    const qRes = await supabase
      .from("quests")
      .select("*")
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (qRes.error) {
      console.error(qRes.error);
      setQuests([]);
    } else {
      setQuests((qRes.data ?? []) as any);
    }

    const cRes = await supabase
      .from("quest_completions")
      .select("quest_id, completed_at")
      .order("completed_at", { ascending: false })
      .limit(200);

    if (cRes.error) {
      console.error(cRes.error);
      setCompletedToday(new Set());
      return;
    }

    const key = todayUtcKey();
    const set = new Set<string>();

    for (const row of cRes.data ?? []) {
      const questId = (row as any).quest_id as string | null;
      if (!questId) continue;

      const rowKey = new Date((row as any).completed_at).toISOString().slice(0, 10);
      if (rowKey === key) set.add(questId);
    }

    setCompletedToday(set);
  }

  async function load() {
    setLoading(true);

    try {
      if (mode === "recent") {
        await loadRecent();
      } else {
        await loadQuestsAndTodayCompletions();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function completeQuest(id: string) {
    setBusyId(id);

    // optimistic removal for “tactile” feel
    const prev = quests;
    setQuests((q) => q.filter((x) => x.id !== id));

    const { data, error } = await supabase.rpc("complete_quest", { p_quest_id: id });

    if (error) {
      setQuests(prev);
      setBusyId(null);
      alert(error.message);
      return;
    }

    const returned = (data as any) ?? null;

    if (returned?.leveled_up) {
      setNewLevel(returned.new_level);
      setLevelUpOpen(true);
      confetti({ particleCount: 140, spread: 70, origin: { y: 0.6 } });
    } else {
      confetti({ particleCount: 55, spread: 45, origin: { y: 0.75 } });
    }

    setBusyId(null);
    await load();
  }

  async function archiveQuest(id: string) {
    setBusyId(id);
    const { error } = await supabase.from("quests").update({ is_archived: true }).eq("id", id);
    setBusyId(null);
    if (error) alert(error.message);
    await load();
  }

  async function deleteQuest(id: string) {
    if (!confirm("Delete this quest permanently?")) return;
    setBusyId(id);
    const { error } = await supabase.from("quests").delete().eq("id", id);
    setBusyId(null);
    if (error) alert(error.message);
    await load();
  }

  if (loading) return <div className="text-sm text-mut">Loading...</div>;

  if (mode === "recent") {
    return (
      <div className="space-y-2">
        {recent.length === 0 ? <div className="text-sm text-mut">No completions yet.</div> : null}
        {recent.map((c) => {
          const title = c.quest_title ?? c.quests?.title ?? "Quest";

          return (
            <div key={c.id} className="rounded-xl bg-panel2 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{title}</div>
                <div className="text-xs text-mut">{relTime(c.completed_at)}</div>
              </div>
              <div className="mt-1 text-xs text-mut">
                +{c.xp_earned} XP · +{c.gold_earned} Gold
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <LevelUpModal open={levelUpOpen} level={newLevel} onClose={() => setLevelUpOpen(false)} />

      <div className="space-y-2">
        {quests.length === 0 ? <div className="text-sm text-mut">No active quests. Create one.</div> : null}

        {quests.map((q) => {
          const isDoneToday = q.kind === "daily" && completedToday.has(q.id);

          return (
            <div key={q.id} className="rounded-xl bg-panel2 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium">{q.title}</div>
                    <span className="rounded-lg bg-[rgba(0,0,0,0.35)] px-2 py-1 text-[10px] text-mut">
                      {q.kind === "daily" ? "DAILY" : "ONE-OFF"}
                    </span>
                  </div>

                  {q.notes ? <div className="mt-1 text-xs text-mut">{q.notes}</div> : null}

                  <div className="mt-2 text-xs text-mut">
                    {q.category.toUpperCase()} · {q.difficulty.toUpperCase()}
                    {isDoneToday ? " · COMPLETED TODAY" : ""}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={() => completeQuest(q.id)} disabled={busyId === q.id || isDoneToday}>
                    {isDoneToday ? "Done" : busyId === q.id ? "..." : "Complete"}
                  </Button>

                  {mode === "all" ? (
                    <>
                      <Button variant="ghost" onClick={() => archiveQuest(q.id)} disabled={busyId === q.id}>
                        Archive
                      </Button>
                      <Button variant="danger" onClick={() => deleteQuest(q.id)} disabled={busyId === q.id}>
                        Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}