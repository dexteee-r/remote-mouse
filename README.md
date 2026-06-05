# 🖱️ Remote Mouse Controller

Contrôlez la souris et le clavier de votre PC Windows depuis votre téléphone, via le réseau Wi-Fi local. L'interface est une **PWA** (application web installable) : pas d'app à télécharger sur un store, il suffit d'ouvrir une page web depuis le navigateur du téléphone.

---

## ✨ Fonctionnalités

- **Trackpad** — déplacement du curseur, clic gauche/droit, double-clic, scroll à 2 doigts, glisser-déposer (appui long)
- **Clavier** — saisie de texte + touches spéciales (Entrée, Tab, flèches, Échap…)
- **Média** — lecture/pause, volume, raccourcis (Alt+Tab, Win+D, Ctrl+C/V/Z…)
- **Sécurité** — accès protégé par mot de passe
- **PWA** — installable sur l'écran d'accueil, reconnexion automatique
- **Icône system tray** — démarre/arrête tout depuis la barre des tâches Windows

---

## 🧱 Comment ça marche

Trois composants tournent sur le PC :

| Composant | Rôle | Port |
| :--- | :--- | :--- |
| **Serveur** (`server/server.py`) | Reçoit les commandes WebSocket et pilote la souris/clavier via `pyautogui` | `8765` |
| **Serveur HTTP** (`launcher.pyw`) | Sert l'interface web (le `client/dist/`) | `6180` |
| **Client** (`client/`) | PWA React/Vite affichée sur le téléphone | — |

Le téléphone et le PC doivent être **sur le même réseau Wi-Fi**.

---

## 📋 Prérequis

- **Windows 10/11**
- **[Python 3.10+](https://www.python.org/downloads/)** — ⚠️ cocher **« Add Python to PATH »** à l'installation
- **[Node.js 20+](https://nodejs.org/)** — nécessaire uniquement pour compiler l'interface (build)

---

## 🚀 Installation

### Méthode rapide (recommandée)

```bash
git clone https://github.com/dexteee-r/remote-mouse.git
cd remote-mouse
```

Puis **double-cliquez sur `install.bat`**. Le script :
- vérifie que Python et Node.js sont présents,
- installe les dépendances Python et compile l'interface web,
- vous demande un mot de passe d'accès et crée `server\.env`,
- propose de générer une **application autonome** et un **raccourci bureau**.

### Application autonome (.exe) — optionnel

À la fin de `install.bat`, vous pouvez générer un **`RemoteMouse.exe` autonome**
(placé dans le dossier parent) via PyInstaller. Cet exécutable :
- embarque tout (serveur, interface, dépendances),
- **ne nécessite ni Python ni Node** sur le PC où il s'exécute,
- lit son mot de passe dans un fichier `.env` placé **à côté de lui**.

> 📦 **Déploiement sur un autre PC** : copiez simplement `RemoteMouse.exe`
> et son `.env` dans le même dossier, puis double-cliquez. Rien d'autre à installer.

### Méthode manuelle

```bash
git clone https://github.com/dexteee-r/remote-mouse.git
cd remote-mouse

# Dépendances Python
pip install -r requirements.txt

# Client web (installation + compilation)
cd client
npm install
npm run build
cd ..

# Mot de passe d'accès
copy server\.env.example server\.env
```

Ouvrez ensuite `server\.env` et remplacez la valeur :

```
APP_PASSWORD=votre_mot_de_passe_ici
```

---

## ▶️ Lancement

**Double-cliquez sur `start.vbs`.**

- Une icône souris apparaît dans la barre des tâches (system tray)
- Le navigateur s'ouvre automatiquement sur l'interface
- Aucune fenêtre de terminal n'est affichée

### Se connecter depuis le téléphone

1. Faites un clic droit sur l'icône tray → l'adresse y est affichée (ex. `192.168.1.42:6180`)
2. Sur le téléphone (même Wi-Fi), ouvrez cette adresse dans le navigateur
3. Entrez le mot de passe, choisissez **Permanent** (mémorisé) ou **Temporaire**
4. (Optionnel) « Ajouter à l'écran d'accueil » pour l'installer comme une app

> 💡 **Astuce** : pour lancer Remote Mouse au démarrage de Windows, placez un raccourci de `start.vbs` dans le dossier `shell:startup`.

---

## 🛠️ Dépannage

| Problème | Solution |
| :--- | :--- |
| « Python introuvable » au lancement | Réinstallez Python en cochant **Add to PATH**, puis relancez `start.vbs` |
| Le téléphone affiche « Hors ligne » | Vérifiez que PC et téléphone sont sur le **même Wi-Fi**. Le pare-feu Windows peut bloquer les ports `8765`/`6180` — autorisez Python à la première demande. |
| « Mot de passe incorrect » | Vérifiez `server\.env`. Après modification, redémarrez via l'icône tray → « Redémarrer les serveurs » |
| Les accents ne s'écrivent pas | Limitation connue de `pyautogui` (voir `BACKLOG.md`) |

---

## 📁 Structure du projet

```
remote-mouse/            ← racine du depot
├── install.bat         ← installation un-clic
├── start.vbs            ← point d'entree (double-clic)
├── launcher.pyw         ← orchestre serveurs + icone tray
├── requirements.txt     ← dependances Python
├── README.md
├── BACKLOG.md
├── server/
│   ├── server.py        ← serveur WebSocket (souris/clavier)
│   └── .env.example     ← modele de configuration
└── client/              ← interface PWA (React + Vite)
    ├── src/
    └── dist/            ← build genere (npm run build)
```
