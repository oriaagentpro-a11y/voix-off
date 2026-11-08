// Audio utilities and Web Audio Mastering DSP for VoxStudio Pro
import { StudioSettings, EqPreset } from "../types";

/**
 * Converts a Base64 string of a WAV file to a Blob and creates an Object URL
 */
export function base64ToAudioUrl(base64: string, mimeType = "audio/wav"): string {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Formats seconds into MM:SS.ms format (e.g. 01:23.4)
 */
export function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00.0";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms}`;
}

/**
 * Estimates reading time based on word count (standard French/English voiceover ~140 wpm)
 */
export function estimateReadingTime(text: string): { words: number; seconds: number; formatted: string } {
  // Strip tags like <breath> or [pause 0.5s] for pure word count
  const clean = text
    .replace(/<[^>]+>/g, " ")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\|[^|]+\|/g, " ")
    .trim();
  const words = clean.split(/\s+/).filter(Boolean).length;
  // ~140 words per minute average voiceover pacing
  const seconds = Math.max(1, Math.round((words / 140) * 60));
  return {
    words,
    seconds,
    formatted: formatTimecode(seconds),
  };
}

/**
 * Decodes an AudioBuffer from an audio URL or ArrayBuffer to extract waveform peaks
 */
export async function extractWaveformData(
  audioUrl: string,
  samplesCount = 120
): Promise<{ peaks: number[]; duration: number; buffer?: AudioBuffer }> {
  try {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samplesCount);
    const peaks: number[] = [];

    for (let i = 0; i < samplesCount; i++) {
      let max = 0;
      const start = i * blockSize;
      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(channelData[start + j] || 0);
        if (val > max) max = val;
      }
      peaks.push(Math.min(1, max));
    }

    return {
      peaks,
      duration: audioBuffer.duration,
      buffer: audioBuffer,
    };
  } catch (err) {
    console.error("Erreur extraction waveform:", err);
    return {
      peaks: Array.from({ length: samplesCount }, () => 0.2 + Math.random() * 0.5),
      duration: 5,
    };
  }
}

/**
 * Encodes an AudioBuffer into a WAV Blob (24-bit or 16-bit PCM RIFF)
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const wavLength = 44 + result.length * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(wavLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + result.length * bytesPerSample, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, result.length * bytesPerSample, true);

  // Write PCM samples with soft limiter
  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

/**
 * Creates an acoustic impulse response buffer for a high-end vocal booth
 */
function createVocalBoothImpulseResponse(ctx: BaseAudioContext, durationSec = 0.2, decay = 3.5): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * durationSec;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / length;
    const envelope = Math.exp(-t * decay);
    // Early reflections density
    left[i] = (Math.random() * 2 - 1) * envelope;
    right[i] = (Math.random() * 2 - 1) * envelope;
  }

  return impulse;
}

/**
 * Builds the real-time Web Audio Mastering Chain
 * (Highpass 80Hz -> Parametric EQ -> Studio Compressor -> Booth Convolver -> Output Gain)
 */
export function buildMasteringNodes(
  ctx: BaseAudioContext,
  settings: StudioSettings
) {
  // 1. Highpass filter to eliminate sub-bass rumble
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(75, ctx.currentTime);
  highpass.Q.setValueAtTime(0.7, ctx.currentTime);

  // 2. Low Shelf (Proximity effect & warm body at 180-220Hz)
  const lowShelf = ctx.createBiquadFilter();
  lowShelf.type = "lowshelf";
  lowShelf.frequency.setValueAtTime(200, ctx.currentTime);

  // 3. Peaking Mid (Clarity / Intelligibility at 3.2kHz)
  const midPeak = ctx.createBiquadFilter();
  midPeak.type = "peaking";
  midPeak.frequency.setValueAtTime(3200, ctx.currentTime);
  midPeak.Q.setValueAtTime(1.2, ctx.currentTime);

  // 4. High Shelf (Silky Air Band at 10-12kHz)
  const highShelf = ctx.createBiquadFilter();
  highShelf.type = "highshelf";
  highShelf.frequency.setValueAtTime(11000, ctx.currentTime);

  // Configure EQ based on EqPreset
  const eqGains = getEqPresetValues(settings.eqPreset);
  // Apply additional proximity warmth and air clarity sliders
  const proxGain = (settings.proximityWarmth || 0.4) * 4.5;
  const airGain = (settings.airClarity || 0.5) * 4.0;

  lowShelf.gain.setValueAtTime(eqGains.low + proxGain, ctx.currentTime);
  midPeak.gain.setValueAtTime(eqGains.mid, ctx.currentTime);
  highShelf.gain.setValueAtTime(eqGains.high + airGain, ctx.currentTime);

  // 5. Studio Broadcast Compressor
  const compressor = ctx.createDynamicsCompressor();
  if (settings.studioCompression) {
    compressor.threshold.setValueAtTime(-18, ctx.currentTime);
    compressor.knee.setValueAtTime(10, ctx.currentTime);
    compressor.ratio.setValueAtTime(3.2, ctx.currentTime);
    compressor.attack.setValueAtTime(0.012, ctx.currentTime);
    compressor.release.setValueAtTime(0.12, ctx.currentTime);
  } else {
    // Transparent pass-through
    compressor.threshold.setValueAtTime(0, ctx.currentTime);
    compressor.ratio.setValueAtTime(1, ctx.currentTime);
  }

  // 6. Vocal Booth Acoustic Simulation (Convolver)
  const convolver = ctx.createConvolver();
  convolver.buffer = createVocalBoothImpulseResponse(ctx, 0.18, 4.0);

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  const reverbLevel = Math.max(0, Math.min(0.6, settings.reverbAmount || 0.12));
  wetGain.gain.setValueAtTime(reverbLevel, ctx.currentTime);
  dryGain.gain.setValueAtTime(1 - reverbLevel * 0.5, ctx.currentTime);

  // 7. Master Output Gain
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(1.05, ctx.currentTime);

  // Wiring nodes
  highpass.connect(lowShelf);
  lowShelf.connect(midPeak);
  midPeak.connect(highShelf);
  highShelf.connect(compressor);

  // Dry + Wet paths
  compressor.connect(dryGain);
  compressor.connect(convolver);
  convolver.connect(wetGain);

  dryGain.connect(masterGain);
  wetGain.connect(masterGain);

  return {
    inputNode: highpass,
    outputNode: masterGain,
    updateSettings: (newSettings: StudioSettings) => {
      const newEq = getEqPresetValues(newSettings.eqPreset);
      const newProx = (newSettings.proximityWarmth || 0.4) * 4.5;
      const newAir = (newSettings.airClarity || 0.5) * 4.0;

      lowShelf.gain.setValueAtTime(newEq.low + newProx, ctx.currentTime);
      midPeak.gain.setValueAtTime(newEq.mid, ctx.currentTime);
      highShelf.gain.setValueAtTime(newEq.high + newAir, ctx.currentTime);

      const newReverb = Math.max(0, Math.min(0.6, newSettings.reverbAmount || 0.12));
      wetGain.gain.setValueAtTime(newReverb, ctx.currentTime);
      dryGain.gain.setValueAtTime(1 - newReverb * 0.5, ctx.currentTime);

      if (newSettings.studioCompression) {
        compressor.threshold.setValueAtTime(-18, ctx.currentTime);
        compressor.ratio.setValueAtTime(3.2, ctx.currentTime);
      } else {
        compressor.threshold.setValueAtTime(0, ctx.currentTime);
        compressor.ratio.setValueAtTime(1, ctx.currentTime);
      }
    },
  };
}

