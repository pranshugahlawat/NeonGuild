"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type Category = "strength" | "intellect" | "focus" | "vitality";
type Difficulty = "easy" | "medium" | "hard";
type Kind = "oneoff" | "daily";

export default function QuestForm() {
  const supabase = useMemo(() => createClient(), []);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [kind, setKind] = useState<Kind>("oneoff");
  const [category, setCategory] = useState<Category>("intellect");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "ok">("idle");
  const [msg, setMsg] = useState("");

  async function createQuest(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMsg("");

    const t = title.trim();
    if (!t) {
      setStatus("error");
      setMsg("Quest title can’t be empty.");
      return;
    }

    const { error } = await supabase.from("quests").insert({
      title: t,
      notes: notes.trim() || null,
      kind,
      category,
      difficulty
    });

    if (error) {
      setStatus("error");
      setMsg(error.message);
      return;
    }

    setTitle("");
    setNotes("");
    setKind("oneoff");
    setCategory("intellect");
    setDifficulty("medium");
    setStatus("ok");
    setMsg("Created.");
    setTimeout(() => setStatus("idle"), 1200);
  }

  return (
    <form className="space-y-3" onSubmit={createQuest}>
      <div>
        <label className="text-sm text-mut" htmlFor="title">Title</label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </div>

      <div>
        <label className="text-sm text-mut" htmlFor="notes">Notes (optional)</label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={240} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-mut" htmlFor="kind">Type</label>
          <Select id="kind" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
            <option value="oneoff">One-off Quest</option>
            <option value="daily">Daily Habit</option>
          </Select>
        </div>

        <div>
          <label className="text-sm text-mut" htmlFor="difficulty">Difficulty</label>
          <Select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm text-mut" htmlFor="category">Category</label>
        <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          <option value="strength">Strength</option>
          <option value="intellect">Intellect</option>
          <option value="focus">Focus</option>
          <option value="vitality">Vitality</option>
        </Select>
      </div>

      <Button type="submit" disabled={status === "saving"} className="w-full">
        {status === "saving" ? "Creating..." : "Create"}
      </Button>

      <p className="min-h-[1.25rem] text-sm" aria-live="polite">
        {status === "error" ? <span className="text-danger">{msg}</span> : null}
        {status === "ok" ? <span className="text-ok">{msg}</span> : null}
      </p>
    </form>
  );
}