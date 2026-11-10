export interface VoiceInfo {
  id: string;
  name: string;
  gender: "femme" | "homme";
  tone: string;
  description: string;
  recommendedFor: string[];
  previewSampleText: string;
  timbreProfile?: string;
  frequencyRange?: string;
}

export interface VoiceTake {
  id: string;
  timestamp: number;
  title: string;
  text: string;
  voice: string;
  style: string;
  model: string;
  duration: number; // in seconds
  audioBase64: string;
  audioUrl: string;
  isFavorite?: boolean;
  realismScore?: number;
  dspApplied?: boolean;
}

export type EqPreset = "flat" | "broadcast" | "clarity" | "warmth" | "podcast" | "air_presence";

export type AmbientTrackId = "none" | "ambient_pad" | "deep_space" | "uplifting_pulse";

export type HyperRealismProfile =
  | "studio_pro"
  | "documentary_deep"
  | "cinema_epic"
  | "luxury_intimate"
  | "tech_dynamic"
  | "storyteller_warm";

export interface StudioSettings {
  speed: number;
  eqPreset: EqPreset;
  reverbAmount: number;
  ambientTrack: AmbientTrackId;
  ambientVolume: number;
  // Hyper-realism mastering and acoustic controls
  masteringEnabled: boolean;
  studioCompression: boolean;
  proximityWarmth: number; // 0 to 1 (adds low-end microphone proximity body)
  airClarity: number; // 0 to 1 (silky high-shelf air at 12kHz)
  deEsserSmooth: boolean; // softens sharp sibilants
  hyperRealismProfile: HyperRealismProfile;
  hyperRealismLevel: "standard" | "high" | "ultra_perfection";
}

export type VoiceId = "Kore" | "Puck" | "Zephyr" | "Fenrir" | "Charon";

export interface DialogueLine {
  id: string;
  speaker: string;
  voice: VoiceId;
  text: string;
  style?: string;
}

export interface StudioPreset {
  id: string;
  name: string;
  category:
    | "Pédagogique"
    | "Documentaire"
    | "Publicité"
    | "Luxe"
    | "Storytelling"
    | "Podcast"
    | "Cinéma"
    | "Bien-être"
    | "Corporate";
  badge: string;
  tagline: string;
  description: string;
  iconName: string;
  recommendedVoice: "Kore" | "Puck" | "Zephyr" | "Fenrir" | "Charon";
  stylePrompt: string;
  hyperRealismProfile: HyperRealismProfile;
  eqPreset: EqPreset;
  proximityWarmth: number;
  airClarity: number;
  studioCompression: boolean;
  reverbAmount: number;
  ambientTrack: AmbientTrackId;
  ambientVolume: number;
  speed: number;
  sampleScript: string;
  pacingAdvice: string;
  isCustom?: boolean;
}
