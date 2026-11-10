import React, { useId, useRef, useState } from "react";
import { FileText, Copy, Check, Trash2, Wand2, Sparkles, MonitorPlay } from "lucide-react";
import { apiFetch } from "../utils/apiKeys";
import { estimateReadingTime } from "../utils/audio";
import { Card, CardHeader, Button, IconButton, MenuButton, Stat, inputCls, fieldBase, cx } from "./ui";
import { fmtDuration } from "./GenerateCard";

interface ScriptTemplate { id: string; title: string; category: string; tone: string; text: string; }

const TEMPLATES: ScriptTemplate[] = [
  { id: "luxe", title: "Publicité luxe", category: "Parfum, beauté", tone: "Chaleureuse, soyeuse, feutrée, au plus près du micro",
    text: "Certains instants ne s'expliquent pas. <breath> Ils se ressentent. [pause 0.4s] Découvrez la nouvelle essence Nocturne. Une signature olfactive rare... pour révéler votre éclat le plus pur." },
  { id: "cinema", title: "Bande-annonce", category: "Cinéma, événement", tone: "Grave, puissante, mystérieuse et percutante",
    text: "Dans un monde où chaque souffle est compté... <gasp> une seule voix peut encore briser le silence. [pause 0.6s] Cet hiver, préparez-vous pour l'ultime voyage. Au cinéma le 12 décembre." },
  { id: "saas", title: "Pitch produit", category: "Tech, B2B", tone: "Dynamique, assurée, moderne, sourire dans la voix",
    text: "Vos équipes perdent jusqu'à 3 heures par jour en tâches répétitives. <breath> Avec Horizon AI, automatisez vos flux clés en un clin d'œil. [pause 0.4s] Simple. Fluide. Redoutablement efficace." },
  { id: "doc", title: "Narration documentaire", category: "Nature, histoire", tone: "Posée, contemplative, chaleureuse et immersive",
    text: "À l'orée du crépuscule, la canopée s'éveille d'une vibration invisible. [pause 0.8s] Ici, chaque créature compose la symphonie fragile d'un sanctuaire préservé depuis des millénaires. <breath> Un équilibre sublime." },
  { id: "podcast", title: "Ouverture de podcast", category: "Podcast", tone: "Naturelle, proche, complice et spontanée",
    text: "Bienvenue dans ce nouvel épisode. <breath> Vous êtes nombreux à m'avoir posé la question cette semaine... |mhm| et la réponse est bien plus surprenante qu'il n'y paraît. [pause 0.5s] Installez-vous, on commence." },
];

export const EXPRESSION_TAGS = [
  { tag: "<breath>", label: "Respiration", hint: "Ajoute une inspiration naturelle" },
  { tag: "[pause 0.4s]", label: "Pause courte", hint: "Silence de 0,4 s pour appuyer un mot" },
  { tag: "[pause 0.8s]", label: "Pause longue", hint: "Silence de 0,8 s, plus posé" },
  { tag: "<laugh>", label: "Sourire", hint: "Un sourire ou un léger rire audible" },
  { tag: "<gasp>", label: "Souffle vif", hint: "Souffle court d'émotion ou de surprise" },
  { tag: "|mhm|", label: "Hésitation", hint: "Petite réaction spontanée (« mhm »)" },
];

const STYLE_SUGGESTIONS = [
  { label: "Pédagogique", value: "Claire, bienveillante et posée, avec des pauses pour laisser le temps de comprendre." },
  { label: "Publicité", value: "Énergique, souriante et percutante, rythme soutenu." },
  { label: "Documentaire", value: "Posée, contemplative et chaleureuse, avec des silences habités." },
];

export const countTags = (s: string) => (s.match(/<[^>]+>|\[[^\]]+\]|\|[^|]+\|/g) || []).length;

interface ScriptEditorProps {
  script: string;
  onChangeScript: (val: string) => void;
  style: string;
  onChangeStyle: (val: string) => void;
  onOpenDoctor: () => void;
  onOpenTeleprompter: () => void;
  isGenerating?: boolean;
  selectedVoiceName?: string;
  modeSwitch: React.ReactNode;
  onNotify: (kind: "success" | "error" | "info", msg: string) => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script, onChangeScript, style, onChangeStyle, onOpenDoctor, onOpenTeleprompter, isGenerating = false, selectedVoiceName = "Kore", modeSwitch, onNotify,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const ids = { script: useId(), style: useId(), tags: useId() };
  const timing = estimateReadingTime(script);

