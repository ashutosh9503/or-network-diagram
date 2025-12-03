import React from "react";

type SectionId = "hero" | "activities" | "network" | "lpp";

const LINKS: { id: SectionId; label: string }[] = [
  { id: "hero",       label: "Home" },
  { id: "activities", label: "Activities / CPM–PERT" },
  { id: "network",    label: "Network Diagram" },
  { id: "lpp",        label: "LPP Solver" },
];

function scrollToSection(id: SectionId) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export const MainNav: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo + name */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white shadow-sm">
            OR
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">
              OR Network Diagram Generator
            </div>
            <div className="text-xs text-slate-500">
              CPM • PERT • LPP • Transportation (soon)
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="hidden gap-4 text-sm font-medium text-slate-600 md:flex">
          {LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="rounded-full px-3 py-1 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