/**
 * Returns dB gains for low, mid, high based on preset
 */
function getEqPresetValues(preset: EqPreset): { low: number; mid: number; high: number } {
  switch (preset) {
    case "broadcast":
      return { low: 3.5, mid: 1.5, high: 2.8 }; // Radio warmth & cut-through
    case "clarity":
      return { low: -1.0, mid: 3.5, high: 4.0 }; // Maximum diction intelligibility
    case "warmth":
      return { low: 4.2, mid: -0.5, high: -1.0 }; // Silky, intimate, velvety
    case "podcast":
      return { low: 2.0, mid: 2.0, high: 2.0 }; // Balanced, clean punch
    case "air_presence":
      return { low: 1.0, mid: 2.5, high: 5.5 }; // Silky top-end shimmer
    case "flat":
    default:
      return { low: 0, mid: 0, high: 0 };
  }
}

/**
 * Renders the audio into a fully mastered studio WAV Blob using OfflineAudioContext
 */
export async function renderMasteredAudioBlob(
  audioUrl: string,
  settings: StudioSettings
): Promise<Blob> {
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();

  const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sourceBuffer = await tempCtx.decodeAudioData(arrayBuffer);

  const offlineCtx = new OfflineAudioContext(
    sourceBuffer.numberOfChannels,
    sourceBuffer.length,
    sourceBuffer.sampleRate
  );

  const bufferSource = offlineCtx.createBufferSource();
  bufferSource.buffer = sourceBuffer;

  const mastering = buildMasteringNodes(offlineCtx, settings);

  bufferSource.connect(mastering.inputNode);
  mastering.outputNode.connect(offlineCtx.destination);

  bufferSource.start(0);
  const renderedBuffer = await offlineCtx.startRendering();

  return audioBufferToWav(renderedBuffer);
}

/**
 * Procedural ambient synthesizer (creates warm background pads or soft cinematic pulses)
 */
export function createAmbientSynthesizer(ctx: AudioContext, type: "ambient_pad" | "deep_space" | "uplifting_pulse") {
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.25;

  const nodes: { stop: () => void }[] = [];

  if (type === "ambient_pad") {
    // Warm soothing chord pad (F minor / Ab major chords: F3, C4, Eb4, G4)
    const freqs = [174.61, 261.63, 311.13, 392.0];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600 + idx * 80, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.15 + idx * 0.05, ctx.currentTime);
      lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      gain.gain.setValueAtTime(0.08 / freqs.length, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start();

      nodes.push({
        stop: () => {
          try {
            osc.stop();
            lfo.stop();
          } catch {}
        },
      });
    });
  } else if (type === "deep_space") {
    // Cinematic drone with subtle low frequencies
    const droneFreqs = [65.41, 98.0, 130.81]; // C2, G2, C3
    droneFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(220, ctx.currentTime);
      filter.Q.setValueAtTime(4, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start();

      nodes.push({
        stop: () => {
          try {
            osc.stop();
          } catch {}
        },
      });
    });
  } else if (type === "uplifting_pulse") {
    // Gentle acoustic warm pulsing arpeggio
    const freqs = [220, 277.18, 329.63, 440]; // A3, C#4, E4, A4
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();

      nodes.push({
        stop: () => {
          try {
            osc.stop();
          } catch {}
        },
      });
    });
  }

  return {
    outputNode: masterGain,
    stop: () => {
      nodes.forEach((n) => n.stop());
    },
  };
}
