# 📝 Remote Mouse Controller - TODO List

Ce fichier liste les évolutions prévues pour transformer ce MVP en une application complète de contrôle à distance.

---

## 🚀 Phase 1 : Améliorations de l'Expérience Utilisateur (UX)
- [x] **Support Clavier** : Ajout d'une zone de saisie et boutons spéciaux (Enter, Backspace).
- [x] **Mode Paysage** : Layout optimisé (flex-direction row) pour une utilisation large.
- [x] **Haptic Feedback** : Vibrations sur clics, scrolls et clavier.
- [x] **Sensibilité configurable** : Slider ajouté pour ajuster la vitesse du curseur.
- [x] **Tap-to-click** : Toucher le trackpad simule un clic gauche.

## 🛠️ Phase 2 : Fonctionnalités Avancées
- [x] **Touches multimédia** : Boutons Volume Up/Down/Mute, Play/Pause/Next/Previous/Stop.
- [x] **Raccourcis Système** : Win+D, Alt+Tab, Ctrl+C/V/Z/A.
- [x] **Refonte UI/UX mobile** : Navigation par onglets (tab bar), trackpad style laptop avec barre de clic gauche/droite intégrée.
- [x] **Click & Hold (drag)** : Appui long 450ms → mouseDown maintenu → déplacement = drag → relâcher = mouseUp.

## 📊 Phase 3 : Dashboard & Stats (Aligné sur Phase 4 du projet global)
- [ ] **Stats d'utilisation** : Enregistrer le nombre de clics et la distance parcourue par la souris.
- [ ] **Monitoring Système** : Afficher l'usage CPU/RAM du PC directement sur l'iPhone.
- [ ] **Preview d'écran** : Envoyer une capture d'écran (basse résolution) périodique pour voir ce qu'on contrôle (mode "Remote Desktop" léger).

## ⚙️ Phase 5 : Infrastructure & Lancement
- [x] **Revoir le lancement de l'app** : `launcher.pyw` — double-clic, aucun terminal visible. Lance le serveur WebSocket + sert `client/dist/` en HTTP statique. Icône system tray (ouvrir navigateur, redémarrer, quitter). Build React auto si `dist/` absent.

## 🔒 Phase 4 : Sécurité & Connectivité
- [ ] **Auto-découverte** : Utiliser Zeroconf/mDNS pour que l'iPhone trouve le serveur sans taper l'IP manuellement.
- [ ] **Code PIN** : Ajouter une authentification simple à la connexion pour éviter qu'un autre membre du Wi-Fi ne prenne le contrôle.
- [ ] **Whitelist d'appareils** : Restreindre l'accès au site et au serveur WebSocket aux seuls appareils autorisés (via adresse MAC, User-Agent, ou token d'appareil persistant).
- [ ] **Service Windows** : Créer un script pour que le serveur Python se lance automatiquement au démarrage du PC.


## AUTRE TACHES : 

- [ ] ajouter du PWA à la web page
- [ ] changer ico de l'app 
---
*Dernière mise à jour : 07 Mai 2026*
