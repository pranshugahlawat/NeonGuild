"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";

export default function ProofUploadModal({
  open,
  completionId,
  onCloseAction,
  onUploadedAction
}: {
  open: boolean;
  completionId: string | null;
  onCloseAction: () => void;
  onUploadedAction?: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function upload() {
    if (!completionId) return;
    if (!file) return setMsg("Select an image first.");
    if (!file.type.startsWith("image/")) return setMsg("Only image files are allowed.");
    if (file.size > 5 * 1024 * 1024) return setMsg("Max file size is 5MB.");

    setBusy(true);
    setMsg("");

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() || "png";
      const objectPath = `${userId}/${completionId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("proofs")
        .upload(objectPath, file, { upsert: true, contentType: file.type });

      if (upErr) throw upErr;

      const { error: rpcErr } = await supabase.rpc("add_completion_proof", {
        p_completion_id: completionId,
        p_object_path: objectPath
      });

      if (rpcErr) throw rpcErr;

      setMsg("Proof uploaded.");
      onUploadedAction?.();

      setTimeout(() => {
        setFile(null);
        setMsg("");
        onCloseAction();
      }, 600);
    } catch (e: any) {
      setMsg(e?.message ?? "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-[rgba(0,0,0,0.85)] px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Upload proof image"
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-[rgba(124,92,255,0.30)] bg-[#0B1020] p-6 shadow-neon2"
            initial={{ scale: 0.92, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
          >
            <div className="text-sm text-mut">Verification</div>
            <div className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-orbitron)" }}>
              Upload Proof (optional)
            </div>
            <p className="mt-2 text-sm text-mut">
              Add an image as evidence. It is linked server-side to the completion log.
            </p>

            <div className="mt-4">
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {msg ? <div className="mt-2 text-xs text-mut" aria-live="polite">{msg}</div> : null}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={onCloseAction} disabled={busy}>
                Skip
              </Button>
              <Button onClick={upload} disabled={busy || !completionId}>
                {busy ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}