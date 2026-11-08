import React from "react";
import { DialogueLine } from "../types";
import { Users, Plus, Trash2, Mic, Sparkles, MessageSquare } from "lucide-react";

interface DialogueModeEditorProps {
  speaker1Name: string;
  setSpeaker1Name: (name: string) => void;
  speaker1Voice: "Kore" | "Puck" | "Zephyr" | "Fenrir" | "Charon";
  setSpeaker1Voice: (voice: any) => void;
  speaker1Style: string;
  setSpeaker1Style: (style: string) => void;

  speaker2Name: string;
  setSpeaker2Name: (name: string) => void;
  speaker2Voice: "Kore" | "Puck" | "Zephyr" | "Fenrir" | "Charon";
  setSpeaker2Voice: (voice: any) => void;
  speaker2Style: string;
  setSpeaker2Style: (style: string) => void;

  lines: DialogueLine[];
  onAddLine: (speaker: string) => void;
  onUpdateLine: (id: string, text: string, style?: string) => void;
  onDeleteLine: (id: string) => void;
  onLoadDialogueTemplate: (tmpl: string) => void;
}

const AVAILABLE_VOICES: ("Kore" | "Puck" | "Zephyr" | "Fenrir" | "Charon")[] = [
  "Puck",
  "Kore",
  "Zephyr",
  "Fenrir",
  "Charon",
];

export const DialogueModeEditor: React.FC<DialogueModeEditorProps> = ({
  speaker1Name,
  setSpeaker1Name,
  speaker1Voice,
  setSpeaker1Voice,
  speaker1Style,
  setSpeaker1Style,

  speaker2Name,
  setSpeaker2Name,
  speaker2Voice,
  setSpeaker2Voice,
  speaker2Style,
  setSpeaker2Style,

  lines,
  onAddLine,
  onUpdateLine,
  onDeleteLine,
  onLoadDialogueTemplate,
}) => {
  const insertTagToLine = (lineId: string, currentText: string, tag: string) => {
    onUpdateLine(lineId, currentText + " " + tag + " ");
  };

  return (
    <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <span>Scénario Dual Gemini 3.8 Flash-TTS</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.5 rounded font-bold">
              Flagship
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-500 text-[11px] mr-1 hidden sm:inline">Exemples :</span>
          <button
            type="button"
            onClick={() => onLoadDialogueTemplate("podcast")}
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/40 text-[11px] cursor-pointer"
          >
            Podcast Talk
          </button>
          <button
            type="button"
            onClick={() => onLoadDialogueTemplate("pub_duo")}
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/40 text-[11px] cursor-pointer"
          >
            Saynète Pub
          </button>
        </div>
      </div>

      {/* Speaker Configuration Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Speaker 1 */}
        <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-amber-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              Intervenant 1
            </span>
            <select
              value={speaker1Voice}
              onChange={(e) => setSpeaker1Voice(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-0.5 focus:outline-none cursor-pointer"
            >
              {AVAILABLE_VOICES.map((v) => (
                <option key={v} value={v}>
                  Voix : {v}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={speaker1Name}
              onChange={(e) => setSpeaker1Name(e.target.value)}
              placeholder="Nom (ex: Alex)"
              className="w-1/3 bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 rounded px-2.5 py-1 focus:outline-none focus:border-amber-500/60"
            />
            <input
              type="text"
              value={speaker1Style}
              onChange={(e) => setSpeaker1Style(e.target.value)}
              placeholder="Style (ex: Hôte dynamique, micro proximité)"
              className="flex-1 bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 rounded px-2.5 py-1 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        {/* Speaker 2 */}
        <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-cyan-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              Intervenant 2
            </span>
            <select
              value={speaker2Voice}
              onChange={(e) => setSpeaker2Voice(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-0.5 focus:outline-none cursor-pointer"
            >
              {AVAILABLE_VOICES.map((v) => (
                <option key={v} value={v}>
                  Voix : {v}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={speaker2Name}
              onChange={(e) => setSpeaker2Name(e.target.value)}
              placeholder="Nom (ex: Sam)"
              className="w-1/3 bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500/60"
            />
            <input
              type="text"
              value={speaker2Style}
              onChange={(e) => setSpeaker2Style(e.target.value)}
              placeholder="Style (ex: Posée, feutrée, bienveillante)"
              className="flex-1 bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
        </div>
      </div>

      {/* Script Lines Timeline */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold uppercase tracking-wider">Répliques & Réactions :</span>
          <span>{lines.length} répliques</span>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {lines.map((line, idx) => {
            const isSpeaker1 = line.speaker === speaker1Name;

            return (
              <div
                key={line.id}
                className={`p-3 rounded-xl border flex flex-col gap-2 ${
                  isSpeaker1
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-cyan-500/5 border-cyan-500/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        isSpeaker1
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-cyan-500/20 text-cyan-300"
                      }`}
                    >
                      {line.speaker}
                    </span>
                    <span className="text-[10px] text-zinc-500">#{idx + 1}</span>
                  </div>

                  {/* Micro cue buttons */}
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => insertTagToLine(line.id, line.text, "<breath>")}
                      className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 hover:bg-zinc-700 cursor-pointer"
                    >
                      + &lt;breath&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTagToLine(line.id, line.text, "|mhm|")}
                      className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 hover:bg-zinc-700 cursor-pointer"
                    >
                      + |mhm|
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteLine(line.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors ml-1 cursor-pointer"
                      title="Supprimer la réplique"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={line.text}
                  onChange={(e) => onUpdateLine(line.id, e.target.value, line.style)}
                  placeholder="Texte de la réplique..."
                  rows={2}
                  className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-zinc-700 text-xs sm:text-sm text-zinc-200 rounded-lg p-2.5 focus:outline-none"
                />
              </div>
            );
          })}
        </div>

        {/* Add line buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onAddLine(speaker1Name)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter pour {speaker1Name}</span>
          </button>

          <button
            type="button"
            onClick={() => onAddLine(speaker2Name)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter pour {speaker2Name}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
