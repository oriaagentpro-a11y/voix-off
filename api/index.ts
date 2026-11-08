import express, { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();


// --- Clés API Google : transmises par l'appli (en-tête) et/ou GEMINI_API_KEY, avec rotation et repli ---
function resolveKeys(req: Request): string[] {
  const out: string[] = [];
  const h = req.headers["x-gemini-api-keys"];
  if (typeof h === "string") {
    try {
      const arr = JSON.parse(Buffer.from(h, "base64").toString("utf8"));
      if (Array.isArray(arr)) for (const k of arr) if (typeof k === "string" && k.trim()) out.push(k.trim());
    } catch {}
  }
  if (process.env.GEMINI_API_KEY) out.push(process.env.GEMINI_API_KEY);
  return Array.from(new Set(out));
}

let rotation = 0;
function makeAi(keys: string[]) {
  const clients = keys.map(
    (apiKey) => new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } })
  );
  const start = rotation++ % clients.length;
  return {
    models: {
      generateContent: async (args: any) => {
        let last: any;
        for (let i = 0; i < clients.length; i++) {
          try {
            return await clients[(start + i) % clients.length].models.generateContent(args);
          } catch (e: any) {
            last = e;
            const m = String(e?.message || e);
            // Quota, clé invalide ou service saturé : on passe à la clé suivante
            if (!/429|quota|RESOURCE_EXHAUSTED|API key|API_KEY|PERMISSION|UNAUTHENTICATED|40[13]|503|overloaded/i.test(m)) throw e;
          }
        }
        throw last;
      },
    },
  };
}
const NO_KEY = "Aucune clé API Google configurée. Ajoutez-en une dans Outils > Clés API Google.";

app.use(express.json({ limit: "50mb" }));

// CORS & Preflight support
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

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

export const VOICES: VoiceInfo[] = [
  {
    id: "Kore",
    name: "Kore",
    gender: "femme",
    tone: "Chaleureuse, soyeuse & narrative (Ultra-Réaliste)",
    description: "Voix féminine d'exception avec un grain soyeux, une diction française irréprochable et un timbre feutré intimiste de studio haut de gamme.",
    recommendedFor: ["Documentaires", "Luxe & Beauté", "E-learning", "Méditation", "Corporate Prestige"],
    previewSampleText: "Bienvenue dans un nouvel univers sonore où chaque souffle et chaque mot vibrent d'une humanité absolue.",
    timbreProfile: "Mezzo-soprano soyeuse, texture feutrée, présence harmonique riche",
    frequencyRange: "180 Hz - 7.5 kHz",
  },
  {
    id: "Puck",
    name: "Puck",
    gender: "homme",
    tone: "Dynamique, percutant & moderne (Ultra-Réaliste)",
    description: "Voix masculine jeune, vivante et entraînante. Énergie communicative, sourire audible et timing percutant idéal pour captiver instantanément.",
    recommendedFor: ["Publicités TV/Radio", "Startups Tech", "Podcasts", "Gaming", "Réseaux sociaux"],
    previewSampleText: "Passez à la vitesse supérieure dès aujourd'hui avec une expérience sonore d'un réalisme saisissant.",
    timbreProfile: "Ténor clair et percussif, projection dynamique, modulation rapide",
    frequencyRange: "120 Hz - 8 kHz",
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    gender: "femme",
    tone: "Empathique, douce & rassurante (Ultra-Réaliste)",
    description: "Voix féminine profondément humaine et bienveillante, avec une respiration subtile et une sensibilité acoustique parfaite pour toucher le cœur.",
    recommendedFor: ["Récit narratif", "Santé & Bien-être", "Service client VIP", "Guide audio", "Livre Audio"],
    previewSampleText: "Prenez un instant pour respirer et découvrir une voix qui vous accompagne avec délicatesse et bienveillance.",
    timbreProfile: "Soprano douce, rondeur acoustique, douceur respiratoire",
    frequencyRange: "200 Hz - 7 kHz",
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    gender: "homme",
    tone: "Profond, puissant & cinématique (Ultra-Réaliste)",
    description: "Voix masculine grave, percutante et texturée avec une résonance de poitrine impressionnante, idéale pour les bandes-annonces et l'émotion épique.",
    recommendedFor: ["Bandes-annonces cinéma", "Teasers événements", "Narration épique", "Manifesto de marque"],
    previewSampleText: "Dans un monde en constante mutation, une seule voix a le pouvoir d'éveiller les consciences et de marquer les esprits.",
    timbreProfile: "Baryton-basse chaleureux, résonance pectorale profonde, autorité naturelle",
    frequencyRange: "85 Hz - 6.5 kHz",
  },
  {
    id: "Charon",
    name: "Charon",
    gender: "homme",
    tone: "Posé, journalistique & d'autorité (Ultra-Réaliste)",
    description: "Voix masculine équilibrée, sérieuse et rassurante avec une prosodie journalistique naturelle et une articulation analytique de référence.",
    recommendedFor: ["Journal d'information", "Livre audio", "Rapports d'entreprise", "Vulgarisation scientifique"],
    previewSampleText: "Voici une analyse approfondie et rigoureuse des grandes avancées qui façonnent notre avenir commun.",
    timbreProfile: "Baryton équilibré, stabilité rythmique, articulation broadcast radio",
    frequencyRange: "110 Hz - 7 kHz",
  },
];

