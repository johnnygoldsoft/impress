# Kiosque - Gestion des Fichiers

Une application de gestion des fichiers avec **Electron** et **Express**. Cette application permet d'uploader des fichiers et de les afficher dans une interface intuitive.

## Fonctionnalités

- **Uploader des fichiers** : Téléchargez facilement des fichiers via l'interface utilisateur.
- **Visualiser les fichiers uploadés** : Liste des fichiers dans un affichage organisé.
- **Application Desktop** : Déployée avec Electron.

## Technologies utilisées

- **Electron** : Interface desktop.
- **Express.js** : Backend pour gérer les uploads.
- **Tailwind CSS** : Framework CSS pour le design.
- **Multer** : Gestion des uploads de fichiers.

## Prérequis

- [Node.js](https://nodejs.org/) (version 14 ou plus récente)
- [npm](https://www.npmjs.com/)

## Installation

1. Clonez le dépôt :

   ```bash
   git clone https://github.com/johnnygoldsoft/impress.git
   cd votre-projet
   ```

2. Installez les dépendances :

   ```bash
   npm install
   ```

3. Configurez les styles Tailwind :

   ```bash
   npx tailwindcss init
   ```

4. Générez les styles CSS :

   ```bash
   npm run build:css
   ```

5. Lancez l'application :

   ```bash
   npm start
   ```

## Structure du projet

```
.
├── public/             # Fichiers statiques (HTML, CSS généré)
├── src/                # Fichiers sources (styles Tailwind, etc.)
├── server.js           # Serveur Express
├── main.js             # Main process Electron
├── package.json        # Dépendances et scripts npm
├── tailwind.config.js  # Configuration Tailwind
├── .gitignore          # Fichiers à ignorer par Git
└── README.md           # Documentation du projet
```

## Prochaines étapes

- Ajouter des tests automatisés.
- Implémenter la suppression de fichiers depuis l'interface utilisateur.
- Optimiser les performances pour les gros fichiers.

## Contribuer

Les contributions sont les bienvenues ! Si vous souhaitez contribuer, veuillez ouvrir une issue ou une pull request.

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
