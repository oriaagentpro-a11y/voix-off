import esbuild from "esbuild";
import fs from "fs";

if (!fs.existsSync("dist-electron")) {
  fs.mkdirSync("dist-electron", { recursive: true });
}

async function build() {
  console.log("📦 Compilation du processus principal Electron et du backend...");
  await esbuild.build({
    entryPoints: ["electron/main.ts"],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    outfile: "dist-electron/main.cjs",
    external: ["electron"],
    sourcemap: true,
  });

  console.log("🔒 Compilation du script de préchargement (preload)...");
  await esbuild.build({
    entryPoints: ["electron/preload.ts"],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    outfile: "dist-electron/preload.cjs",
    external: ["electron"],
    sourcemap: true,
  });

  console.log("✅ Processus Electron et backend compilés avec succès dans dist-electron/");
}

build().catch((err) => {
  console.error("❌ Erreur lors de la compilation d'Electron :", err);
  process.exit(1);
});
