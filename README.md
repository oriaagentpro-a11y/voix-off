# VoxStudio Pro — Studio de voix off IA

Station de voix off ultra-réaliste (React + Vite + Tailwind, serveur Express, Google Gemini).

## Lancer en local
1. `npm install`
2. `npm run dev`
3. Ouvrir l'appli, puis **Outils > Clés API Google** pour ajouter une ou plusieurs clés.
   (Alternative : `GEMINI_API_KEY` dans `.env.local`, voir `.env.example`.)

## Clés API Google
- Nombre de clés illimité, activables/désactivables, avec bouton « Tester ».
- Le serveur répartit les appels entre les clés actives et passe à la suivante en cas de quota, clé refusée ou service saturé.
- Les clés sont stockées dans le navigateur (localStorage) et envoyées au serveur pour appeler Google : utiliser HTTPS en production.
- Noms de modèles modifiables via `GEMINI_TTS_MODEL` et `GEMINI_TEXT_MODEL`.

## Interface
Navigation en haut (Voix, Presets, Mode Duo, Prises, Outils), recherche `Ctrl+K`, menus et curseurs sur mesure. Le thème monochrome est défini dans `src/index.css`.

© Marion de SOUZA — Tous droits réservés.
