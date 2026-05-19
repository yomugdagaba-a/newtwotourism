/**
 * useBookingSSE
 *
 * Connects to the backend SSE endpoint and calls the provided callback
 * whenever a booking event arrives.
 *
 * Falls back gracefully:
 *  - If EventSource is not supported (very old browsers) → no-op
 *  - If the connection drops → auto-reconnects after 5 seconds
 *  - If the token is missing → does not connect
 *
 * Usage:
 *   useBookingSSE(token, (event, data) => {
 *     if (event === 'booking_update' || event === 'booking_new') {
 *       // update state
 *     }
 *   });
 */

import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/services/api';

type SseCallback = (event: string, data: Record<string, unknown>) => void;

export function useBookingSSE(token: string | null | undefined, onEvent: SseCallback) {
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!token) return;
    if (typeof EventSource === 'undefined') return; // SSR / old browser

    // Strip /api suffix from base URL for SSE endpoint
    const baseUrl = API_BASE_URL.replace(/\/api$/, '');
    const sseUrl = `${baseUrl}/api/sse/bookings?token=${encodeURIComponent(token)}`;

    function connect() {
      if (!mountedRef.current) return;

      const es = new EventSource(sseUrl);
      esRef.current = es;

      es.addEventListener('connected', () => {
        console.log('📡 SSE: booking stream connected');
      });

      es.addEventListener('booking_update', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          onEvent('booking_update', data);
        } catch { /* ignore parse errors */ }
      });

      es.addEventListener('booking_new', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          onEvent('booking_new', data);
        } catch { /* ignore parse errors */ }
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (!mountedRef.current) return;
        // Reconnect after 5 seconds
        reconnectTimer.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, 5000);
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [token]); // reconnect if token changes
}
