import React, { useMemo, useState } from "react";
import { Library, Play, Pause, Star, RotateCcw, Download, Trash2, Search, Clock, Mic } from "lucide-react";
import { VoiceTake } from "../types";
import { formatTimecode } from "../utils/audio";
import { PageHeader } from "../components/AppShell";
import { Button, Card, ConfirmDialog, EmptyState, IconButton, IconChip, Segmented, Stat, inputCls, cx } from "../components/ui";
import { relativeTime } from "./StudioView";

export const TakesView: React.FC<{
  takes: VoiceTake[];
  activeTakeId: string | null;
  isPlayingActive: boolean;
  onPlay: (t: VoiceTake) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRestore: (t: VoiceTake) => void;
  onGoStudio: () => void;
}> = ({ takes, activeTakeId, isPlayingActive, onPlay, onDelete, onToggleFavorite, onRestore, onGoStudio }) => {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "fav">("all");
  const [toDelete, setToDelete] = useState<VoiceTake | null>(null);

  const total = takes.reduce((s, t) => s + (t.duration || 0), 0);
  const favs = takes.filter((t) => t.isFavorite).length;
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return takes.filter((t) => (filter === "all" || t.isFavorite) && (!n || `${t.title} ${t.voice} ${t.text}`.toLowerCase().includes(n)));
  }, [takes, q, filter]);

  const download = (t: VoiceTake) => {
    const a = document.createElement("a");
    a.href = t.audioUrl;
    a.download = `prise_${t.voice.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${t.id}.wav`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <>
      <PageHeader title="Prises" subtitle="Toutes les voix générées pendant vos sessions." />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="!p-5"><div className="flex items-center gap-3"><IconChip><Library /></IconChip><Stat size="lg" label="Prises" value={takes.length} /></div></Card>
        <Card className="!p-5"><div className="flex items-center gap-3"><IconChip><Clock /></IconChip><Stat size="lg" label="Durée totale" value={formatTimecode(total)} /></div></Card>
        <Card className="!p-5"><div className="flex items-center gap-3"><IconChip><Star /></IconChip><Stat size="lg" label="Favoris" value={favs} /></div></Card>
      </div>

      <Card aria-label="Liste des prises">
        {takes.length === 0 ? (
          <EmptyState
            icon={<Mic />}
            title="Aucune prise pour l'instant"
            text="Chaque voix générée est ajoutée ici, prête à être réécoutée ou téléchargée."
            action={<Button variant="primary" onClick={onGoStudio}>Aller au Studio</Button>}
          />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-2" aria-hidden="true" />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un texte, une voix…" aria-label="Rechercher dans les prises" className={cx(inputCls, "!pl-10")} />
              </div>
              <Segmented label="Afficher" value={filter} onChange={(v) => setFilter(v as "all" | "fav")} options={[{ value: "all", label: "Toutes" }, { value: "fav", label: "Favoris" }]} />
            </div>

            {list.length === 0 ? (
              <EmptyState compact icon={<Search />} title="Aucun résultat" text="Modifiez la recherche ou le filtre." />
            ) : (
              <ul className="divide-y divide-line">
                {list.map((t) => {
                  const on = activeTakeId === t.id;
                  const playable = !!t.audioUrl;
                  return (
                    <li key={t.id} className={cx("flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap", on && "-mx-3 rounded-[12px] bg-accent-soft/60 px-3")}>
                      <IconButton
                        variant={on ? "primary" : "secondary"}
                        label={!playable ? "Audio indisponible (session précédente)" : on && isPlayingActive ? `Mettre en pause ${t.title}` : `Écouter ${t.title}`}
                        icon={on && isPlayingActive ? <Pause className="fill-current" /> : <Play className="fill-current" />}
                        onClick={() => onPlay(t)}
                        disabled={!playable}
                        className="!rounded-full"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{t.title}</p>
                        <p className="truncate text-[13px] text-ink-2">{t.text}</p>
                      </div>
                      <div className="tabular hidden w-28 text-right text-xs text-ink-2 md:block">
                        <p>{formatTimecode(t.duration)}</p>
                        <p>{relativeTime(t.timestamp)}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <IconButton label={t.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={!!t.isFavorite} icon={<Star className={t.isFavorite ? "fill-current text-warning" : ""} />} onClick={() => onToggleFavorite(t.id)} />
                        <IconButton label="Reprendre ce texte dans le Studio" icon={<RotateCcw />} onClick={() => onRestore(t)} />
                        <IconButton label="Télécharger (WAV)" icon={<Download />} onClick={() => download(t)} disabled={!playable} />
                        <IconButton label="Supprimer la prise" icon={<Trash2 />} variant="danger" onClick={() => setToDelete(t)} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer cette prise ?"
        message={<>« {toDelete?.title} » sera retirée de l'historique. Cette action est définitive.</>}
        confirmLabel="Supprimer"
        onCancel={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) onDelete(toDelete.id); setToDelete(null); }}
      />
    </>
  );
};
