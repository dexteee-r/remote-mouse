#! python3
"""
Remote Mouse Controller — Launcher
Double-clic pour démarrer. Aucune fenêtre de terminal.
Gère le serveur WebSocket + le serveur HTTP statique.
Icône dans la barre des tâches (system tray) pour tout contrôler.
"""

import sys
import os

# Redirige les erreurs vers un fichier log (indispensable en mode sans console)
_LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'launcher.log')
sys.stderr = open(_LOG_PATH, 'w', encoding='utf-8')
sys.stdout = sys.stderr
import subprocess
import threading
import webbrowser
import socket
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from functools import partial

import pystray
from PIL import Image, ImageDraw

# ── Chemins ───────────────────────────────────────────────────────────────────

BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
SERVER_PY   = os.path.join(BASE_DIR, 'server', 'server.py')
CLIENT_DIST = os.path.join(BASE_DIR, 'client', 'dist')
CLIENT_DIR  = os.path.join(BASE_DIR, 'client')

WS_PORT   = 8765
HTTP_PORT = 6180

# ── État global ───────────────────────────────────────────────────────────────

_ws_process  = None
_http_server = None

# ── Utilitaires ───────────────────────────────────────────────────────────────

def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return 'localhost'


def create_icon(size: int = 64) -> Image.Image:
    img  = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Fond bleu
    draw.ellipse([2, 2, size - 2, size - 2], fill=(10, 132, 255, 255))
    # Corps de la souris (blanc)
    mx, my = size // 2, size // 2
    draw.rounded_rectangle([mx - 10, my - 14, mx + 10, my + 14], radius=8, fill=(255, 255, 255, 230))
    # Séparateur boutons
    draw.line([(mx - 10, my - 4), (mx + 10, my - 4)], fill=(10, 132, 255, 200), width=2)
    # Molette
    draw.rounded_rectangle([mx - 3, my - 13, mx + 3, my - 6], radius=2, fill=(10, 132, 255, 210))
    return img


class _SilentHTTPHandler(SimpleHTTPRequestHandler):
    """Handler HTTP sans logs."""
    def log_message(self, fmt, *args):
        pass


class _ReuseHTTPServer(HTTPServer):
    allow_reuse_address = True


def _ensure_build():
    """Build le client React si dist/ est absent ou vide."""
    if os.path.isdir(CLIENT_DIST) and os.listdir(CLIENT_DIST):
        return
    npm   = 'npm.cmd' if sys.platform == 'win32' else 'npm'
    flags = subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
    subprocess.run(
        [npm, 'run', 'build'],
        cwd=CLIENT_DIR,
        creationflags=flags,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True,
    )

# ── Gestion des serveurs ──────────────────────────────────────────────────────

def _run_http():
    global _http_server
    handler = partial(_SilentHTTPHandler, directory=CLIENT_DIST)
    _http_server = _ReuseHTTPServer(('0.0.0.0', HTTP_PORT), handler)
    _http_server.serve_forever()


def start_servers():
    global _ws_process
    flags = subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
    _ws_process = subprocess.Popen(
        [sys.executable, SERVER_PY],
        creationflags=flags,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    threading.Thread(target=_run_http, daemon=True).start()


def stop_servers():
    global _ws_process, _http_server
    if _ws_process:
        _ws_process.terminate()
        try:
            _ws_process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            _ws_process.kill()
        _ws_process = None
    if _http_server:
        _http_server.shutdown()
        _http_server = None

# ── Actions tray ──────────────────────────────────────────────────────────────

def on_open(icon, item):
    webbrowser.open(f'http://{get_local_ip()}:{HTTP_PORT}')


def on_restart(icon, item):
    stop_servers()
    time.sleep(0.5)
    start_servers()


def on_quit(icon, item):
    stop_servers()
    icon.stop()

# ── Point d'entrée ────────────────────────────────────────────────────────────

def main():
    print(f'[launcher] Python {sys.version}', flush=True)
    print(f'[launcher] BASE_DIR = {BASE_DIR}', flush=True)
    _ensure_build()
    start_servers()

    # Ouvre le navigateur après 1.5s (laisse le temps aux serveurs de démarrer)
    def _delayed_open():
        time.sleep(1.5)
        webbrowser.open(f'http://{get_local_ip()}:{HTTP_PORT}')

    threading.Thread(target=_delayed_open, daemon=True).start()

    ip = get_local_ip()
    menu = pystray.Menu(
        pystray.MenuItem(f'Remote Mouse  ·  {ip}:{HTTP_PORT}', None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem('Ouvrir dans le navigateur', on_open, default=True),
        pystray.MenuItem('Redémarrer les serveurs',   on_restart),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem('Quitter', on_quit),
    )

    tray = pystray.Icon(
        name='remote_mouse',
        icon=create_icon(),
        title='Remote Mouse',
        menu=menu,
    )
    tray.run()


if __name__ == '__main__':
    main()
