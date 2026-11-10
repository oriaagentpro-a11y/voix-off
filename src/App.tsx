import React, { useCallback, useEffect, useRef, useState } from "react";
import { VoiceInfo, VoiceTake, StudioSettings, DialogueLine, StudioPreset, VoiceId } from "./types";
import { base64ToAudioUrl, estimateReadingTime } from "./utils/audio";
import { STUDIO_PRESETS } from "./data/presets";
import { apiFetch, activeKeys } from "./utils/apiKeys";
import { AppShell, ViewId } from "./components/AppShell";
import { PlayerDock, PlayerHandle } from "./components/PlayerDock";
import { ScriptEditor } from "./components/ScriptEditor";
import { DialogueModeEditor } from "./components/DialogueModeEditor";
import { VoiceSelector } from "./components/VoiceSelector";
import { GenerateCard, ModelMode, TargetFormat } from "./components/GenerateCard";
import { TeleprompterModal } from "./components/TeleprompterModal";
import { ScriptDoctorModal } from "./components/ScriptDoctorModal";
import { Segmented, Toast, Toasts } from "./components/ui";
import { StudioView, KeyBanner, RecentTakes } from "./views/StudioView";
import { PresetsView } from "./views/PresetsView";
import { TakesView } from "./views/TakesView";
import { MixView } from "./views/MixView";
import { SettingsView, ThemePref } from "./views/SettingsView";
import { User, Users } from "lucide-react";

const INITIAL_VOICES: VoiceInfo[] = [
  {
    id: "Kore", name: "Kore", gender: "femme",
    tone: "Chaleureuse, soyeuse et narrative",
    description: "Voix féminine au grain soyeux, diction française soignée et timbre feutré.",
    recommendedFor: ["Documentaires", "Luxe et beauté", "E-learning", "Méditation", "Corporate"],
    previewSampleText: "Bienvenue dans un nouvel univers sonore où chaque mot compte.",
  },
  {
    id: "Puck", name: "Puck", gender: "homme",
    tone: "Dynamique, percutant et moderne",
    description: "Voix masculine jeune et vivante, sourire audible et rythme entraînant.",
    recommendedFor: ["Publicités", "Startups tech", "Podcasts", "Gaming", "Réseaux sociaux"],
    previewSampleText: "Passez à la vitesse supérieure dès aujourd'hui.",
  },
  {
    id: "Zephyr", name: "Zephyr", gender: "femme",
    tone: "Empathique, douce et rassurante",
    description: "Voix féminine bienveillante, respiration subtile, idéale pour toucher.",
    recommendedFor: ["Récit", "Santé et bien-être", "Service client", "Guide audio", "Livre audio"],
    previewSampleText: "Prenez un instant pour respirer et découvrir une voix qui vous accompagne.",
  },
  {
    id: "Fenrir", name: "Fenrir", gender: "homme",
    tone: "Profond, puissant et cinématique",
    description: "Voix masculine grave et texturée, idéale pour les bandes-annonces.",
    recommendedFor: ["Bandes-annonces", "Teasers", "Narration épique", "Manifeste de marque"],
    previewSampleText: "Dans un monde en constante mutation, une seule voix peut marquer les esprits.",
  },
  {
    id: "Charon", name: "Charon", gender: "homme",
    tone: "Posé, journalistique et sérieux",
    description: "Voix masculine équilibrée, prosodie d'information et articulation précise.",
    recommendedFor: ["Information", "Livre audio", "Rapports d'entreprise", "Vulgarisation"],
    previewSampleText: "Voici une analyse rigoureuse des avancées qui façonnent notre avenir.",
  },
];

const DEFAULT_SCRIPT =
  "Bienvenue dans ce tutoriel. <breath> Aujourd'hui, nous allons découvrir pas à pas comment maîtriser chaque fonctionnalité clé. [pause 0.4s] Prenez le temps d'observer les différentes options... et commençons dès maintenant par la première étape.";
const DEFAULT_STYLE =
  "Voix pédagogique claire, souriante et bienveillante. Diction soignée, respirations naturelles et pauses pour faciliter la mémorisation.";

type Speaker = { name: string; voice: VoiceId; style: string };

/* Stockage local tolérant aux erreurs (navigation privée, quota…). */
const load = <T,>(key: string, fallback: T): T => {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
};
const save = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || !!el.closest("[role=slider],[role=dialog]"));
};