  const insertTag = (tag: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const before = script.substring(0, s);
    const pad = before && !/\s$/.test(before) ? " " : "";
    const ins = `${pad}${tag} `;
    onChangeScript(before + ins + script.substring(e));
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s + ins.length, s + ins.length); });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onNotify("error", "Impossible de copier le texte.");
    }
  };

  const polish = async () => {
    if (!script.trim() || polishing) return;
    setPolishing(true);
    try {
      const res = await apiFetch("/api/voice/optimize-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, mode: "hyper-realism", targetTone: style || "Chaleureux, sincère et naturel", voiceName: selectedVoiceName }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      let out = data.result;
      try { const p = JSON.parse(data.result); if (p.optimizedScript) out = p.optimizedScript; } catch {}
      onChangeScript(out);
      onNotify("success", "Respirations et pauses ajoutées au texte.");
    } catch {
      onNotify("error", "L'amélioration automatique n'a pas abouti. Vérifiez vos clés API ou réessayez.");
    } finally {
      setPolishing(false);
    }
  };

  return (
    <Card aria-labelledby="script-title">
      <CardHeader
        id="script-title"
        icon={<FileText />}
        title="Script"
        subtitle="Votre texte, tel qu'il sera lu"
        action={
          <>
            {modeSwitch}
            <MenuButton
              label="Modèles"
              items={TEMPLATES.map((t) => ({
                id: t.id, label: t.title, desc: t.category,
                onSelect: () => { onChangeScript(t.text); onChangeStyle(t.tone); onNotify("info", `Modèle « ${t.title} » chargé.`); },
              }))}
            />
          </>
        }
      />

      <label htmlFor={ids.script} className="sr-only">Texte du script</label>
      <div className="relative">
        <textarea
          id={ids.script}
          ref={textareaRef}
          value={script}
          onChange={(e) => onChangeScript(e.target.value)}
          placeholder="Écrivez ou collez votre texte ici…"
          rows={7}
          aria-describedby={ids.tags}
          className={cx(fieldBase, "min-h-[180px] resize-y !rounded-[16px] border-line-strong bg-surface-2 !p-4 !pb-14 !text-base leading-relaxed")}
        />
        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1 rounded-[12px] bg-surface p-1 shadow-card ring-1 ring-line">
          <IconButton size="sm" label={copied ? "Copié" : "Copier le texte"} icon={copied ? <Check /> : <Copy />} onClick={copy} disabled={!script} />
          <IconButton size="sm" label="Effacer le texte" icon={<Trash2 />} variant="danger" onClick={() => onChangeScript("")} disabled={!script || isGenerating} />
        </div>
      </div>

      {/* Balises d'expression */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-labelledby={ids.tags}>
        <span id={ids.tags} className="mr-1 text-[13px] text-ink-2">Ajouter au curseur :</span>
        {EXPRESSION_TAGS.map((t) => (
          <button
            key={t.tag}
            type="button"
            onClick={() => insertTag(t.tag)}
            title={`${t.hint} — ${t.tag}`}
            className="h-8 cursor-pointer rounded-full border border-line bg-surface px-3 text-[13px] font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface-2"
          >
            + {t.label}
          </button>
        ))}
      </div>

      {/* Direction de jeu */}
      <div className="mt-5 flex flex-col gap-2">
        <label htmlFor={ids.style} className="text-[13px] font-medium text-ink">Direction de jeu</label>
        <input
          id={ids.style}
          type="text"
          value={style}
          onChange={(e) => onChangeStyle(e.target.value)}
          placeholder="Ex. : chaleureuse, proche du micro, rythme posé"
          className={inputCls}
        />
        <div className="flex flex-wrap gap-1.5">
          {STYLE_SUGGESTIONS.map((s) => (
            <button key={s.label} type="button" onClick={() => onChangeStyle(s.value)}
              className="h-8 cursor-pointer rounded-full bg-surface-2 px-3 text-[13px] text-ink-2 transition-colors hover:text-ink">
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pied : indicateurs + outils */}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
        <div className="grid grid-cols-3 gap-6 sm:gap-10">
          <Stat label="Mots" value={timing.words} />
          <Stat label="Durée estimée" value={fmtDuration(timing.seconds)} />
          <Stat label="Balises" value={countTags(script)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" icon={<Sparkles />} onClick={polish} loading={polishing} disabled={!script.trim()} title="Ajoute automatiquement respirations et pauses">
            {polishing ? "Amélioration…" : "Rendre plus naturel"}
          </Button>
          <Button size="sm" icon={<Wand2 />} onClick={onOpenDoctor} disabled={!script.trim()}>Coach IA</Button>
          <IconButton label="Ouvrir le prompteur" icon={<MonitorPlay />} variant="secondary" size="sm" onClick={onOpenTeleprompter} />
        </div>
      </div>
    </Card>
  );
};
