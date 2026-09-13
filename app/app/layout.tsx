import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { Analytics } from "@vercel/analytics/next"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/auth");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Nav />
        <div className="mt-6">{children}</div>
      </div>
      <Analytics/>
    </div>
  );
}