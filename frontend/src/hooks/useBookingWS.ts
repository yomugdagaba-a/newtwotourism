/**
 * useBookingWS
 *
 * Single WebSocket connection that handles ALL real-time booking features:
 *   - booking_new      → owner sees new booking instantly
 *   - booking_update   → status changes (accept, reject, cost, approve)
 *   - booking_message  → new message in conversation
 *   - typing           → "Owner is typing..." / "Client is typing..."
 *   - online           → green dot (user is online/offline)
 *
 * Falls back gracefully:
 *   - No token → does not connect
 *   - Connection drops → auto-reconnects after 3 seconds
 *   - Server unreachable → silent fallback (SSE still works)
 */

import { useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '@/services/api';

export type WsEventType =
  | 'booking_new'
  | 'booking_update'
  | 'booking_message'
  | 'typing'
  | 'online'
  | 'connected'
  | 'pong';

export type WsPayload = Record<string, unknown>;
export type WsCallback = (event: WsEventType, data: WsPayload) => void;

// Derive WebSocket URL from the API base URL
// Can be overridden with NEXT_PUBLIC_WS_URL env variable
function getWsUrl(token: string): string {
  // Allow explicit override for platforms like Leapcell
  const explicitWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (explicitWsUrl) {
    return `${explicitWsUrl}?token=${encodeURIComponent(token)}`;
  }

  const base = API_BASE_URL.replace(/\/api$/, '');
  const wsBase = base.replace(/^https?:\/\//, (match) =>
    match === 'https://' ? 'wss://' : 'ws://'
  );
  return `${wsBase}/ws?token=${encodeURIComponent(token)}`;
}

export function useBookingWS(
  token: string | null | undefined,
  onEvent: WsCallback
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const onEventRef = useRef(onEvent);

  // Keep ref in sync with latest callback via effect (not during render)
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  // ── Connect ────────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!mountedRef.current || !token) return;
    if (typeof WebSocket === 'undefined') return; // SSR guard

    const url = getWsUrl(token);
    console.log('🔌 WS: connecting to', url.replace(/token=[^&]+/, 'token=***'));
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('🔌 WS: connected, sending auth...');
      // Authenticate immediately after connection (backup to URL token)
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as { type: WsEventType } & WsPayload;
        const { type, ...data } = msg;
        if (type) onEventRef.current(type, data);
      } catch { /* ignore malformed */ }
    };

    ws.onerror = () => {
      // onerror is always followed by onclose, handle there
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (!mountedRef.current) return;
      console.log('🔌 WS: disconnected, reconnecting in 3s...');
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 3000);
    };
  }, [token]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // ── Send typing signal ─────────────────────────────────────────────────────
  const sendTyping = useCallback((bookingId: number, isTyping: boolean) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'typing', bookingId, isTyping }));
    }
  }, []);

  return { sendTyping };
}
