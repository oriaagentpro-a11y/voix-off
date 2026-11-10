import React, { useEffect, useState } from "react";
import { UserRound, Volume2, Square } from "lucide-react";
import { VoiceInfo } from "../types";
import { Card, CardHeader, ChoiceCard, IconButton, Badge } from "./ui";

interface VoiceSelectorProps {
  voices: VoiceInfo[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  disabled?: boolean;
}

const shortTone = (t: string) => t.replace(/\s*\(.*\)/, "");

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ voices, selectedVoice, onSelectVoice, disabled = false }) => {
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  // Aperçu approximatif via la synthèse du navigateur (gratuit, sans appel API).
  const preview = (v: VoiceInfo) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (playing === v.id) { setPlaying(null); return; }
    const u = new SpeechSynthesisUtterance(v.previewSampleText);
    u.lang = "fr-FR";
    u.rate = 0.96;
    u.pitch = v.gender === "homme" ? 0.88 : 1.08;
    u.onend = u.onerror = () => setPlaying(null);
    setPlaying(v.id);
    window.speechSynthesis.speak(u);
  };

  const current = voices.find((v) => v.id === selectedVoice);

  return (
    <Card aria-labelledby="voices-title">
      <CardHeader
        id="voices-title"
        icon={<UserRound />}
        title="Voix"
        subtitle={current ? `${current.name} · ${shortTone(current.tone)}` : "Choisissez une voix"}
      />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 2xl:grid-cols-3">
        {voices.map((v) => (
          <ChoiceCard
            key={v.id}
            selected={selectedVoice === v.id}
            onClick={() => onSelectVoice(v.id)}
            disabled={disabled}
            ariaLabel={`${v.name}, voix ${v.gender === "femme" ? "féminine" : "masculine"}, ${shortTone(v.tone)}`}
            title={
              <span className="flex items-center gap-2">
                {v.name}
                <Badge>{v.gender === "femme" ? "Féminine" : "Masculine"}</Badge>
              </span>
            }
            desc={
              <>
                <span className="block">{shortTone(v.tone)}</span>
                <span className="mt-1 block text-xs">Idéale pour : {v.recommendedFor.slice(0, 2).join(", ")}</span>
              </>
            }
            aside={
              <IconButton
                size="sm"
                label={playing === v.id ? `Arrêter l'aperçu de ${v.name}` : `Écouter un aperçu de ${v.name}`}
                icon={playing === v.id ? <Square className="fill-current" /> : <Volume2 />}
                active={playing === v.id}
                onClick={() => preview(v)}
              />
            }
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-2">L'aperçu utilise la voix de votre système : il donne une idée du ton, pas du rendu final.</p>
    </Card>
  );
};
