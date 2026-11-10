import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, FlipHorizontal } from "lucide-react";
import { Dialog, IconButton, Slider } from "./ui";

interface TeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: string;
  speed?: number;
}

/* Prompteur plein écran, toujours sombre pour limiter l'éblouissement. */
export const TeleprompterModal: React.FC<TeleprompterModalProps> = ({ isOpen, onClose, script, speed = 1.0 }) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(speed * 2);
  const [fontSize, setFontSize] = useState(40);
  const [isMirrored, setIsMirrored] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { if (!isOpen) setIsScrolling(false); }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isScrolling) return;
    let raf = 0;
    const step = () => {
      if (scrollRef.current) scrollRef.current.scrollTop += scrollSpeed * 0.75;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isOpen, isScrolling, scrollSpeed]);

  // Espace = lecture/pause, sauf si le focus est sur un contrôle (qui gère déjà Espace).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.code === "Space" && !t.closest("button,[role=slider],input,textarea")) {
        e.preventDefault();
        setIsScrolling((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onClose={onClose} title="Prompteur" description="Espace : lancer ou mettre en pause · Échap : quitter" size="full">
      <div className="dock flex h-full flex-col bg-dock text-dock-ink">
        <div className="flex flex-wrap items-center justify-center gap-3 border-b border-white/10 px-4 py-3 sm:gap-5">
          <button
            type="button"
            onClick={() => setIsScrolling((s) => !s)}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[12px] bg-dock-accent px-5 text-sm font-semibold text-[#0b1f14]"
            data-autofocus
          >
            {isScrolling ? <Pause className="h-4 w-4 fill-current" aria-hidden="true" /> : <Play className="h-4 w-4 fill-current" aria-hidden="true" />}
            {isScrolling ? "Pause" : "Défiler"}
          </button>
          <IconButton variant="dock" label="Revenir au début" icon={<RotateCcw />} onClick={() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }} />
          <div className="flex items-center gap-2 text-[13px] text-dock-ink-2">
            <span>Vitesse</span>
            <Slider tone="dock" className="!w-28" label="Vitesse de défilement" min={1} max={6} step={0.5} value={scrollSpeed} valueText={`${scrollSpeed}`} onChange={setScrollSpeed} />
          </div>
          <div className="flex items-center gap-2 text-[13px] text-dock-ink-2">
            <span>Taille</span>
            <Slider tone="dock" className="!w-28" label="Taille du texte" min={24} max={64} step={4} value={fontSize} valueText={`${fontSize} pixels`} onChange={setFontSize} />
          </div>
          <IconButton variant="dock" label="Mode miroir (vitre de prompteur)" icon={<FlipHorizontal />} active={isMirrored} aria-pressed={isMirrored} onClick={() => setIsMirrored((m) => !m)} />
        </div>

        <div className="relative min-h-0 flex-1">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px bg-dock-accent/50" />
          <div
            ref={scrollRef}
            className={`mx-auto h-full max-w-4xl overflow-y-auto px-6 py-[40vh] text-center font-medium leading-relaxed sm:px-16 ${isMirrored ? "-scale-x-100" : ""}`}
            style={{ fontSize }}
          >
            {script || "Votre script s'affichera ici."}
          </div>
        </div>
      </div>
    </Dialog>
  );
};
