/**
 * useBookingWS — Singleton WebSocket per browser tab
 *
 * Uses a module-level singleton to ensure only ONE WebSocket connection
 * exists per browser tab, regardless of React re-renders or token refreshes.
 *
 * Handles:
 *   - booking_new, booking_update, booking_message
 *   - typing indicator
 *   - online/offline status
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

// ── Module-level singleton ────────────────────────────────────────────────────
// One WS per browser tab — survives React re-renders and token refreshes
let _ws: WebSocket | null = null;
let _wsToken: string | null = null;
let _pingInterval: ReturnType<typeof setInterval> | null = null;
let _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const _listeners: Set<WsCallback> = new Set();
let _destroyed = false;

function getWsUrl(token: string): string {
  const explicitWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (explicitWsUrl) return `${explicitWsUrl}?token=${encodeURIComponent(token)}`;

  const base = API_BASE_URL.replace(/\/api$/, '');
  const wsBase = base.replace(/^https?:\/\//, (m) => m === 'https://' ? 'wss://' : 'ws://');
  return `${wsBase}/ws?token=${encodeURIComponent(token)}`;
}

function _clearPing() {
  if (_pingInterval) { clearInterval(_pingInterval); _pingInterval = null; }
}

function _clearReconnect() {
  if (_reconnectTimer) { clearTimeout(_reconnectTimer); _reconnectTimer = null; }
}

function _startPing() {
  _clearPing();
  _pingInterval = setInterval(() => {
    if (_ws && _ws.readyState === WebSocket.OPEN) {
      _ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 20000);
}

function _dispatch(type: WsEventType, data: WsPayload) {
  _listeners.forEach(cb => { try { cb(type, data); } catch { /* ignore */ } });
}

function _connect(token: string) {
  if (_destroyed) return;

  // Don't reconnect if already open with same token
  if (_ws && _ws.readyState === WebSocket.OPEN && _wsToken === token) return;

  // Close existing connection cleanly
  if (_ws) {
    _ws.onclose = null;
    _ws.onerror = null;
    _ws.close();
    _ws = null;
  }

  _clearPing();
  _wsToken = token;

  const url = getWsUrl(token);
  const ws = new WebSocket(url);
  _ws = ws;

  ws.onopen = () => {
    if (_ws !== ws) return; // stale connection
    ws.send(JSON.stringify({ type: 'auth', token }));
    _startPing();
  };

  ws.onmessage = (e) => {
    if (_ws !== ws) return;
    try {
      const msg = JSON.parse(e.data) as { type: WsEventType } & WsPayload;
      const { type, ...data } = msg;
      if (type) _dispatch(type, data);
    } catch { /* ignore */ }
  };

  ws.onerror = () => { /* handled by onclose */ };

  ws.onclose = () => {
    if (_ws !== ws) return; // stale
    _ws = null;
    _clearPing();
    if (_destroyed) return;
    _reconnectTimer = setTimeout(() => {
      if (!_destroyed && _wsToken) _connect(_wsToken);
    }, 3000);
  };
}

function _ensureConnected(token: string) {
  _clearReconnect();
  _connect(token);
}

// ── React hook ────────────────────────────────────────────────────────────────

export function useBookingWS(
  token: string | null | undefined,
  onEvent: WsCallback
) {
  const onEventRef = useRef(onEvent);

  useEffect(() => { onEventRef.current = onEvent; });

  // Register this component's callback
  useEffect(() => {
    if (!token) return;

    const cb: WsCallback = (event, data) => onEventRef.current(event, data);
    _listeners.add(cb);
    _destroyed = false;

    // Connect or reuse existing connection
    _ensureConnected(token);

    return () => {
      _listeners.delete(cb);
      // Don't close the WS on unmount — keep it alive for the tab
    };
  }, [token]);

  const sendTyping = useCallback((bookingId: number, isTyping: boolean) => {
    if (_ws && _ws.readyState === WebSocket.OPEN) {
      _ws.send(JSON.stringify({ type: 'typing', bookingId, isTyping }));
    }
  }, []);

  return { sendTyping };
}