// Helper to construct ultra-realistic speech direction
function buildRealisticSpeechStyle(
  baseStyle?: string,
  profile?: string,
  level: "standard" | "high" | "ultra_perfection" = "ultra_perfection"
): string {
  const profileGuidance: Record<string, string> = {
    studio_pro:
      "Studio broadcast acoustic master. Ultra-realistic French voice actor in an acoustically treated recording booth. Natural breathing cadence, subtle human micro-inflections, crisp consonants, warm proximity effect like a high-end Neumann U87 microphone, organic vocal cord vibration, absolutely zero robotic or flat synthesizer artifacts.",
    documentary_deep:
      "Prestige documentary narration in French. Calibrated pacing, deep warm resonance, contemplative pauses, lifelike breathing, captivating and authentic human storytelling with intimate proximity.",
    cinema_epic:
      "Cinematic cinematic trailer voiceover in French. Powerful emotional depth, controlled chest resonance, dramatic pauses, magnetic intensity and lifelike vocal timbre.",
    luxury_intimate:
      "Luxury prestige fragrance and high-end brand French voice. Velvety, silky, whispering near-mic presence, delicate audible breath, intimate elegance and sophisticated diction.",
    tech_dynamic:
      "Modern innovative startup and tech pitch in French. Authentic enthusiasm, communicative smile in the voice, sharp pacing, fluid natural liaisons, engaging and spontaneous.",
    storyteller_warm:
      "Passionate and deeply empathetic French storyteller. Sensitive emotional modulations, natural phrasing, heartfelt human warmth and natural breathing intervals.",
  };

  const selectedGuidance = profile && profileGuidance[profile] ? profileGuidance[profile] : profileGuidance.studio_pro;

  if (level === "standard") {
    return baseStyle || "Voix off claire, professionnelle et naturelle";
  }

  const realismEnrichment =
    level === "ultra_perfection"
      ? `${selectedGuidance}. Diction vivante, prosodie spontanée, micro-variations de ton authentiques.`
      : `${selectedGuidance}.`;

  if (baseStyle && baseStyle.trim()) {
    return `${realismEnrichment} Intention spécifique demandée par le réalisateur : ${baseStyle.trim()}`;
  }

  return realismEnrichment;
}

// Router for voice endpoints (handles both with and without /api prefix)
const voiceRouter = express.Router();

// 1. Get available voices
voiceRouter.get("/voices", (_req: Request, res: Response) => {
  res.json({ voices: VOICES });
});

