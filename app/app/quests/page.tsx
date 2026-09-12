import QuestForm from "@/components/QuestForm";
import QuestList from "@/components/QuestList";
import { Card } from "@/components/ui/Card";

export default function QuestsPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <div className="text-lg font-semibold">Create Quest / Daily Habit</div>
        <p className="mt-1 text-sm text-mut">One-offs can be completed once; daily habits once per day.</p>
        <div className="mt-4">
          <QuestForm />
        </div>
      </Card>

      <Card>
        <div className="text-lg font-semibold">Your Quest Board</div>
        <p className="mt-1 text-sm text-mut">One-offs auto-archive after completion.</p>
        <div className="mt-4">
          <QuestList mode="all" />
        </div>
      </Card>
    </div>
  );
}