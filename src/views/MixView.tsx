import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Waves, Mic2, Activity, Music, Play, Square } from "lucide-react";
import { StudioSettings, EqPreset, AmbientTrackId, HyperRealismProfile } from "../types";
import { createAmbientSynthesizer } from "../utils/audio";
import { PageHeader } from "../components/AppShell";
import { Button, Card, CardHeader, ChoiceCard, Slider, Switch } from "../components/ui";

const PROFILES: { id: HyperRealismProfile; label: string; desc: string }[] = [
  { id: "studio_pro", label: "Studio", desc: "Neutre, diction nette" },
  { id: "documentary_deep", label: "Documentaire", desc: "Posé, profond, pauses habitées" },
  { id: "luxury_intimate", label: "Intime", desc: "Feutré, très proche du micro" },
  { id: "cinema_epic", label: "Cinéma", desc: "Grave, intense, dramatique" },
  { id: "tech_dynamic", label: "Dynamique", desc: "Énergique, sourire dans la voix" },
  { id: "storyteller_warm", label: "Conteur", desc: "Chaleureux et expressif" },
];

const EQS: { id: EqPreset; label: string; desc: string }[] = [
  { id: "clarity", label: "Clarté", desc: "Consonnes nettes, très intelligible" },
  { id: "broadcast", label: "Radio", desc: "Présence et densité" },
  { id: "warmth", label: "Chaleur", desc: "Rond et doux" },
  { id: "air_presence", label: "Brillance", desc: "Aigus aérés, sans sifflement" },
  { id: "podcast", label: "Podcast", desc: "Équilibré et compact" },
  { id: "flat", label: "Neutre", desc: "Aucune correction" },
];

const BEDS: { id: AmbientTrackId; label: string; desc: string }[] = [
  { id: "none", label: "Aucun", desc: "Voix seule" },
  { id: "ambient_pad", label: "Nappe douce", desc: "Accords calmes" },
  { id: "deep_space", label: "Cinématique", desc: "Basse grave et immersive" },
  { id: "uplifting_pulse", label: "Pulsation", desc: "Rythme léger et positif" },
];

const pct = (v: number) => `${Math.round(v * 100)} %`;

const SliderRow: React.FC<{ label: string; hint: string; value: number; min?: number; max?: number; step?: number; display: string; onChange: (v: number) => void }> = ({
  label, hint, value, min = 0, max = 1, step = 0.05, display, onChange,
}) => (
  <div>
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-ink-2">{hint}</p>
      </div>
      <span className="tabular text-sm font-semibold" aria-hidden="true">{display}</span>
    </div>
    <Slider label={label} value={value} min={min} max={max} step={step} valueText={display} onChange={onChange} />
  </div>
);