// 2. Generate voiceover audio
voiceRouter.post("/generate", async (req: Request, res: Response) => {
  try {
    const keys = resolveKeys(req);
    if (!keys.length) {
      return res.status(400).json({ error: NO_KEY });
    }

    const ai = makeAi(keys);

    const {
      text,
      voice = "Kore",
      style = "Chaleureux, professionnel et captivant",
      modelMode = "flash-tts",
      hyperRealismLevel = "ultra_perfection",
      hyperRealismProfile = "studio_pro",
      dialogueMode = false,
      speakers = [],
    } = req.body;

    if (!text && (!dialogueMode || !speakers?.length)) {
      return res.status(400).json({ error: "Le texte de la voix off est requis." });
    }

    // Flagship model selection
    const selectedModel = modelMode === "flash-lite" ? "gemini-3.8-flash-lite-tts" : "gemini-3.8-flash-tts";

    // Dialogue mode (2 speakers)
    if (dialogueMode && Array.isArray(speakers) && speakers.length === 2) {
      const [speaker1, speaker2] = speakers;
      const sp1Name = speaker1.name || "Alex";
      const sp2Name = speaker2.name || "Sam";
      const sp1Voice = speaker1.voice || "Puck";
      const sp2Voice = speaker2.voice || "Kore";

      const sp1RealisticStyle = buildRealisticSpeechStyle(speaker1.style || style, hyperRealismProfile, hyperRealismLevel);
      const sp2RealisticStyle = buildRealisticSpeechStyle(speaker2.style || "Posée, complice et bienveillante", hyperRealismProfile, hyperRealismLevel);

      const dialogueParts = (speaker1.lines || []).map((line: { speaker: string; text: string; style?: string }) => {
        const lineText = line.text
          .replace(/\[pause\s*([\d.]+)s?\]/gi, " ... ")
          .trim();

        return {
          text: `${line.speaker}: ${lineText}`,
          speechMetadata: {
            speaker: line.speaker,
            style: line.speaker === sp1Name ? sp1RealisticStyle : sp2RealisticStyle,
          },
        };
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-tts",
        contents: [
          {
            role: "user",
            parts:
              dialogueParts.length > 0
                ? dialogueParts
                : [
                    {
                      text: `${sp1Name}: ${speaker1.text || text}`,
                      speechMetadata: { speaker: sp1Name, style: sp1RealisticStyle },
                    },
                    {
                      text: `${sp2Name}: ${speaker2.text || "Tout à fait, nous poursuivons cette démonstration."}`,
                      speechMetadata: { speaker: sp2Name, style: sp2RealisticStyle },
                    },
                  ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: sp1Name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: sp1Voice },
                  },
                },
                {
                  speaker: sp2Name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: sp2Voice },
                  },
                },
              ],
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioBase64) {
        return res.status(500).json({ error: "Aucun flux audio généré par le modèle." });
      }

      return res.json({
        audioBase64,
        mimeType: "audio/wav",
        voice: `${sp1Voice} & ${sp2Voice}`,
        style,
        model: "gemini-3.8-flash-tts",
        hyperRealismLevel,
      });
    }

    // Single-speaker generation
    const enhancedStyle = buildRealisticSpeechStyle(style, hyperRealismProfile, hyperRealismLevel);

    let formattedText = text
      .replace(/\[pause\s*([0-1](?:\.\d+)?)s?\]/gi, " ... ")
      .replace(/\[pause\s*([2-9](?:\.\d+)?)s?\]/gi, " ... <breath> ... ")
      .trim();

    if (hyperRealismLevel === "ultra_perfection" && !formattedText.includes("<breath>") && formattedText.length > 180) {
      formattedText = formattedText.replace(/([.!?])\s+([A-ZÀ-Ÿ])/i, "$1 <breath> $2");
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: formattedText,
              speechMetadata: {
                style: enhancedStyle,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) {
      return res.status(500).json({ error: "Impossible d'extraire le fichier audio généré." });
    }

    return res.json({
      audioBase64,
      mimeType: "audio/wav",
      voice,
      style,
      model: selectedModel,
      hyperRealismLevel,
      profile: hyperRealismProfile,
    });
  } catch (error: any) {
    console.error("Erreur génération audio:", error);
    return res.status(500).json({
      error: error?.message || "Erreur lors de la génération de la voix off.",
    });
  }
});

// Test d'une clé
voiceRouter.post("/test-key", async (req: Request, res: Response) => {
  const key = typeof req.body?.key === "string" ? req.body.key.trim() : "";
  if (!key) return res.status(400).json({ ok: false, error: "Clé manquante." });
  try {
    await new GoogleGenAI({ apiKey: key }).models.generateContent({ model: "gemini-3.8-flash", contents: "Réponds : ok" });
    return res.json({ ok: true });
  } catch (e: any) {
    return res.json({ ok: false, error: String(e?.message || e).slice(0, 200) });
  }
});

