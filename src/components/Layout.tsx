// src/components/Layout.tsx
import { ReactNode } from "react";
import { motion } from "framer-motion";

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500" />

      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-lg font-bold">
              OR
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-wide text-slate-100">
                OR Network Diagram Generator
              </p>
              <p className="text-xs text-slate-400">
                Critical Path • CPM • PERT • Student Friendly
              </p>
            </div>
          </div>
        </div>
      </header>

      <motion.main
        className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {children}
      </motion.main>

      <footer className="border-t border-slate-800 bg-slate-950/90 text-center text-xs text-slate-500 py-3">
        © {new Date().getFullYear()} OR Diagram Studio — Built for Students 🚀
      </footer>
    </div>
  );
}
