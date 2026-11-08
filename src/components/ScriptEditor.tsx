import { apiFetch } from "../utils/apiKeys";
import React, { useRef, useState } from "react";
import { estimateReadingTime } from "../utils/audio";
import { Clock, Type, Sparkles, BookOpen, Trash2, Copy, Check, SlidersHorizontal, Wand2, Loader2, CheckCircle } from "lucide-react";

interface ScriptTemplate {
  title: string;
  category: string;
  tone: string;
  text: string;
}

const TEMPLATES: ScriptTemplate[] = [
  {
    title: "Publicité Luxe & Parfum Prestige",
    category: "Publicité Luxe",
    tone: "Chaleureuse, soyeuse, feutrée et envoûtante, chuchotée au plus près du micro",
    text: "Certains instants ne s'expliquent pas. <breath> Ils se ressentent. [pause 0.4s] Découvrez la nouvelle essence Nocturne. Une signature olfactive rare... pour révéler votre éclat le plus pur.",
  },
  {
    title: "Bande-Annonce Cinéma Épique",
    category: "Cinéma",
    tone: "Grave, puissante, mystérieuse et percutante avec résonance de poitrine",
    text: "Dans un monde où chaque souffle est compté... <gasp> une seule voix peut encore briser le silence. [pause 0.6s] Cet hiver, préparez-vous pour l'ultime voyage. Au cinéma le 12 décembre.",
  },
  {
    title: "Pitch Produit SaaS B2B & Startup",
    category: "Corporate Tech",
    tone: "Dynamique, assurée, moderne avec sourire communicatif et rythme percutant",
    text: "Vos équipes perdent jusqu'à 3 heures par jour en tâches répétitives. <breath> Avec Horizon AI, automatisez vos flux clés en un clin d'œil. [pause 0.4s] Simple. Fluide. Redoutablement efficace. Rejoignez dès maintenant plus de 500 entreprises leaders.",
  },
  {
    title: "Narration Documentaire Arte / BBC",
    category: "Documentaire",
    tone: "Posée, contemplative, chaleureuse et immersive avec respiration sereine",
    text: "À l'orée du crépuscule, la canopée s'éveille d'une vibration invisible. [pause 0.8s] Ici, chaque créature compose la symphonie fragile d'un sanctuaire préservé depuis des millénaires. <breath> Un équilibre sublime.",
  },
  {
    title: "Podcast & Confidences Intimes",
    category: "Podcast Studio",
    tone: "Naturel désarmant, proximité micro intime, complice et spontané",
    text: "Bienvenue dans ce nouvel épisode. <breath> Vous êtes nombreux à m'avoir posé la question cette semaine... |mhm| et la réponse est bien plus surprenante qu'il n'y paraît. [pause 0.5s] Installez-vous confortablement, on commence.",
  },
];

const REALISTIC_STYLE_PRESETS = [
  "Studio Pro : Diction impeccable, micro-inflections naturelles et chaleur Neumann U87",
  "Documentaire : Posé, contemplatif, pauses habitées et résonance chaleureuse",
  "Luxe & Beauté : Feutré, soyeux, intimité de proximité micro et souffle doux",
  "Publicité TV : Énergique, percutant, souriant et présence dynamique",
  "Cinéma Épique : Grave, vibrant, intense et dramatique",
  "Storyteller : Conteur sensible, empathique et modulations sincères",
];

interface ScriptEditorProps {
  script: string;
  onChangeScript: (val: string) => void;
  style: string;
  onChangeStyle: (val: string) => void;
  onOpenDoctor: () => void;
  isGenerating?: boolean;
  selectedVoiceName?: string;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  onChangeScript,
  style,
  onChangeStyle,
  onOpenDoctor,
  isGenerating = false,
  selectedVoiceName = "Kore",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const [isAutoPolishing, setIsAutoPolishing] = useState(false);
  const [polishMessage, setPolishMessage] = useState<string | null>(null);

