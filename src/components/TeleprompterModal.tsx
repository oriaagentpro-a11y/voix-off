import { Slider } from "./ui";
import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, X, FlipHorizontal, Type, Gauge } from "lucide-react";

interface TeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: string;
  speed?: number;
}

export const TeleprompterModal: React.FC<TeleprompterModalProps> = ({
  isOpen,
  onClose,
  script,
  speed = 1.0,
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(speed * 2); // 1 to 5
  const [fontSize, setFontSize] = useState(36); // px
  const [isMirrored, setIsMirrored] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll loop
  useEffect(() => {
    if (!isOpen || !isScrolling) return;

    let animFrame: number;
    const scrollStep = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += scrollSpeed * 0.75;
      }
      animFrame = requestAnimationFrame(scrollStep);
    };

    animFrame = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animFrame);
  }, [isOpen, isScrolling, scrollSpeed]);

  // Spacebar toggle keyboard shortcut
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsScrolling((prev) => !prev);
      } else if (e.code === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleReset = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="scope-dark fixed inset-0 z-50 bg-black flex flex-col select-none">
      {/* Top Floating Control Bar */}
      <div className="bg-zinc-950/90 border-b border-zinc-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold tracking-normal text-xs">
            Prompteur Studio
          </span>
          <span className="text-zinc-500 text-xs hidden sm:inline font-mono">
            [Espace] pour Lancer/Pause, [Échap] pour Quitter
          </span>
        </div>

        {/* Center Transport & Config */}
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={() => setIsScrolling(!isScrolling)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg transition-colors"
          >
            {isScrolling ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isScrolling ? "PAUSE" : "DÉFILER"}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            title="Revenir au début"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed slider */}
          <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs text-zinc-400">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <Slider className="!w-28" label="Vitesse de défilement" min={1} max={6} step={0.5} value={scrollSpeed} onChange={(v) => setScrollSpeed(v)} />
            <span className="font-mono text-[11px] text-zinc-300 w-6 text-right">
              {scrollSpeed}x
            </span>
          </div>

          {/* Font size */}
          <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs text-zinc-400">
            <Type className="w-3.5 h-3.5 text-cyan-400" />
            <Slider className="!w-28" label="Taille du texte" min={24} max={56} step={4} value={fontSize} onChange={(v) => setFontSize(v)} />
          </div>

          {/* Mirror toggle for teleprompter glass */}
          <button
            type="button"
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isMirrored
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                : "bg-zinc-900 text-zinc-400 border-zinc-800"
            }`}
            title="Mode Miroir (pour vitre prompteur)"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Prompter Visual Reading Area with Center Guide Line */}
      <div className="relative flex-1 overflow-hidden">
        {/* Subtle center marker line */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-amber-500/30 z-10 pointer-events-none flex items-center justify-between px-4">
          <span className="text-[10px] uppercase font-mono text-amber-500/60">Ligne de regard</span>
          <span className="text-[10px] uppercase font-mono text-amber-500/60">Ligne de regard</span>
        </div>

        <div
          ref={scrollContainerRef}
          className={`h-full overflow-y-auto px-6 sm:px-16 py-48 text-center text-zinc-100 font-sans font-medium leading-relaxed max-w-4xl mx-auto scroll-smooth ${
            isMirrored ? "scale-x-[-1]" : ""
          }`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {script || "Votre script s'affichera ici en grand format lisible..."}
        </div>
      </div>
    </div>
  );
};
