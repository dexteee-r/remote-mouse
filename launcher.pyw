#! python3
"""
Remote Mouse Controller — Launcher
Double-clic (ou .exe) pour demarrer. Aucune fenetre de terminal.
Sert l'interface web + le serveur WebSocket, le tout in-process.
Compatible mode gele PyInstaller (.exe autonome).
"""

import sys
import os

# ── Detection du mode (dev vs .exe gele) + chemins ──────────────────────────

FROZEN = getattr(sys, "frozen", False)

if FROZEN:
    RUNTIME_DIR = os.path.dirname(sys.executable)      # dossier de l'.exe
    BUNDLE_DIR  = sys._MEIPASS                          # ressources embarquees
    CLIENT_DIST = os.path.join(BUNDLE_DIR, "dist")
else:
    RUNTIME_DIR = os.path.dirname(os.path.abspath(__file__))
    BUNDLE_DIR  = RUNTIME_DIR
    CLIENT_DIST = os.path.join(RUNTIME_DIR, "client", "dist")
    # Permet "import server" depuis le sous-dossier server/ en mode dev
    sys.path.insert(0, os.path.join(RUNTIME_DIR, "server"))

# Redirige les sorties vers un log (indispensable sans console)
_LOG_PATH = os.path.join(RUNTIME_DIR, "launcher.log")
try:
    sys.stderr = open(_LOG_PATH, "w", encoding="utf-8")
    sys.stdout = sys.stderr
except Exception:
    pass

import asyncio
import threading
import webbrowser
import socket
import time
import ctypes

import pystray
from PIL import Image, ImageDraw

WS_PORT   = 8765
HTTP_PORT = 6180

# ── Etat global ─────────────────────────────────────────────────────────────

_ws_loop     = None
_ws_stop     = None
_http_server = None


# ── Utilitaires ─────────────────────────────────────────────────────────────

def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"


def create_icon(size: int = 64) -> Image.Image:
    img  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([2, 2, size - 2, size - 2], fill=(10, 132, 255, 255))
    mx, my = size // 2, size // 2
    draw.rounded_rectangle([mx - 10, my - 14, mx + 10, my + 14], radius=8, fill=(255, 255, 255, 230))
    draw.line([(mx - 10, my - 4), (mx + 10, my - 4)], fill=(10, 132, 255, 200), width=2)
    draw.rounded_rectangle([mx - 3, my - 13, mx + 3, my - 6], radius=2, fill=(10, 132, 255, 210))
    return img


def ensure_env() -> bool:
    """En mode gele, cree un .env par defaut a cote de l'.exe s'il manque.
    Retourne True si un fichier par defaut vient d'etre cree."""
    if not FROZEN:
        return False
    env_path = os.path.join(RUNTIME_DIR, ".env")
    if not os.path.exists(env_path):
        try:
            with open(env_path, "w", encoding="utf-8") as f:
                f.write("APP_PASSWORD=change_me\n")
            return True
        except Exception:
            return False
    return False


def _ensure_build():
    """Mode dev uniquement : build le client si dist/ est absent."""
    if FROZEN:
        return
    if os.path.isdir(CLIENT_DIST) and os.listdir(CLIENT_DIST):
        return
    import subprocess
    npm   = "npm.cmd" if sys.platform == "win32" else "npm"
    flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
    subprocess.run(
        [npm, "run", "build"],
        cwd=os.path.join(RUNTIME_DIR, "client"),
        creationflags=flags,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True,
    )


# ── Serveur HTTP statique (interface web) ───────────────────────────────────

from http.server import HTTPServer, SimpleHTTPRequestHandler
from functools import partial


class _SilentHTTPHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass


class _ReuseHTTPServer(HTTPServer):
    allow_reuse_address = True


def _run_http():
    global _http_server
    handler = partial(_SilentHTTPHandler, directory=CLIENT_DIST)
    _http_server = _ReuseHTTPServer(("0.0.0.0", HTTP_PORT), handler)
    _http_server.serve_forever()


# ── Serveur WebSocket (in-process, dans un thread dedie) ────────────────────

def _run_ws():
    global _ws_loop, _ws_stop
    import server
    import websockets

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    _ws_loop = loop

    async def runner():
        global _ws_stop
        _ws_stop = loop.create_future()
        async with websockets.serve(server.handle_client, "0.0.0.0", server.get_port()):
            await _ws_stop

    try:
        loop.run_until_complete(runner())
    except Exception as e:
        print(f"[launcher] WS server stopped: {e}")
    finally:
        loop.close()


def start_servers():
    threading.Thread(target=_run_ws, daemon=True).start()
    threading.Thread(target=_run_http, daemon=True).start()


def stop_servers():
    global _ws_loop, _ws_stop, _http_server
    if _ws_loop and _ws_stop and not _ws_stop.done():
        _ws_loop.call_soon_threadsafe(_ws_stop.set_result, None)
    _ws_loop = None
    _ws_stop = None
    if _http_server:
        _http_server.shutdown()
        _http_server = None


# ── Actions tray ────────────────────────────────────────────────────────────

def on_open(icon, item):
    webbrowser.open(f"http://{get_local_ip()}:{HTTP_PORT}")


def on_restart(icon, item):
    stop_servers()
    time.sleep(0.5)
    start_servers()


def on_quit(icon, item):
    stop_servers()
    icon.stop()


# ── Point d'entree ──────────────────────────────────────────────────────────

def main():
    print(f"[launcher] Python {sys.version} | frozen={FROZEN}", flush=True)
    print(f"[launcher] RUNTIME_DIR = {RUNTIME_DIR}", flush=True)
    print(f"[launcher] CLIENT_DIST = {CLIENT_DIST}", flush=True)

    created_default = ensure_env()
    _ensure_build()
    start_servers()

    if created_default:
        ctypes.windll.user32.MessageBoxW(
            0,
            "Aucun mot de passe n'etait configure.\n\n"
            "Un fichier .env a ete cree a cote de l'application avec le mot "
            "de passe par defaut \"change_me\".\n\n"
            "Modifiez-le puis utilisez \"Redemarrer\" dans le menu de l'icone.",
            "Remote Mouse",
            0x40,  # MB_ICONINFORMATION
        )

    def _delayed_open():
        time.sleep(1.5)
        webbrowser.open(f"http://{get_local_ip()}:{HTTP_PORT}")

    threading.Thread(target=_delayed_open, daemon=True).start()

    ip = get_local_ip()
    menu = pystray.Menu(
        pystray.MenuItem(f"Remote Mouse  ·  {ip}:{HTTP_PORT}", None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Ouvrir dans le navigateur", on_open, default=True),
        pystray.MenuItem("Redemarrer les serveurs",   on_restart),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Quitter", on_quit),
    )

    tray = pystray.Icon(
        name="remote_mouse",
        icon=create_icon(),
        title="Remote Mouse",
        menu=menu,
    )
    tray.run()


if __name__ == "__main__":
    main()
