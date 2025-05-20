// server.js avec restriction d'accès
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ip = require("ip"); // Module qu'il faut installer

const app = express();

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const os = require("os");

const desktopDir = path.join(os.homedir(), "Desktop");

// Chemin du dossier uploads sur le bureau
const uploadsDir = path.join(desktopDir, "uploads");

// Vérifier si le dossier existe, sinon le créer
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Dossier uploads créé sur le bureau.");
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

// Middleware pour restreindre l'accès uniquement depuis localhost
const restrictToLocalAccess = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;

  // Version stricte: autorise uniquement localhost
  if (
    clientIp === "127.0.0.1" ||
    clientIp === "::1" ||
    clientIp === "::ffff:127.0.0.1"
  ) {
    return next(); // Utilisateur autorisé
  }

  // Accès refusé pour toutes les autres IPs
  return res
    .status(403)
    .json({ error: "Accès interdit depuis une IP externe" });
};

app.use(express.static(path.join(__dirname, "public")));
// Protéger l'accès aux fichiers uploadés
app.use("/uploads", restrictToLocalAccess, express.static(uploadsDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html")); // Assurez-vous que le chemin est correct
});

app.post("/upload", upload.single("file"), (req, res) => {
  console.log("Fichier reçu :", req.file);
  if (req.file) {
    io.emit("new-file", req.file.filename); // Émet l'événement
  }
  res.redirect("/");
});

// Appliquer la restriction à la route /files
app.get("/files", restrictToLocalAccess, (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error("Erreur lecture dossier uploads :", err);
      return res
        .status(500)
        .json({ error: "Impossible de récupérer les fichiers." });
    }
    res.json(files);
  });
});

// Ne plus exporter l'app directement, mais exporter un objet avec app et server
module.exports = { app, server };
