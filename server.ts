import app from "./api/index.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const server = app.listen(PORT, () => {
    console.log(`🎙️ VoxStudio Pro : serveur prêt sur http://localhost:${PORT}`);
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\n❌ Le port ${PORT} est déjà utilisé (une autre instance de VoxStudio tourne sans doute).\n` +
          `   Fermez-la, ou trouvez le processus avec : netstat -ano | findstr :${PORT}\n`
      );
      process.exit(1);
    }
    throw err;
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
