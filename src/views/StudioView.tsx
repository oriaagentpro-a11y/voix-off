import React from "react";
import { KeyRound, Library, Play, Pause, X } from "lucide-react";
import { VoiceTake } from "../types";
import { formatTimecode } from "../utils/audio";
import { PageHeader } from "../components/AppShell";
import { Button, Card, CardHeader, EmptyState, IconButton, cx } from "../components/ui";

export const relativeTime = (ts: number) => {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.round(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export const KeyBanner: React.FC<{ onOpen: () => void; onDismiss: () => void }> = ({ onOpen, onDismiss }) => (
  <div role="note" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-warning/40 bg-warning-soft px-4 py-3">
    <div className="flex items-center gap-3 text-sm">
      <KeyRound className="h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
      <span><strong className="font-semibold">Aucune clé API enregistrée dans l'application.</strong> Si votre serveur n'en a pas, ajoutez-en une pour générer.</span>
    </div>
    <div className="flex items-center gap-1">
      <Button size="sm" variant="secondary" onClick={onOpen}>Ajouter une clé</Button>
      <IconButton size="sm" label="Masquer ce message" icon={<X />} onClick={onDismiss} />
    </div>
  </div>
);

export const RecentTakes: React.FC<{
  takes: VoiceTake[]; activeTakeId: string | null; isPlayingActive: boolean; onPlay: (t: VoiceTake) => void; onSeeAll: () => void;
}> = ({ takes, activeTakeId, isPlayingActive, onPlay, onSeeAll }) => (
  <Card aria-labelledby="recent-title">
    <CardHeader
      id="recent-title"
      icon={<Library />}
      title="Dernières prises"
      action={takes.length > 0 ? <Button size="sm" variant="ghost" onClick={onSeeAll}>Tout voir</Button> : undefined}
    />
    {takes.length === 0 ? (
      <EmptyState compact icon={<Library />} title="Pas encore de prise" text="Vos voix générées apparaîtront ici." />
    ) : (
      <ul className="flex flex-col gap-1.5">
        {takes.slice(0, 3).map((t) => {
          const playable = !!t.audioUrl;
          const on = activeTakeId === t.id;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onPlay(t)}
                disabled={!playable}
                aria-label={`${on && isPlayingActive ? "Mettre en pause" : "Écouter"} : ${t.title}, ${formatTimecode(t.duration)}`}
                className={cx(
                  "flex w-full cursor-pointer items-center gap-3 rounded-[12px] p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  on ? "bg-accent-soft" : "hover:bg-surface-2"
                )}
              >
                <span aria-hidden="true" className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", on ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink")}>
                  {on && isPlayingActive ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{t.title}</span>
                  <span className="block text-xs text-ink-2">{t.voice} · {relativeTime(t.timestamp)}</span>
                </span>
                <span className="tabular text-xs text-ink-2">{formatTimecode(t.duration)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </Card>
);

export const StudioView: React.FC<{
  banner?: React.ReactNode; editor: React.ReactNode; voices?: React.ReactNode; generate: React.ReactNode; recent: React.ReactNode;
}> = ({ banner, editor, voices, generate, recent }) => (
  <>
    <PageHeader title="Studio" subtitle="Écrivez, choisissez une voix, générez." />
    {banner}
    {/* Ordre mobile : texte → générer → voix → prises. Sur grand écran, la colonne de droite reste collée. */}
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">{editor}</div>
      <aside aria-label="Génération" className="min-w-0 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:self-start">
        {generate}
      </aside>
      {voices && <div className="min-w-0 lg:col-start-1 lg:row-start-2">{voices}</div>}
      <div className="min-w-0 lg:col-start-2 lg:row-start-2 lg:self-start">{recent}</div>
    </div>
  </>
);
