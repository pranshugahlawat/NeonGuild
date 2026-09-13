"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

export default function LevelUpModal({
  open,
  level,
  onCloseAction
}: {
  open: boolean;
  level: number;
  onCloseAction: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-[rgba(0,0,0,0.78)] px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Level up dialog"
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-[rgba(37,246,255,0.30)] bg-[#0B1020] p-6 shadow-neon2"
            initial={{ scale: 0.92, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
          >
            <div className="text-sm text-mut">Level Up!</div>
            <div className="mt-1 text-3xl font-semibold" style={{ fontFamily: "var(--font-orbitron)" }}>
              Lv. {level}
            </div>
            <p className="mt-3 text-sm text-mut">Your guild rank increased. Keep completing quests for loot.</p>
            <div className="mt-5 flex justify-end">
              <Button onClick={onCloseAction}>Continue</Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}