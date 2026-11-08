import React from "react";
import { HelpCircle, X, Mic, Sparkles, BookOpen, Volume2, Activity, ShieldCheck } from "lucide-react";

interface StudioHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudioHelpModal: React.FC<StudioHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Guide d'Hyper-Réalisme & Perfectionnisme Studio
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-zinc-300 leading-relaxed">
          <section className="space-y-1.5">
            <h4 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              1. Comment obtenir une voix 100% vivante et humaine ?
            </h4>
            <p className="text-zinc-300">
              Pour éliminer toute sensation de voix robotique, 3 facteurs essentiels sont appliqués par VoxStudio :
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[11px]">
              <li>
                <strong className="text-amber-300">Moteur Flagship Gemini 3.8 Flash TTS</strong> : Modélisation avancée de la résonance des cordes vocales et du conduit vocal humain.
              </li>
              <li>
                <strong className="text-amber-300">Respirations physiologiques &lt;breath&gt;</strong> : Tout être humain inspire avant de parler. Utilisez le bouton <em>"Perfectionner le Réalisme"</em> pour insérer automatiquement les respirations aux pauses anatomiques réelles.
              </li>
              <li>
                <strong className="text-amber-300">Micro-inflections & Pauses</strong> : Des silences de réflexion de 0.4s à 0.8s (ex: <code>[pause 0.5s]</code>) donnent du poids et de la profondeur à chaque pensée.
              </li>
            </ul>
          </section>

          <section className="space-y-1.5 pt-2 border-t border-zinc-800">
            <h4 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              2. Effet de proximité & Chaîne de Mastering DSP
            </h4>
            <p className="text-zinc-400">
              En studio radio et cinéma, un comédien se place à 5-10 cm d'un micro à lampe (Neumann U87). Le DSP de VoxStudio reproduit cet effet :
            </p>
            <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-[11px] space-y-1 font-mono text-zinc-300">
              <div>• <strong>Chaleur de Proximité</strong> : Renforce les harmoniques de poitrine (180-220Hz).</div>
              <div>• <strong>Compresseur Broadcast</strong> : Homogénéise le volume avec un ratio 3.2:1.</div>
              <div>• <strong>Air Band (11kHz)</strong> : Apporte un soyeux sans sibilance agressive.</div>
              <div>• <strong>Cabine Insonorisée</strong> : Réflexions acoustiques ultra-courtes pour ancrer la voix dans l'espace 3D.</div>
            </div>
          </section>

          <section className="space-y-1.5 pt-2 border-t border-zinc-800">
            <h4 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              3. Balises vocales supportées
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                <span className="text-cyan-400 font-bold">&lt;breath&gt;</span>
                <p className="text-zinc-400 text-[10px]">Inspiration naturelle</p>
              </div>
              <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                <span className="text-amber-400 font-bold">[pause 0.5s]</span>
                <p className="text-zinc-400 text-[10px]">Silence expressif calibré</p>
              </div>
              <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                <span className="text-purple-400 font-bold">&lt;gasp&gt;</span>
                <p className="text-zinc-400 text-[10px]">Souffle d'émotion ou surprise</p>
              </div>
              <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">&lt;laugh&gt;</span>
                <p className="text-zinc-400 text-[10px]">Sourire audible dans la voix</p>
              </div>
              <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800 col-span-2">
                <span className="text-blue-400 font-bold">|mhm|</span> ou <span className="text-blue-400 font-bold">|yeah|</span>
                <p className="text-zinc-400 text-[10px]">Backchanneling / approbations naturelles en dialogue</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
