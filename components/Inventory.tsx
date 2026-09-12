"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Row = {
  acquired_at: string;
  shop_items: { name: string; type: string } | null;
};

export default function Inventory() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("inventory")
      .select("acquired_at, shop_items(name,type)")
      .order("acquired_at", { ascending: false });

    setRows((data ?? []) as any);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="text-sm text-mut">Loading...</div>;

  return (
    <div className="space-y-2">
      {rows.length === 0 ? <div className="text-sm text-mut">No items yet. Visit the shop.</div> : null}
      {rows.map((r, idx) => (
        <div key={idx} className="rounded-xl bg-panel2 p-3">
          <div className="font-medium">{r.shop_items?.name ?? "Item"}</div>
          <div className="text-xs text-mut">{r.shop_items?.type ?? ""}</div>
        </div>
      ))}
    </div>
  );
}