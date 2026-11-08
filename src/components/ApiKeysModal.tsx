import React, { useEffect, useState } from "react";
import { X, Plus, Eye, EyeOff, Trash2, KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { ApiKeyEntry, loadKeys, saveKeys } from "../utils/apiKeys";

const mask = (k: string) => (k.length <= 10 ? "••••••" : `${k.slice(0, 4)}••••••••${k.slice(-4)}`);

export const ApiKeysModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState<ApiKeyEntry[]>(loadKeys);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, { state: "loading" | "ok" | "ko"; msg?: string }>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => { if (isOpen) setKeys(loadKeys()); }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  const commit = (next: ApiKeyEntry[]) => { setKeys(next); saveKeys(next); };
  const add = () => {
    const v = value.trim();
    if (v.length < 20) return setFormError("Cette clé semble trop courte.");
    if (keys.some((k) => k.key === v)) return setFormError("Cette clé est déjà enregistrée.");
    commit([...keys, { id: crypto.randomUUID(), label: label.trim() || `Clé ${keys.length + 1}`, key: v, enabled: true }]);
    setLabel(""); setValue(""); setFormError(null);
  };
  const test = async (k: ApiKeyEntry) => {
    setStatus((s) => ({ ...s, [k.id]: { state: "loading" } }));
    try {
      const r = await fetch("/api/voice/test-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: k.key }) });
      const d = await r.json();
      setStatus((s) => ({ ...s, [k.id]: d.ok ? { state: "ok" } : { state: "ko", msg: d.error } }));
    } catch {
      setStatus((s) => ({ ...s, [k.id]: { state: "ko", msg: "Serveur injoignable." } }));
    }
  };
  const active = keys.filter((k) => k.enabled).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Clés API Google" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-[28px] p-6 sm:p-7 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2"><KeyRound className="w-5 h-5" />Clés API Google</h2>
            <p className="text-xs text-zinc-500 mt-1">{keys.length} enregistrée(s) · {active} active(s). Si une clé atteint son quota, la suivante prend le relais automatiquement.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex flex-col gap-2.5">
          {keys.length === 0 && <div className="rounded-2xl bg-zinc-800/60 px-4 py-6 text-center text-sm text-zinc-500">Aucune clé pour l’instant. Ajoutez votre première clé ci-dessous.</div>}
          {keys.map((k) => {
            const st = status[k.id];
            return (
              <div key={k.id} className={`rounded-2xl border border-zinc-700 p-3.5 flex flex-col gap-2.5 ${k.enabled ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-3">
                  <button type="button" role="switch" aria-checked={k.enabled} aria-label={`Activer ${k.label}`} onClick={() => commit(keys.map((x) => (x.id === k.id ? { ...x, enabled: !x.enabled } : x)))}
                    className={`relative w-11 h-6 rounded-full shrink-0 cursor-pointer transition-colors ${k.enabled ? "bg-amber-500" : "bg-zinc-600"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-zinc-900 transition-all ${k.enabled ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-zinc-100 truncate">{k.label}</div>
                    <div className="text-xs font-mono text-zinc-500 truncate">{shown[k.id] ? k.key : mask(k.key)}</div>
                  </div>
                  <button type="button" aria-label={shown[k.id] ? "Masquer" : "Afficher"} onClick={() => setShown((s) => ({ ...s, [k.id]: !s[k.id] }))} className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer">{shown[k.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  <button type="button" onClick={() => test(k)} className="px-3.5 h-9 rounded-full border border-zinc-700 text-xs font-medium text-zinc-100 cursor-pointer">Tester</button>
                  <button type="button" aria-label={`Supprimer ${k.label}`} onClick={() => commit(keys.filter((x) => x.id !== k.id))} className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
                {st && (
                  <div className="text-xs flex items-center gap-1.5 text-zinc-400" role="status">
                    {st.state === "loading" && <><Loader2 className="w-3.5 h-3.5 animate-spin" />Test en cours…</>}
                    {st.state === "ok" && <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Clé valide</>}
                    {st.state === "ko" && <><AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" /><span className="truncate">{st.msg || "Clé refusée"}</span></>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-zinc-800/50 p-4 flex flex-col gap-3">
          <div className="text-sm font-semibold text-zinc-100">Ajouter une clé</div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2.5">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nom (facultatif)" aria-label="Nom de la clé" className="rounded-full bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500" />
            <input value={value} onChange={(e) => { setValue(e.target.value); setFormError(null); }} onKeyDown={(e) => { if (e.key === "Enter") add(); }} type="password" autoComplete="off" spellCheck={false} placeholder="AIza…" aria-label="Clé API Google" className="rounded-full bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm font-mono text-zinc-100 outline-none placeholder:text-zinc-500" />
          </div>
          {formError && <div className="text-xs text-rose-600" role="alert">{formError}</div>}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[11px] text-zinc-500">Clés stockées uniquement dans ce navigateur ; envoyées à votre serveur pour appeler Google.</span>
            <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-full bg-amber-500 text-zinc-950 px-5 py-2.5 text-sm font-semibold cursor-pointer"><Plus className="w-4 h-4" />Ajouter</button>
          </div>
        </div>
      </div>
    </div>
  );
};
