import { app, BrowserWindow, shell, ipcMain, Menu, MenuItemConstructorOptions, nativeTheme } from "electron";
import path from "path";
import http from "http";
import express from "express";
import apiApp from "../api/index.js";

// Empêche le lancement de plusieurs instances simultanées
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let embeddedServer: http.Server | null = null;
let serverPort: number | null = null;

const isDev = !app.isPackaged || process.env.NODE_ENV === "development";

async function startEmbeddedServer(): Promise<number> {
  const distPath = path.join(app.getAppPath(), "dist");

  // Servir les fichiers statiques de l'application React compilée
  apiApp.use(express.static(distPath));

  // SPA fallback : renvoyer index.html pour les routes non-API
  apiApp.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/voice/")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });

  embeddedServer = http.createServer(apiApp);

  return new Promise<number>((resolve, reject) => {
    // Écoute sur 127.0.0.1 avec port dynamique (0 = port libre attribué par le système d'exploitation)
    embeddedServer!.listen(0, "127.0.0.1", () => {
      const addr = embeddedServer!.address();
      if (addr && typeof addr === "object") {
        serverPort = addr.port;
        console.log(`🎙️ [VoxStudio Desktop] Serveur embarqué actif sur http://127.0.0.1:${serverPort}`);
        resolve(serverPort);
      } else {
        reject(new Error("Impossible de déterminer le port du serveur embarqué"));
      }
    });

    embeddedServer!.on("error", (err) => {
      console.error("Erreur serveur embarqué :", err);
      reject(err);
    });
  });
}

function createStudioMenu(win: BrowserWindow) {
  const isMac = process.platform === "darwin";

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: "VoxStudio Pro",
            submenu: [
              { role: "about", label: "À propos de VoxStudio Pro" },
              { type: "separator" },
              { role: "services", label: "Services" },
              { type: "separator" },
              { role: "hide", label: "Masquer VoxStudio Pro" },
              { role: "hideOthers", label: "Masquer les autres" },
              { role: "unhide", label: "Tout afficher" },
              { type: "separator" },
              { role: "quit", label: "Quitter VoxStudio Pro" },
            ] as MenuItemConstructorOptions[],
          },
        ]
      : []),
    {
      label: "Fichier",
      submenu: [
        {
          label: "Nouvelle session",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            win.webContents.send("menu-new-session");
          },
        },
        { type: "separator" },
        isMac
          ? { role: "close", label: "Fermer la fenêtre" }
          : { role: "quit", label: "Quitter" },
      ] as MenuItemConstructorOptions[],
    },
    {
      label: "Édition",
      submenu: [
        { role: "undo", label: "Annuler" },
        { role: "redo", label: "Rétablir" },
        { type: "separator" },
        { role: "cut", label: "Couper" },
        { role: "copy", label: "Copier" },
        { role: "paste", label: "Coller" },
        { role: "selectAll", label: "Tout sélectionner" },
      ] as MenuItemConstructorOptions[],
    },
    {
      label: "Affichage",
      submenu: [
        { role: "reload", label: "Recharger l'interface" },
        { role: "forceReload", label: "Forcer le rechargement" },
        {
          role: "toggleDevTools",
          label: "Outils de développement (Inspecteur)",
        },
        { type: "separator" },
        { role: "resetZoom", label: "Taille normale" },
        { role: "zoomIn", label: "Zoom avant" },
        { role: "zoomOut", label: "Zoom arrière" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Plein écran" },
      ] as MenuItemConstructorOptions[],
    },
    {
      label: "Studio",
      submenu: [
        {
          label: "Prompteur",
          accelerator: "CmdOrCtrl+T",
          click: () => {
            win.webContents.send("open-teleprompter");
          },
        },
        {
          label: "Coach IA",
          accelerator: "CmdOrCtrl+D",
          click: () => {
            win.webContents.send("open-script-doctor");
          },
        },
        {
          label: "Clés API Google",
          accelerator: "CmdOrCtrl+K",
          click: () => {
            win.webContents.send("open-api-keys");
          },
        },
      ] as MenuItemConstructorOptions[],
    },
    {
      label: "Aide",
      submenu: [
        {
          label: "Dépôt GitHub",
          click: async () => {
            await shell.openExternal("https://github.com/oriaagentpro-a11y/voix-off.git");
          },
        },
        {
          label: "Documentation Google Gemini TTS",
          click: async () => {
            await shell.openExternal("https://ai.google.dev/docs");
          },
        },
        { type: "separator" },
        {
          label: "À propos de VoxStudio Pro",
          click: () => {
            win.webContents.send("open-about-modal");
          },
        },
      ] as MenuItemConstructorOptions[],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function createMainWindow() {
  const iconBase = path.join(app.getAppPath(), "electron/assets");
  const iconPath =
    process.platform === "win32"
      ? path.join(iconBase, "icon.ico")
      : path.join(iconBase, "icon.png");

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    title: "VoxStudio Pro — Studio de voix off",
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0e0f0f" : "#f4f4f1", // Fond du thème courant : évite un flash au démarrage
    icon: iconPath,
    show: false, // Affichage progressif dès que le DOM est prêt
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  createStudioMenu(mainWindow);

  // Redirection des liens externes vers le navigateur par défaut de l'utilisateur
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const isLocal =
      url.startsWith("http://localhost:") ||
      url.startsWith("http://127.0.0.1:") ||
      url.startsWith("file://");
    if (!isLocal) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Chargement de l'URL appropriée (Dev ou Production embarquée)
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (isDev) {
    await mainWindow.loadURL("http://localhost:3000");
  } else {
    // Mode production autonome : démarrer le serveur embarqué
    const port = await startEmbeddedServer();
    await mainWindow.loadURL(`http://127.0.0.1:${port}`);
  }
}

// IPC Handlers
ipcMain.handle("open-external", async (_event, url: string) => {
  if (typeof url === "string" && (url.startsWith("https://") || url.startsWith("http://"))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

ipcMain.on("window-minimize", () => {
  mainWindow?.minimize();
});

ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on("window-close", () => {
  mainWindow?.close();
});

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (embeddedServer) {
    console.log("Fermeture du serveur embarqué VoxStudio...");
    embeddedServer.close();
  }
});
