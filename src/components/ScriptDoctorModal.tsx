import { apiFetch } from "../utils/apiKeys";
import { Select, Dialog, Button, ChoiceCard, inputCls } from "./ui";
import React, { useState, useEffect } from "react";
import { Sparkles, Check, Clock, Languages, Wand2, Mic2, CheckCircle2 } from "lucide-react";

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
  const [mode, setMode] = useState<DoctorMode>("hyper-realism");
  useEffect(() => {
    if (isOpen && initialMode) setMode(initialMode);
  }, [isOpen, initialMode]);
  const [targetTone, setTargetTone] = useState("Chaleureux, sincère et naturel");
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
      const res = await apiFetch("/api/voice/optimize-script", {
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

  const MODES: { id: DoctorMode; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: "hyper-realism", label: "Naturel", desc: "Respirations et prosodie", icon: <Mic2 /> },
    { id: "pacing", label: "Rythme", desc: "Pauses et fluidité", icon: <Wand2 /> },
    { id: "timing-variants", label: "15 / 30 / 60 s", desc: "Trois durées", icon: <Clock /> },
    { id: "translate", label: "Traduction", desc: "En gardant le ton", icon: <Languages /> },
    { id: "polish", label: "Style", desc: "Plus d'impact", icon: <Sparkles /> },
  ];

  const ResultBlock: React.FC<{ title: string; text: string; applyLabel: string }> = ({ title, text, applyLabel }) => (
    <div className="rounded-[16px] border border-line p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <Button size="sm" variant="primary" icon={<Check />} onClick={() => handleApply(text)}>{applyLabel}</Button>
      </div>
      <p className="whitespace-pre-wrap rounded-[12px] bg-surface-2 p-3 text-sm leading-relaxed">{text}</p>
    </div>
  );

  return (
    <Dialog open={isOpen} onClose={onClose} title="Coach IA" description="Réécrit votre script sans le dénaturer. Rien n'est remplacé sans votre accord." icon={<Wand2 />} size="lg">
      <div className="flex flex-col gap-5">
        <div role="group" aria-label="Type d'aide" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {MODES.map((m) => (
            <ChoiceCard key={m.id} selected={mode === m.id} onClick={() => setMode(m.id)} title={m.label} desc={m.desc} className="[&_button]:!pr-3.5" />
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-[16px] bg-surface-2 p-4 sm:flex-row sm:items-end">
          {mode === "translate" ? (
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="text-[13px] font-medium">Langue cible</span>
              <Select label="Langue cible" value={targetLang} onChange={setTargetLang} options={["Anglais (US)", "Anglais (UK)", "Espagnol", "Allemand", "Italien", "Portugais", "Japonais"].map((l) => ({ value: l, label: l }))} />
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="doctor-tone" className="text-[13px] font-medium">Intention recherchée</label>
              <input id="doctor-tone" type="text" value={targetTone} onChange={(e) => setTargetTone(e.target.value)} placeholder="Ex. : chaleureux, posé, percutant" className={inputCls} />
            </div>
          )}
          <Button variant="primary" icon={<Sparkles />} loading={isLoading} disabled={!script} onClick={handleRunOptimizer}>
            {isLoading ? "Analyse…" : "Lancer"}
          </Button>
        </div>

        {!script && <p className="text-[13px] text-ink-2">Écrivez d'abord un texte dans le Studio.</p>}
        {error && <p role="alert" className="rounded-[12px] bg-danger-soft p-3 text-[13px] text-danger">{error}</p>}

        <div aria-live="polite" className="flex flex-col gap-3">
          {realismData && (
            <>
              {realismData.realismImprovements && realismData.realismImprovements.length > 0 && (
                <div className="rounded-[16px] bg-accent-soft p-4 text-[13px]">
                  <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-accent-soft-ink"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Ce qui a changé</p>
                  <ul className="list-disc space-y-1 pl-5 text-ink">
                    {realismData.realismImprovements.map((imp, idx) => <li key={idx}>{imp}</li>)}
                  </ul>
                  {realismData.artisticDirectionAdvice && <p className="mt-2 text-ink-2"><strong className="text-ink">Conseil :</strong> {realismData.artisticDirectionAdvice}</p>}
                </div>
              )}
              <ResultBlock title="Texte proposé" text={realismData.optimizedScript || result} applyLabel="Utiliser ce texte" />
            </>
          )}
          {timingVersions && (
            <>
              {timingVersions.v15 && <ResultBlock title="Version 15 secondes" text={timingVersions.v15} applyLabel="Utiliser" />}
              {timingVersions.v30 && <ResultBlock title="Version 30 secondes" text={timingVersions.v30} applyLabel="Utiliser" />}
              {timingVersions.v60 && <ResultBlock title="Version 60 secondes" text={timingVersions.v60} applyLabel="Utiliser" />}
            </>
          )}
          {!realismData && !timingVersions && result && <ResultBlock title="Texte proposé" text={result} applyLabel="Utiliser ce texte" />}
        </div>
      </div>
    </Dialog>
  );
};
