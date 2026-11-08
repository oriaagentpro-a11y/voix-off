import React, { useEffect, useRef, useState } from "react";
import { ChevronRight, Wind, Mic2, Timer, Languages, Wand2, ChevronDown, Search, Sparkles, MonitorPlay, HelpCircle, Check, Mic, UserRound } from "lucide-react";
import { VoiceInfo, StudioPreset } from "../types";
import type { DoctorMode } from "./ScriptDoctorModal";

interface HeaderProps {
  dialogueMode: boolean;
  onToggleDialogueMode: (enabled: boolean) => void;
  onOpenTeleprompter: () => void;
  onOpenScriptDoctor: (mode?: DoctorMode) => void;
  onOpenHelp: () => void;
  activeTakeCount: number;
  voices: VoiceInfo[];
  selectedVoice: string;
  onSelectVoice: (id: string) => void;
  presets: StudioPreset[];
  activePresetId: string | null;
  onApplyPreset: (preset: StudioPreset, insertScript: boolean, autoGenerate?: boolean) => void;
}

type MenuItem = { children?: MenuItem[]; id: string; title: string; desc?: string; active?: boolean; onSelect: () => void; icon: React.ReactNode };

const Menu: React.FC<{ label: string; title: string; items: MenuItem[] }> = ({ label, title, items }) => {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) setSub(null);
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const move = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const els = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') || []);
    const i = els.indexOf(document.activeElement as HTMLElement);
    els[(i + (e.key === "ArrowDown" ? 1 : -1) + els.length) % els.length]?.focus();
  };

  return (
    <div className="relative" ref={ref} onKeyDown={move}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${open ? "bg-[#18181b] text-white" : "text-[#3f3f46] hover:bg-[#f4f4f5]"}`}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" aria-label={title} className="absolute left-0 top-full mt-3 z-50 w-[330px] bg-white border border-[#e4e4e7] rounded-3xl p-2.5 shadow-[0_16px_40px_rgba(20,20,22,.10)]">
          <div className="px-3 pt-2 pb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-[#6b6b72]">{title}</div>
          {items.map((it) => (
            <div key={it.id} className="relative" onMouseEnter={() => setSub(it.children ? it.id : null)}>
              <button
                role="menuitem"
                type="button"
                aria-haspopup={it.children ? "menu" : undefined}
                aria-expanded={it.children ? sub === it.id : undefined}
                onClick={() => { if (it.children) setSub(sub === it.id ? null : it.id); else { it.onSelect(); setOpen(false); } }}
                onKeyDown={(e) => { if (it.children && e.key === "ArrowRight") { setSub(it.id); setTimeout(() => (e.currentTarget.parentElement?.querySelector('[data-sub] [role="menuitem"]') as HTMLElement | null)?.focus(), 0); } }}
                className={`w-full flex items-center gap-3.5 p-2.5 rounded-2xl text-left cursor-pointer ${it.active || sub === it.id ? "bg-[#f4f4f5]" : "hover:bg-[#f4f4f5]"}`}
              >
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${it.active ? "bg-[#18181b] text-white" : "bg-[#f4f4f5] text-[#18181b]"}`}>{it.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-[#18181b] truncate">{it.title}</span>
                  {it.desc && <span className="block text-xs text-[#6b6b72] mt-0.5 truncate">{it.desc}</span>}
                </span>
                {it.active && <Check className="w-4 h-4 text-[#18181b]" />}
                {it.children && <ChevronRight className="w-4 h-4 text-[#6b6b72]" />}
              </button>
              {it.children && sub === it.id && (
                <div data-sub role="menu" aria-label={it.title} onKeyDown={(e) => { if (e.key === "ArrowLeft") { setSub(null); (e.currentTarget.previousElementSibling as HTMLElement | null)?.focus(); } }} className="absolute left-full top-0 ml-2 z-50 w-[290px] bg-white border border-[#e4e4e7] rounded-3xl p-2.5 shadow-[0_16px_40px_rgba(20,20,22,.10)] max-sm:static max-sm:ml-0 max-sm:mt-1 max-sm:w-full max-sm:shadow-none">
                  {it.children.map((c) => (
                    <button key={c.id} role="menuitem" type="button" onClick={() => { c.onSelect(); setOpen(false); }} className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left hover:bg-[#f4f4f5] cursor-pointer">
                      <span className="w-9 h-9 rounded-xl bg-[#f4f4f5] flex items-center justify-center shrink-0 text-[#18181b]">{c.icon}</span>
                      <span className="min-w-0"><span className="block text-sm font-semibold text-[#18181b] truncate">{c.title}</span>{c.desc && <span className="block text-xs text-[#6b6b72] truncate">{c.desc}</span>}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SearchBox: React.FC<{ items: MenuItem[] }> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, []);
  const n = q.trim().toLowerCase();
  const res = items.filter((i) => !n || `${i.title} ${i.desc || ""}`.toLowerCase().includes(n)).slice(0, 8);
  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-label="Rechercher (Ctrl+K)" onClick={() => setOpen((o) => !o)} className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#18181b] cursor-pointer">
        <Search className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-3 z-50 w-[340px] bg-white border border-[#e4e4e7] rounded-3xl p-2.5 shadow-[0_16px_40px_rgba(20,20,22,.10)]">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Voix, preset, outil…" aria-label="Rechercher" className="w-full rounded-full bg-[#f4f4f5] px-4 py-2.5 text-sm text-[#18181b] placeholder:text-[#6b6b72] outline-none mb-2" />
          <div role="menu" className="max-h-[50vh] overflow-y-auto">
            {res.length === 0 && <div className="px-3 py-4 text-sm text-[#6b6b72]">Aucun résultat</div>}
            {res.map((it) => (
              <button key={it.id} role="menuitem" type="button" onClick={() => { it.onSelect(); setOpen(false); setQ(""); }} className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left hover:bg-[#f4f4f5] cursor-pointer">
                <span className="w-9 h-9 rounded-xl bg-[#f4f4f5] flex items-center justify-center shrink-0 text-[#18181b]">{it.icon}</span>
                <span className="min-w-0"><span className="block text-sm font-semibold text-[#18181b] truncate">{it.title}</span>{it.desc && <span className="block text-xs text-[#6b6b72] truncate">{it.desc}</span>}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const goTo = (id: string) => {
  if (id === "top") window.scrollTo({ top: 0, behavior: "smooth" });
  else document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const Header: React.FC<HeaderProps> = (p) => {
  const voiceItems: MenuItem[] = p.voices.map((v) => ({
    id: v.id, title: v.name, desc: `${v.gender === "femme" ? "Femme" : "Homme"} · ${v.tone.replace(/\s*\(.*\)/, "")}`,
    active: v.id === p.selectedVoice, icon: <UserRound className="w-4 h-4" />,
    onSelect: () => { p.onToggleDialogueMode(false); p.onSelectVoice(v.id); goTo("voix"); },
  }));
  const presetItems: MenuItem[] = p.presets.map((s) => ({
    id: s.id, title: s.name, desc: s.tagline, active: s.id === p.activePresetId, icon: <Sparkles className="w-4 h-4" />,
    onSelect: () => { p.onToggleDialogueMode(false); p.onApplyPreset(s, true, false); },
  }));
  const toolItems: MenuItem[] = [
    { id: "coach", title: "Coach Réalisme", desc: "Optimise respirations et diction", icon: <Sparkles className="w-4 h-4" />, onSelect: () => p.onOpenScriptDoctor("hyper-realism"), children: [
      { id: "c1", title: "Respirations", desc: "Hyper-réalisme et souffles", icon: <Wind className="w-4 h-4" />, onSelect: () => p.onOpenScriptDoctor("hyper-realism") },
      { id: "c2", title: "Rythme et pauses", desc: "Optimiser le débit", icon: <Mic2 className="w-4 h-4" />, onSelect: () => p.onOpenScriptDoctor("pacing") },
      { id: "c3", title: "Versions 15 / 30 / 60 s", desc: "Adapter la durée", icon: <Timer className="w-4 h-4" />, onSelect: () => p.onOpenScriptDoctor("timing-variants") },
      { id: "c4", title: "Traduction", desc: "Traduire en gardant le jeu", icon: <Languages className="w-4 h-4" />, onSelect: () => p.onOpenScriptDoctor("translate") },
      { id: "c5", title: "Polissage", desc: "Style et fluidité", icon: <Wand2 className="w-4 h-4" />, onSelect: () => p.onOpenScriptDoctor("polish") },
    ] },
    { id: "prompteur", title: "Prompteur", desc: "Lecture plein écran", icon: <MonitorPlay className="w-4 h-4" />, onSelect: p.onOpenTeleprompter },
    { id: "guide", title: "Guide studio", desc: "Hyper-réalisme et acoustique", icon: <HelpCircle className="w-4 h-4" />, onSelect: p.onOpenHelp },
  ];
  const link = "px-4 py-2.5 rounded-full text-sm font-medium text-[#3f3f46] hover:bg-[#f4f4f5] cursor-pointer";

  return (
    <header className="sticky top-0 z-40 px-4 sm:px-6 pt-5 pb-1 bg-[#e8e8eb]">
      <div className="max-w-[1384px] mx-auto flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5 bg-white rounded-full py-2 pl-2 pr-5">
          <span className="w-9 h-9 rounded-full bg-[#18181b] flex items-center justify-center"><Mic className="w-4 h-4 text-white" /></span>
          <span className="font-display font-bold text-[19px] tracking-tight text-[#18181b]">VoxStudio</span>
        </div>

        <nav aria-label="Navigation principale" className="flex flex-wrap items-center gap-1 bg-white rounded-full p-1.5 flex-1 min-w-0">
          <button type="button" className={link} onClick={() => goTo("top")}>Studio</button>
          <Menu label="Voix" title="Voix" items={voiceItems} />
          <Menu label="Presets" title="Presets 1 clic" items={presetItems} />
          <button type="button" className={`${link} ${p.dialogueMode ? "!bg-[#18181b] !text-white" : ""}`} aria-pressed={p.dialogueMode} onClick={() => p.onToggleDialogueMode(!p.dialogueMode)}>Mode Duo</button>
          <button type="button" className={link} onClick={() => goTo("prises")}>Prises <span className="ml-1 text-xs text-[#6b6b72]">{p.activeTakeCount}</span></button>
          <Menu label="Outils" title="Outils" items={toolItems} />
        </nav>

        <div className="hidden md:flex items-center gap-2 bg-white rounded-full px-4 py-3 text-xs font-medium text-[#18181b]">
          <span className="w-2 h-2 rounded-full bg-[#18181b]" />Flagship 24 kHz
        </div>
        <SearchBox items={[...voiceItems, ...presetItems, ...toolItems]} />
      </div>
    </header>
  );
};
