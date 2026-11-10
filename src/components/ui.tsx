import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, X, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";

/* ==================================================================
   Bibliothèque de composants VoxStudio (cahier des charges, §5).
   Tous les composants n'utilisent que les jetons sémantiques.
   ================================================================== */

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------- Champs ---------- */
/* fieldBase n'impose ni bordure colorée ni fond : à compléter sans conflit de classes. */
export const fieldBase =
  "w-full rounded-[12px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-2 " +
  "transition-colors focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50";
export const inputCls = `${fieldBase} border-line-strong bg-surface`;

export const Field: React.FC<{ label: string; htmlFor?: string; hint?: React.ReactNode; className?: string; children: React.ReactNode }> = ({
  label, htmlFor, hint, className, children,
}) => (
  <div className={cx("flex flex-col gap-1.5", className)}>
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">{label}</label>
    {children}
    {hint && <span className="text-xs text-ink-2">{hint}</span>}
  </div>
);

/* ---------- Cartes ---------- */
export const Card: React.FC<
  React.HTMLAttributes<HTMLElement> & { as?: "section" | "div" | "article" | "aside"; variant?: "default" | "inner" | "hero" }
> = ({ as = "section", variant = "default", className, children, ...rest }) => {
  const Tag = as as any;
  return (
    <Tag
      className={cx(
        variant === "default" && "rounded-[24px] border border-line bg-surface p-5 shadow-card lg:p-6",
        variant === "inner" && "rounded-[16px] bg-surface-2 p-4",
        variant === "hero" && "hero-card rounded-[24px] p-5 lg:p-6",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export const IconChip: React.FC<{ children: React.ReactNode; tone?: "neutral" | "plain" | "accent" | "hero" | "speakerB"; className?: string }> = ({
  children, tone = "neutral", className,
}) => (
  <span
    aria-hidden="true"
    className={cx(
      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] [&>svg]:h-4 [&>svg]:w-4",
      tone === "neutral" && "bg-surface-2 text-ink",
      tone === "plain" && "bg-surface text-ink",
      tone === "accent" && "bg-accent-soft text-accent-soft-ink",
      tone === "hero" && "bg-white/15 text-white",
      tone === "speakerB" && "bg-speaker-b-soft text-speaker-b",
      className
    )}
  >
    {children}
  </span>
);

export const CardHeader: React.FC<{
  icon?: React.ReactNode; title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode;
  id?: string; tone?: "neutral" | "accent" | "hero"; level?: 2 | 3; className?: string;
}> = ({ icon, title, subtitle, action, id, tone = "neutral", level = 2, className }) => {
  const H = (level === 2 ? "h2" : "h3") as any;
  return (
    <div className={cx("mb-4 flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && <IconChip tone={tone === "hero" ? "hero" : tone}>{icon}</IconChip>}
        <div className="min-w-0">
          <H id={id} className={cx("text-[16px] font-semibold leading-tight", tone === "hero" ? "text-white" : "text-ink")}>{title}</H>
          {subtitle && <p className={cx("mt-0.5 text-[13px]", tone === "hero" ? "text-white/90" : "text-ink-2")}>{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
};

/* ---------- Boutons ---------- */
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "hero" | "onHero";
type BtnSize = "sm" | "md" | "lg";
const btnBase =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap cursor-pointer select-none transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-45 [&>svg]:shrink-0";
const btnVariant: Record<BtnVariant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90",
  hero: "bg-white text-[#14532d] hover:bg-[#ecfdf3]",
  onHero: "border border-white/40 text-white hover:bg-white/10",
};
const btnSize: Record<BtnSize, string> = {
  sm: "h-9 rounded-[10px] px-3 text-[13px] [&>svg]:h-4 [&>svg]:w-4",
  md: "h-11 rounded-[12px] px-4 text-sm [&>svg]:h-4 [&>svg]:w-4",
  lg: "h-14 rounded-[16px] px-6 text-base [&>svg]:h-5 [&>svg]:w-5",
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize; icon?: React.ReactNode; loading?: boolean }
>(({ variant = "secondary", size = "md", icon, loading, className, children, disabled, type = "button", ...rest }, ref) => (
  <button
    ref={ref}
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={cx(btnBase, btnVariant[variant], btnSize[size], className)}
    {...rest}
  >
    {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : icon}
    {children}
  </button>
));
Button.displayName = "Button";

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    label: string; icon: React.ReactNode; variant?: "ghost" | "secondary" | "primary" | "dock" | "danger"; size?: "sm" | "md"; active?: boolean;
  }
>(({ label, icon, variant = "ghost", size = "md", active, className, type = "button", ...rest }, ref) => (
  <button
    ref={ref}
    type={type}
    aria-label={label}
    title={label}
    className={cx(
      "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
      size === "sm" ? "h-9 w-9 [&>svg]:h-4 [&>svg]:w-4" : "h-10 w-10 [&>svg]:h-[18px] [&>svg]:w-[18px]",
      variant === "ghost" && (active ? "bg-accent-soft text-accent-soft-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink"),
      variant === "secondary" && "border border-line-strong bg-surface text-ink hover:bg-surface-2",
      variant === "primary" && "bg-accent text-accent-ink hover:bg-accent-hover",
      variant === "danger" && "text-ink-2 hover:bg-danger-soft hover:text-danger",
      variant === "dock" && (active ? "bg-dock-accent/15 text-dock-accent" : "text-dock-ink-2 hover:bg-dock-2 hover:text-dock-ink"),
      className
    )}
    {...rest}
  >
    {icon}
  </button>
));
IconButton.displayName = "IconButton";

/* ---------- Badge ---------- */
export const Badge: React.FC<{ tone?: "neutral" | "accent" | "warning" | "danger" | "speakerB" | "hero"; children: React.ReactNode; className?: string }> = ({
  tone = "neutral", children, className,
}) => (
  <span
    className={cx(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular [&>svg]:h-3 [&>svg]:w-3",
      tone === "neutral" && "bg-surface-2 text-ink-2",
      tone === "accent" && "bg-accent-soft text-accent-soft-ink",
      tone === "warning" && "bg-warning-soft text-warning",
      tone === "danger" && "bg-danger-soft text-danger",
      tone === "speakerB" && "bg-speaker-b-soft text-speaker-b",
      tone === "hero" && "bg-white/15 text-white",
      className
    )}
  >
    {children}
  </span>
);

/* ---------- Statistique ---------- */
export const Stat: React.FC<{ label: string; value: React.ReactNode; badge?: React.ReactNode; size?: "sm" | "lg"; onHero?: boolean; className?: string }> = ({
  label, value, badge, size = "sm", onHero, className,
}) => (
  <div className={cx("min-w-0", className)}>
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={cx("tabular font-semibold tracking-tight", size === "lg" ? "text-[34px] leading-none" : "text-[20px] leading-tight", onHero ? "text-white" : "text-ink")}>
        {value}
      </span>
      {badge}
    </div>
    <div className={cx("mt-1 text-xs", onHero ? "text-white/90" : "text-ink-2")}>{label}</div>
  </div>
);

/* ---------- Jauge demi-cercle ---------- */
export const Gauge: React.FC<{ value: number; max: number; label: string; valueText: string; children?: React.ReactNode }> = ({
  value, max, label, valueText, children,
}) => {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const over = max > 0 && value > max;
  const r = 80, c = Math.PI * r;
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} aria-valuetext={valueText} className="relative mx-auto w-full max-w-[208px]">
      <svg viewBox="0 0 200 112" className="block w-full" aria-hidden="true">
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={over ? "#fde68a" : "#ffffff"} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${c * ratio} ${c}`} style={{ transition: "stroke-dasharray 300ms ease" }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center">{children}</div>
    </div>
  );
};

/* ---------- Sélecteur segmenté (radiogroup) ---------- */
export function Segmented<T extends string>({
  value, options, onChange, label, size = "md", tone = "default", className, fullWidth,
}: {
  value: T; options: { value: T; label: React.ReactNode; icon?: React.ReactNode; title?: string }[]; onChange: (v: T) => void;
  label: string; size?: "sm" | "md"; tone?: "default" | "hero" | "dock"; className?: string; fullWidth?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = options.findIndex((o) => o.value === value);
  const onKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (Math.max(0, idx) + d + options.length) % options.length;
    onChange(options[n].value);
    refs.current[n]?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKey}
      className={cx(
        "inline-flex items-center gap-0.5 rounded-full p-1",
        tone === "default" && "bg-surface-2",
        tone === "hero" && "bg-black/20",
        tone === "dock" && "bg-dock-2",
        fullWidth && "flex w-full",
        className
      )}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (idx < 0 && i === 0) ? 0 : -1}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cx(
              "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors [&>svg]:h-4 [&>svg]:w-4",
              size === "sm" ? "h-8 text-[13px]" : "h-9 text-[13px]",
              fullWidth ? "min-w-0 flex-1 px-2" : size === "sm" ? "px-3" : "px-4",
              tone === "default" && (on ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface-3 hover:text-ink"),
              tone === "hero" && (on ? "bg-white text-[#14532d]" : "text-white/90 hover:text-white"),
              tone === "dock" && (on ? "bg-dock-ink text-dock" : "text-dock-ink-2 hover:text-dock-ink")
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Carte de choix (bouton à état) ---------- */
export const ChoiceCard: React.FC<{
  selected: boolean; onClick: () => void; title: React.ReactNode; desc?: React.ReactNode; icon?: React.ReactNode;
  aside?: React.ReactNode; footer?: React.ReactNode; disabled?: boolean; className?: string; ariaLabel?: string;
}> = ({ selected, onClick, title, desc, icon, aside, footer, disabled, className, ariaLabel }) => (
  <div
    className={cx(
      "relative flex flex-col rounded-[16px] border-2 transition-colors",
      selected ? "border-accent bg-accent-soft/50" : "border-transparent bg-surface-2 hover:border-line-strong/50",
      disabled && "opacity-50",
      className
    )}
  >
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className="flex w-full flex-1 cursor-pointer items-start gap-3 rounded-[14px] p-3.5 pr-12 text-left disabled:cursor-not-allowed"
    >
      {icon && <IconChip tone={selected ? "accent" : "plain"}>{icon}</IconChip>}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        {desc && <span className="mt-0.5 block text-[13px] leading-snug text-ink-2">{desc}</span>}
      </span>
    </button>
    {selected ? (
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-ink">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    ) : null}
    {aside && <div className="absolute right-2 bottom-2">{aside}</div>}
    {footer && <div className="px-3.5 pb-3.5">{footer}</div>}
  </div>
);

/* ---------- Interrupteur ---------- */
export const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; className?: string }> = ({
  checked, onChange, label, description, className,
}) => {
  const id = useId();
  return (
    <div className={cx("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0">
        <div id={`${id}-l`} className="text-sm font-medium text-ink">{label}</div>
        {description && <div id={`${id}-d`} className="text-[13px] text-ink-2">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        aria-describedby={description ? `${id}-d` : undefined}
        onClick={() => onChange(!checked)}
        className={cx("relative h-7 w-12 shrink-0 cursor-pointer rounded-full border transition-colors", checked ? "border-accent bg-accent" : "border-line-strong bg-surface-3")}
      >
        <span className={cx("absolute top-[3px] h-5 w-5 rounded-full shadow transition-all", checked ? "left-[24px] bg-accent-ink" : "left-[3px] bg-surface")} />
      </button>
    </div>
  );
};

/* ---------- Curseur ---------- */
export const Slider: React.FC<{
  value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void;
  label?: string; valueText?: string; className?: string; tone?: "default" | "dock";
}> = ({ value, min = 0, max = 1, step = 0.05, onChange, label, valueText, className = "", tone = "default" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const clamp = (v: number) => Math.min(max, Math.max(min, +(Math.round(v / step) * step).toFixed(4)));
  const fromX = (x: number) => {
    const r = ref.current!.getBoundingClientRect();
    onChange(clamp(min + ((x - r.left) / r.width) * (max - min)));
  };
  const dock = tone === "dock";
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      className={cx("relative flex h-6 w-full cursor-pointer touch-none select-none items-center rounded-full", className)}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); fromX(e.clientX); }}
      onPointerMove={(e) => { if (e.buttons) fromX(e.clientX); }}
      onKeyDown={(e) => {
        const big = (max - min) / 10;
        let v: number | null = null;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") v = value + step;
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") v = value - step;
        else if (e.key === "PageUp") v = value + big;
        else if (e.key === "PageDown") v = value - big;
        else if (e.key === "Home") v = min;
        else if (e.key === "End") v = max;
        if (v !== null) { e.preventDefault(); onChange(clamp(v)); }
      }}
    >
      <div className={cx("relative h-1.5 w-full rounded-full", dock ? "bg-dock-2" : "bg-surface-3")}>
        <div className={cx("absolute inset-y-0 left-0 rounded-full", dock ? "bg-dock-ink" : "bg-accent")} style={{ width: `${pct}%` }} />
      </div>
      <div
        className={cx("absolute -ml-2 h-4 w-4 rounded-full border-2", dock ? "border-dock bg-dock-ink" : "border-surface bg-accent shadow")}
        style={{ left: `${pct}%` }}
      />
    </div>
  );
};

/* ---------- Liste déroulante ---------- */
export const Select: React.FC<{
  value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; label?: string; className?: string; id?: string;
}> = ({ value, options, onChange, label, className = "", id }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const listId = useId();
  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    const d = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", d);
    return () => document.removeEventListener("mousedown", d);
  }, [open]);
  const cur = options.find((o) => o.value === value);
  const choose = (v: string) => { onChange(v); setOpen(false); btn.current?.focus(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); } return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    }
    if ((e.key === "Enter" || e.key === " ") && open) { e.preventDefault(); choose(options[active].value); }
  };
  return (
    <div className={cx("relative", className)} ref={ref} onKeyDown={onKey}>
      <button
        ref={btn}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-[12px] border border-line-strong bg-surface px-3.5 text-left text-[13px] font-medium text-ink hover:bg-surface-2"
      >
        <span className="truncate">{cur?.label ?? value}</span>
        <ChevronDown className={cx("h-4 w-4 shrink-0 text-ink-2 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div id={listId} role="listbox" aria-label={label} className="animate-fade-up absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-[16px] border border-line bg-surface p-1.5 shadow-pop">
          {options.map((o, i) => (
            <div
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o.value)}
              className={cx("flex cursor-pointer items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-[13px] text-ink", i === active && "bg-surface-2")}
            >
              <span className="truncate">{o.label}</span>
              {o.value === value && <Check className="h-4 w-4 text-accent" aria-hidden="true" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Menu simple (bouton + liste d'actions) ---------- */
export const MenuButton: React.FC<{
  label: string; icon?: React.ReactNode; items: { id: string; label: string; desc?: string; onSelect: () => void }[];
  align?: "left" | "right"; buttonClassName?: string; size?: BtnSize;
}> = ({ label, icon, items, align = "right", buttonClassName, size = "sm" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const d = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", d);
    setTimeout(() => (ref.current?.querySelector('[role="menuitem"]') as HTMLElement | null)?.focus(), 0);
    return () => document.removeEventListener("mousedown", d);
  }, [open]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); btn.current?.focus(); return; }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const els = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') || []);
    const i = els.indexOf(document.activeElement as HTMLElement);
    els[(i + (e.key === "ArrowDown" ? 1 : -1) + els.length) % els.length]?.focus();
  };
  return (
    <div className="relative" ref={ref} onKeyDown={onKey}>
      <Button ref={btn} size={size} variant="secondary" icon={icon} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)} className={buttonClassName}>
        {label}
        <ChevronDown className={cx("h-4 w-4 text-ink-2 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </Button>
      {open && (
        <div id={menuId} role="menu" aria-label={label} className={cx("animate-fade-up absolute top-full z-50 mt-2 w-72 max-w-[calc(100vw-32px)] rounded-[16px] border border-line bg-surface p-1.5 shadow-pop", align === "right" ? "right-0" : "left-0")}>
          {items.map((it) => (
            <button key={it.id} type="button" role="menuitem" tabIndex={-1}
              onClick={() => { it.onSelect(); setOpen(false); btn.current?.focus(); }}
              className="block w-full cursor-pointer rounded-[10px] px-3 py-2 text-left hover:bg-surface-2 focus:bg-surface-2 focus-visible:outline-none">
              <span className="block text-[13px] font-semibold text-ink">{it.label}</span>
              {it.desc && <span className="block text-xs text-ink-2">{it.desc}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Boîte de dialogue (focus piégé, Échap, retour du focus) ---------- */
const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export const Dialog: React.FC<{
  open: boolean; onClose: () => void; title: string; description?: React.ReactNode; icon?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full"; children: React.ReactNode; footer?: React.ReactNode; hideHeader?: boolean;
}> = ({ open, onClose, title, description, icon, size = "md", children, footer, hideHeader }) => {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useLayoutEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") || panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first || panel.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const els = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!els.length) return;
      const a = els[0], z = els[els.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  const full = size === "full";
  return createPortal(
    <div
      className={cx("fixed inset-0 z-[80] flex bg-black/55 backdrop-blur-[2px]", full ? "" : "items-end justify-center p-0 sm:items-center sm:p-4")}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cx(
          "animate-fade-up flex flex-col bg-surface text-ink focus:outline-none",
          full ? "h-full w-full" : "max-h-[92vh] w-full rounded-t-[24px] border border-line shadow-pop sm:rounded-[24px]",
          size === "sm" && "sm:max-w-md",
          size === "md" && "sm:max-w-2xl",
          size === "lg" && "sm:max-w-4xl"
        )}
      >
        <div className={cx("flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6", hideHeader && "sr-only")}>
          <div className="flex min-w-0 items-center gap-3">
            {icon && <IconChip tone="accent">{icon}</IconChip>}
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold leading-tight">{title}</h2>
              {description && <p id={descId} className="mt-0.5 text-[13px] text-ink-2">{description}</p>}
            </div>
          </div>
          <IconButton label="Fermer" icon={<X />} onClick={onClose} variant="secondary" />
        </div>
        <div className={cx("min-h-0 flex-1 overflow-y-auto", full ? "" : "px-5 py-5 sm:px-6")}>{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean; title: string; message: React.ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}> = ({ open, title, message, confirmLabel, onConfirm, onCancel }) => (
  <Dialog
    open={open}
    onClose={onCancel}
    title={title}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onCancel} data-autofocus>Annuler</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
      </>
    }
  >
    <p className="text-sm text-ink-2">{message}</p>
  </Dialog>
);

/* ---------- État vide ---------- */
export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode; compact?: boolean }> = ({
  icon, title, text, action, compact,
}) => (
  <div className={cx("flex flex-col items-center justify-center text-center", compact ? "gap-2 py-6" : "gap-3 py-12")}>
    <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-2 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
    <div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-[13px] text-ink-2">{text}</p>}
    </div>
    {action}
  </div>
);

/* ---------- Notifications ---------- */
export type Toast = { id: number; kind: "success" | "error" | "info"; message: string; action?: { label: string; onClick: () => void } };

export const Toasts: React.FC<{ toasts: Toast[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => {
  const polite = toasts.filter((t) => t.kind !== "error");
  const urgent = toasts.filter((t) => t.kind === "error");
  const render = (t: Toast) => (
    <div key={t.id} className="animate-fade-up pointer-events-auto flex w-full items-start gap-3 rounded-[16px] border border-line bg-surface p-3.5 text-sm text-ink shadow-pop">
      {t.kind === "success" && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />}
      {t.kind === "error" && <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />}
      {t.kind === "info" && <Info className="mt-0.5 h-5 w-5 shrink-0 text-ink-2" aria-hidden="true" />}
      <div className="min-w-0 flex-1">
        <p className="leading-snug">{t.message}</p>
        {t.action && (
          <button type="button" onClick={() => { t.action!.onClick(); onDismiss(t.id); }} className="mt-1.5 cursor-pointer text-[13px] font-semibold text-accent underline-offset-2 hover:underline">
            {t.action.label}
          </button>
        )}
      </div>
      <IconButton label="Fermer la notification" icon={<X />} size="sm" onClick={() => onDismiss(t.id)} className="-m-1" />
    </div>
  );
  return (
    <div className="pointer-events-none fixed right-4 bottom-[156px] z-[90] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2 md:bottom-[104px]">
      <div aria-live="polite" role="status" className="flex flex-col gap-2">{polite.map(render)}</div>
      <div aria-live="assertive" role="alert" className="flex flex-col gap-2">{urgent.map(render)}</div>
    </div>
  );
};