  const timing = estimateReadingTime(script);

  const insertTag = (tag: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = script;
    const newText = currentText.substring(0, start) + tag + currentText.substring(end);
    onChangeScript(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 10);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApplyTemplate = (tmpl: ScriptTemplate) => {
    onChangeScript(tmpl.text);
    onChangeStyle(tmpl.tone);
  };

  // Instant 1-Click Hyper-Realism Optimizer
  const handleQuickOptimizeForRealism = async () => {
    if (!script.trim() || isAutoPolishing) return;
    setIsAutoPolishing(true);
    setPolishMessage(null);

    try {
      const res = await apiFetch("/api/voice/optimize-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script,
          mode: "hyper-realism",
          targetTone: style || "Chaleureux, sincère, captivant et hyper-réaliste",
          voiceName: selectedVoiceName,
        }),
      });

      if (!res.ok) throw new Error("Erreur optimisation");
      const data = await res.json();

      let optimizedScript = data.result;
      try {
        const parsed = JSON.parse(data.result);
        if (parsed.optimizedScript) {
          optimizedScript = parsed.optimizedScript;
        }
      } catch {}

      onChangeScript(optimizedScript);
      setPolishMessage("Script perfectionné : respirations & prosodie naturelle intégrées !");
      setTimeout(() => setPolishMessage(null), 4000);
    } catch (err) {
      console.error("Auto polish error:", err);
      // Fallback: inject a natural breath if absent
      if (!script.includes("<breath>")) {
        const modified = script.replace(/([.!?])\s+([A-ZÀ-Ÿ])/i, "$1 <breath> $2");
        onChangeScript(modified);
        setPolishMessage("Respiration anatomique ajoutée au script.");
        setTimeout(() => setPolishMessage(null), 3000);
      }
    } finally {
      setIsAutoPolishing(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-[28px] p-5 sm:p-6 flex flex-col gap-4 shadow-xl">
      {/* Top Header: Title & Templates */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
          <h2 className="text-sm font-semibold text-zinc-100 tracking-normal flex items-center gap-2">
            <span>Script de Voix Off</span>
            <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              HD Prosodie
            </span>
          </h2>
        </div>

        {/* Templates Dropdown & AI Optimization Actions */}
        <div className="flex items-center gap-2">
          {/* Quick 1-Click Perfectionist Polish Button */}
          <button
            type="button"
            onClick={handleQuickOptimizeForRealism}
            disabled={isAutoPolishing || !script.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 text-amber-300 border border-amber-500/40 transition-all font-bold cursor-pointer disabled:opacity-40 shadow-sm"
            title="Analyser le texte et insérer les respirations naturelles et pauses de perfectionnement"
          >
            {isAutoPolishing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Perfectionnement...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Perfectionner le Réalisme</span>
              </>
            )}
          </button>

          {/* Templates Pro */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/50 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Modèles Studio</span>
            </button>

            {/* Dropdown menu */}
            <div className="absolute right-0 top-full mt-1 w-72 p-2 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl hidden group-hover:block group-focus-within:block z-30">
              <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 tracking-normal border-b border-zinc-800 pb-1 mb-1">
                Scripts calibrés pour l'hyper-réalisme
              </div>
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-amber-500/15 hover:text-amber-300 text-zinc-300 transition-colors flex flex-col cursor-pointer"
                >
                  <span className="font-semibold text-zinc-100">{tmpl.title}</span>
                  <span className="text-[10px] text-zinc-400">{tmpl.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Coach IA Modal Button */}
          <button
            type="button"
            onClick={onOpenDoctor}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 transition-colors cursor-pointer"
            title="Ouvrir le Coach IA pour réécrire, minuter ou traduire"
          >
            <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Coach IA</span>
          </button>
        </div>
      </div>

      {polishMessage && (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{polishMessage}</span>
        </div>
      )}

      {/* Script Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={script}
          onChange={(e) => onChangeScript(e.target.value)}
          placeholder="Rédigez ou collez votre script voix off ici... Insérez <breath> pour une respiration naturelle, [pause 0.5s] pour une pause réflexive, ou |mhm| pour une réaction spontanée."
          rows={6}
          disabled={isGenerating}
          className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-amber-500/80 rounded-xl p-3.5 text-sm sm:text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all font-sans leading-relaxed resize-y min-h-[145px]"
        />

        {/* Quick action floating buttons */}
        <div className="absolute right-3 bottom-3 flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!script}
            className="p-1.5 rounded-lg bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-colors disabled:opacity-30 cursor-pointer"
            title="Copier le script"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onChangeScript("")}
            disabled={!script}
            className="p-1.5 rounded-lg bg-zinc-900/90 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-zinc-700 transition-colors disabled:opacity-30 cursor-pointer"
            title="Effacer le texte"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cue Markers Insertion Bar (Hyper-Realism acoustic cues) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] text-zinc-400 font-bold tracking-normal mr-1">
            Balises de Réalisme Humain :
          </span>
          <button
            type="button"
            onClick={() => insertTag("<breath> ")}
            className="px-2 py-0.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-mono text-[11px] border border-cyan-500/30 transition-colors cursor-pointer"
            title="Insère une respiration pulmonaire naturelle"
          >
            + &lt;breath&gt;
          </button>
          <button
            type="button"
            onClick={() => insertTag("[pause 0.4s] ")}
            className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono text-[11px] border border-amber-500/30 transition-colors cursor-pointer"
            title="Micropause d'emphase (0.4s)"
          >
            + [pause 0.4s]
          </button>
          <button
            type="button"
            onClick={() => insertTag("[pause 0.8s] ")}
            className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono text-[11px] border border-amber-500/30 transition-colors cursor-pointer"
            title="Pause dramatique ou contemplative (0.8s)"
          >
            + [pause 0.8s]
          </button>
          <button
            type="button"
            onClick={() => insertTag("<gasp> ")}
            className="px-2 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-mono text-[11px] border border-purple-500/30 transition-colors cursor-pointer"
            title="Souffle court / émotion vive"
          >
            + &lt;gasp&gt;
          </button>
          <button
            type="button"
            onClick={() => insertTag("<laugh> ")}
            className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-mono text-[11px] border border-emerald-500/30 transition-colors cursor-pointer"
            title="Sourire audible dans la voix"
          >
            + &lt;laugh&gt;
          </button>
          <button
            type="button"
            onClick={() => insertTag("|mhm| ")}
            className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700 transition-colors cursor-pointer"
            title="Interjection naturelle d'approbation"
          >
            + |mhm|
          </button>
        </div>

        {/* Word Count & Duration Metrics */}
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-zinc-500" />
            <span>
              <strong className="text-zinc-200">{timing.words}</strong> mots
            </span>
          </div>
          <span className="text-zinc-700">|</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Durée estimée : <strong className="text-amber-400 font-bold">{timing.formatted}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Direction & Tone Selection */}
      <div className="pt-2 border-t border-zinc-800/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <label className="text-xs font-semibold text-zinc-400 tracking-normal flex items-center gap-1.5 whitespace-nowrap">
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
          <span>Direction Vocale & Réalisme :</span>
        </label>
        <div className="relative flex-1">
          <input
            type="text"
            value={style}
            onChange={(e) => onChangeStyle(e.target.value)}
            placeholder="Ex: Chaleureux, intime, micro de proximité, diction impeccable..."
            className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-amber-500/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
        </div>

        {/* Quick Style presets */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {REALISTIC_STYLE_PRESETS.slice(0, 3).map((st, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChangeStyle(st)}
              className="text-[10px] whitespace-nowrap px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/40 transition-colors cursor-pointer"
            >
              {st.split(":")[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
