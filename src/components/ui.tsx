import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

/* Curseur sur mesure (remplace <input type="range">) : souris, tactile et clavier. */
export const Slider: React.FC<{
  value: number; min?: number; max?: number; step?: number;
  onChange: (v: number) => void; label?: string; className?: string;
}> = ({ value, min = 0, max = 1, step = 0.05, onChange, label, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const clamp = (v: number) => Math.min(max, Math.max(min, +(Math.round(v / step) * step).toFixed(4)));
  const fromX = (x: number) => {
    const r = ref.current!.getBoundingClientRect();
    onChange(clamp(min + ((x - r.left) / r.width) * (max - min)));
  };
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`relative w-full h-5 flex items-center cursor-pointer touch-none select-none ${className}`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); fromX(e.clientX); }}
      onPointerMove={(e) => { if (e.buttons) fromX(e.clientX); }}
      onKeyDown={(e) => {
        const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? step : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -step : 0;
        if (d) { e.preventDefault(); onChange(clamp(value + d)); }
      }}
    >
      <div className="h-1.5 w-full rounded-full bg-zinc-800 relative">
        <div className="absolute inset-y-0 left-0 rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="absolute w-4 h-4 -ml-2 rounded-full bg-amber-500 border-2 border-zinc-950" style={{ left: `${pct}%` }} />
    </div>
  );
};

/* Liste déroulante sur mesure (remplace <select>) : clavier, Échap, clic extérieur. */
export const Select: React.FC<{
  value: string; options: { value: string; label: string }[];
  onChange: (v: string) => void; label?: string; className?: string;
}> = ({ value, options, onChange, label, className = "" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const d = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", d); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", d); document.removeEventListener("keydown", k); };
  }, [open]);
  const cur = options.find((o) => o.value === value);
  return (
    <div className={`relative ${className}`} ref={ref}>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-100 cursor-pointer">
        <span className="truncate">{cur?.label ?? value}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-[#e4e4e7] rounded-2xl p-1.5 shadow-[0_16px_40px_rgba(20,20,22,.10)]">
          {options.map((o) => (
            <button key={o.value} type="button" role="option" aria-selected={o.value === value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-medium text-left text-[#18181b] cursor-pointer ${o.value === value ? "bg-[#f4f4f5]" : "hover:bg-[#f4f4f5]"}`}>
              <span className="truncate">{o.label}</span>{o.value === value && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
