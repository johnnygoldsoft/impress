const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser"); // Installez avec npm install body-parser

const app = express();

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const ip = require("ip"); // Installez avec npm install ip

// Middleware pour parser le JSON
app.use(bodyParser.json());

// Création des dossiers s'ils n'existent pas
const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("Dossier uploads créé.");
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log("Dossier data créé.");

  // Créer un fichier pour stocker les données des fichiers imprimés
  fs.writeFileSync(
    path.join(dataDir, "printed.json"),
    JSON.stringify([]),
    "utf8"
  );
}

// Fonction d'aide pour lire/écrire les fichiers de données
function readPrintedFiles() {
  try {
    const data = fs.readFileSync(path.join(dataDir, "printed.json"), "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erreur lecture fichiers imprimés:", err);
    return [];
  }
}

function savePrintedFiles(files) {
  try {
    fs.writeFileSync(
      path.join(dataDir, "printed.json"),
      JSON.stringify(files),
      "utf8"
    );
    return true;
  } catch (err) {
    console.error("Erreur sauvegarde fichiers imprimés:", err);
    return false;
  }
}

// Configuration du stockage pour multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, baseName + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadsDir)); // Servir les fichiers uploadés

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/upload", upload.single("file"), (req, res) => {
  console.log("Fichier reçu :", req.file);
  if (req.file) {
    // Créer un objet avec les métadonnées du fichier
    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      clientName: req.body.clientName || "Client",
      options: {
        rectoVerso: req.body.rectoVerso === "on",
        couleur: req.body.couleur === "on",
        copies: parseInt(req.body.copies) || 1,
      },
      uploadedAt: new Date().toISOString(),
    };

    io.emit("new-file", fileInfo); // Émet l'événement avec les métadonnées
  }
  res.redirect("/");
});

app.get("/files", (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error("Erreur lecture dossier uploads :", err);
      return res
        .status(500)
        .json({ error: "Impossible de récupérer les fichiers." });
    }

    // Filtrer pour ne pas renvoyer les fichiers déjà imprimés
    const printedFiles = readPrintedFiles();
    const printedFilenames = printedFiles.map((file) => file.filename);

    // Convertir la liste de fichiers en objets avec métadonnées (simples pour le moment)
    const pendingFiles = files
      .filter((filename) => !printedFilenames.includes(filename))
      .map((filename) => ({
        filename,
        clientName: "Client", // Par défaut
        options: {},
      }));

    res.json(pendingFiles);
  });
});

app.get("/printed-files", (req, res) => {
  const printedFiles = readPrintedFiles();
  res.json(printedFiles);
});

// Nouvel endpoint pour marquer un fichier comme imprimé
app.post("/print", (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: "Nom de fichier requis" });
  }

  // Lire la liste des fichiers en attente
  fs.readdir(uploadsDir, (err, files) => {
    if (err || !files.includes(filename)) {
      return res.status(404).json({ error: "Fichier non trouvé" });
    }

    // Ajouter aux fichiers imprimés
    const printedFiles = readPrintedFiles();

    // Vérifier si le fichier n'est pas déjà marqué comme imprimé
    if (!printedFiles.some((file) => file.filename === filename)) {
      printedFiles.push({
        filename,
        clientName: "Client", // À améliorer avec les métadonnées réelles
        options: {},
        printedAt: new Date().toISOString(),
      });

      savePrintedFiles(printedFiles);

      // Notifier tous les clients
      io.emit("file-printed", filename);
    }

    res.json({ success: true });
  });
});

// Nouvel endpoint pour imprimer plusieurs fichiers
app.post("/print-multiple", (req, res) => {
  const { filenames } = req.body;

  if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
    return res.status(400).json({ error: "Liste de fichiers requise" });
  }

  // Lire la liste des fichiers en attente
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Erreur lecture fichiers" });
    }

    const printedFiles = readPrintedFiles();
    const now = new Date().toISOString();

    // Traiter chaque fichier
    filenames.forEach((filename) => {
      if (
        files.includes(filename) &&
        !printedFiles.some((file) => file.filename === filename)
      ) {
        printedFiles.push({
          filename,
          clientName: "Client",
          options: {},
          printedAt: now,
        });

        // Notifier tous les clients
        io.emit("file-printed", filename);
      }
    });

    savePrintedFiles(printedFiles);
    res.json({ success: true });
  });
});

// Nouvel endpoint pour supprimer les fichiers imprimés de l'historique
app.post("/clear-printed", (req, res) => {
  savePrintedFiles([]);
  io.emit("printed-cleared");
  res.json({ success: true });
});

// Endpoint pour récupérer les informations du serveur (IP, port)
app.get("/server-info", (req, res) => {
  const localIP = ip.address();
  const port = req.socket.localPort;

  res.json({
    localIP,
    port,
    networkUrl: `http://${localIP}:${port}`,
  });
});

module.exports = { app, server };
