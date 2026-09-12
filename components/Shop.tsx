"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";

type Item = {
  id: string;
  name: string;
  type: "theme" | "badge";
  price: number;
};

export default function Shop() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("shop_items").select("id,name,type,price").order("price", { ascending: true });
    setItems((data ?? []) as any);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buy(id: string) {
    setBusy(id);
    const { error } = await supabase.rpc("buy_item", { p_item_id: id });
    setBusy(null);
    if (error) alert(error.message);
    else alert("Purchased!");
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((it) => (
        <div key={it.id} className="rounded-2xl bg-panel2 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{it.name}</div>
              <div className="mt-1 text-xs text-mut">{it.type.toUpperCase()}</div>
              <div className="mt-2 text-sm">
                Price: <span className="font-semibold">{it.price}</span> Gold
              </div>
            </div>
            <Button onClick={() => buy(it.id)} disabled={busy === it.id}>
              {busy === it.id ? "..." : "Buy"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}