# Backlog — Remote Mouse Controller

Analyse complète de l'app (01 Juin 2026). Classée par priorité et aspect.

---

## 🔴 Bugs critiques

### Texte français cassé — `pyautogui.typewrite()`
- **Fichier** : `remote mouse/server/server.py` — handler `type`
- **Problème** : `typewrite()` ne supporte pas les caractères non-ASCII. Taper `é`, `à`, `ç` ne fonctionne pas.
- **Fix** : passer par le presse-papier — copier le texte via `pyperclip` puis envoyer `Ctrl+V`.

### ~~Clic gauche fantôme après scroll 2 doigts~~ ✅ Résolu (02/06/2026)
- `handleTouchEnd` reçoit maintenant l'event — si `e.touches.length > 0` (un doigt encore posé), on ignore le relâchement. Guard `!isScrolling.current` ajouté avant le tap-to-click.

### ~~Scroll 2 doigts lit `touches[0]` au lieu de la moyenne~~ ✅ Résolu (02/06/2026)
- `handleTouchStart` et `handleTouchMove` utilisent désormais `(touches[0].pageY + touches[1].pageY) / 2`.

---

## 🟠 Problèmes importants

### ~~Focus perdu sur le clavier iOS~~ ✅ Résolu (02/06/2026)
- `onMouseDown={e => e.preventDefault()}` sur tous les boutons spéciaux + flèches. `inputRef.current?.focus()` dans `pressKey` en filet de sécurité iOS.

### Connexions multiples non bloquées — `server.py` ⏭ Non retenu
- Remplacé par un système de mot de passe (voir ci-dessous).

### ~~Mot de passe d'accès~~ ✅ Implémenté (02/06/2026)
- `.env` → `APP_PASSWORD=...` lu par `python-dotenv`
- `server.py` : guard auth par connexion, toute commande ignorée avant `auth_ok`
- `useWebSocket.ts` : `authenticate()`, auto-auth à la reconnexion depuis `localStorage`/`sessionStorage`
- `PasswordScreen.tsx` : UI dark, champ mdp, boutons Permanent / Temporaire, message d'erreur
- **Permanent** = `localStorage` (mémorisé même après fermeture du navigateur)
- **Temporaire** = `sessionStorage` (oublié à la fermeture de l'onglet)

### Latence mouvement — `pyautogui` vs `pynput`
- **Fichier** : `remote mouse/server/server.py` — handler `move`
- **Problème** : `pyautogui.moveRel()` a une latence ~10-20ms par appel (il récupère la position courante avant de déplacer). Sur les mouvements rapides ça se ressent.
- **Fix** : remplacer par `pynput.mouse.Controller().move(dx, dy)` — direct, sans overhead.

### Aucune guidance à l'écran "Hors ligne"
- **Fichier** : `remote mouse/client/src/App.tsx`
- **Problème** : quand le WebSocket ne répond pas, l'utilisateur voit un point rouge sans information. Pas d'IP affichée, pas de bouton d'aide.
- **Fix** : afficher l'URL/IP attendue + un bouton "Réessayer" + éventuellement un QR code généré côté serveur pour ouvrir automatiquement la bonne URL.

### ~~Aucune validation des données reçues~~ ✅ Résolu (02/06/2026)
- Helpers `valid_delta` (float borné ±2000, rejet NaN/Infinity), `valid_button` (whitelist left/right), `valid_key` (string nettoyée, max 40 chars), `valid_keys` (liste, max 6 touches). Toutes les entrées pyautogui passent par ces guards.

---

## 🔵 Améliorations qualité

### `FAILSAFE = False` risqué — `server.py`
- **Fichier** : `remote mouse/server/server.py`
- **Problème** : si la connexion plante avec un `mouseDown` actif, la souris reste bloquée sans moyen d'urgence.
- **Fix** : réactiver le failsafe ET implémenter un timeout côté serveur qui envoie un `mouseUp` automatique si aucun message n'arrive depuis 5 secondes.

### ~~Sensibilité non persistée~~ ✅ Résolu (02/06/2026)
- `useState` initialisé depuis `localStorage`, `setItem` à chaque changement du slider.

### Icônes emoji dans la tab bar
- **Fichier** : `remote mouse/client/src/App.tsx` — tableau `TABS`
- **Problème** : `◉`, `⌨`, `♪` ont un rendu inconsistant entre iOS, Android et Windows.
- **Fix** : remplacer par des SVG inline (ex. Lucide Icons, ~2kb pour 3 icônes).

### Port WebSocket hardcodé
- **Fichiers** : `remote mouse/client/src/App.tsx` et `remote mouse/server/server.py`
- **Problème** : `8765` est en dur dans 2 fichiers séparés. Si le port change, il faut modifier les 2.
- **Fix** : fichier de config partagé ou variable d'environnement `WS_PORT`.

### ~~`color-scheme: dark` non déclaré~~ ✅ Résolu (02/06/2026)
- `color-scheme: dark` ajouté dans `:root` (index.css) et `<meta name="color-scheme" content="dark">` dans `index.html`.

### ~~Code mort — composants inutilisés~~ ✅ Résolu (02/06/2026)
- `ConnectionStatus.tsx` et `ActionBar.tsx` supprimés.

### ~~`lastMessage` exposé inutilement — `useWebSocket.ts`~~ ✅ Résolu (01/06/2026)
- Retiré lors de la réécriture complète du hook.

---

## 💡 Idées d'évolution (Phase 4+)

| Idée | Détail |
|---|---|
| Accélération trackpad | Courbe non-linéaire : `Math.pow(speed, 1.5)` — petits mouvements précis, grands mouvements rapides |
| Scroll naturel | Toggle pour inverser le sens du scroll (style macOS) |
| Geste à 3 doigts | Envoie Alt+Tab ou Win+Tab pour switcher les fenêtres |
| Swipe sur champ texte | Glisser à gauche = backspace, à droite = espace (comme les claviers mobiles) |
| Slider de volume | Remplacer les 3 boutons Vol+/Mute/Vol- par un vrai slider |
| QR code d'accès | Le serveur génère un QR code affichable sur le PC pour ouvrir directement la bonne URL |
| Code PIN connexion | Sécuriser l'accès avec un PIN affiché sur le PC à saisir sur le téléphone |
| Whitelist MAC/token | N'autoriser que les appareils connus |
| Service Windows | Lancer le serveur automatiquement au démarrage de Windows |
| Auto-découverte mDNS | Trouver le serveur automatiquement sans connaître l'IP |
