import asyncio
import math
import os
import sys
import websockets
import json
import pyautogui
from dotenv import load_dotenv


# ── Resolution du .env (compatible mode gele PyInstaller) ───────────────────
# - En .exe gele : .env est lu A COTE de l'executable.
# - En dev       : .env est lu a cote de server.py (dossier server/).

def _runtime_dir() -> str:
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


ENV_PATH = os.path.join(_runtime_dir(), ".env")

# Disable PyAutoGUI fail-safe (useful for remote control)
pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0

VALID_BUTTONS = {"left", "right"}
MAX_DELTA     = 2000
MAX_TEXT_LEN  = 500
MAX_KEY_LEN   = 40
MAX_HOTKEYS   = 6
SCROLL_FACTOR = 20

# Accumulateur de scroll : conserve la fraction de cran non envoyee
# pour que les petits mouvements ne soient jamais perdus par l'arrondi.
_scroll_acc = 0.0


# ── Configuration lue paresseusement (rechargee a chaque appel) ─────────────
# Permet de prendre en compte un .env cree/modifie APRES le demarrage.

def get_port() -> int:
    load_dotenv(ENV_PATH, override=True)
    try:
        return int(os.getenv("WS_PORT", "8765"))
    except (TypeError, ValueError):
        return 8765


def get_password() -> str:
    load_dotenv(ENV_PATH, override=True)
    return os.getenv("APP_PASSWORD", "")


PORT = get_port()


# ── Validation helpers ──────────────────────────────────────────────────────

def valid_delta(value, default=0) -> float:
    try:
        v = float(value)
    except (TypeError, ValueError):
        return float(default)
    if not math.isfinite(v):
        return float(default)
    return max(-MAX_DELTA, min(MAX_DELTA, v))


def valid_button(value) -> str:
    return value if value in VALID_BUTTONS else "left"


def valid_key(value):
    if not isinstance(value, str):
        return None
    cleaned = value.strip()[:MAX_KEY_LEN]
    return cleaned if cleaned else None


def valid_keys(value):
    if not isinstance(value, list):
        return []
    return [k for k in (valid_key(k) for k in value[:MAX_HOTKEYS]) if k]


# ── Client handler ──────────────────────────────────────────────────────────

async def handle_client(websocket):
    print(f"[SERVER] Client connected from {websocket.remote_address}")
    await websocket.send(json.dumps({"type": "status", "message": "Connected. Auth required."}))

    authenticated = False

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                msg_type = data.get("type")

                # ── Auth ──────────────────────────────────────────────────
                if msg_type == "auth":
                    received = data.get("password", "")
                    password = get_password()
                    if password and received == password:
                        authenticated = True
                        await websocket.send(json.dumps({"type": "auth_ok"}))
                        print(f"[SERVER] Auth OK from {websocket.remote_address}")
                    else:
                        await websocket.send(json.dumps({"type": "auth_fail"}))
                        print(f"[SERVER] Auth FAIL from {websocket.remote_address}")
                    continue

                # ── Guard : toutes les commandes necessitent l'auth ───────
                if not authenticated:
                    await websocket.send(json.dumps({"type": "auth_required"}))
                    continue

                # ── Commandes ─────────────────────────────────────────────
                if msg_type == "ping":
                    await websocket.send(json.dumps({"type": "pong"}))

                elif msg_type == "move":
                    dx = valid_delta(data.get("dx", 0))
                    dy = valid_delta(data.get("dy", 0))
                    pyautogui.moveRel(dx, dy)

                elif msg_type == "click":
                    pyautogui.click(button=valid_button(data.get("button")))

                elif msg_type == "dblclick":
                    pyautogui.doubleClick()

                elif msg_type == "scroll":
                    global _scroll_acc
                    dy = valid_delta(data.get("dy", 0))
                    _scroll_acc += dy * SCROLL_FACTOR
                    clicks = int(_scroll_acc)      # tronque vers 0
                    _scroll_acc -= clicks          # garde le reste fractionnaire
                    if clicks:
                        pyautogui.scroll(clicks)

                elif msg_type == "type":
                    text = data.get("text", "")
                    if isinstance(text, str) and text:
                        pyautogui.typewrite(text[:MAX_TEXT_LEN])

                elif msg_type == "key":
                    key = valid_key(data.get("key"))
                    if key:
                        pyautogui.press(key)

                elif msg_type == "hotkey":
                    keys = valid_keys(data.get("keys", []))
                    if keys:
                        pyautogui.hotkey(*keys)

                elif msg_type == "mousedown":
                    pyautogui.mouseDown(button=valid_button(data.get("button")))

                elif msg_type == "mouseup":
                    pyautogui.mouseUp(button=valid_button(data.get("button")))

            except Exception as e:
                print(f"[SERVER] Error processing message: {e}")

    except websockets.exceptions.ConnectionClosed:
        print("[SERVER] Client disconnected")


# ── Execution autonome (mode dev : python server.py) ────────────────────────

async def main():
    port = get_port()
    print(f"[SERVER] Python WebSocket server listening on ws://0.0.0.0:{port}")
    async with websockets.serve(handle_client, "0.0.0.0", port):
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[SERVER] Server stopped.")
