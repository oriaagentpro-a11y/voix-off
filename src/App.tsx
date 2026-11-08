import React, { useState, useEffect } from "react";
import { VoiceInfo, VoiceTake, StudioSettings, DialogueLine, StudioPreset } from "./types";
import { base64ToAudioUrl } from "./utils/audio";
import { STUDIO_PRESETS } from "./data/presets";
import { Header } from "./components/Header";
import { StudioPresetsBar } from "./components/StudioPresetsBar";
import { VoiceSelector } from "./components/VoiceSelector";
import { ScriptEditor } from "./components/ScriptEditor";
import { AudioWaveformVisualizer } from "./components/AudioWaveformVisualizer";
import { StudioDspRack } from "./components/StudioDspRack";
import { TakesHistory } from "./components/TakesHistory";
import { DialogueModeEditor } from "./components/DialogueModeEditor";
import { TeleprompterModal } from "./components/TeleprompterModal";
import { ScriptDoctorModal, DoctorMode } from "./components/ScriptDoctorModal";
import { ApiKeysModal } from "./components/ApiKeysModal";
import { apiFetch, activeKeys } from "./utils/apiKeys";
import { StudioHelpModal } from "./components/StudioHelpModal";
import {
  Mic,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Radio,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Cpu,
  BookmarkCheck,
  Layers,
} from "lucide-react";

const INITIAL_VOICES: VoiceInfo[] = [
  {
    id: "Kore",
    name: "Kore",
    gender: "femme",
    tone: "Chaleureuse, soyeuse & narrative (Ultra-Réaliste)",
    description: "Voix féminine d'exception avec un grain soyeux, une diction française irréprochable et un timbre feutré intimiste de studio haut de gamme.",
    recommendedFor: ["Documentaires", "Luxe & Beauté", "E-learning", "Méditation", "Corporate Prestige"],
    previewSampleText: "Bienvenue dans un nouvel univers sonore où chaque souffle et chaque mot vibrent d'une humanité absolue.",
    timbreProfile: "Mezzo-soprano soyeuse, texture feutrée, présence harmonique riche",
    frequencyRange: "180 Hz - 7.5 kHz",
  },
  {
    id: "Puck",
    name: "Puck",
    gender: "homme",
    tone: "Dynamique, percutant & moderne (Ultra-Réaliste)",
    description: "Voix masculine jeune, vivante et entraînante. Énergie communicative, sourire audible et timing percutant idéal pour captiver instantanément.",
    recommendedFor: ["Publicités TV/Radio", "Startups Tech", "Podcasts", "Gaming", "Réseaux sociaux"],
    previewSampleText: "Passez à la vitesse supérieure dès aujourd'hui avec une expérience sonore d'un réalisme saisissant.",
    timbreProfile: "Ténor clair et percussif, projection dynamique, modulation rapide",
    frequencyRange: "120 Hz - 8 kHz",
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    gender: "femme",
    tone: "Empathique, douce & rassurante (Ultra-Réaliste)",
    description: "Voix féminine profondément humaine et bienveillante, avec une respiration subtile et une sensibilité acoustique parfaite pour toucher le cœur.",
    recommendedFor: ["Récit narratif", "Santé & Bien-être", "Service client VIP", "Guide audio", "Livre Audio"],
    previewSampleText: "Prenez un instant pour respirer et découvrir une voix qui vous accompagne avec délicatesse et bienveillance.",
    timbreProfile: "Soprano douce, rondeur acoustique, douceur respiratoire",
    frequencyRange: "200 Hz - 7 kHz",
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    gender: "homme",
    tone: "Profond, puissant & cinématique (Ultra-Réaliste)",
    description: "Voix masculine grave, percutante et texturée avec une résonance de poitrine impressionnante, idéale pour les bandes-annonces et l'émotion épique.",
    recommendedFor: ["Bandes-annonces cinéma", "Teasers événements", "Narration épique", "Manifesto de marque"],
    previewSampleText: "Dans un monde en constante mutation, une seule voix a le pouvoir d'éveiller les consciences et de marquer les esprits.",
    timbreProfile: "Baryton-basse chaleureux, résonance pectorale profonde, autorité naturelle",
    frequencyRange: "85 Hz - 6.5 kHz",
  },
  {
    id: "Charon",
    name: "Charon",
    gender: "homme",
    tone: "Posé, journalistique & d'autorité (Ultra-Réaliste)",
    description: "Voix masculine équilibrée, sérieuse et rassurante avec une prosodie journalistique naturelle et une articulation analytique de référence.",
    recommendedFor: ["Journal d'information", "Livre audio", "Rapports d'entreprise", "Vulgarisation scientifique"],
    previewSampleText: "Voici une analyse approfondie et rigoureuse des grandes avancées qui façonnent notre avenir commun.",
    timbreProfile: "Baryton équilibré, stabilité rythmique, articulation broadcast radio",
    frequencyRange: "110 Hz - 7 kHz",
  },
];

