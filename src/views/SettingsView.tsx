import React, { useEffect, useId, useState } from "react";
import { KeyRound, Plus, Eye, EyeOff, Trash2, Loader2, CheckCircle2, AlertCircle, Palette, BookOpen, Sun, Moon, Monitor } from "lucide-react";
import { ApiKeyEntry, loadKeys, saveKeys } from "../utils/apiKeys";
import { PageHeader } from "../components/AppShell";
import { Button, Card, CardHeader, ConfirmDialog, EmptyState, IconButton, Segmented, Switch, inputCls, cx } from "../components/ui";
import { EXPRESSION_TAGS } from "../components/ScriptEditor";

export type ThemePref = "system" | "light" | "dark";

const mask = (k: string) => (k.length <= 10 ? "••••••" : `${k.slice(0, 4)}••••••••${k.slice(-4)}`);

const ApiKeysCard: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyEntry[]>(loadKeys);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, { state: "loading" | "ok" | "ko"; msg?: string }>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ApiKeyEntry | null>(null);
  const ids = { label: useId(), key: useId(), err: useId() };

  useEffect(() => {
    const sync = () => setKeys(loadKeys());
    window.addEventListener("voxstudio-keys", sync);
    return () => window.removeEventListener("voxstudio-keys", sync);
  }, []);

  const commit = (next: ApiKeyEntry[]) => { setKeys(next); saveKeys(next); };
  const add = () => {
    const v = value.trim();
    if (v.length < 20) return setFormError("Cette clé semble trop courte : vérifiez qu'elle est complète.");
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
    <Card id="cles" aria-labelledby="keys-title" className="scroll-mt-6">
      <CardHeader id="keys-title" icon={<KeyRound />} title="Clés API Google" subtitle={`${keys.length} enregistrée${keys.length > 1 ? "s" : ""} · ${active} active${active > 1 ? "s" : ""}. Si une clé atteint son quota, la suivante prend le relais.`} />

      {keys.length === 0 ? (
        <EmptyState compact icon={<KeyRound />} title="Aucune clé enregistrée" text="Ajoutez une clé Google AI Studio pour pouvoir générer des voix." />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {keys.map((k) => {
            const st = status[k.id];
            return (
              <li key={k.id} className={cx("rounded-[16px] border border-line p-3.5", !k.enabled && "bg-surface-2")}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{k.label}</p>
                    <p className="truncate font-mono text-xs text-ink-2">{shown[k.id] ? k.key : mask(k.key)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch label={`Activer ${k.label}`} className="[&>div:first-child]:sr-only" checked={k.enabled} onChange={() => commit(keys.map((x) => (x.id === k.id ? { ...x, enabled: !x.enabled } : x)))} />
                    <IconButton label={shown[k.id] ? "Masquer la clé" : "Afficher la clé"} icon={shown[k.id] ? <EyeOff /> : <Eye />} onClick={() => setShown((s) => ({ ...s, [k.id]: !s[k.id] }))} />
                    <Button size="sm" onClick={() => test(k)} loading={st?.state === "loading"}>Tester</Button>
                    <IconButton label={`Supprimer ${k.label}`} icon={<Trash2 />} variant="danger" onClick={() => setToDelete(k)} />
                  </div>
                </div>
                {st && st.state !== "loading" && (
                  <p className="mt-2 flex items-center gap-1.5 text-[13px]" role="status">
                    {st.state === "ok" ? <><CheckCircle2 className="h-4 w-4 text-accent" aria-hidden="true" />Clé valide</> : <><AlertCircle className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" /><span className="text-danger">{st.msg || "Clé refusée"}</span></>}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form className="mt-5 rounded-[16px] bg-surface-2 p-4" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <p className="mb-3 text-sm font-semibold">Ajouter une clé</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ids.label} className="text-[13px] font-medium">Nom <span className="font-normal text-ink-2">(facultatif)</span></label>
            <input id={ids.label} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. : Compte perso" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={ids.key} className="text-[13px] font-medium">Clé API</label>
            <input
              id={ids.key} value={value} onChange={(e) => { setValue(e.target.value); setFormError(null); }} type="password" autoComplete="off" spellCheck={false}
              placeholder="AIza…" aria-invalid={!!formError} aria-describedby={formError ? ids.err : undefined} className={cx(inputCls, "font-mono")}
            />
          </div>
        </div>
        {formError && <p id={ids.err} className="mt-2 text-[13px] text-danger" role="alert">{formError}</p>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-2">Les clés restent dans ce navigateur et ne sont envoyées qu'à votre serveur VoxStudio.</p>
          <Button type="submit" variant="primary" icon={<Plus />}>Ajouter</Button>
        </div>
      </form>

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer cette clé ?"
        message={<>La clé « {toDelete?.label} » sera retirée de ce navigateur.</>}
        confirmLabel="Supprimer"
        onCancel={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) commit(keys.filter((x) => x.id !== toDelete.id)); setToDelete(null); }}
      />
    </Card>
  );
};

export const SettingsView: React.FC<{ theme: ThemePref; onChangeTheme: (t: ThemePref) => void }> = ({ theme, onChangeTheme }) => (
  <>
    <PageHeader title="Réglages" subtitle="Clés d'accès, apparence et aide." />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px] lg:gap-5">
      <ApiKeysCard />
      <div className="flex flex-col gap-4 lg:gap-5">
        <Card aria-labelledby="theme-title">
          <CardHeader id="theme-title" icon={<Palette />} title="Apparence" subtitle="Le mode « Système » suit le réglage de votre ordinateur." />
          <Segmented
            label="Thème"
            fullWidth
            value={theme}
            onChange={onChangeTheme}
            options={[
              { value: "light", label: "Clair", icon: <Sun /> },
              { value: "dark", label: "Sombre", icon: <Moon /> },
              { value: "system", label: "Système", icon: <Monitor /> },
            ]}
          />
        </Card>

        <Card aria-labelledby="help-title">
          <CardHeader id="help-title" icon={<BookOpen />} title="Aide" subtitle="Obtenir une voix naturelle" />
          <div className="space-y-4 text-[13px] leading-relaxed text-ink-2">
            <p><strong className="text-ink">Écrivez pour l'oral.</strong> Phrases courtes, ponctuation marquée. Le bouton « Rendre plus naturel » ajoute respirations et pauses là où un comédien les placerait.</p>
            <div>
              <p className="mb-2 font-semibold text-ink">Balises d'expression</p>
              <dl className="grid grid-cols-1 gap-1.5">
                {EXPRESSION_TAGS.map((t) => (
                  <div key={t.tag} className="flex items-baseline justify-between gap-3 rounded-[10px] bg-surface-2 px-3 py-2">
                    <dt className="font-mono text-xs text-ink">{t.tag}</dt>
                    <dd className="text-right text-xs">{t.hint}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p><strong className="text-ink">Mixage.</strong> « Chaleur » rapproche la voix du micro, « Brillance » ajoute de l'air, « Pièce » ajoute un peu d'espace. Comparez avec le bouton « Mixé / Brut » du lecteur.</p>
            <div>
              <p className="mb-2 font-semibold text-ink">Raccourcis clavier</p>
              <ul className="space-y-1">
                <li><kbd className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-ink">Ctrl + Entrée</kbd> générer la voix</li>
                <li><kbd className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-ink">Espace</kbd> lecture / pause (hors champ de texte)</li>
                <li><kbd className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-ink">Échap</kbd> fermer une fenêtre</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </>
);