// 3. Optimize script
voiceRouter.post("/optimize-script", async (req: Request, res: Response) => {
  try {
    const keys = resolveKeys(req);
    if (!keys.length) {
      return res.status(400).json({ error: NO_KEY });
    }

    const ai = makeAi(keys);

    const { script, mode, targetTone, language = "fr", voiceName } = req.body;

    if (!script) {
      return res.status(400).json({ error: "Le script à optimiser est requis." });
    }

    let instruction = "";

    if (mode === "hyper-realism") {
      instruction = `Tu es le directeur artistique de voix off le plus réputé de France, expert en prosodie, phonétique et réalisme sonore humain.
Ta mission : Transformer ce script pour qu'il atteigne la perfection et l'HYPER-RÉALISME ABSOLU une fois synthétisé par la voix IA "${voiceName || "Kore"}".

Règles de perfectionnisme pour un rendu 100% humain et vivant :
1. Insère des respirations organiques avec la balise <breath> aux pauses respiratoires anatomiques logiques (tous les 12 à 18 mots environ).
2. Insère des pauses de réflexion et d'emphase avec [pause 0.4s] ou [pause 0.8s] avant les révélations clés.
3. Si pertinent pour le ton, utilise de très légères réactions humaines comme <laugh> (sourire dans la voix) ou <gasp> (souffle d'étonnement) ou |mhm| (approbation).
4. Élimine les phrases trop alambiquées, les enchaînements de consonnes cacophoniques et le style trop écrit : privilégie une oralité noble, percutante et naturelle.
5. Soigne les liaisons et la musicalité phonétique française.
6. Conserve scrupuleusement le message de fond, les faits et l'argumentation.
7. Ton cible : ${targetTone || "Chaleureux, sincère, captivant et hyper-réaliste"}.

Réponds STRICTEMENT sous forme d'un objet JSON valide :
{
  "optimizedScript": "Le texte final révisé avec balises <breath> et [pause] prêt pour l'enregistrement",
  "realismImprovements": [
    "Détail précis de l'amélioration 1 apportée (ex: respiration ajoutée pour humaniser la transition)",
    "Détail précis de l'amélioration 2",
    "Détail précis de l'amélioration 3"
  ],
  "estimatedPacingSec": 24,
  "artisticDirectionAdvice": "Conseil d'écoute pour l'ingénieur du son"
}`;
    } else if (mode === "pacing") {
      instruction = `Tu es un ingénieur du son de studio de doublage.
Optimise ce script pour la lecture orale à haute voix (voix off) :
- Ajoute des respirations et pauses naturelles avec la balise <breath> ou [pause 0.5s].
- Améliore le rythme, la prosodie et le dynamisme oral.
- Retire les tournures lourdes ou difficiles à prononcer.
- Ton souhaité: ${targetTone || "Professionnel et captivant"}.
Ne renvoie UNIQUEMENT que le texte révisé prêt pour l'enregistrement, sans explication introductive ni guillemets.`;
    } else if (mode === "timing-variants") {
      instruction = `Tu es un scénariste voix off publicitaire d'élite.
À partir de ce texte, génère 3 versions calibrées en temps de lecture :
1) Format 15 secondes (punchy, environ 30-35 mots)
2) Format 30 secondes (standard publicité, environ 65-75 mots)
3) Format 60 secondes (narration complète, environ 130-150 mots)

Renvoie un JSON valide au format:
{
  "v15": "texte de la version 15s avec <breath> naturel",
  "v30": "texte de la version 30s avec respirations",
  "v60": "texte de la version 60s complet et rythmé"
}`;
    } else if (mode === "translate") {
      instruction = `Tu es un adaptateur de doublage et de voix off international de renom.
Traduis et adapte ce script en langue "${language}" pour qu'il sonne parfaitement naturel, vivant et fluide à l'oral pour un comédien voix off natif de très haut niveau.
Ton souhaité: ${targetTone || "Naturel, percutant et fluide"}.
Ne renvoie UNIQUEMENT que le script traduit adapté, sans commentaire.`;
    } else {
      instruction = `Tu es un directeur d'acteurs de voix off prestigieux.
Sublime ce script pour une voix off haut de gamme d'un réalisme parfait :
- Vocabulaire percutant, fluidité phonétique irréprochable.
- Ponctuation optimale pour des respirations naturelles <breath>.
- Style souhaité: ${targetTone || "Cinématique, humain et soigné"}.
Ne renvoie que le texte optimisé directement sans préambule.`;
    }

    const isJsonResponse = mode === "hyper-realism" || mode === "timing-variants";

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `${instruction}\n\n--- SCRIPT ORIGINAL ---\n${script}` }],
        },
      ],
      config: isJsonResponse ? { responseMimeType: "application/json" } : undefined,
    });

    let optimized = response.text || "";
    if (isJsonResponse) {
      optimized = optimized
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    }
    return res.json({ result: optimized });
  } catch (error: any) {
    console.error("Erreur optimisation script:", error);
    return res.status(500).json({ error: error?.message || "Erreur lors de l'optimisation du script." });
  }
});

// Mount router on both paths to guarantee matching regardless of Vercel rewrite prefix
app.use("/api/voice", voiceRouter);
app.use("/voice", voiceRouter);

// Healthcheck
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

export default app;