const DEFAULT_SCRIPT =
  "Bienvenue dans ce tutoriel. <breath> Aujourd'hui, nous allons découvrir pas à pas comment maîtriser chaque fonctionnalité clé. [pause 0.4s] Prenez le temps d'observer les différentes options... et commençons dès maintenant par la première étape.";

export default function App() {
  const [voices, setVoices] = useState<VoiceInfo[]>(INITIAL_VOICES);
  const [presets, setPresets] = useState<StudioPreset[]>(() => {
    try {
      const saved = localStorage.getItem("voxstudio_custom_presets");
      if (saved) {
        const custom = JSON.parse(saved);
        return [...STUDIO_PRESETS, ...custom];
      }
    } catch {}
    return STUDIO_PRESETS;
  });

  // Default preset is Tutorial Pédagogique
  const [activePresetId, setActivePresetId] = useState<string | null>("tutorial_elearning");

  const [selectedVoice, setSelectedVoice] = useState<string>("Kore");
  const [script, setScript] = useState<string>(DEFAULT_SCRIPT);
  const [style, setStyle] = useState<string>(
    "Voix pédagogique claire, souriante, bienveillante et didactique. Diction impeccable avec respirations naturelles douces et pauses réflexives pour faciliter la mémorisation."
  );
  // Default to flagship TTS model for peak hyper-realism
  const [modelMode, setModelMode] = useState<"flash-lite" | "flash-tts">("flash-tts");

  // Mode Dialogue State
  const [dialogueMode, setDialogueMode] = useState(false);
  const [speaker1Name, setSpeaker1Name] = useState("Alex");
  const [speaker1Voice, setSpeaker1Voice] = useState<"Kore" | "Puck" | "Zephyr" | "Fenrir" | "Charon">("Puck");
  const [speaker1Style, setSpeaker1Style] = useState("Dynamique et enthousiaste avec sourire dans la voix");

  const [speaker2Name, setSpeaker2Name] = useState("Sam");
  const [speaker2Voice, setSpeaker2Voice] = useState<"Kore" | "Puck" | "Zephyr" | "Fenrir" | "Charon">("Kore");
  const [speaker2Style, setSpeaker2Style] = useState("Posée, complice, feutrée et bienveillante");

  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([
    {
      id: "1",
      speaker: "Alex",
      voice: "Puck",
      text: "Bienvenue dans VoxStudio ! Aujourd'hui on teste les réglages prédéfinis automatiques.",
    },
    {
      id: "2",
      speaker: "Sam",
      voice: "Kore",
      text: "Exactement Alex, <breath> un simple clic configure toute la cabine sonore pour un rendu d'une perfection absolue.",
    },
  ]);

  // Studio Settings (DSP, Hyper-Realism Acoustics & Mastering)
  const [studioSettings, setStudioSettings] = useState<StudioSettings>({
    speed: 1.0,
    eqPreset: "clarity",
    reverbAmount: 0.06,
    ambientTrack: "none",
    ambientVolume: 0.15,
    masteringEnabled: true,
    studioCompression: true,
    proximityWarmth: 0.35,
    airClarity: 0.7,
    deEsserSmooth: true,
    hyperRealismProfile: "studio_pro",
    hyperRealismLevel: "ultra_perfection",
  });

  // Takes & Active audio
  const [takes, setTakes] = useState<VoiceTake[]>(() => {
    try {
      const saved = localStorage.getItem("voxstudio_takes");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [activeTake, setActiveTake] = useState<VoiceTake | null>(null);

  // UI state & Modals
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
  const [isScriptDoctorOpen, setIsScriptDoctorOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isKeysOpen, setIsKeysOpen] = useState(false);
  const [apiKeyCount, setApiKeyCount] = useState(() => activeKeys().length);
  useEffect(() => {
    const sync = () => setApiKeyCount(activeKeys().length);
    window.addEventListener("voxstudio-keys", sync);
    return () => window.removeEventListener("voxstudio-keys", sync);
  }, []);
  const [doctorMode, setDoctorMode] = useState<DoctorMode>("hyper-realism");

  // Desktop Menu Shortcuts & Actions Integration
  useEffect(() => {
    if (!window.voxStudioDesktop?.onMenuAction) return;

    const unbindTeleprompter = window.voxStudioDesktop.onMenuAction("open-teleprompter", () => {
      setIsTeleprompterOpen(true);
    });
    const unbindDoctor = window.voxStudioDesktop.onMenuAction("open-script-doctor", () => {
      setIsScriptDoctorOpen(true);
    });
    const unbindKeys = window.voxStudioDesktop.onMenuAction("open-api-keys", () => {
      setIsKeysOpen(true);
    });
    const unbindHelp = window.voxStudioDesktop.onMenuAction("open-about-modal", () => {
      setIsHelpOpen(true);
    });

    return () => {
      unbindTeleprompter();
      unbindDoctor();
      unbindKeys();
      unbindHelp();
    };
  }, []);

  // Sync takes to localStorage
  useEffect(() => {
    try {
      const lightTakes = takes.slice(0, 10).map((t) => ({
        ...t,
        audioBase64: "",
      }));
      localStorage.setItem("voxstudio_takes", JSON.stringify(lightTakes));
    } catch {}
  }, [takes]);

  // Fetch available voices on load
  useEffect(() => {
    fetch("/api/voice/voices")
      .then((res) => res.json())
      .then((data) => {
        if (data.voices && Array.isArray(data.voices)) {
          setVoices(data.voices);
        }
      })
      .catch((err) => console.log("Utilisation des voix par défaut:", err));
  }, []);

  // 1-Click Preset Application Handler
  const handleApplyPreset = (
    preset: StudioPreset,
    insertScript: boolean,
    autoGenerate?: boolean
  ) => {
    setActivePresetId(preset.id);
    setSelectedVoice(preset.recommendedVoice);
    setStyle(preset.stylePrompt);

    const scriptToUse = insertScript ? preset.sampleScript : script;
    if (insertScript) {
      setScript(preset.sampleScript);
    }

    const updatedSettings: StudioSettings = {
      ...studioSettings,
      speed: preset.speed,
      eqPreset: preset.eqPreset,
      reverbAmount: preset.reverbAmount,
      ambientTrack: preset.ambientTrack,
      ambientVolume: preset.ambientVolume,
      masteringEnabled: true,
      studioCompression: preset.studioCompression,
      proximityWarmth: preset.proximityWarmth,
      airClarity: preset.airClarity,
      hyperRealismProfile: preset.hyperRealismProfile,
      hyperRealismLevel: "ultra_perfection",
    };

    setStudioSettings(updatedSettings);

    setSuccessMessage(
      `Paramètres prédéfinis "${preset.name}" appliqués avec succès ! (Voix ${preset.recommendedVoice}, EQ ${preset.eqPreset}, Profil ${preset.hyperRealismProfile})`
    );
    setTimeout(() => setSuccessMessage(null), 4000);

    // If requested, trigger instant generation
    if (autoGenerate) {
      setTimeout(() => {
        handleGenerateVoiceover({
          textOverride: scriptToUse,
          voiceOverride: preset.recommendedVoice,
          styleOverride: preset.stylePrompt,
          profileOverride: preset.hyperRealismProfile,
        });
      }, 50);
    }
  };

  // Main Generation Handler
  const handleGenerateVoiceover = async (overrides?: {
    textOverride?: string;
    voiceOverride?: string;
    styleOverride?: string;
    profileOverride?: string;
  }) => {
    const textToGenerate = overrides?.textOverride ?? script.trim();
    if (!dialogueMode && !textToGenerate) {
      setError("Veuillez saisir un script avant de générer la voix off.");
      return;
    }

    const activeVoice = overrides?.voiceOverride ?? selectedVoice;
    const activeStyle = overrides?.styleOverride ?? style;
    const activeProfile = overrides?.profileOverride ?? studioSettings.hyperRealismProfile;

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let payload: any = {
        modelMode,
        style: activeStyle,
        hyperRealismLevel: studioSettings.hyperRealismLevel,
        hyperRealismProfile: activeProfile,
      };

      if (dialogueMode) {
        payload = {
          ...payload,
          dialogueMode: true,
          speakers: [
            {
              name: speaker1Name,
              voice: speaker1Voice,
              style: speaker1Style,
              lines: dialogueLines.filter((l) => l.speaker === speaker1Name),
            },
            {
              name: speaker2Name,
              voice: speaker2Voice,
              style: speaker2Style,
              lines: dialogueLines.filter((l) => l.speaker === speaker2Name),
            },
          ],
        };
      } else {
        payload = {
          ...payload,
          text: textToGenerate,
          voice: activeVoice,
        };
      }

      const response = await apiFetch("/api/voice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de la synthèse vocale.");
      }

      const data = await response.json();
      const audioUrl = base64ToAudioUrl(data.audioBase64, data.mimeType || "audio/wav");

      // Calculate audio duration
      const tempAudio = new Audio(audioUrl);
      tempAudio.onloadedmetadata = () => {
        const audioDuration = tempAudio.duration || 5;

        const activePresetObj = presets.find((p) => p.id === activePresetId);
        const takeTitle = dialogueMode
          ? `Duo ${speaker1Name} & ${speaker2Name}`
          : activePresetObj
          ? `[${activePresetObj.name}] Voix ${activeVoice}`
          : `Voix ${activeVoice}`;

        const newTake: VoiceTake = {
          id: `${Date.now()}`,
          timestamp: Date.now(),
          title: takeTitle,
          text: dialogueMode
            ? dialogueLines.map((l) => `${l.speaker}: ${l.text}`).join(" | ")
            : textToGenerate,
          voice: dialogueMode ? `${speaker1Voice} & ${speaker2Voice}` : activeVoice,
          style: data.style || activeStyle,
          model: data.model || "gemini-3.8-flash-tts",
          duration: audioDuration,
          audioBase64: data.audioBase64,
          audioUrl,
          dspApplied: studioSettings.masteringEnabled,
        };

        setActiveTake(newTake);
        setTakes((prev) => [newTake, ...prev]);
        setSuccessMessage("Prise audio master hyper-réaliste générée avec succès !");
        setTimeout(() => setSuccessMessage(null), 3500);
      };
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Impossible de générer la voix off. Vérifiez votre script.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Dialogue lines actions
  const handleAddDialogueLine = (speaker: string) => {
    const newLine: DialogueLine = {
      id: `${Date.now()}`,
      speaker,
      voice: (speaker === speaker1Name ? speaker1Voice : speaker2Voice) as any,
      text: "",
    };
    setDialogueLines((prev) => [...prev, newLine]);
  };

  const handleUpdateDialogueLine = (id: string, text: string, lineStyle?: string) => {
    setDialogueLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, text, style: lineStyle } : l))
    );
  };

  const handleDeleteDialogueLine = (id: string) => {
    setDialogueLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleLoadDialogueTemplate = (type: string) => {
    if (type === "podcast") {
      setSpeaker1Name("Alex");
      setSpeaker1Voice("Puck");
      setSpeaker1Style("Hôte tech curieux avec énergie communicative");

      setSpeaker2Name("Sam");
      setSpeaker2Voice("Kore");
      setSpeaker2Style("Experte IA posée, diction veloutée");

      setDialogueLines([
        {
          id: "1",
          speaker: "Alex",
          voice: "Puck",
          text: "Bienvenue dans ce nouvel épisode ! <breath> Aujourd'hui, nous explorons la révolution des voix de synthèse hyper-réalistes.",
        },
        {
          id: "2",
          speaker: "Sam",
          voice: "Kore",
          text: "Merci Alex. En effet, |mhm| la fidélité acoustique atteint désormais le standard des studios broadcast professionnels les plus exigeants.",
        },
      ]);
    } else {
      setSpeaker1Name("Emma");
      setSpeaker1Voice("Kore");
      setSpeaker1Style("Dynamique, feutrée et convaincante");

      setSpeaker2Name("Marc");
      setSpeaker2Voice("Fenrir");
      setSpeaker2Style("Solennel, profond et cinématique");

      setDialogueLines([
        {
          id: "1",
          speaker: "Emma",
          voice: "Kore",
          text: "Vous cherchiez l'outil idéal pour donner vie à vos projets vidéo avec un réalisme saisissant ?",
        },
        {
          id: "2",
          speaker: "Marc",
          voice: "Fenrir",
          text: "Ne cherchez plus. [pause 0.5s] La perfection sonore est désormais à portée de clic.",
        },
      ]);
    }
  };

  // Takes management
  const handleDeleteTake = (id: string) => {
    setTakes((prev) => prev.filter((t) => t.id !== id));
    if (activeTake?.id === id) {
      setActiveTake(null);
    }
  };

  const handleToggleFavorite = (id: string) => {
    setTakes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  };

  const handleRestoreScript = (restoredText: string, restoredStyle: string) => {
    setScript(restoredText);
    if (restoredStyle) setStyle(restoredStyle);
  };

  const currentActivePreset = presets.find((p) => p.id === activePresetId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Studio Header */}
      <Header
        dialogueMode={dialogueMode}
        onToggleDialogueMode={(val) => setDialogueMode(val)}
        onOpenTeleprompter={() => setIsTeleprompterOpen(true)}
        onOpenScriptDoctor={(m) => { if (m) setDoctorMode(m); setIsScriptDoctorOpen(true); }}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenApiKeys={() => setIsKeysOpen(true)}
        apiKeyCount={apiKeyCount}
        activeTakeCount={takes.length}
        voices={voices}
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        presets={presets}
        activePresetId={activePresetId}
        onApplyPreset={handleApplyPreset}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner: Hyper-Realism Studio Engine & Current Active Preset Status */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-zinc-100">
                  Moteur Hyper-Réalisme Activé (Flagship 24kHz)
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500 text-zinc-950 font-black">
                  Perfection Ultime
                </span>
                {currentActivePreset && (
                  <span className="text-[10px] bg-zinc-800 border border-zinc-700 text-amber-300 font-mono font-bold px-2 py-0.5 rounded hidden sm:inline">
                    Preset : {currentActivePreset.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Respirations physiologiques &lt;breath&gt;, micro-inflections humaines, effet de proximité micro studio Neumann et égalisation 32-bit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setStudioSettings((prev) => ({
                  ...prev,
                  hyperRealismLevel:
                    prev.hyperRealismLevel === "ultra_perfection" ? "high" : "ultra_perfection",
                }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                studioSettings.hyperRealismLevel === "ultra_perfection"
                  ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800"
              }`}
            >
              {studioSettings.hyperRealismLevel === "ultra_perfection"
                ? "★ Perfectionnisme 100%"
                : "Mode Standard"}
            </button>
          </div>
        </div>

        {/* Alerts / Feedback notification */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-200 font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1-Click Studio Presets Bar */}
        {!dialogueMode && (
          <StudioPresetsBar
            presets={presets}
            activePresetId={activePresetId}
            onSelectPreset={handleApplyPreset}
            currentSettings={studioSettings}
            currentVoice={selectedVoice}
            isGenerating={isGenerating}
          />
        )}

        {/* Rangée 1 : script + lecteur */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5 items-stretch">
          <div className="scope-dark bg-zinc-950 rounded-[28px] p-5 space-y-4 min-w-0">
            {dialogueMode ? (
              <DialogueModeEditor
                speaker1Name={speaker1Name}
                setSpeaker1Name={setSpeaker1Name}
                speaker1Voice={speaker1Voice}
                setSpeaker1Voice={setSpeaker1Voice}
                speaker1Style={speaker1Style}
                setSpeaker1Style={setSpeaker1Style}
                speaker2Name={speaker2Name}
                setSpeaker2Name={setSpeaker2Name}
                speaker2Voice={speaker2Voice}
                setSpeaker2Voice={setSpeaker2Voice}
                speaker2Style={speaker2Style}
                setSpeaker2Style={setSpeaker2Style}
                lines={dialogueLines}
                onAddLine={handleAddDialogueLine}
                onUpdateLine={handleUpdateDialogueLine}
                onDeleteLine={handleDeleteDialogueLine}
                onLoadDialogueTemplate={handleLoadDialogueTemplate}
              />
            ) : (
              <ScriptEditor
                script={script}
                onChangeScript={setScript}
                style={style}
                onChangeStyle={setStyle}
                onOpenDoctor={() => setIsScriptDoctorOpen(true)}
                isGenerating={isGenerating}
                selectedVoiceName={selectedVoice}
              />
            )}

            
            {/* Synthesis Launch Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => handleGenerateVoiceover()}
                disabled={isGenerating || (!dialogueMode && !script.trim())}
                className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 transition-all transform active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Synthèse Vocale Hyper-Réaliste en Cours...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>
                      Générer la Voix Off Studio (WAV 24kHz)
                    </span>
                  </>
                )}
              </button>

              {/* Model Quality Switch */}
              <div className="flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs font-mono text-zinc-400">
                <button
                  type="button"
                  onClick={() => setModelMode("flash-tts")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    modelMode === "flash-tts"
                      ? "bg-amber-500 text-zinc-950 font-black shadow-sm"
                      : "hover:text-zinc-200"
                  }`}
                  title="Gemini 3.8 Flash-TTS Flagship: Recommandé pour l'hyper-réalisme, respirations et prosodie vivante"
                >
                  Flagship TTS (Ultra)
                </button>
                <button
                  type="button"
                  onClick={() => setModelMode("flash-lite")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    modelMode === "flash-lite"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                      : "hover:text-zinc-200"
                  }`}
                  title="Flash-Lite TTS: Synthèse rapide économique"
                >
                  Flash-Lite
                </button>
              </div>
            </div>

            
          </div>
          <div className="min-w-0">
            {/* Audio Waveform Player with Live Web Audio DSP Chain */}
            <AudioWaveformVisualizer
              audioUrl={activeTake?.audioUrl || null}
              audioBase64={activeTake?.audioBase64 || null}
              voiceName={activeTake?.voice || selectedVoice}
              styleDescription={activeTake?.style || style}
              modelName={activeTake?.model || (modelMode === "flash-tts" ? "gemini-3.8-flash-tts (Flagship)" : "gemini-3.8-flash-lite-tts")}
              settings={studioSettings}
              onChangeSpeed={(spd) => setStudioSettings({ ...studioSettings, speed: spd })}
            />

            
          </div>
        </div>

        {/* Rangée 2 : voix + prises */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5 items-start">
          {!dialogueMode && (
            <div className="min-w-0">{/* Studio Rack Section: Voices Selection (Solo Mode) */}
        
          <div id="voix" className="scroll-mt-28"><VoiceSelector
            voices={voices}
            selectedVoice={selectedVoice}
            onSelectVoice={(vId) => {
              setSelectedVoice(vId);
            }}
            disabled={isGenerating}
          /></div></div>
          )}
          <div className={`min-w-0 ${dialogueMode ? "lg:col-span-2" : ""}`}>
            {/* History of Takes */}
            <div id="prises" className="scroll-mt-28"><TakesHistory
              takes={takes}
              activeTakeId={activeTake?.id || null}
              onSelectTake={(take) => setActiveTake(take)}
              onDeleteTake={handleDeleteTake}
              onToggleFavorite={handleToggleFavorite}
              onRestoreScript={handleRestoreScript}
            /></div>
          
          </div>
        </div>

        {/* Rangée 3 : rack de mastering */}
        <div className="scope-dark bg-zinc-950 rounded-[28px] p-5">
          {/* DSP Mastering Rack */}
            <StudioDspRack
              settings={studioSettings}
              onChangeSettings={setStudioSettings}
            />
          
        </div>
      </main>

      {/* Footer / Console bar */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-6 py-4 mt-auto text-xs text-zinc-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>VoxStudio Pro • Station de Travail Voix Off Hyper-Réaliste IA</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
          <span>Moteur : Gemini 3.8 Flash TTS Flagship (24kHz Mono 16-bit RIFF)</span>
          <span>•</span>
          <span>Presets Intelligents 1-Clic : Tuto, Documentaire, Pub, Luxe, Storytelling...</span>
        </div>
      </footer>

      {/* Teleprompter Modal */}
      <TeleprompterModal
        isOpen={isTeleprompterOpen}
        onClose={() => setIsTeleprompterOpen(false)}
        script={dialogueMode ? dialogueLines.map((l) => `${l.speaker} : ${l.text}`).join("\n\n") : script}
        speed={studioSettings.speed}
      />

      {/* Script Doctor & Realism Coach Modal */}
      <ScriptDoctorModal
        initialMode={doctorMode}
        isOpen={isScriptDoctorOpen}
        onClose={() => setIsScriptDoctorOpen(false)}
        script={script}
        onApplyScript={(newText) => setScript(newText)}
        selectedVoiceName={selectedVoice}
      />

      <ApiKeysModal isOpen={isKeysOpen} onClose={() => setIsKeysOpen(false)} />

      {/* Studio Help Modal */}
      <StudioHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
