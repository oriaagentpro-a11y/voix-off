import React, { useState, useEffect, useRef } from "react";
import { StudioSettings, EqPreset, AmbientTrackId, HyperRealismProfile } from "../types";
import { createAmbientSynthesizer } from "../utils/audio";
import { Sliders, Music, Waves, Volume2, Sparkles, Play, Square, Mic2, ShieldCheck, Cpu } from "lucide-react";

interface StudioDspRackProps {
  settings: StudioSettings;
  onChangeSettings: (newSettings: StudioSettings) => void;
}

const EQ_PRESETS: { id: EqPreset; label: string; desc: string }[] = [
  { id: "broadcast", label: "Broadcast Radio", desc: "Chaleur des bas-médiums et présence percutante" },
  { id: "clarity", label: "Clarté Vocale", desc: "Intelligibilité maximale et netteté des consonnes" },
  { id: "warmth", label: "Feutré Chaleureux", desc: "Rondeur veloutée et intimité feutrée" },
  { id: "air_presence", label: "Air & Brillance 12k", desc: "Scintillement cristallin soyeux sans sibilance" },
  { id: "podcast", label: "Podcast Pro", desc: "Équilibre dynamique compact et chaleureux" },
  { id: "flat", label: "Brut Studio", desc: "Signal linéaire sans coloration acoustique" },
];

const AMBIENT_BEDS: { id: AmbientTrackId; label: string; desc: string }[] = [
  { id: "none", label: "Aucun fond (Voix isolée)", desc: "Acapella pur en cabine insonorisée" },
  { id: "ambient_pad", label: "Nappe Ambiante Sereine", desc: "Accords doux et chaleureux en nappe feutrée" },
  { id: "deep_space", label: "Cinématique Profond", desc: "Basse drone immersive et mystérieuse" },
  { id: "uplifting_pulse", label: "Pulsation Moderne", desc: "Rythmique acoustique subtile et positive" },
];

const REALISM_PROFILES: { id: HyperRealismProfile; label: string; desc: string }[] = [
  { id: "studio_pro", label: "Cabine Studio Pro", desc: "Micro Neumann U87, diction parfaite et micro-respirations" },
  { id: "documentary_deep", label: "Documentaire Arte/BBC", desc: "Profondeur contemplative, chaleur et pauses habitées" },
  { id: "luxury_intimate", label: "Luxe & Feutré", desc: "Voix caressante au plus près du micro, soyeuse" },
  { id: "cinema_epic", label: "Cinéma & Teaser", desc: "Résonance de poitrine, intensité dramatique" },
  { id: "tech_dynamic", label: "Tech & Innovation", desc: "Énergie communicative, sourire dans la voix" },
  { id: "storyteller_warm", label: "Conteur Vibrant", desc: "Sensibilité humaine et modulations expressives" },
];

