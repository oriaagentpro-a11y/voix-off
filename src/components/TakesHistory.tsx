import React, { useState } from "react";
import { VoiceTake } from "../types";
import { formatTimecode } from "../utils/audio";
import {
  ListMusic,
  Play,
  Pause,
  Download,
  Trash2,
  Star,
  RotateCcw,
  Clock,
  Radio,
  Share2,
} from "lucide-react";

interface TakesHistoryProps {
  takes: VoiceTake[];
  activeTakeId: string | null;
  onSelectTake: (take: VoiceTake) => void;
  onDeleteTake: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRestoreScript: (text: string, style: string) => void;
}

export const TakesHistory: React.FC<TakesHistoryProps> = ({
  takes,
  activeTakeId,
  onSelectTake,
  onDeleteTake,
  onToggleFavorite,
  onRestoreScript,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  const toggleInlinePlay = (take: VoiceTake) => {
    if (playingId === take.id) {
      if (audioObj) {
        audioObj.pause();
      }
      setPlayingId(null);
    } else {
      if (audioObj) {
        audioObj.pause();
      }
      const newAudio = new Audio(take.audioUrl);
      newAudio.play();
      newAudio.onended = () => setPlayingId(null);
      setAudioObj(newAudio);
      setPlayingId(take.id);
    }
  };

  const handleDownload = (e: React.MouseEvent, take: VoiceTake) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = take.audioUrl;
    a.download = `prise_${take.voice.toLowerCase()}_${take.id}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-zinc-900 rounded-[28px] p-5 sm:p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-zinc-100 tracking-normal">
            Historique des Prises ({takes.length})
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">Session Actuelle</span>
      </div>

      {takes.length === 0 ? (
        <div className="py-8 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
          <Radio className="w-6 h-6 text-zinc-700" />
          <span>Aucune prise enregistrée pour l'instant.</span>
          <span className="text-zinc-600 text-[11px]">
            Vos générations apparaîtront ici avec leur fichier WAV téléchargeable.
          </span>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {takes.map((take, index) => {
            const isSelected = activeTakeId === take.id;
            const isPlayingThis = playingId === take.id;

            return (
              <div
                key={take.id}
                onClick={() => onSelectTake(take)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                  isSelected
                    ? "bg-zinc-100/10 border-zinc-100"
                    : "bg-zinc-900 hover:bg-zinc-800/50 border-zinc-700"
                }`}
              >
                {/* Left info & inline play */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleInlinePlay(take);
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      isPlayingThis
                        ? "bg-amber-500 text-zinc-950"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    }`}
                  >
                    {isPlayingThis ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-100">
                        Prise #{takes.length - index} ({take.voice})
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {formatTimecode(take.duration)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 max-w-sm">
                      {take.text}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(take.id);
                    }}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      take.isFavorite
                        ? "text-amber-400 bg-amber-500/20 border-amber-500/40"
                        : "text-zinc-500 hover:text-zinc-300 border-transparent hover:bg-zinc-800"
                    }`}
                    title="Favori"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestoreScript(take.text, take.style);
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title="Réinjecter ce script dans l'éditeur"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, take)}
                    className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 transition-colors"
                    title="Télécharger WAV"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTake(take.id);
                    }}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                    title="Supprimer la prise"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
