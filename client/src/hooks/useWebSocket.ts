// client/src/hooks/useWebSocket.ts
import { useState, useEffect, useCallback, useRef } from 'react';

type WsStatus = 'connecting' | 'connected' | 'disconnected';

const PING_INTERVAL_MS  = 20_000;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS  = 30_000;
const STORAGE_KEY       = 'rmc_password';

export const useWebSocket = (serverUrl: string) => {
  const [status, setStatus]              = useState<WsStatus>('disconnected');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError]        = useState(false);

  const wsRef           = useRef<WebSocket | null>(null);
  const reconnectDelay  = useRef(RECONNECT_BASE_MS);
  const reconnectTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer       = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmounted       = useRef(false);

  const clearPing = () => {
    if (pingTimer.current) { clearInterval(pingTimer.current); pingTimer.current = null; }
  };
  const clearReconnect = () => {
    if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
  };

  // Envoie le mot de passe stocké dès que la connexion s'ouvre
  const tryAutoAuth = (socket: WebSocket) => {
    const stored = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      socket.send(JSON.stringify({ type: 'auth', password: stored }));
    }
  };

  const connect = useCallback(() => {
    if (unmounted.current) return;

    if (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    setStatus('connecting');
    setIsAuthenticated(false);
    const socket = new WebSocket(serverUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      if (unmounted.current) { socket.close(); return; }
      setStatus('connected');
      reconnectDelay.current = RECONNECT_BASE_MS;

      clearPing();
      pingTimer.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, PING_INTERVAL_MS);

      tryAutoAuth(socket);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'auth_ok') {
          setIsAuthenticated(true);
          setAuthError(false);
        } else if (data.type === 'auth_fail') {
          // Mot de passe stocké invalide (ex. changé côté serveur) → on nettoie
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(STORAGE_KEY);
          setIsAuthenticated(false);
          setAuthError(true);
        }
      } catch { /* messages non-JSON ignorés */ }
    };

    socket.onclose = () => {
      if (unmounted.current) return;
      clearPing();
      setStatus('disconnected');
      setIsAuthenticated(false);

      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, RECONNECT_MAX_MS);
        connect();
      }, reconnectDelay.current);
    };

    socket.onerror = () => { /* onclose suit immédiatement */ };
  }, [serverUrl]);

  useEffect(() => {
    unmounted.current = false;
    connect();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const ws = wsRef.current;
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          clearReconnect();
          reconnectDelay.current = RECONNECT_BASE_MS;
          connect();
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      unmounted.current = true;
      clearPing();
      clearReconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      wsRef.current?.close();
    };
  }, [connect]);

  // Appelé depuis PasswordScreen
  const authenticate = useCallback((password: string, permanent: boolean) => {
    setAuthError(false);
    if (permanent) {
      localStorage.setItem(STORAGE_KEY, password);
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, password);
      localStorage.removeItem(STORAGE_KEY);
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'auth', password }));
    }
  }, []);

  const send = (payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  const sendMove      = useCallback((dx: number, dy: number) => send({ type: 'move', dx, dy }), []);
  const sendClick     = useCallback((button: 'left' | 'right') => send({ type: 'click', button }), []);
  const sendDblClick  = useCallback(() => send({ type: 'dblclick' }), []);
  const sendScroll    = useCallback((dy: number) => send({ type: 'scroll', dy }), []);
  const sendType      = useCallback((text: string) => send({ type: 'type', text }), []);
  const sendKey       = useCallback((key: string) => send({ type: 'key', key }), []);
  const sendHotkey    = useCallback((keys: string[]) => send({ type: 'hotkey', keys }), []);
  const sendMouseDown = useCallback((button: 'left' | 'right' = 'left') => send({ type: 'mousedown', button }), []);
  const sendMouseUp   = useCallback((button: 'left' | 'right' = 'left') => send({ type: 'mouseup', button }), []);

  return {
    status,
    isAuthenticated,
    authError,
    authenticate,
    sendMove, sendClick, sendDblClick, sendScroll,
    sendType, sendKey, sendHotkey, sendMouseDown, sendMouseUp,
    connectRefetch: connect,
  };
};