export default function App() {
  /* ---------- Préférences et navigation ---------- */
  const [view, setView] = useState<ViewId>(() => load<ViewId>("voxstudio_view", "studio"));
  const [theme, setTheme] = useState<ThemePref>(() => {
    try { const t = localStorage.getItem("voxstudio_theme"); return t === "light" || t === "dark" ? t : "system"; } catch { return "system"; }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", theme);
    try { theme === "system" ? localStorage.removeItem("voxstudio_theme") : localStorage.setItem("voxstudio_theme", theme); } catch {}
  }, [theme]);
  const navigate = useCallback((v: ViewId) => {
    setView(v);
    save("voxstudio_view", v);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => document.getElementById("contenu")?.focus({ preventScroll: true }));
  }, []);

  /* ---------- Données ---------- */
  const [voices, setVoices] = useState<VoiceInfo[]>(INITIAL_VOICES);
  const [presets] = useState<StudioPreset[]>(() => [...STUDIO_PRESETS, ...load<StudioPreset[]>("voxstudio_custom_presets", [])]);
  const draft = load<{ script?: string; style?: string; dialogueMode?: boolean; voice?: string; presetId?: string | null; target?: TargetFormat }>("voxstudio_draft", {});
  const [activePresetId, setActivePresetId] = useState<string | null>(draft.presetId === undefined ? "tutorial_elearning" : draft.presetId);
  const [selectedVoice, setSelectedVoice] = useState<string>(draft.voice || "Kore");
  const [script, setScript] = useState<string>(draft.script ?? DEFAULT_SCRIPT);
  const [style, setStyle] = useState<string>(draft.style ?? DEFAULT_STYLE);
  const [dialogueMode, setDialogueMode] = useState<boolean>(!!draft.dialogueMode);
  const [target, setTarget] = useState<TargetFormat>(draft.target || "free");
  const [modelMode, setModelMode] = useState<ModelMode>("flash-tts");

  const [speakers, setSpeakers] = useState<[Speaker, Speaker]>([
    { name: "Alex", voice: "Puck", style: "Dynamique et enthousiaste, sourire dans la voix" },
    { name: "Sam", voice: "Kore", style: "Posée, complice et bienveillante" },
  ]);
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([
    { id: "1", speaker: "Alex", voice: "Puck", text: "Bienvenue dans VoxStudio ! Aujourd'hui on teste les préréglages." },
    { id: "2", speaker: "Sam", voice: "Kore", text: "Exactement Alex, <breath> un clic suffit pour régler la voix, le ton et le mixage." },
  ]);

  const [studioSettings, setStudioSettings] = useState<StudioSettings>({
    speed: 1.0, eqPreset: "clarity", reverbAmount: 0.06, ambientTrack: "none", ambientVolume: 0.15,
    masteringEnabled: true, studioCompression: true, proximityWarmth: 0.35, airClarity: 0.7, deEsserSmooth: true,
    hyperRealismProfile: "studio_pro", hyperRealismLevel: "ultra_perfection",
  });

  // Les prises restaurées n'ont plus d'audio (non conservé entre sessions) : on vide leur URL.
  const [takes, setTakes] = useState<VoiceTake[]>(() => load<VoiceTake[]>("voxstudio_takes", []).map((t) => ({ ...t, audioUrl: "", audioBase64: "" })));
  const [activeTake, setActiveTake] = useState<VoiceTake | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<PlayerHandle>(null);

  /* ---------- Interface ---------- */
  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
  const [isScriptDoctorOpen, setIsScriptDoctorOpen] = useState(false);
  const [apiKeyCount, setApiKeyCount] = useState(() => activeKeys().length);
  const [bannerHidden, setBannerHidden] = useState(() => load<boolean>("voxstudio_hide_key_banner", false));

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback((kind: Toast["kind"], message: string, action?: Toast["action"]) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, kind, message, action }]);
    if (kind !== "error") setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  useEffect(() => {
    const sync = () => setApiKeyCount(activeKeys().length);
    window.addEventListener("voxstudio-keys", sync);
    return () => window.removeEventListener("voxstudio-keys", sync);
  }, []);

  useEffect(() => {
    save("voxstudio_draft", { script, style, dialogueMode, voice: selectedVoice, presetId: activePresetId, target });
  }, [script, style, dialogueMode, selectedVoice, activePresetId, target]);

  useEffect(() => {
    save("voxstudio_takes", takes.slice(0, 20).map((t) => ({ ...t, audioBase64: "", audioUrl: "" })));
  }, [takes]);

  useEffect(() => {
    fetch("/api/voice/voices")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data.voices) && data.voices.length) setVoices(data.voices); })
      .catch(() => {});
  }, []);

  // Menus de l'application desktop
  useEffect(() => {
    const d = window.voxStudioDesktop;
    if (!d?.onMenuAction) return;
    const off = [
      d.onMenuAction("open-teleprompter", () => setIsTeleprompterOpen(true)),
      d.onMenuAction("open-script-doctor", () => setIsScriptDoctorOpen(true)),
      d.onMenuAction("open-api-keys", () => navigate("settings")),
      d.onMenuAction("open-about-modal", () => navigate("settings")),
      d.onMenuAction("menu-new-session", () => {
        setDialogueMode(false);
        setScript("");
        setActivePresetId(null);
        navigate("studio");
        notify("info", "Nouvelle session : le script est vide, vos prises restent dans l'historique.");
      }),
    ];
    return () => off.forEach((f) => f());
  }, [navigate, notify]);

  /* ---------- Préréglages ---------- */
  const handleApplyPreset = (preset: StudioPreset, insertScript: boolean) => {
    setActivePresetId(preset.id);
    setSelectedVoice(preset.recommendedVoice);
    setStyle(preset.stylePrompt);
    if (insertScript) setScript(preset.sampleScript);
    setDialogueMode(false);
    setStudioSettings((s) => ({
      ...s,
      speed: preset.speed, eqPreset: preset.eqPreset, reverbAmount: preset.reverbAmount, ambientTrack: preset.ambientTrack,
      ambientVolume: preset.ambientVolume, masteringEnabled: true, studioCompression: preset.studioCompression,
      proximityWarmth: preset.proximityWarmth, airClarity: preset.airClarity, hyperRealismProfile: preset.hyperRealismProfile,
    }));
    navigate("studio");
    notify("success", `Préréglage « ${preset.name} » appliqué${insertScript ? " avec son texte d'exemple" : ""}.`);
  };

  /* ---------- Génération ---------- */
  // Sans clé locale, on laisse tout de même essayer : le serveur peut avoir sa propre clé (.env).
  const emptyReason = dialogueMode
    ? dialogueLines.some((l) => l.text.trim()) ? null : "Ajoutez au moins une réplique pour générer."
    : script.trim() ? null : "Écrivez un texte pour générer.";

  const handleGenerate = async () => {
    if (isGenerating || emptyReason) return;
    setIsGenerating(true);
    const base = { modelMode, style, hyperRealismLevel: studioSettings.hyperRealismLevel, hyperRealismProfile: studioSettings.hyperRealismProfile };
    const payload = dialogueMode
      ? {
          ...base,
          dialogueMode: true,
          speakers: speakers.map((s) => ({ name: s.name, voice: s.voice, style: s.style, lines: dialogueLines.filter((l) => l.speaker === s.name && l.text.trim()) })),
        }
      : { ...base, text: script.trim(), voice: selectedVoice };

    try {
      const response = await apiFetch("/api/voice/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "La génération a échoué.");
      }
      const data = await response.json();
      const audioUrl = base64ToAudioUrl(data.audioBase64, data.mimeType || "audio/wav");
      const duration = await new Promise<number>((resolve) => {
        // Certains navigateurs ne chargent pas les métadonnées d'un Audio détaché : repli après 1,5 s.
        const timer = setTimeout(() => resolve(0), 1500);
        const a = new Audio();
        a.preload = "metadata";
        a.onloadedmetadata = () => { clearTimeout(timer); resolve(isFinite(a.duration) ? a.duration : 0); };
        a.onerror = () => { clearTimeout(timer); resolve(0); };
        a.src = audioUrl;
      });
      const preset = presets.find((p) => p.id === activePresetId);
      const take: VoiceTake = {
        id: `${Date.now()}`,
        timestamp: Date.now(),
        title: dialogueMode ? `Dialogue ${speakers[0].name} et ${speakers[1].name}` : preset ? `${preset.name} · ${selectedVoice}` : `Voix ${selectedVoice}`,
        text: dialogueMode ? dialogueLines.map((l) => `${l.speaker} : ${l.text}`).join(" | ") : script.trim(),
        voice: dialogueMode ? `${speakers[0].voice} et ${speakers[1].voice}` : selectedVoice,
        style: data.style || style,
        model: data.model || modelMode,
        duration: duration || estimateReadingTime(script).seconds,
        audioBase64: data.audioBase64,
        audioUrl,
        dspApplied: studioSettings.masteringEnabled,
      };
      setTakes((prev) => [take, ...prev]);
      setActiveTake(take);
      playerRef.current?.playWhenReady();
      notify("success", "Voix générée : lecture dans le lecteur en bas.");
    } catch (err: any) {
      const msg: string = err?.message || "Impossible de générer la voix.";
      const keyIssue = /cl[ée]|key|quota|429|api/i.test(msg) || !apiKeyCount;
      notify("error", msg, keyIssue ? { label: "Vérifier mes clés API", onClick: () => navigate("settings") } : undefined);
    } finally {
      setIsGenerating(false);
    }
  };

  // Raccourcis globaux : Ctrl+Entrée (générer), Espace (lecture/pause hors saisie)
  const genRef = useRef(handleGenerate);
  genRef.current = handleGenerate;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (document.querySelector("[role=dialog]")) return;
        e.preventDefault();
        genRef.current();
      } else if (e.code === "Space" && !e.repeat && !isTyping(e.target) && !(e.target as HTMLElement).closest?.("button,a")) {
        e.preventDefault();
        playerRef.current?.togglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- Duo ---------- */
  const changeSpeaker = (i: 0 | 1, patch: Partial<Speaker>) => {
    const old = speakers[i];
    const next = [...speakers] as [Speaker, Speaker];
    next[i] = { ...old, ...patch };
    setSpeakers(next);
    if (patch.name !== undefined || patch.voice !== undefined) {
      setDialogueLines((ls) => ls.map((l) => (l.speaker === old.name ? { ...l, speaker: next[i].name, voice: next[i].voice } : l)));
    }
  };
  const addLine = (speaker: string) => {
    const s = speakers.find((x) => x.name === speaker) || speakers[0];
    setDialogueLines((prev) => [...prev, { id: `${Date.now()}`, speaker: s.name, voice: s.voice, text: "" }]);
    requestAnimationFrame(() => {
      const all = document.querySelectorAll<HTMLTextAreaElement>('textarea[id^="line-"]');
      all[all.length - 1]?.focus();
    });
  };
  const loadDialogueTemplate = (type: string) => {
    const tpl: { s: [Speaker, Speaker]; lines: [string, string] } =
      type === "podcast"
        ? { s: [{ name: "Alex", voice: "Puck", style: "Hôte curieux, énergie communicative" }, { name: "Sam", voice: "Kore", style: "Experte posée, diction veloutée" }],
            lines: ["Bienvenue dans ce nouvel épisode ! <breath> Aujourd'hui, on parle des voix de synthèse réalistes.", "Merci Alex. |mhm| La qualité atteint désormais celle des studios professionnels."] }
        : { s: [{ name: "Emma", voice: "Kore", style: "Dynamique, feutrée et convaincante" }, { name: "Marc", voice: "Fenrir", style: "Solennel, profond et cinématique" }],
            lines: ["Vous cherchiez l'outil idéal pour donner vie à vos vidéos ?", "Ne cherchez plus. [pause 0.5s] La voix parfaite est à portée de clic."] };
    setSpeakers(tpl.s);
    setDialogueLines(tpl.lines.map((text, i) => ({ id: `${Date.now()}-${i}`, speaker: tpl.s[i].name, voice: tpl.s[i].voice, text })));
    notify("info", "Modèle de dialogue chargé.");
  };

  /* ---------- Prises ---------- */
  const playTake = (t: VoiceTake) => {
    if (!t.audioUrl) return;
    if (activeTake?.id === t.id) { playerRef.current?.togglePlay(); return; }
    setActiveTake(t);
    playerRef.current?.playWhenReady();
  };
  const deleteTake = (id: string) => {
    setTakes((prev) => prev.filter((t) => t.id !== id));
    if (activeTake?.id === id) setActiveTake(null);
    notify("info", "Prise supprimée.");
  };
  const restoreTake = (t: VoiceTake) => {
    if (t.text.includes(" | ") && /^[^:]+ : /.test(t.text)) {
      notify("info", "Ce texte vient d'un dialogue : il a été copié dans le script solo.");
    }
    setDialogueMode(false);
    setScript(t.text);
    if (t.style) setStyle(t.style);
    navigate("studio");
  };

  /* ---------- Rendu ---------- */
  const currentPreset = presets.find((p) => p.id === activePresetId);
  const currentVoice = voices.find((v) => v.id === selectedVoice);
  const estSeconds = dialogueMode
    ? estimateReadingTime(dialogueLines.map((l) => l.text).join(" ")).seconds
    : estimateReadingTime(script).seconds;

  const modeSwitch = (
    <Segmented
      label="Mode d'écriture"
      size="sm"
      value={dialogueMode ? "duo" : "solo"}
      onChange={(v) => setDialogueMode(v === "duo")}
      options={[{ value: "solo", label: "Solo", icon: <User /> }, { value: "duo", label: "Duo", icon: <Users /> }]}
    />
  );

  let page: React.ReactNode;
  if (view === "presets") page = <PresetsView presets={presets} activePresetId={activePresetId} onApply={handleApplyPreset} isGenerating={isGenerating} />;
  else if (view === "takes") page = (
    <TakesView takes={takes} activeTakeId={activeTake?.id ?? null} isPlayingActive={isPlaying} onPlay={playTake} onDelete={deleteTake}
      onToggleFavorite={(id) => setTakes((p) => p.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t)))}
      onRestore={restoreTake} onGoStudio={() => navigate("studio")} />
  );
  else if (view === "mix") page = <MixView settings={studioSettings} onChange={setStudioSettings} hasTake={!!activeTake?.audioUrl} />;
  else if (view === "settings") page = <SettingsView theme={theme} onChangeTheme={setTheme} />;
  else page = (
    <StudioView
      banner={apiKeyCount === 0 && !bannerHidden ? <KeyBanner onOpen={() => navigate("settings")} onDismiss={() => { setBannerHidden(true); save("voxstudio_hide_key_banner", true); }} /> : undefined}
      editor={
        dialogueMode ? (
          <DialogueModeEditor speakers={speakers} onChangeSpeaker={changeSpeaker} lines={dialogueLines} onAddLine={addLine}
            onUpdateLine={(id, text, s) => setDialogueLines((p) => p.map((l) => (l.id === id ? { ...l, text, style: s } : l)))}
            onDeleteLine={(id) => setDialogueLines((p) => p.filter((l) => l.id !== id))}
            onLoadDialogueTemplate={loadDialogueTemplate} modeSwitch={modeSwitch} />
        ) : (
          <ScriptEditor script={script} onChangeScript={setScript} style={style} onChangeStyle={setStyle}
            onOpenDoctor={() => setIsScriptDoctorOpen(true)} onOpenTeleprompter={() => setIsTeleprompterOpen(true)}
            isGenerating={isGenerating} selectedVoiceName={selectedVoice} modeSwitch={modeSwitch} onNotify={notify} />
        )
      }
      voices={dialogueMode ? undefined : <VoiceSelector voices={voices} selectedVoice={selectedVoice} onSelectVoice={setSelectedVoice} disabled={isGenerating} />}
      generate={
        <GenerateCard
          estSeconds={estSeconds} target={target} onChangeTarget={setTarget}
          voiceLabel={dialogueMode ? `${speakers[0].voice} et ${speakers[1].voice}` : currentVoice?.name || selectedVoice}
          presetName={dialogueMode ? undefined : currentPreset?.name}
          modelMode={modelMode} onChangeModelMode={setModelMode}
          onGenerate={handleGenerate} isGenerating={isGenerating} disabledReason={emptyReason}
        />
      }
      recent={<RecentTakes takes={takes} activeTakeId={activeTake?.id ?? null} isPlayingActive={isPlaying} onPlay={playTake} onSeeAll={() => navigate("takes")} />}
    />
  );

  return (
    <>
      <AppShell
        view={view}
        onNavigate={navigate}
        takeCount={takes.length}
        hasKeys={apiKeyCount > 0}
        player={
          <PlayerDock
            ref={playerRef}
            audioUrl={activeTake?.audioUrl || null}
            title={activeTake?.title || ""}
            voiceName={activeTake?.voice || selectedVoice}
            settings={studioSettings}
            onChangeSpeed={(speed) => setStudioSettings((s) => ({ ...s, speed }))}
            onNotify={notify}
            onPlayingChange={setIsPlaying}
          />
        }
      >
        <div key={view} className="animate-fade-up">{page}</div>
      </AppShell>

      <Toasts toasts={toasts} onDismiss={dismiss} />

      <TeleprompterModal
        isOpen={isTeleprompterOpen}
        onClose={() => setIsTeleprompterOpen(false)}
        script={dialogueMode ? dialogueLines.map((l) => `${l.speaker} : ${l.text}`).join("\n\n") : script}
        speed={studioSettings.speed}
      />
      <ScriptDoctorModal
        isOpen={isScriptDoctorOpen}
        onClose={() => setIsScriptDoctorOpen(false)}
        script={script}
        onApplyScript={(t) => { setScript(t); notify("success", "Texte du coach appliqué."); }}
        selectedVoiceName={selectedVoice}
      />
    </>
  );
}