export const MixView: React.FC<{ settings: StudioSettings; onChange: (s: StudioSettings) => void; hasTake: boolean }> = ({ settings: s, onChange, hasTake }) => {
  const set = (p: Partial<StudioSettings>) => onChange({ ...s, ...p });
  const [previewing, setPreviewing] = useState(false);
  const synthRef = useRef<{ stop: () => void } | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  const stopPreview = () => { synthRef.current?.stop(); synthRef.current = null; setPreviewing(false); };
  useEffect(() => () => { synthRef.current?.stop(); ctxRef.current?.close().catch(() => {}); }, []);

  const togglePreview = () => {
    if (previewing) return stopPreview();
    if (s.ambientTrack === "none") return;
    try {
      if (!ctxRef.current || ctxRef.current.state === "closed") ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      ctxRef.current.resume();
      const synth = createAmbientSynthesizer(ctxRef.current, s.ambientTrack);
      synth.outputNode.gain.setValueAtTime(s.ambientVolume * 0.35, ctxRef.current.currentTime);
      synth.outputNode.connect(ctxRef.current.destination);
      synthRef.current = synth;
      setPreviewing(true);
    } catch (err) {
      console.error("Erreur aperçu fond sonore:", err);
    }
  };

  return (
    <>
      <PageHeader
        title="Mixage"
        subtitle={hasTake ? "Les réglages s'entendent en direct dans le lecteur." : "Générez une prise pour entendre les réglages en direct."}
      />

      <Card className="mb-4 lg:mb-5">
        <Switch
          checked={s.masteringEnabled}
          onChange={(v) => set({ masteringEnabled: v })}
          label="Traitement du son activé"
          description="Égalisation, micro et dynamique appliqués à l'écoute et à l'export. Désactivez-le pour entendre la voix brute."
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 lg:gap-5">
        <Card aria-labelledby="mx-profile">
          <CardHeader id="mx-profile" icon={<Sparkles />} title="Interprétation" subtitle="Façon de jouer le texte · s'applique à la prochaine génération" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PROFILES.map((p) => (
              <ChoiceCard key={p.id} selected={s.hyperRealismProfile === p.id} onClick={() => set({ hyperRealismProfile: p.id })} title={p.label} desc={p.desc} />
            ))}
          </div>
        </Card>

        <Card aria-labelledby="mx-eq">
          <CardHeader id="mx-eq" icon={<Waves />} title="Égalisation" subtitle="Couleur générale de la voix" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {EQS.map((e) => (
              <ChoiceCard key={e.id} selected={s.eqPreset === e.id} onClick={() => set({ eqPreset: e.id })} title={e.label} desc={e.desc} />
            ))}
          </div>
        </Card>

        <Card aria-labelledby="mx-mic">
          <CardHeader id="mx-mic" icon={<Mic2 />} title="Micro" subtitle="Distance et espace autour de la voix" />
          <div className="flex flex-col gap-5">
            <SliderRow label="Chaleur" hint="Renforce les graves, comme une voix proche du micro" value={s.proximityWarmth ?? 0.4} display={pct(s.proximityWarmth ?? 0.4)} onChange={(v) => set({ proximityWarmth: v })} />
            <SliderRow label="Brillance" hint="Ajoute de l'air dans les aigus" value={s.airClarity ?? 0.5} display={pct(s.airClarity ?? 0.5)} onChange={(v) => set({ airClarity: v })} />
            <SliderRow label="Pièce" hint="Légère réverbération de la cabine" value={s.reverbAmount ?? 0.1} max={0.4} step={0.02} display={pct((s.reverbAmount ?? 0.1) / 0.4)} onChange={(v) => set({ reverbAmount: v })} />
          </div>
        </Card>

        <Card aria-labelledby="mx-dyn">
          <CardHeader id="mx-dyn" icon={<Activity />} title="Dynamique et qualité" />
          <div className="flex flex-col divide-y divide-line">
            <Switch className="pb-4" checked={s.studioCompression} onChange={(v) => set({ studioCompression: v })} label="Compression" description="Lisse les écarts de volume pour un son plus dense" />
            <Switch className="py-4" checked={s.deEsserSmooth} onChange={(v) => set({ deEsserSmooth: v })} label="Atténuer les sifflements" description="Adoucit les « s » et « ch » trop marqués" />
            <Switch className="pt-4" checked={s.hyperRealismLevel === "ultra_perfection"} onChange={(v) => set({ hyperRealismLevel: v ? "ultra_perfection" : "high" })} label="Qualité maximale" description="Consignes de jeu plus détaillées envoyées au moteur · prochaine génération" />
          </div>
        </Card>

        <Card aria-labelledby="mx-bed" className="xl:col-span-2">
          <CardHeader
            id="mx-bed"
            icon={<Music />}
            title="Fond sonore"
            subtitle="Musique d'ambiance jouée sous la voix, volume automatiquement abaissé"
            action={
              s.ambientTrack !== "none" ? (
                <Button size="sm" icon={previewing ? <Square className="fill-current" /> : <Play className="fill-current" />} onClick={togglePreview} aria-pressed={previewing}>
                  {previewing ? "Arrêter" : "Écouter le fond"}
                </Button>
              ) : undefined
            }
          />
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {BEDS.map((b) => (
              <ChoiceCard key={b.id} selected={s.ambientTrack === b.id} onClick={() => { stopPreview(); set({ ambientTrack: b.id }); }} title={b.label} desc={b.desc} />
            ))}
          </div>
          {s.ambientTrack !== "none" && (
            <div className="mt-5 max-w-md">
              <SliderRow label="Volume du fond" hint="Par rapport à la voix" value={s.ambientVolume} min={0.05} max={0.8} display={pct(s.ambientVolume)} onChange={(v) => set({ ambientVolume: v })} />
            </div>
          )}
        </Card>
      </div>
    </>
  );
};
