// Modifications à apporter dans main.js pour l'accès réseau

const { app: electronApp, BrowserWindow } = require("electron");
const path = require("path");
const { app, server } = require("./server");
const portfinder = require("portfinder");
const ip = require("ip"); // Ajoutez cette dépendance avec npm install ip

let mainWindow;
let serverInstance;
let port;

function createWindow() {
  const localIP = ip.address(); // Obtient l'adresse IP locale de la machine

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${port}`);

  // Affiche l'URL d'accès pour les clients
  console.log(`🌐 URL d'accès pour les clients: http://${localIP}:${port}`);

  // Vous pourriez afficher cela dans l'interface également
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.executeJavaScript(`
      // Ajouter l'URL en haut de la page
      const header = document.querySelector('header');
      const accessUrlDiv = document.createElement('div');
      accessUrlDiv.className = 'mt-2 p-2 bg-blue-100 rounded-lg';
      accessUrlDiv.innerHTML = '<p class="text-sm">URL pour vos clients: <span class="font-bold">http://${localIP}:${port}</span></p>';
      header.appendChild(accessUrlDiv);
    `);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (serverInstance) {
      serverInstance.close(() => {
        console.log("Serveur arrêté");
      });
      serverInstance = null;
    }
  });
}

electronApp.whenReady().then(async () => {
  try {
    // Trouver un port disponible
    port = await portfinder.getPortPromise({ port: 80 });

    // Lier le serveur à toutes les interfaces réseau (0.0.0.0) au lieu de localhost
    serverInstance = server.listen(port, "0.0.0.0", () => {
      const localIP = ip.address();
      console.log(`Serveur démarré sur http://localhost:${port}`);
      console.log(`Accessible depuis le réseau à http://${localIP}:${port}`);
      createWindow();
    });
  } catch (err) {
    console.error("Erreur lors de la détection du port :", err);
  }
});

electronApp.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electronApp.quit();
  }
});

electronApp.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
