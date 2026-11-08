import React, { useState } from "react";
import { VoiceInfo } from "../types";
import { Play, Square, Sparkles, CheckCircle2, User, Volume2, Mic } from "lucide-react";

interface VoiceSelectorProps {
  voices: VoiceInfo[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  disabled?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  disabled = false,
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const handlePreviewSpeech = (e: React.MouseEvent, voice: VoiceInfo) => {
    e.stopPropagation();

    if ("speechSynthesis" in window) {
      if (playingVoiceId === voice.id) {
        window.speechSynthesis.cancel();
        setPlayingVoiceId(null);
        return;
      }

      window.speechSynthesis.cancel();
      setPlayingVoiceId(voice.id);

      const utterance = new SpeechSynthesisUtterance(voice.previewSampleText);
      utterance.lang = "fr-FR";
      utterance.rate = 0.96;
      utterance.pitch = voice.gender === "homme" ? 0.88 : 1.08;

      utterance.onend = () => {
        setPlayingVoiceId(null);
      };
      utterance.onerror = () => {
        setPlayingVoiceId(null);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold tracking-normal text-zinc-300 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-amber-400" />
          <span>Comédiens Voix Off Hyper-Réalistes</span>
        </label>
        <span className="text-[11px] text-amber-400/90 font-mono flex items-center gap-1 font-semibold">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Modélisation Flagship 24kHz
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
        {voices.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isPlaying = playingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => !disabled && onSelectVoice(voice.id)}
              className={`relative group rounded-xl p-3.5 border transition-all cursor-pointer text-left flex flex-col justify-between select-none ${
                isSelected
                  ? "scope-dark bg-zinc-950 border-zinc-950"
                  : "bg-zinc-800/60 hover:bg-zinc-800 border-transparent text-zinc-300"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* Top of Card */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors">
                      {voice.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        voice.gender === "femme"
                          ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {voice.gender === "femme" ? "Femme" : "Homme"}
                    </span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400 fill-amber-500/20" />
                  )}
                </div>

                {/* Tone tag */}
                <p className="text-xs font-semibold text-amber-400/90 mb-1 leading-snug line-clamp-1">
                  {voice.tone}
                </p>

                {/* Short description */}
                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 mb-2">
                  {voice.description}
                </p>

                {/* Timbre Profile badge if available */}
                {voice.timbreProfile && (
                  <div className="text-[10px] text-zinc-500 bg-zinc-950/70 px-2 py-1 rounded border border-zinc-800/80 mb-2 leading-tight">
                    <strong className="text-zinc-400">Timbre :</strong> {voice.timbreProfile.split(",")[0]}
                  </div>
                )}
              </div>

              {/* Recommended tags & audition button */}
              <div className="pt-2 border-t border-zinc-800/70 mt-auto flex items-center justify-between gap-1">
                <div className="flex flex-wrap gap-1 overflow-hidden h-4">
                  {voice.recommendedFor.slice(0, 1).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[9px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded truncate max-w-[85px]"
                    >
                      {tag}
                    </span>
                  ))}
                  {voice.recommendedFor.length > 1 && (
                    <span className="text-[9px] text-zinc-500">
                      +{voice.recommendedFor.length - 1}
                    </span>
                  )}
                </div>

                {/* Audio preview audition button */}
                <button
                  type="button"
                  onClick={(e) => handlePreviewSpeech(e, voice)}
                  className={`p-1.5 rounded-lg text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer ${
                    isPlaying
                      ? "text-amber-400 bg-amber-500/20 animate-pulse"
                      : "hover:bg-zinc-800"
                  }`}
                  title="Écouter un extrait de test"
                >
                  {isPlaying ? (
                    <Square className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
