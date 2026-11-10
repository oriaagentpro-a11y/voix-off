import React from "react";
import { Mic, LayoutGrid, Library, SlidersHorizontal, Settings, AudioLines } from "lucide-react";
import { cx } from "./ui";

export type ViewId = "studio" | "presets" | "takes" | "mix" | "settings";

export const NAV: { id: ViewId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "studio", label: "Studio", icon: <Mic />, hint: "Écrire et générer" },
  { id: "presets", label: "Préréglages", icon: <LayoutGrid />, hint: "Points de départ par projet" },
  { id: "takes", label: "Prises", icon: <Library />, hint: "Historique des générations" },
  { id: "mix", label: "Mixage", icon: <SlidersHorizontal />, hint: "Rendu sonore" },
  { id: "settings", label: "Réglages", icon: <Settings />, hint: "Clés API, apparence, aide" },
];

export const AppShell: React.FC<{
  view: ViewId; onNavigate: (v: ViewId) => void; takeCount: number; hasKeys: boolean; player: React.ReactNode; children: React.ReactNode;
}> = ({ view, onNavigate, takeCount, hasKeys, player, children }) => (
  <div className="min-h-screen bg-bg text-ink">
    <a href="#contenu" className="skip-link">Aller au contenu</a>

    {/* Barre latérale : icônes de 768 à 1279 px, complète au-delà */}
    <nav aria-label="Navigation principale" className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col border-r border-line bg-surface md:flex xl:w-[240px]">
      <div className="flex h-[72px] items-center gap-2.5 px-4 xl:px-5">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-accent text-accent-ink">
          <AudioLines className="h-5 w-5" />
        </span>
        <span className="hidden text-[17px] font-semibold tracking-tight xl:block">VoxStudio</span>
      </div>
      <ul className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {NAV.map((n) => {
          const on = view === n.id;
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onNavigate(n.id)}
                aria-current={on ? "page" : undefined}
                title={n.label}
                className={cx(
                  "group flex h-11 w-full cursor-pointer items-center gap-3 rounded-[12px] px-3 text-left text-sm font-medium transition-colors [&>svg]:h-5 [&>svg]:w-5 [&>svg]:shrink-0",
                  "justify-center xl:justify-start",
                  on ? "bg-accent-soft text-accent-soft-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                )}
              >
                {n.icon}
                <span className="sr-only xl:not-sr-only xl:flex-1">{n.label}</span>
                {n.id === "takes" && takeCount > 0 && (
                  <span className="hidden rounded-full bg-surface-2 px-2 text-xs tabular text-ink-2 xl:inline">{takeCount}</span>
                )}
                {n.id === "settings" && !hasKeys && (
                  <span className="h-2 w-2 rounded-full bg-warning" aria-label="Clé API à configurer" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="hidden px-5 pb-[112px] text-xs text-ink-2 xl:block">
        <p className="font-medium text-ink">VoxStudio Pro</p>
        <p>Voix off IA en français</p>
      </div>
    </nav>

    <main id="contenu" tabIndex={-1} className="pb-[176px] focus:outline-none md:pl-[72px] md:pb-[120px] xl:pl-[240px]">
      <div className="mx-auto w-full max-w-[1320px] px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">{children}</div>
    </main>

    {player}

    {/* Barre d'onglets mobile */}
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface md:hidden">
      <ul className="grid grid-cols-5">
        {NAV.map((n) => {
          const on = view === n.id;
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onNavigate(n.id)}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "flex h-16 w-full cursor-pointer flex-col items-center justify-center gap-1 text-xs font-medium [&>svg]:h-5 [&>svg]:w-5",
                  on ? "text-accent" : "text-ink-2"
                )}
              >
                {n.icon}
                <span>{n.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  </div>
);

export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      <h1 className="text-[24px] font-semibold leading-tight tracking-tight sm:text-[28px]">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);
