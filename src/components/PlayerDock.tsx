import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Play, Pause, Rewind, FastForward, Repeat, Volume2, VolumeX, Download, FileAudio } from "lucide-react";
import { formatTimecode, extractWaveformData, buildMasteringNodes, renderMasteredAudioBlob, createAmbientSynthesizer } from "../utils/audio";
import { StudioSettings } from "../types";
import { IconButton, Segmented, Slider, cx } from "./ui";

export interface PlayerHandle { togglePlay: () => void; playWhenReady: () => void; }

interface PlayerDockProps {
  audioUrl: string | null;
  title: string;
  voiceName: string;
  settings: StudioSettings;
  onChangeSpeed: (spd: number) => void;
  onNotify: (kind: "success" | "error", msg: string) => void;
  onPlayingChange?: (playing: boolean) => void;
}

const SPEEDS = ["0.8", "1", "1.2", "1.5"] as const;

/* Lecteur fixe, monté en permanence : il porte le graphe Web Audio (mixage temps réel). */
export const PlayerDock = forwardRef<PlayerHandle, PlayerDockProps>(({ audioUrl, title, voiceName, settings, onChangeSpeed, onNotify, onPlayingChange }, handle) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const masteringChainRef = useRef<ReturnType<typeof buildMasteringNodes> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ambientSynthRef = useRef<{ stop: () => void } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [bypass, setBypass] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [width, setWidth] = useState(600);

  const has = !!audioUrl;
  const pendingPlay = useRef(false);
  useEffect(() => { onPlayingChange?.(isPlaying); }, [isPlaying]);

  useEffect(() => {
    if (!audioUrl) return;
    let alive = true;
    extractWaveformData(audioUrl, 160).then(({ peaks: p, duration: d }) => {
      if (!alive) return;
      setPeaks(p);
      if (d > 0) setDuration(d);
    });
    setIsPlaying(false);
    setCurrentTime(0);
    return () => { alive = false; };
  }, [audioUrl]);

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = settings.speed; }, [settings.speed, audioUrl]);

  // Graphe Web Audio : source → (mastering) → analyseur → sortie
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (!sourceNodeRef.current || (sourceNodeRef.current as any).mediaElement !== el) {
        sourceNodeRef.current = ctx.createMediaElementSource(el);
      }
      if (!analyserRef.current) {
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;
      }
      const mastering = buildMasteringNodes(ctx, settings);
      masteringChainRef.current = mastering;
      try { sourceNodeRef.current.disconnect(); } catch {}
      if (bypass || !settings.masteringEnabled) {
        sourceNodeRef.current.connect(analyserRef.current);
      } else {
        sourceNodeRef.current.connect(mastering.inputNode);
        mastering.outputNode.connect(analyserRef.current);
      }
      analyserRef.current.connect(ctx.destination);
    } catch (err) {
      console.error("Audio graph setup error:", err);
    }
    return () => { ambientSynthRef.current?.stop(); ambientSynthRef.current = null; };
  }, [audioUrl, bypass, settings.masteringEnabled]);

  useEffect(() => { masteringChainRef.current?.updateSettings(settings); }, [settings]);

  const stopAmbient = () => { ambientSynthRef.current?.stop(); ambientSynthRef.current = null; };

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    if (audioCtxRef.current?.state === "suspended") await audioCtxRef.current.resume();
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      stopAmbient();
      return;
    }
    try {
      await el.play();
      setIsPlaying(true);
      if (settings.ambientTrack !== "none" && audioCtxRef.current) {
        stopAmbient();
        const synth = createAmbientSynthesizer(audioCtxRef.current, settings.ambientTrack);
        synth.outputNode.gain.setValueAtTime(Math.max(0.04, settings.ambientVolume * 0.18), audioCtxRef.current.currentTime);
        synth.outputNode.connect(audioCtxRef.current.destination);
        ambientSynthRef.current = synth;
      }
    } catch (e) {
      console.error("Playback error:", e);
    }
  };

  useImperativeHandle(handle, () => ({ togglePlay, playWhenReady: () => { pendingPlay.current = true; } }));

  const onTime = () => {
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
    if (el.duration && !isNaN(el.duration) && isFinite(el.duration)) setDuration(el.duration);
  };
  const onEnded = () => {
    if (isLooping && audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); return; }
    setIsPlaying(false);
    setCurrentTime(0);
    stopAmbient();
  };
  const seek = (t: number) => {
    if (!audioRef.current || !duration) return;
    const n = Math.max(0, Math.min(duration, t));
    audioRef.current.currentTime = n;
    setCurrentTime(n);
  };
  const setVol = (v: number) => { setVolume(v); setIsMuted(v === 0); if (audioRef.current) audioRef.current.volume = v; };
  const toggleMute = () => {
    const m = !isMuted;
    setIsMuted(m);
    if (audioRef.current) audioRef.current.volume = m ? 0 : volume || 1;
    if (!m && volume === 0) setVolume(1);
  };

  // Taille réelle du canvas (netteté sur écrans haute densité)
  useEffect(() => {
    const el = waveRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [has]);

  // Rendu de la forme d'onde
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const H = 40;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.round(H * dpr);
    let raf = 0;
    const freq = new Uint8Array(64);
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, H);
      const progress = duration > 0 ? currentTime / duration : 0;
      if (analyserRef.current && isPlaying) analyserRef.current.getByteFrequencyData(freq);
      const n = Math.max(40, Math.floor(width / 4));
      const bw = width / n;
      for (let i = 0; i < n; i++) {
        const src = peaks.length ? peaks[Math.floor((i / n) * peaks.length)] : 0.18;
        let p = Math.max(0.08, src ?? 0.18);
        const frac = i / n;
        if (isPlaying && Math.abs(frac - progress) < 0.03) p = Math.min(1, p * 0.7 + ((freq[i % 32] || 0) / 255) * 0.6);
        const h = Math.max(3, p * H * 0.92);
        ctx.fillStyle = frac <= progress ? (bypass ? "#e5e7eb" : "#4ade80") : "#3d4245";
        ctx.beginPath();
        ctx.roundRect(i * bw + 0.5, (H - h) / 2, Math.max(1.5, bw - 1.5), h, 1.5);
        ctx.fill();
      }
      if (hoverTime !== null && duration > 0) {
        ctx.fillStyle = "rgba(255,255,255,.6)";
        ctx.fillRect((hoverTime / duration) * width, 0, 1, H);
      }
      if (isPlaying) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [peaks, currentTime, duration, hoverTime, isPlaying, bypass, width]);

  const fracFromEvent = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  };

  const fileBase = `voxstudio_${voiceName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const downloadRaw = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `${fileBase}_brut_${Date.now()}.wav`;
    document.body.appendChild(a); a.click(); a.remove();
  };
  const exportMaster = async () => {
    if (!audioUrl) return;
    setExporting(true);
    try {
      const blob = await renderMasteredAudioBlob(audioUrl, settings);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileBase}_master_${Date.now()}.wav`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      onNotify("success", "Fichier WAV exporté avec le mixage appliqué.");
    } catch (err) {
      console.error("Erreur export master:", err);
      onNotify("error", "L'export avec mixage a échoué : la version brute a été téléchargée à la place.");
      downloadRaw();
    } finally {
      setExporting(false);
    }
  };

  const speedValue = (SPEEDS.find((s) => Number(s) === settings.speed) ?? "1") as (typeof SPEEDS)[number];

  return (
    <section
      aria-label="Lecteur"
      className="dock fixed inset-x-0 bottom-16 z-30 border-t border-white/5 bg-dock text-dock-ink md:bottom-0 md:left-[72px] xl:left-[240px]"
    >
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} crossOrigin="anonymous" onTimeUpdate={onTime} onEnded={onEnded} onLoadedMetadata={onTime} onCanPlay={() => { if (pendingPlay.current) { pendingPlay.current = false; togglePlay(); } }} />
      )}
      <div className="mx-auto flex h-[88px] max-w-[1320px] items-center gap-3 px-3 sm:px-6 lg:gap-5 lg:px-8">
        {/* Transport */}
        <div className="flex items-center gap-1">
          <span className="hidden sm:contents"><IconButton label="Reculer de 3 secondes" icon={<Rewind />} variant="dock" disabled={!has} onClick={() => seek(currentTime - 3)} /></span>
          <button
            type="button"
            onClick={togglePlay}
            disabled={!has}
            aria-label={isPlaying ? "Pause" : "Lecture"}
            title={isPlaying ? "Pause (Espace)" : "Lecture (Espace)"}
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-dock-ink text-dock transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
          </button>
          <span className="hidden sm:contents"><IconButton label="Avancer de 3 secondes" icon={<FastForward />} variant="dock" disabled={!has} onClick={() => seek(currentTime + 3)} /></span>
          <span className="hidden lg:contents"><IconButton label={isLooping ? "Désactiver la boucle" : "Lire en boucle"} icon={<Repeat />} variant="dock" active={isLooping} aria-pressed={isLooping} disabled={!has} onClick={() => setIsLooping((l) => !l)} /></span>
        </div>

        {/* Titre + forme d'onde */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <p className="truncate text-[13px] font-semibold">{has ? title : "Aucune prise chargée"}</p>
            <p className="tabular shrink-0 text-xs text-dock-ink-2">
              <span className="text-dock-ink">{formatTimecode(currentTime)}</span> / {formatTimecode(duration)}
            </p>
          </div>
          {has ? (
            <div
              ref={waveRef}
              role="slider"
              tabIndex={0}
              aria-label="Position de lecture"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(currentTime)}
              aria-valuetext={`${formatTimecode(currentTime)} sur ${formatTimecode(duration)}`}
              className="relative h-10 cursor-pointer rounded-[6px]"
              onClick={(e) => seek(fracFromEvent(e) * duration)}
              onMouseMove={(e) => duration && setHoverTime(fracFromEvent(e) * duration)}
              onMouseLeave={() => setHoverTime(null)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") { e.preventDefault(); seek(currentTime + 1); }
                if (e.key === "ArrowLeft") { e.preventDefault(); seek(currentTime - 1); }
                if (e.key === "Home") { e.preventDefault(); seek(0); }
                if (e.key === "End") { e.preventDefault(); seek(duration); }
              }}
            >
              <canvas ref={canvasRef} aria-hidden="true" className="block h-10 w-full" />
              {hoverTime !== null && duration > 0 && (
                <span className="tabular pointer-events-none absolute -top-6 -translate-x-1/2 rounded-md bg-dock-2 px-1.5 py-0.5 text-xs" style={{ left: `${(hoverTime / duration) * 100}%` }}>
                  {formatTimecode(hoverTime)}
                </span>
              )}
            </div>
          ) : (
            <p className="flex h-10 items-center text-xs text-dock-ink-2">Générez une voix dans Studio pour l'écouter ici.</p>
          )}
        </div>

        {/* Outils */}
        <div className="flex items-center gap-2">
          <div className="hidden 2xl:block"><Segmented
            label="Vitesse de lecture"
            tone="dock"
            size="sm"
            value={speedValue}
            onChange={(v) => onChangeSpeed(Number(v))}
            options={SPEEDS.map((s) => ({ value: s, label: `${s.replace(".", ",")}×` }))}
          /></div>
          <button
            type="button"
            onClick={() => setBypass((b) => !b)}
            disabled={!has}
            aria-pressed={!bypass}
            title="Comparer avec et sans le mixage"
            className={cx(
              "hidden h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex",
              bypass ? "bg-dock-2 text-dock-ink-2" : "bg-dock-accent/15 text-dock-accent"
            )}
          >
            <span aria-hidden="true" className={cx("h-2 w-2 rounded-full", bypass ? "bg-dock-ink-2" : "bg-dock-accent")} />
            {bypass ? "Brut" : "Mixé"}
          </button>
          <div className="hidden items-center gap-1 lg:flex">
            <IconButton label={isMuted || volume === 0 ? "Rétablir le son" : "Couper le son"} icon={isMuted || volume === 0 ? <VolumeX /> : <Volume2 />} variant="dock" onClick={toggleMute} />
            <Slider tone="dock" className="!w-20" label="Volume" min={0} max={1} step={0.05} value={isMuted ? 0 : volume} valueText={`${Math.round((isMuted ? 0 : volume) * 100)} %`} onChange={setVol} />
          </div>
          <span className="hidden md:contents"><IconButton label="Télécharger la version brute (WAV)" icon={<FileAudio />} variant="dock" disabled={!has} onClick={downloadRaw} /></span>
          <button
            type="button"
            onClick={exportMaster}
            disabled={!has || exporting}
            aria-busy={exporting || undefined}
            title="Exporter en WAV avec le mixage appliqué"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[12px] bg-dock-accent px-3 text-[13px] font-semibold text-[#0b1f14] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{exporting ? "Export…" : "Exporter"}</span>
            <span className="sr-only sm:hidden">Exporter</span>
          </button>
        </div>
      </div>
    </section>
  );
});
PlayerDock.displayName = "PlayerDock";
