import { Select } from "./ui";
import React, { useState, useEffect } from "react";
import { Sparkles, X, Check, Clock, Languages, Wand2, Loader2, HeartHandshake, Mic2, FileText, CheckCircle2 } from "lucide-react";

export type DoctorMode = "hyper-realism" | "pacing" | "timing-variants" | "translate" | "polish";

interface ScriptDoctorModalProps {
  initialMode?: DoctorMode;
  isOpen: boolean;
  onClose: () => void;
  script: string;
  onApplyScript: (optimizedText: string) => void;
  selectedVoiceName?: string;
}

export const ScriptDoctorModal: React.FC<ScriptDoctorModalProps> = ({
  initialMode,
  isOpen,
  onClose,
  script,
  onApplyScript,
  selectedVoiceName = "Kore",
}) => {
  const [mode, setMode] = useState<"hyper-realism" | "pacing" | "timing-variants" | "translate" | "polish">("hyper-realism");
  useEffect(() => {
    if (isOpen && initialMode) setMode(initialMode);
  }, [isOpen, initialMode]);
  const [targetTone, setTargetTone] = useState("Chaleureux, sincère, captivant et hyper-réaliste");
  const [targetLang, setTargetLang] = useState("Anglais (US)");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [realismData, setRealismData] = useState<{
    optimizedScript?: string;
    realismImprovements?: string[];
    artisticDirectionAdvice?: string;
    estimatedPacingSec?: number;
  } | null>(null);
  const [timingVersions, setTimingVersions] = useState<{ v15?: string; v30?: string; v60?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunOptimizer = async () => {
    if (!script) return;
    setIsLoading(true);
    setError(null);
    setResult("");
    setRealismData(null);
    setTimingVersions(null);

    try {
      const res = await fetch("/api/voice/optimize-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script,
          mode,
          targetTone,
          language: targetLang,
          voiceName: selectedVoiceName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur d'optimisation");
      }

      const data = await res.json();

      if (mode === "hyper-realism") {
        try {
          const parsed = JSON.parse(data.result);
          setRealismData(parsed);
          setResult(parsed.optimizedScript || data.result);
        } catch {
          setResult(data.result);
        }
      } else if (mode === "timing-variants") {
        try {
          const parsed = JSON.parse(data.result);
          setTimingVersions(parsed);
        } catch {
          setResult(data.result);
        }
      } else {
        setResult(data.result);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Impossible d'optimiser le script.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (text: string) => {
    onApplyScript(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 tracking-normal flex items-center gap-2">
                <span>Coach Voix Off & Direction Artistique</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                  Perfectionnisme
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Optimisation prosodique, respirations organiques & acoustique vivante
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setMode("hyper-realism")}
              className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                mode === "hyper-realism"
                  ? "bg-zinc-100/10 border-zinc-100 text-amber-300 ring-1 ring-amber-500/40 shadow-sm"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Mic2 className="w-3.5 h-3.5 mb-1 text-amber-400" />
              <div className="font-bold">Hyper-Réalisme</div>
              <div className="text-[10px] text-zinc-500">Prosodie & souffle</div>
            </button>

            <button
              type="button"
              onClick={() => setMode("pacing")}
              className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                mode === "pacing"
                  ? "bg-zinc-100/10 border-zinc-100 text-amber-300 ring-1 ring-amber-500/40"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 mb-1 text-cyan-400" />
              <div className="font-bold">Fluidité & Pauses</div>
              <div className="text-[10px] text-zinc-500">Diction naturelle</div>
            </button>

            <button
              type="button"
              onClick={() => setMode("timing-variants")}
              className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                mode === "timing-variants"
                  ? "bg-zinc-100/10 border-zinc-100 text-amber-300 ring-1 ring-amber-500/40"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5 mb-1 text-emerald-400" />
              <div className="font-bold">Minutage 15/30/60s</div>
              <div className="text-[10px] text-zinc-500">Formats calibrés</div>
            </button>

            <button
              type="button"
              onClick={() => setMode("translate")}
              className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                mode === "translate"
                  ? "bg-zinc-100/10 border-zinc-100 text-amber-300 ring-1 ring-amber-500/40"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Languages className="w-3.5 h-3.5 mb-1 text-purple-400" />
              <div className="font-bold">Doublage Mondial</div>
              <div className="text-[10px] text-zinc-500">Polyglotte natif</div>
            </button>

            <button
              type="button"
              onClick={() => setMode("polish")}
              className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                mode === "polish"
                  ? "bg-zinc-100/10 border-zinc-100 text-amber-300 ring-1 ring-amber-500/40"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 mb-1 text-rose-400" />
              <div className="font-bold">Sublimer le Ton</div>
              <div className="text-[10px] text-zinc-500">Impact & émotion</div>
            </button>
          </div>

          {/* Configuration sub-options */}
          <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 flex flex-wrap items-center gap-3 text-xs">
            {mode === "translate" ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-zinc-400 font-medium">Langue cible :</span>
                <Select className="w-48" label="Langue cible" value={targetLang} onChange={setTargetLang} options={["Anglais (US)","Anglais (UK)","Espagnol","Allemand","Italien","Portugais","Japonais"].map((l) => ({ value: l, label: l }))} />
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-zinc-400 font-medium">Intention recherchée :</span>
                <input
                  type="text"
                  value={targetTone}
                  onChange={(e) => setTargetTone(e.target.value)}
                  placeholder="Ex: Chaleureux, intime, posé, percutant..."
                  className="flex-1 bg-zinc-950 border border-zinc-700 text-zinc-200 rounded px-2.5 py-1 focus:outline-none"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleRunOptimizer}
              disabled={isLoading || !script}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-semibold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Direction en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Perfectionner le Script</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Hyper-Realism Analysis Display */}
          {realismData && (
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-amber-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Diagnostic d'Hyper-Réalisme Artistique
                </span>
                <button
                  type="button"
                  onClick={() => handleApply(realismData.optimizedScript || result)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Appliquer dans le Studio
                </button>
              </div>

              {/* Improvements list */}
              {realismData.realismImprovements && realismData.realismImprovements.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-zinc-300 tracking-normal">
                    Ajustements physiologiques et oraux appliqués :
                  </div>
                  <ul className="space-y-1">
                    {realismData.realismImprovements.map((imp, idx) => (
                      <li key={idx} className="text-xs text-zinc-300 flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Artistic advice */}
              {realismData.artisticDirectionAdvice && (
                <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs text-amber-300/90 italic">
                  <strong>Note du Directeur :</strong> {realismData.artisticDirectionAdvice}
                </div>
              )}

              {/* Final text preview */}
              <div className="bg-zinc-950/90 p-3 rounded-lg border border-zinc-800 text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed font-sans">
                {realismData.optimizedScript}
              </div>
            </div>
          )}

          {/* Timing versions results */}
          {timingVersions && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-zinc-300 tracking-normal">
                Versions Minutées Calibrées :
              </h4>

              {timingVersions.v15 && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">Format 15s (Flash Pub)</span>
                    <button
                      type="button"
                      onClick={() => handleApply(timingVersions.v15!)}
                      className="px-2.5 py-1 bg-amber-500 text-zinc-950 font-bold text-xs rounded hover:bg-amber-400 cursor-pointer"
                    >
                      Appliquer 15s
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200">{timingVersions.v15}</p>
                </div>
              )}

              {timingVersions.v30 && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400">Format 30s (Standard TV/Radio)</span>
                    <button
                      type="button"
                      onClick={() => handleApply(timingVersions.v30!)}
                      className="px-2.5 py-1 bg-cyan-500 text-zinc-950 font-bold text-xs rounded hover:bg-cyan-400 cursor-pointer"
                    >
                      Appliquer 30s
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200">{timingVersions.v30}</p>
                </div>
              )}

              {timingVersions.v60 && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">Format 60s (Narration Complète)</span>
                    <button
                      type="button"
                      onClick={() => handleApply(timingVersions.v60!)}
                      className="px-2.5 py-1 bg-emerald-500 text-zinc-950 font-bold text-xs rounded hover:bg-emerald-400 cursor-pointer"
                    >
                      Appliquer 60s
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200">{timingVersions.v60}</p>
                </div>
              )}
            </div>
          )}

          {/* Simple result fallback if not timing or realism JSON */}
          {!realismData && !timingVersions && result && (
            <div className="p-4 rounded-xl bg-zinc-900 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Script Révisé par le Coach IA
                </span>
                <button
                  type="button"
                  onClick={() => handleApply(result)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Remplacer dans l'Éditeur
                </button>
              </div>

              <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-800 text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed font-sans">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
