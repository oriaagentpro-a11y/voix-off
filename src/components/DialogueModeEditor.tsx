import React, { useId } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { DialogueLine, VoiceId } from "../types";
import { estimateReadingTime } from "../utils/audio";
import { Card, CardHeader, IconButton, MenuButton, Select, inputCls, cx } from "./ui";

interface Speaker { name: string; voice: VoiceId; style: string; }

interface DialogueModeEditorProps {
  speakers: [Speaker, Speaker];
  onChangeSpeaker: (index: 0 | 1, patch: Partial<Speaker>) => void;
  lines: DialogueLine[];
  onAddLine: (speaker: string) => void;
  onUpdateLine: (id: string, text: string, style?: string) => void;
  onDeleteLine: (id: string) => void;
  onLoadDialogueTemplate: (tmpl: string) => void;
  modeSwitch: React.ReactNode;
}

const VOICES: VoiceId[] = ["Puck", "Kore", "Zephyr", "Fenrir", "Charon"];

const SpeakerCard: React.FC<{ s: Speaker; index: 0 | 1; onChange: (p: Partial<Speaker>) => void }> = ({ s, index, onChange }) => {
  const id = useId();
  const b = index === 1;
  return (
    <fieldset className={cx("rounded-[16px] border-2 p-4", b ? "border-speaker-b/40 bg-speaker-b-soft/40" : "border-accent/40 bg-accent-soft/40")}>
      <legend className={cx("px-1 text-[13px] font-semibold", b ? "text-speaker-b" : "text-accent")}>Intervenant {index + 1}</legend>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-n`} className="text-xs font-medium text-ink-2">Nom</label>
          <input id={`${id}-n`} value={s.name} onChange={(e) => onChange({ name: e.target.value })} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span id={`${id}-v`} className="text-xs font-medium text-ink-2">Voix</span>
          <Select label={`Voix de l'intervenant ${index + 1}`} value={s.voice} onChange={(v) => onChange({ voice: v as VoiceId })} options={VOICES.map((v) => ({ value: v, label: v }))} />
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <label htmlFor={`${id}-s`} className="text-xs font-medium text-ink-2">Style de jeu</label>
          <input id={`${id}-s`} value={s.style} onChange={(e) => onChange({ style: e.target.value })} placeholder="Ex. : posée, complice" className={inputCls} />
        </div>
      </div>
    </fieldset>
  );
};

export const DialogueModeEditor: React.FC<DialogueModeEditorProps> = ({
  speakers, onChangeSpeaker, lines, onAddLine, onUpdateLine, onDeleteLine, onLoadDialogueTemplate, modeSwitch,
}) => {
  const words = (name: string) => lines.filter((l) => l.speaker === name).reduce((n, l) => n + estimateReadingTime(l.text).words, 0);
  const wA = words(speakers[0].name), wB = words(speakers[1].name);
  const total = wA + wB;
  const pA = total ? Math.round((wA / total) * 100) : 50;

  return (
    <Card aria-labelledby="duo-title">
      <CardHeader
        id="duo-title"
        icon={<Users />}
        title="Dialogue"
        subtitle="Deux voix, une seule prise"
        action={
          <>
            {modeSwitch}
            <MenuButton
              label="Modèles"
              items={[
                { id: "podcast", label: "Discussion podcast", desc: "Un hôte et une experte", onSelect: () => onLoadDialogueTemplate("podcast") },
                { id: "pub", label: "Saynète publicitaire", desc: "Deux voix contrastées", onSelect: () => onLoadDialogueTemplate("pub_duo") },
              ]}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SpeakerCard s={speakers[0]} index={0} onChange={(p) => onChangeSpeaker(0, p)} />
        <SpeakerCard s={speakers[1]} index={1} onChange={(p) => onChangeSpeaker(1, p)} />
      </div>

      {/* Répartition de la parole */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-[13px]">
          <span className="flex items-center gap-1.5 font-medium"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />{speakers[0].name || "Intervenant 1"} · {pA} %</span>
          <span className="flex items-center gap-1.5 font-medium">{speakers[1].name || "Intervenant 2"} · {100 - pA} %<span aria-hidden="true" className="h-2 w-2 rounded-full bg-speaker-b" /></span>
        </div>
        <div className="flex h-2.5 gap-1" role="img" aria-label={`Répartition de la parole : ${pA} % pour ${speakers[0].name}, ${100 - pA} % pour ${speakers[1].name}`}>
          <div className="rounded-full bg-accent transition-all" style={{ width: `${pA}%` }} />
          <div className="rounded-full bg-speaker-b transition-all" style={{ width: `${100 - pA}%` }} />
        </div>
      </div>

      {/* Répliques */}
      <h3 className="mt-6 mb-3 text-sm font-semibold">Répliques <span className="font-normal text-ink-2">({lines.length})</span></h3>
      <ol className="flex flex-col gap-2.5">
        {lines.map((line, i) => {
          const b = line.speaker === speakers[1].name;
          return (
            <li key={line.id} className={cx("rounded-[16px] border-l-4 bg-surface-2 p-3", b ? "border-speaker-b" : "border-accent")}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label htmlFor={`line-${line.id}`} className={cx("text-[13px] font-semibold", b ? "text-speaker-b" : "text-accent")}>
                  {line.speaker} <span className="font-normal text-ink-2">· réplique {i + 1}</span>
                </label>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => onUpdateLine(line.id, `${line.text.trimEnd()} <breath> `, line.style)} className="h-8 cursor-pointer rounded-full px-2.5 text-xs font-medium text-ink-2 hover:bg-surface hover:text-ink">+ Respiration</button>
                  <button type="button" onClick={() => onUpdateLine(line.id, `${line.text.trimEnd()} |mhm| `, line.style)} className="h-8 cursor-pointer rounded-full px-2.5 text-xs font-medium text-ink-2 hover:bg-surface hover:text-ink">+ Hésitation</button>
                  <IconButton size="sm" variant="danger" label={`Supprimer la réplique ${i + 1}`} icon={<Trash2 />} onClick={() => onDeleteLine(line.id)} />
                </div>
              </div>
              <textarea
                id={`line-${line.id}`}
                value={line.text}
                onChange={(e) => onUpdateLine(line.id, e.target.value, line.style)}
                placeholder="Texte de la réplique…"
                rows={2}
                className={cx(inputCls, "resize-y")}
              />
            </li>
          );
        })}
      </ol>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onAddLine(speakers[0].name)} className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 truncate rounded-[12px] border border-accent/50 px-3 text-sm font-semibold text-accent hover:bg-accent-soft">
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">Réplique de {speakers[0].name || "1"}</span>
        </button>
        <button type="button" onClick={() => onAddLine(speakers[1].name)} className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 truncate rounded-[12px] border border-speaker-b/50 px-3 text-sm font-semibold text-speaker-b hover:bg-speaker-b-soft">
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">Réplique de {speakers[1].name || "2"}</span>
        </button>
      </div>
    </Card>
  );
};
