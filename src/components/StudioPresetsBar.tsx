import React, { useState } from "react";
import { StudioPreset, StudioSettings } from "../types";
import {
  GraduationCap,
  Compass,
  Zap,
  Sparkles,
  BookOpen,
  Radio,
  Flame,
  Heart,
  Briefcase,
  Check,
  Play,
  Sliders,
  ChevronDown,
  ChevronUp,
  Layers,
  Wand2,
  BookmarkCheck,
  FileText,
  Mic,
} from "lucide-react";

interface StudioPresetsBarProps {
  presets: StudioPreset[];
  activePresetId: string | null;
  onSelectPreset: (preset: StudioPreset, insertScript: boolean, autoGenerate?: boolean) => void;
  currentSettings: StudioSettings;
  currentVoice: string;
  isGenerating?: boolean;
}

export const StudioPresetsBar: React.FC<StudioPresetsBarProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  currentSettings,
  currentVoice,
  isGenerating = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showDetailsId, setShowDetailsId] = useState<string | null>(null);

  const categories = [
    "Tous",
    "Pédagogique",
    "Documentaire",
    "Publicité",
    "Luxe",
    "Storytelling",
    "Podcast",
    "Cinéma",
    "Bien-être",
  ];

  const filteredPresets =
    selectedCategory === "Tous"
      ? presets
      : presets.filter((p) => p.category === selectedCategory);

  const activePreset = presets.find((p) => p.id === activePresetId);

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case "GraduationCap":
        return <GraduationCap className="w-5 h-5 text-amber-400" />;
      case "Compass":
        return <Compass className="w-5 h-5 text-cyan-400" />;
      case "Zap":
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case "Sparkles":
        return <Sparkles className="w-5 h-5 text-rose-400" />;
      case "BookOpen":
        return <BookOpen className="w-5 h-5 text-emerald-400" />;
      case "Radio":
        return <Radio className="w-5 h-5 text-purple-400" />;
      case "Flame":
        return <Flame className="w-5 h-5 text-orange-400" />;
      case "Heart":
        return <Heart className="w-5 h-5 text-pink-400" />;
      case "Briefcase":
      default:
        return <Briefcase className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="bg-zinc-900 rounded-[28px] p-5 sm:p-6 flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-semibold shadow-md shadow-amber-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-100 tracking-normal">
                Paramètres Prédéfinis Studio (1-Clic)
              </h2>
              <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold px-2 py-0.5 rounded uppercase">
                Préréglages Intelligents
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Sélectionnez votre type de projet : la voix, le style, l'égalisation, la compression et l'acoustique sont configurés automatiquement.
            </p>
          </div>
        </div>

        {/* Toggle Expand / Collapse */}
        <div className="flex items-center gap-2">
          {activePreset && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-medium">
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Actif : <strong>{activePreset.name}</strong>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700/50 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? "Masquer les Presets" : "Afficher les Presets"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20 font-semibold"
                      : "bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  {cat === "Pédagogique" && "🎓 "}
                  {cat === "Documentaire" && "🌍 "}
                  {cat === "Publicité" && "🚀 "}
                  {cat === "Luxe" && "💎 "}
                  {cat === "Storytelling" && "📖 "}
                  {cat === "Podcast" && "🎙️ "}
                  {cat === "Cinéma" && "🎬 "}
                  {cat === "Bien-être" && "🧘 "}
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Presets Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredPresets.map((preset) => {
              const isActive = activePresetId === preset.id;
              const isDetailsOpen = showDetailsId === preset.id;

              return (
                <div
                  key={preset.id}
                  className={`relative rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                    isActive
                      ? "bg-gradient-to-b from-amber-500/15 via-zinc-900 to-zinc-900 border-amber-500/90 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/40"
                      : "bg-zinc-950/70 hover:bg-zinc-950 border-zinc-800/80 hover:border-zinc-700 text-zinc-300"
                  }`}
                >
                  {/* Top line with Icon, Title, and Category */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                          {getPresetIcon(preset.iconName)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-zinc-100 leading-tight">
                            {preset.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-semibold">
                              {preset.badge}
                            </span>
                            <span className="text-[10px] text-amber-400/90 font-medium flex items-center gap-0.5">
                              <Mic className="w-3 h-3" />
                              Voix : {preset.recommendedVoice}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-semibold tracking-normal flex items-center gap-1 shrink-0 shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Actif
                        </span>
                      )}
                    </div>

                    {/* Tagline */}
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3 line-clamp-2">
                      {preset.tagline}
                    </p>

                    {/* Configuration Specs Tags */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-zinc-400 bg-zinc-900/80 p-2 rounded-lg border border-zinc-800/80 mb-3">
                      <span className="text-zinc-300">
                        EQ: <strong className="text-amber-400">{preset.eqPreset}</strong>
                      </span>
                      <span>•</span>
                      <span>Proximité: {Math.round(preset.proximityWarmth * 100)}%</span>
                      <span>•</span>
                      <span>Air: {Math.round(preset.airClarity * 100)}%</span>
                      {preset.studioCompression && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400">Compresseur ON</span>
                        </>
                      )}
                    </div>

                    {/* Collapsible details preview */}
                    {isDetailsOpen && (
                      <div className="space-y-2 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs mb-3 animate-in fade-in">
                        <div>
                          <strong className="text-zinc-300">Style appliqué :</strong>
                          <p className="text-[11px] text-zinc-400 mt-0.5 italic">{preset.stylePrompt}</p>
                        </div>
                        <div>
                          <strong className="text-zinc-300">Conseil de rythme :</strong>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{preset.pacingAdvice}</p>
                        </div>
                        <div>
                          <strong className="text-zinc-300">Script modèle inclus :</strong>
                          <p className="text-[11px] text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-800 mt-1 font-sans">
                            {preset.sampleScript}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-zinc-800/80 mt-auto flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {/* Main Apply Button */}
                      <button
                        type="button"
                        onClick={() => onSelectPreset(preset, false)}
                        disabled={isGenerating}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isActive
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30"
                            : "bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 border border-zinc-700/60"
                        }`}
                        title="Appliquer automatiquement tous les paramètres sans écraser votre texte"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{isActive ? "Paramètres Appliqués" : "Appliquer ce Preset"}</span>
                      </button>

                      {/* Apply + Insert Sample Script */}
                      <button
                        type="button"
                        onClick={() => onSelectPreset(preset, true)}
                        disabled={isGenerating}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-300 border border-zinc-700/60 transition-colors cursor-pointer"
                        title="Appliquer les paramètres ET charger l'exemple de script calibré"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {/* Details toggle */}
                      <button
                        type="button"
                        onClick={() => setShowDetailsId(isDetailsOpen ? null : preset.id)}
                        className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
                        title={isDetailsOpen ? "Masquer les détails" : "Voir tous les paramètres et le script exemple"}
                      >
                        {isDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Direct 1-Click Generate Button */}
                    <button
                      type="button"
                      onClick={() => onSelectPreset(preset, false, true)}
                      disabled={isGenerating}
                      className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="Appliquer ce preset et lancer immédiatement la synthèse vocale"
                    >
                      <Play className="w-3 h-3 fill-current text-amber-400" />
                      <span>Appliquer & Générer Directement</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
