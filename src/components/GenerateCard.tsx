import React from "react";
import { Mic, Zap, Gauge as GaugeIcon } from "lucide-react";
import { Card, CardHeader, Gauge, Segmented, Badge, Button } from "./ui";
export const fmtDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

export type TargetFormat = "free" | "15" | "30" | "60";
export type ModelMode = "flash-tts" | "flash-lite";

interface GenerateCardProps {
  estSeconds: number;
  target: TargetFormat;
  onChangeTarget: (t: TargetFormat) => void;
  voiceLabel: string;
  presetName?: string;
  modelMode: ModelMode;
  onChangeModelMode: (m: ModelMode) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabledReason?: string | null;
}

export const GenerateCard: React.FC<GenerateCardProps> = ({
  estSeconds, target, onChangeTarget, voiceLabel, presetName, modelMode, onChangeModelMode, onGenerate, isGenerating, disabledReason,
}) => {
  const t = target === "free" ? 0 : Number(target);
  const diff = t ? estSeconds - t : 0;
  const tolerance = t ? Math.max(1, Math.round(t * 0.1)) : 0;
  const fits = t ? Math.abs(diff) <= tolerance : true;
  const deltaText = !t ? null : fits ? "Dans le format" : diff > 0 ? `+${diff} s` : `${diff} s`;
  const gaugeMax = t || Math.max(30, Math.ceil(estSeconds / 15) * 15);

  return (
    <Card variant="hero" aria-labelledby="gen-title">
      <CardHeader
        id="gen-title"
        tone="hero"
        icon={<GaugeIcon />}
        title="Générer"
        action={
          <Segmented
            label="Format cible"
            tone="hero"
            size="sm"
            value={target}
            onChange={onChangeTarget}
            options={[
              { value: "free", label: "Libre" },
              { value: "15", label: "15 s" },
              { value: "30", label: "30 s" },
              { value: "60", label: "60 s" },
            ]}
          />
        }
      />

      <Gauge
        value={estSeconds}
        max={gaugeMax}
        label="Durée estimée par rapport au format cible"
        valueText={t ? `${estSeconds} secondes estimées pour un format de ${t} secondes` : `${estSeconds} secondes estimées`}
      >
        <span className="tabular text-[34px] font-semibold leading-none">{fmtDuration(estSeconds)}</span>
        <span className="mt-1 text-[13px] text-white/85">{t ? `durée estimée · cible ${t} s` : "durée estimée"}</span>
      </Gauge>

      <div className="mt-2 flex min-h-6 justify-center">
        {deltaText && (
          <Badge tone="hero" className={fits ? "" : "!bg-[#fde68a] !text-[#4a3500]"}>
            {deltaText}
            {!fits && <span className="sr-only">{diff > 0 ? " : texte trop long pour le format" : " : texte trop court pour le format"}</span>}
          </Badge>
        )}
      </div>

      <Button
        variant="hero"
        size="lg"
        className="mt-3 w-full"
        icon={<Mic />}
        onClick={onGenerate}
        loading={isGenerating}
        disabled={!!disabledReason}
        aria-describedby={disabledReason ? "gen-reason" : "gen-hint"}
      >
        {isGenerating ? "Génération…" : "Générer la voix"}
      </Button>
      {disabledReason ? (
        <p id="gen-reason" className="mt-2 text-center text-[13px] text-white/90">{disabledReason}</p>
      ) : (
        <p id="gen-hint" className="mt-2 text-center text-xs text-white/75">Raccourci : Ctrl + Entrée</p>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-[16px] bg-black/20 p-3.5 text-[13px]">
        <div className="min-w-0">
          <dt className="text-white/75">Voix</dt>
          <dd className="truncate font-semibold">{voiceLabel}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-white/75">Préréglage</dt>
          <dd className="truncate font-semibold">{presetName || "Aucun"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span id="model-label" className="text-[13px] text-white/85">Moteur</span>
        <Segmented
          label="Moteur de synthèse"
          tone="hero"
          size="sm"
          value={modelMode}
          onChange={onChangeModelMode}
          options={[
            { value: "flash-tts", label: "Qualité", title: "Rendu le plus naturel (recommandé)" },
            { value: "flash-lite", label: "Rapide", icon: <Zap />, title: "Plus rapide et plus économique" },
          ]}
        />
      </div>

    </Card>
  );
};
