import React, { useState } from "react";
import { GraduationCap, Compass, Zap, Sparkles, BookOpen, Radio, Flame, Heart, Briefcase, ChevronDown, Check, FileText } from "lucide-react";
import { StudioPreset } from "../types";
import { PageHeader } from "../components/AppShell";
import { Badge, Button, Card, IconChip, cx } from "../components/ui";

const ICONS: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap />, Compass: <Compass />, Zap: <Zap />, Sparkles: <Sparkles />, BookOpen: <BookOpen />,
  Radio: <Radio />, Flame: <Flame />, Heart: <Heart />, Briefcase: <Briefcase />,
};

export const EQ_LABELS: Record<string, string> = {
  broadcast: "Radio", clarity: "Clarté", warmth: "Chaleur", air_presence: "Brillance", podcast: "Podcast", flat: "Neutre",
};

const pct = (v: number) => `${Math.round(v * 100)} %`;

export const PresetsView: React.FC<{
  presets: StudioPreset[]; activePresetId: string | null; onApply: (p: StudioPreset, insertScript: boolean) => void; isGenerating: boolean;
}> = ({ presets, activePresetId, onApply, isGenerating }) => {
  const categories = ["Tous", ...Array.from(new Set(presets.map((p) => p.category)))];
  const [cat, setCat] = useState("Tous");
  const [open, setOpen] = useState<string | null>(null);
  const list = cat === "Tous" ? presets : presets.filter((p) => p.category === cat);

  return (
    <>
      <PageHeader title="Préréglages" subtitle="Un point de départ par type de projet : voix, direction de jeu et mixage réglés d'un clic." />

      <div role="group" aria-label="Filtrer par catégorie" className="mb-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={cat === c}
            onClick={() => setCat(c)}
            className={cx(
              "h-9 cursor-pointer rounded-full border px-4 text-[13px] font-medium transition-colors",
              cat === c ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {list.map((p) => {
          const active = p.id === activePresetId;
          const isOpen = open === p.id;
          return (
            <li key={p.id} className="min-w-0">
              <Card as="article" aria-labelledby={`p-${p.id}`} className={cx("flex h-full flex-col", active && "ring-2 ring-accent")}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconChip tone={active ? "accent" : "neutral"}>{ICONS[p.iconName] ?? <Briefcase />}</IconChip>
                    <div className="min-w-0">
                      <h2 id={`p-${p.id}`} className="text-[15px] font-semibold leading-snug">{p.name}</h2>
                      <p className="text-xs text-ink-2">{p.category} · voix {p.recommendedVoice}</p>
                    </div>
                  </div>
                  {active && <Badge tone="accent"><Check />Actif</Badge>}
                </div>
                <p className="text-[13px] leading-relaxed text-ink-2">{p.tagline}</p>

                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-[16px] bg-surface-2 p-3">
                  <div><dt className="text-xs text-ink-2">Égalisation</dt><dd className="text-sm font-semibold">{EQ_LABELS[p.eqPreset] ?? p.eqPreset}</dd></div>
                  <div><dt className="text-xs text-ink-2">Chaleur</dt><dd className="tabular text-sm font-semibold">{pct(p.proximityWarmth)}</dd></div>
                  <div><dt className="text-xs text-ink-2">Brillance</dt><dd className="tabular text-sm font-semibold">{pct(p.airClarity)}</dd></div>
                </dl>

                {isOpen && (
                  <div id={`d-${p.id}`} className="animate-fade-up mt-4 space-y-3 text-[13px]">
                    <div><p className="font-semibold">Direction de jeu</p><p className="text-ink-2">{p.stylePrompt}</p></div>
                    <div><p className="font-semibold">Conseil de rythme</p><p className="text-ink-2">{p.pacingAdvice}</p></div>
                    <div><p className="font-semibold">Texte d'exemple</p><p className="rounded-[12px] bg-surface-2 p-3 text-ink">{p.sampleScript}</p></div>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                  <Button size="sm" variant={active ? "secondary" : "primary"} onClick={() => onApply(p, false)} disabled={isGenerating} icon={active ? <Check /> : undefined}>
                    {active ? "Réappliquer" : "Appliquer"}
                  </Button>
                  <Button size="sm" variant="ghost" icon={<FileText />} onClick={() => onApply(p, true)} disabled={isGenerating} title="Applique les réglages et remplace votre texte par l'exemple">
                    Avec le texte d'exemple
                  </Button>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`d-${p.id}`}
                    onClick={() => setOpen(isOpen ? null : p.id)}
                    className="ml-auto inline-flex h-9 cursor-pointer items-center gap-1 rounded-[10px] px-2.5 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
                  >
                    Détails
                    <ChevronDown className={cx("h-4 w-4 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                  </button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </>
  );
};
