import { Slider } from "./ui";
import React, { useRef, useState, useEffect } from "react";
import { formatTimecode, extractWaveformData, buildMasteringNodes, renderMasteredAudioBlob, createAmbientSynthesizer } from "../utils/audio";
import { StudioSettings } from "../types";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Repeat,
  Radio,
  FastForward,
  Rewind,
  Sparkles,
  Sliders,
  Check,
  Disc,
  Activity,
  Layers,
} from "lucide-react";

interface AudioWaveformVisualizerProps {
  audioUrl: string | null;
  audioBase64: string | null;
  voiceName: string;
  styleDescription: string;
  modelName: string;
  settings: StudioSettings;
  onChangeSpeed: (spd: number) => void;
  onToggleMastering?: (val: boolean) => void;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  audioUrl,
  audioBase64,
  voiceName,
  styleDescription,
  modelName,
  settings,
  onChangeSpeed,
  onToggleMastering,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Web Audio mastering state
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const masteringChainRef = useRef<ReturnType<typeof buildMasteringNodes> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ambientSynthRef = useRef<{ stop: () => void } | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isBypassDsp, setIsBypassDsp] = useState(false);
  const [isExportingMaster, setIsExportingMaster] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Load and decode waveform peaks whenever audioUrl changes
  useEffect(() => {
    if (!audioUrl) return;

    let isMounted = true;
    extractWaveformData(audioUrl, 160).then(({ peaks: extractedPeaks, duration: decodedDuration }) => {
      if (isMounted) {
        setPeaks(extractedPeaks);
        if (decodedDuration > 0) {
          setDuration(decodedDuration);
        }
      }
    });

    setIsPlaying(false);
    setCurrentTime(0);

    return () => {
      isMounted = false;
    };
  }, [audioUrl]);

  // Sync audio element speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.speed;
    }
  }, [settings.speed]);

  // Setup Web Audio mastering graph
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const setupAudioGraph = () => {
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (!sourceNodeRef.current) {
          sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(audioEl);
        }

        // Create Analyser for real-time spectrum and VU meter
        if (!analyserRef.current) {
          analyserRef.current = audioCtxRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          analyserRef.current.smoothingTimeConstant = 0.8;
        }

        // Build mastering DSP
        const mastering = buildMasteringNodes(audioCtxRef.current, settings);
        masteringChainRef.current = mastering;

        // Disconnect previous graph safely
        try {
          sourceNodeRef.current.disconnect();
        } catch {}

        if (isBypassDsp || !settings.masteringEnabled) {
          // Bypass: direct to analyser & destination
          sourceNodeRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioCtxRef.current.destination);
        } else {
          // Processed through studio mastering rack
          sourceNodeRef.current.connect(mastering.inputNode);
          mastering.outputNode.connect(analyserRef.current);
          analyserRef.current.connect(audioCtxRef.current.destination);
        }
      } catch (err) {
        console.error("Audio graph setup error:", err);
      }
    };

    setupAudioGraph();

    return () => {
      if (ambientSynthRef.current) {
        ambientSynthRef.current.stop();
        ambientSynthRef.current = null;
      }
    };
  }, [audioUrl, isBypassDsp, settings.masteringEnabled]);

  // Update dynamic mastering parameters when settings change
  useEffect(() => {
    if (masteringChainRef.current) {
      masteringChainRef.current.updateSettings(settings);
    }
  }, [settings]);

  // Play / Pause handler with ambient background ducking
  const togglePlay = async () => {
    if (!audioRef.current || !audioUrl) return;

    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (ambientSynthRef.current) {
        ambientSynthRef.current.stop();
        ambientSynthRef.current = null;
      }
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);

        // Start ambient bed if configured
        if (settings.ambientTrack !== "none" && audioCtxRef.current) {
          if (ambientSynthRef.current) {
            ambientSynthRef.current.stop();
          }
          const synth = createAmbientSynthesizer(audioCtxRef.current, settings.ambientTrack);
          // Ducking: lower ambient bed volume (-14dB) behind vocals
          const duckedVolume = Math.max(0.04, settings.ambientVolume * 0.18);
          synth.outputNode.gain.setValueAtTime(duckedVolume, audioCtxRef.current.currentTime);
          synth.outputNode.connect(audioCtxRef.current.destination);
          ambientSynthRef.current = synth;
        }
      } catch (e) {
        console.error("Playback error:", e);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    if (isLooping && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
      if (ambientSynthRef.current) {
        ambientSynthRef.current.stop();
        ambientSynthRef.current = null;
      }
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const skipTime = (delta: number) => {
    if (audioRef.current) {
      const nextTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + delta));
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVol;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume;
    }
  };

  // Real-time animation loop: draws waveform + live frequency spectrum & VU meter
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;
    const frequencyData = new Uint8Array(64);

    const renderFrame = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const progress = duration > 0 ? currentTime / duration : 0;
      const hoverProgress = hoverTime !== null && duration > 0 ? hoverTime / duration : null;

      // Extract real-time frequency data if playing
      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(frequencyData);
      }

      // Draw subtle background grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      for (let y = 15; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 1. Draw Waveform Bars
      const barCount = peaks.length > 0 ? peaks.length : 140;
      const barWidth = width / barCount;
      const centerY = height / 2;

      for (let i = 0; i < barCount; i++) {
        let peak = peaks[i] !== undefined ? Math.max(0.08, peaks[i]) : 0.2;

        // If currently playing at this position, modulate bar height with real-time frequency energy
        const barFrac = i / barCount;
        if (isPlaying && Math.abs(barFrac - progress) < 0.04) {
          const freqIndex = Math.min(frequencyData.length - 1, Math.floor((i % 32)));
          const dynamicBoost = (frequencyData[freqIndex] || 0) / 255;
          peak = Math.min(1.0, peak * 0.7 + dynamicBoost * 0.6);
        }

        const barHeight = Math.max(4, peak * (height * 0.8));
        const x = i * barWidth;

        // Color based on playback progress
        if (barFrac <= progress) {
          const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
          if (isBypassDsp) {
            // Cool cyan when bypassing DSP
            gradient.addColorStop(0, "#38bdf8");
            gradient.addColorStop(0.5, "#0284c7");
            gradient.addColorStop(1, "#0369a1");
          } else {
            // Warm golden amber when hyper-realism mastering is active
            gradient.addColorStop(0, "#fde68a");
            gradient.addColorStop(0.4, "#f59e0b");
            gradient.addColorStop(1, "#b45309");
          }
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = "#27272a";
        }

        const topY = centerY - barHeight / 2;
        const radius = Math.min(barWidth * 0.35, 2);
        ctx.beginPath();
        ctx.roundRect(x + 1, topY, Math.max(1.5, barWidth - 1.5), barHeight, radius);
        ctx.fill();
      }

      // 2. Draw Playhead line with glow
      if (duration > 0) {
        const playheadX = progress * width;
        ctx.strokeStyle = isBypassDsp ? "#38bdf8" : "#fbbf24";
        ctx.lineWidth = 2;
        ctx.shadowColor = isBypassDsp ? "rgba(56, 189, 248, 0.6)" : "rgba(251, 191, 36, 0.6)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Playhead handle
        ctx.fillStyle = isBypassDsp ? "#38bdf8" : "#fbbf24";
        ctx.beginPath();
        ctx.arc(playheadX, 6, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Hover indicator
      if (hoverProgress !== null) {
        const hoverX = hoverProgress * width;
        ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hoverX, 0);
        ctx.lineTo(hoverX, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [peaks, currentTime, duration, hoverTime, isPlaying, isBypassDsp]);

  // Scrub click on waveform canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioRef.current || duration === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const frac = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = frac * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (duration === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const frac = Math.max(0, Math.min(1, moveX / rect.width));
    setHoverTime(frac * duration);
  };

  const handleCanvasMouseLeave = () => {
    setHoverTime(null);
  };

  // Export Master Studio WAV (with full EQ & Compression baked in)
  const handleExportMaster = async () => {
    if (!audioUrl) return;
    setIsExportingMaster(true);
    setExportSuccess(null);

    try {
      const masteredBlob = await renderMasteredAudioBlob(audioUrl, settings);
      const masteredUrl = URL.createObjectURL(masteredBlob);

      const a = document.createElement("a");
      a.href = masteredUrl;
      const cleanVoice = voiceName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      a.download = `voxstudio_${cleanVoice}_master_hyper_realiste_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(masteredUrl), 2000);
      setExportSuccess("Master Studio HD exporté avec succès !");
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error("Erreur export master:", err);
      // Fallback: download raw
      handleDownloadRaw();
    } finally {
      setIsExportingMaster(false);
    }
  };

  // Direct Raw AI WAV download
  const handleDownloadRaw = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    const cleanVoice = voiceName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    a.download = `voxstudio_${cleanVoice}_raw_ai_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-zinc-900 rounded-[28px] p-5 sm:p-6 flex flex-col gap-4">
      {/* Hidden audio element with crossOrigin for Web Audio graph processing */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={handleTimeUpdate}
        />
      )}

      {/* Top Bar: Take metadata & Realism Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-100">
                Master Voix : {voiceName || "Voix Studio"}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                Ultra-Réaliste
              </span>
            </div>
            <p className="text-xs text-zinc-400 line-clamp-1">{styleDescription || "Rendu Studio Haute Fidélité"}</p>
          </div>
        </div>

        {/* Real-time A/B Switch: Master Studio vs Raw Bypass */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBypassDsp(!isBypassDsp)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
              !isBypassDsp
                ? "bg-amber-500/15 text-amber-300 border-amber-500/40 font-bold shadow-sm"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
            }`}
            title="Activer/Désactiver le traitement mastering en temps réel (A/B Test)"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>{!isBypassDsp ? "DSP Master Actif" : "Signal Brut IA"}</span>
          </button>

          {/* Export Mastered WAV Button */}
          <button
            type="button"
            onClick={handleExportMaster}
            disabled={!audioUrl || isExportingMaster}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-semibold text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-30 disabled:pointer-events-none"
            title="Exporter le fichier WAV Masterisé 24kHz avec égalisation et compression studio"
          >
            {isExportingMaster ? (
              <span className="animate-pulse">Mastering...</span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Exporter Master HD</span>
              </>
            )}
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Waveform Canvas Display */}
      <div className="relative bg-zinc-900/90 rounded-xl p-3 border border-zinc-800 overflow-hidden group">
        {/* Dynamic Studio Status Watermark */}
        <div className="absolute top-2 right-3 z-10 flex items-center gap-2 text-[10px] font-mono text-zinc-500 pointer-events-none">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-amber-400 animate-ping" : "bg-zinc-600"}`}></span>
            {isPlaying ? "ON AIR" : "STANDBY"}
          </span>
          <span>•</span>
          <span>{settings.eqPreset.toUpperCase()}</span>
          {settings.studioCompression && (
            <>
              <span>•</span>
              <span className="text-amber-400/90 font-bold">COMP: 3.2:1</span>
            </>
          )}
        </div>

        {audioUrl ? (
          <>
            <canvas
              ref={canvasRef}
              width={800}
              height={100}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
              className="w-full h-24 sm:h-28 cursor-pointer select-none block"
            />
            {/* Hover time tooltip */}
            {hoverTime !== null && (
              <div
                className="absolute top-2 pointer-events-none -translate-x-1/2 bg-zinc-950/90 border border-amber-500/40 text-amber-300 text-[10px] font-mono px-1.5 py-0.5 rounded shadow-lg"
                style={{
                  left: `${(hoverTime / duration) * 100}%`,
                }}
              >
                {formatTimecode(hoverTime)}
              </div>
            )}
          </>
        ) : (
          <div className="h-24 sm:h-28 flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
            <Radio className="w-6 h-6 text-zinc-600 animate-pulse" />
            <span>Générez votre voix off pour visualiser la forme d'onde et tester le mastering</span>
          </div>
        )}
      </div>

      {/* Transport Controls & Timecode */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Playback Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={!audioUrl}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors disabled:opacity-30 cursor-pointer"
            title="Remettre au début"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => skipTime(-3)}
            disabled={!audioUrl}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors disabled:opacity-30 cursor-pointer"
            title="Reculer de 3s"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            disabled={!audioUrl}
            className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 disabled:opacity-30 cursor-pointer"
            title={isPlaying ? "Mettre en pause" : "Lire"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skipTime(3)}
            disabled={!audioUrl}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors disabled:opacity-30 cursor-pointer"
            title="Avancer de 3s"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            disabled={!audioUrl}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isLooping
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800"
            } disabled:opacity-30`}
            title={isLooping ? "Boucle activée" : "Activer la boucle"}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Timecode Readout */}
        <div className="flex items-center gap-2 bg-zinc-900/90 px-3 py-1.5 rounded-xl border border-zinc-800 font-mono text-xs sm:text-sm">
          <span className="text-amber-400 font-bold tracking-wider">
            {formatTimecode(currentTime)}
          </span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400 tracking-wider">
            {formatTimecode(duration)}
          </span>
        </div>

        {/* Right tools: Speed, Raw WAV Download & Volume */}
        <div className="flex items-center gap-3">
          {/* Speed selector */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            {[0.8, 1.0, 1.2, 1.5].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onChangeSpeed(spd)}
                className={`px-2 py-1 text-[11px] rounded font-medium transition-colors cursor-pointer ${
                  settings.speed === spd
                    ? "bg-amber-500 text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Raw WAV button */}
          <button
            type="button"
            onClick={handleDownloadRaw}
            disabled={!audioUrl}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-[10px] font-mono transition-colors disabled:opacity-30 cursor-pointer"
            title="Télécharger la prise brute sans traitement (Raw IA)"
          >
            Raw
          </button>

          {/* Volume control */}
          <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={toggleMute}
              className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <Slider className="!w-16" label="Volume" min={0} max={1} step={0.05} value={isMuted ? 0 : volume} onChange={(v) => handleVolumeChange(v)} />
          </div>
        </div>
      </div>
    </div>
  );
};