export const StudioDspRack: React.FC<StudioDspRackProps> = ({
  settings,
  onChangeSettings,
}) => {
  const [isPlayingAmbientPreview, setIsPlayingAmbientPreview] = useState(false);
  const synthRef = useRef<{ stop: () => void } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Stop ambient synthesizer on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
        synthRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const togglePreviewAmbient = () => {
    if (isPlayingAmbientPreview) {
      if (synthRef.current) {
        synthRef.current.stop();
        synthRef.current = null;
      }
      setIsPlayingAmbientPreview(false);
    } else {
      if (settings.ambientTrack === "none") return;
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }

        const synth = createAmbientSynthesizer(audioCtxRef.current, settings.ambientTrack);
        synth.outputNode.gain.setValueAtTime(settings.ambientVolume * 0.35, audioCtxRef.current.currentTime);
        synth.outputNode.connect(audioCtxRef.current.destination);
        synthRef.current = synth;
        setIsPlayingAmbientPreview(true);
      } catch (err) {
        console.error("Erreur lancement synthé d'ambiance:", err);
      }
    }
  };

  return (
    <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-xl flex flex-col gap-5">
      {/* Rack Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Rack de Traitement Studio & Hyper-Réalisme
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
            <Cpu className="w-3 h-3 text-amber-400" />
            DSP 32-bit Float Live
          </span>
        </div>
      </div>

      {/* Profil d'Acoustique Hyper-Réaliste */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Profil Acoustique & Intention Réaliste</span>
          </label>
          <span className="text-[11px] text-zinc-400 font-mono">
            Directives de cabine vocale HD
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {REALISM_PROFILES.map((prof) => {
            const isSelected = settings.hyperRealismProfile === prof.id;
            return (
              <button
                key={prof.id}
                type="button"
                onClick={() => onChangeSettings({ ...settings, hyperRealismProfile: prof.id })}
                className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-500/80 text-zinc-100 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/30"
                    : "bg-zinc-950/60 hover:bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div className="font-bold flex items-center justify-between text-zinc-100">
                  <span>{prof.label}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                </div>
                <div className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{prof.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Module 1: Parametric Studio Mastering (EQ, Compression, Proximity Warmth, Silky Air) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-zinc-800/80">
        {/* Equalization Presets */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-amber-400" />
            <span>Égalisation Vocale (EQ Studio)</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            {EQ_PRESETS.map((eq) => {
              const isSelected = settings.eqPreset === eq.id;
              return (
                <button
                  key={eq.id}
                  type="button"
                  onClick={() => onChangeSettings({ ...settings, eqPreset: eq.id })}
                  className={`text-left p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500/70 text-zinc-100 shadow-sm ring-1 ring-amber-500/20"
                      : "bg-zinc-950/60 hover:bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between text-zinc-200">
                    <span className="text-xs">{eq.label}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                  </div>
                  <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{eq.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Micro-Acoustics Sliders: Proximity Warmth & Silky Air */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2.5 mt-2">
            {/* Proximity warmth */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-300 font-medium flex items-center gap-1">
                  <Mic2 className="w-3 h-3 text-amber-400" />
                  Effet de Proximité (Chaleur Micro)
                </span>
                <span className="font-mono text-amber-400">
                  {Math.round((settings.proximityWarmth || 0.4) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.proximityWarmth ?? 0.4}
                onChange={(e) =>
                  onChangeSettings({ ...settings, proximityWarmth: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 accent-amber-400 rounded-lg cursor-pointer"
              />
            </div>

            {/* Silky air band */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-300 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Clarté & Air Band (11 kHz)
                </span>
                <span className="font-mono text-cyan-400">
                  {Math.round((settings.airClarity || 0.5) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.airClarity ?? 0.5}
                onChange={(e) =>
                  onChangeSettings({ ...settings, airClarity: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 accent-cyan-400 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Dynamics, Cabin Acoustics & Ambient Bed */}
        <div className="space-y-3">
          {/* Studio Compressor & Booth Reverb Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                onChangeSettings({ ...settings, studioCompression: !settings.studioCompression })
              }
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                settings.studioCompression
                  ? "bg-amber-500/15 border-amber-500/70 text-amber-300 ring-1 ring-amber-500/30"
                  : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <div className="text-xs font-bold flex items-center justify-between">
                <span>Compresseur Studio</span>
                <span className={`w-2 h-2 rounded-full ${settings.studioCompression ? "bg-amber-400" : "bg-zinc-700"}`}></span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Densité broadcast 3.2:1</div>
            </button>

            {/* Cabin Reflection Amount */}
            <div className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between">
              <div className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span>Cabine Insonorisée</span>
                <span className="font-mono text-[10px] text-amber-400">
                  {Math.round((settings.reverbAmount || 0.12) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.4"
                step="0.02"
                value={settings.reverbAmount ?? 0.12}
                onChange={(e) =>
                  onChangeSettings({ ...settings, reverbAmount: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 accent-amber-400 rounded-lg cursor-pointer mt-1"
              />
            </div>
          </div>

          {/* Ambient Music Bed with Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nappe Sonore & Ambiance</span>
              </label>

              {settings.ambientTrack !== "none" && (
                <button
                  type="button"
                  onClick={togglePreviewAmbient}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                    isPlayingAmbientPreview
                      ? "bg-cyan-500 text-zinc-950 border-cyan-400 font-bold"
                      : "bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border-cyan-500/30"
                  }`}
                  title="Auditionner la boucle musicale"
                >
                  {isPlayingAmbientPreview ? (
                    <>
                      <Square className="w-2.5 h-2.5 fill-current" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Auditionner</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {AMBIENT_BEDS.map((bed) => {
                const isSelected = settings.ambientTrack === bed.id;
                return (
                  <div
                    key={bed.id}
                    onClick={() => {
                      if (isPlayingAmbientPreview && synthRef.current) {
                        synthRef.current.stop();
                        setIsPlayingAmbientPreview(false);
                      }
                      onChangeSettings({ ...settings, ambientTrack: bed.id });
                    }}
                    className={`p-2 rounded-xl border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-500/60 text-zinc-100 ring-1 ring-cyan-500/20"
                        : "bg-zinc-950/60 hover:bg-zinc-900 border-zinc-800 text-zinc-300"
                    }`}
                  >
                    <div className="font-semibold text-zinc-200 flex items-center justify-between">
                      <span className="text-[11px] truncate">{bed.label}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Volume slider for ambient bed with ducking notice */}
            {settings.ambientTrack !== "none" && (
              <div className="pt-1 flex items-center gap-2 text-xs">
                <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-400 text-[11px]">Volume fond :</span>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={settings.ambientVolume}
                  onChange={(e) =>
                    onChangeSettings({ ...settings, ambientVolume: parseFloat(e.target.value) })
                  }
                  className="flex-1 h-1 bg-zinc-800 accent-cyan-400 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-cyan-400 w-8 text-right">
                  {Math.round(settings.ambientVolume * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
