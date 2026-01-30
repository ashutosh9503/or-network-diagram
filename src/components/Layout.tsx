import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ModeToggle } from "./mode-toggle";
import { AboutUs } from "./AboutUs";
import { Toaster } from "@/components/ui/sonner";

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative isolate">
      {/* Background patterns */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-400 opacity-10 blur-[100px] dark:bg-indigo-900"></div>
      </div>

      <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500" />

      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white text-lg font-bold shadow-sm">
              OR
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-wide">
                OR Network Diagram Generator
              </p>
              <p className="text-xs text-muted-foreground">
                Operations Research Toolkit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <AboutUs />
            <ModeToggle />
          </div>
        </div>
      </header>

      <motion.main
        className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {children}
      </motion.main>

      <footer className="border-t bg-muted/50 text-center text-xs text-muted-foreground py-6">
        <p>© {new Date().getFullYear()} OR Network Diagram Generator. Designed for Students & Professions.</p>
      </footer>
      <Toaster />
    </div>
  );
}
