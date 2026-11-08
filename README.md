# 🎙️ VoxStudio Pro — Studio de Voix Off IA Ultra-Réaliste

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://www.microsoft.com/windows)
[![macOS](https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple&logoColor=white)](https://www.apple.com/macos)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

> **VoxStudio Pro** est une station audionumérique (DAW) web de nouvelle génération dédiée à la production de voix off haute fidélité. Propulsée par les modèles multimodaux vocaux de **Google Gemini**, elle combine direction artistique assistée par IA, modélisation acoustique studio (DSP temps réel) et résilience multi-clés pour un rendu vivant, organique et indiscernable d'un comédien voix off en cabine insonorisée.

---

## 🌟 Points Forts & Fonctionnalités

### 🎭 Moteur Vocal Hyper-Réaliste & Casting Virtuel
* **5 timbres vocaux d'exception** calibrés en français :
  * **Kore** — Chaleureuse, soyeuse et intimiste *(Luxe, Documentaire, E-learning, Narration)*
  * **Puck** — Dynamique, percutant et énergique *(Publicité, Tech, Gaming, Réseaux Sociaux)*
  * **Zephyr** — Empathique, bienveillante et rassurante *(Santé, Méditation, Récit)*
  * **Fenrir** — Grave, cinématique et autoritaire *(Bandes-annonces, Manifestos, Teasers)*
  * **Charon** — Posé, analytique et journalistique *(Corporate, Audiobooks, Vulgarisation)*
* **6 Profils d'Intention & Acoustique** : *Studio Pro*, *Documentaire Profond*, *Cinéma Épique*, *Luxe & Intimité*, *Tech Dynamique*, *Conteur Chaleureux*.
* **Niveaux de réalisme** réglables (*Standard*, *Haute fidélité*, *Ultra-perfection*) avec micro-inflections humaines et prosodie spontanée.

### 👥 Mode Duo (Multi-Locuteurs)
* Synthèse de dialogues complets entre deux voix distinctes en une seule passe audio native.
* Alternance fluide des répliques, balance acoustique harmonisée et styles de jeu personnalisables par personnage.

### 🎛️ Rack de Mastering DSP Temps Réel (Web Audio API)
* **Égalisation studio (EQ)** : Presets optimisés (*Broadcast*, *Clarity*, *Warmth*, *Podcast*, *Air Presence*, *Flat*).
* **Traitement dynamique & acoustique** :
  * Chaleur de proximité (effet de corps micro Neumann U87)
  * Brillance et clarté « Air » (rayonnement 12 kHz)
  * Compression studio et De-Esser doux (atténuation des sifflantes)
  * Réverbération de pièce dosable
* **Lits musicaux d'ambiance intégrés** avec mixage de volume indépendant.
* **Visualiseur de forme d'onde interactif** (scrubbing, timecode, zoom, boucle, gestion du gain).

### 🧠 Script Doctor IA & Direction Artistique
* **Analyse prosodique intelligente** : transformation automatique de scripts écrits en textes oraux rythmés.
* **Insertion de balises anatomiques** : respirations (`<breath>`), pauses dramatiques calibrées (`[pause 0.5s]`), sourires dans la voix (`<laugh>`).
* **Déclinaisons publicitaires calibrées** : génération instantanée des formats **15s**, **30s** et **60s**.
* **Traduction & adaptation internationale** optimisée pour l'oralité.

### 📜 Téléprompteur & Gestionnaire de Prises (Takes)
* **Téléprompteur studio plein écran** avec défilement réglable pour les répétitions et lectures témoins.
* **Historique complet des prises enregistrées** : écoute comparative, marquage des favoris, score de réalisme, métadonnées DSP et téléchargement instantané au format **WAV**.

### 🔑 Haute Disponibilité & Gestion Multi-Clés API
* **Support d'un nombre illimité de clés API Google Gemini**.
* **Rotation intelligente (Round-Robin)** et **basculement automatique (Failover)** sans interruption en cas de saturation de quota (`429`), clé invalide ou surcharge du service.
* Stockage local chiffré dans le navigateur (`localStorage`) avec transmission sécurisée via en-têtes HTTP.
* Outil de test de clé intégré avec protection contre le spam.

---

## 🏗️ Architecture & Technologies

```
voxstudio-pro-refonte/
├── api/
│   └── index.ts             # API Express, passerelle Gemini SDK, rotation des clés & TTS
├── src/
│   ├── components/          # Composants UI React (Header, ScriptEditor, DSP Rack, etc.)
│   ├── data/                # Presets de production thématiques (Publicité, Cinéma, Luxe...)
│   ├── utils/               # Moteur Web Audio API, traitement DSP, stockage des clés
│   ├── types.ts             # Définitions TypeScript complètes
│   ├── App.tsx              # Composant racine & orchestration de l'état du studio
│   └── index.css            # Design System monochrome haut de gamme Tailwind CSS v4
├── server.ts                # Serveur de développement et d'exécution hybride Vite / Express
└── package.json             # Dépendances et scripts
```

| Composant | Technologie |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8 |
| **Styles & Design** | Tailwind CSS v4, Lucide Icons, Motion |
| **Backend API** | Node.js, Express, `@google/genai` (SDK officiel Google) |
| **Traitement Audio** | Web Audio API (BiquadFilter, DynamicsCompressor, Convolver, Gain) |
| **Hébergement supporté** | Vercel (Serverless), Google Cloud Run, Docker, VPS Node.js |

---

## 🚀 Démarrage Rapide

### Prérequis
* [Node.js](https://nodejs.org/) (version 18+ recommandée)
* [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)
* Une ou plusieurs clés d'API [Google AI Studio](https://aistudio.google.com/)

### 1. Installation

```bash
# Cloner le dépôt
git clone https://github.com/oriaagentpro-a11y/voix-off.git
cd voix-off

# Installer les dépendances
npm install
```

### 2. Configuration des variables d'environnement (Facultatif)

Vous pouvez configurer une clé par défaut sur le serveur en créant un fichier `.env.local` (inspiré de `.env.example`) :

```env
# Clé API Google par défaut (optionnelle si configurée via l'interface)
GEMINI_API_KEY="votre-cle-api-gemini"

# Modèles Gemini utilisés (optionnels)
GEMINI_TTS_MODEL="gemini-3.8-flash-tts"
GEMINI_TEXT_MODEL="gemini-3.8-flash"

# Port d'écoute du serveur
PORT=3000
```

> 💡 **Note :** Vous pouvez également renseigner vos clés directement dans l'application via le menu **Outils > Clés API Google**. Elles seront conservées dans votre navigateur et utilisées pour vos sessions.

### 3. Lancement en local

```bash
# Démarrer le serveur de développement (Express + Vite)
npm run dev
```

Ouvrez votre navigateur sur `http://localhost:3000`.

---

## 🛠️ Commandes Disponibles

### 🌐 Mode Web & Serveur
| Commande | Action |
|---|---|
| `npm run dev` | Lance le serveur web de développement avec rechargement à chaud (HMR). |
| `npm run build` | Compile l'application cliente optimisée pour la production dans le dossier `dist/`. |
| `npm start` | Démarre le serveur Node.js en mode production (`NODE_ENV=production`). |
| `npm run preview` | Prévisualise la version de production via le serveur Vite. |
| `npm run lint` | Exécute la vérification statique des types TypeScript (`tsc --noEmit`). |

### 💻 Mode Application Desktop (Windows & macOS)
| Commande | Action |
|---|---|
| `npm run desktop:dev` | Démarre le serveur local et lance la fenêtre Electron en mode développement avec HMR. |
| `npm run build:electron` | Compile le processus principal Electron et le backend Express dans `dist-electron/`. |
| `npm run desktop:build:win` | Génère les exécutables Windows (installateur NSIS `.exe` et version portable `.exe`) dans le dossier `release/`. |
| `npm run desktop:build:mac` | Génère les paquets macOS (image disque `.dmg` et archive `.zip` pour Apple Silicon et Intel) dans `release/`. |
| `npm run desktop:build:all` | Compile et empaquette simultanément pour Windows et macOS. |

---

## 💻 Architecture de l'Application Desktop

VoxStudio Pro est conçu pour s'exécuter de façon 100% autonome sur **Windows** et **macOS** sans nécessiter de configuration externe :

1. **Serveur Backend Embarqué** : Au lancement de l'application, Electron démarre une instance interne et isolée du serveur Express sur l'adresse de bouclage locale `127.0.0.1` avec un port dynamique attribué automatiquement par le système d'exploitation. Aucun conflit de port n'est possible avec d'autres applications.
2. **Performance Native & DSP** : Les flux audio Web Audio API bénéficient de l'accélération matérielle Chromium intégrée à Electron.
3. **Menus & Raccourcis Système** :
   * `Cmd/Ctrl + T` : Téléprompteur de lecture
   * `Cmd/Ctrl + D` : Script Doctor & Coach de Réalisme IA
   * `Cmd/Ctrl + K` : Gestionnaire de clés API Google
   * Plein écran studio, zoom dynamique, inspecteur développeur
4. **Sécurité Sandbox & Liens Externes** : Isolation du contexte active (`contextIsolation: true`) et ouverture automatique de tout lien web externe dans le navigateur système par défaut.

---

## 🎙️ Guide de Rédaction & Balises Vocales

VoxStudio Pro interprète des balises de jeu d'acteur pour enrichir la prosodie de la synthèse vocale :

| Balise | Effet produit | Exemple |
|---|---|---|
| `<breath>` | Respiration naturelle / reprise d'air humaine | `Bienvenue chez nous. <breath> Laissez-moi vous guider.` |
| `[pause 0.4s]` | Pause dramatique ou contemplative calibrée (en secondes) | `Le résultat ? [pause 0.6s] Une transformation totale.` |
| `<laugh>` | Sourire audible / légère inflexion amusée | `C'est aussi simple que cela. <laugh>` |
| `<gasp>` | Souffle d'étonnement ou d'émerveillement | `<gasp> Regardez ce panorama.` |
| `|mhm|` | Vocalise d'assentiment ou d'écoute attentive | `|mhm| Tout à fait d'accord.` |

---

## 🔒 Sécurité & Confidentialité des Clés

* Les clés API ajoutées via l'interface utilisateur sont stockées **uniquement dans le stockage local de votre navigateur (`localStorage`)**.
* Elles sont transmises au serveur via un en-tête chiffré base64 temporaire pour effectuer la requête auprès de l'API Google GenAI et ne sont **jamais persistées dans une base de données serveur ni journalisées**.
* En production, veillez à déployer l'application sous **HTTPS** pour sécuriser les échanges entre le client et l'API.

---

## 📄 Licence & Droits

© **Marion de SOUZA** — Tous droits réservés.
