import StatsCard from "@/components/StatsCard";
import QuestList from "@/components/QuestList";
import { Card } from "@/components/ui/Card";

export default function DashboardPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <StatsCard />
      </div>

      <div className="lg:col-span-2 grid gap-4">
        <Card>
          <div className="text-lg font-semibold">Today’s Quests</div>
          <p className="mt-1 text-sm text-mut">
            Complete quests to earn XP + Gold. Daily habits are limited to once per day (server-enforced).
          </p>
          <div className="mt-4">
            <QuestList mode="today" />
          </div>
        </Card>

        <Card>
          <div className="text-lg font-semibold">Recent Activity</div>
          <p className="mt-1 text-sm text-mut">Stored in the database completion log.</p>
          <div className="mt-4">
            <QuestList mode="recent" />
          </div>
        </Card>
      </div>
    </div>
  );
}