"use client";

import { useEffect, useState, useCallback } from "react";
import { createContext, useContext } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms, 0 = sticky
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info", title?: string, duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-4), { id, type, title, message, duration }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const success = useCallback((message: string, title?: string) => toast(message, "success", title), [toast]);
  const error   = useCallback((message: string, title?: string) => toast(message, "error",   title, 6000), [toast]);
  const warning = useCallback((message: string, title?: string) => toast(message, "warning", title, 5000), [toast]);
  const info    = useCallback((message: string, title?: string) => toast(message, "info",    title), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES: Record<ToastType, { bar: string; icon: string; title: string; text: string; bg: string; close: string }> = {
  success: { bar: "bg-green-500",  icon: "text-green-500",  title: "text-green-900", text: "text-green-800", bg: "bg-green-50  border-green-200", close: "text-green-400 hover:text-green-600" },
  error:   { bar: "bg-red-500",    icon: "text-red-500",    title: "text-red-900",   text: "text-red-800",   bg: "bg-red-50    border-red-200",   close: "text-red-400   hover:text-red-600"   },
  warning: { bar: "bg-yellow-500", icon: "text-yellow-500", title: "text-yellow-900",text: "text-yellow-800",bg: "bg-yellow-50 border-yellow-200",close: "text-yellow-400 hover:text-yellow-600"},
  info:    { bar: "bg-blue-500",   icon: "text-blue-500",   title: "text-blue-900",  text: "text-blue-800",  bg: "bg-blue-50   border-blue-200",  close: "text-blue-400  hover:text-blue-600"  },
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ── Single Toast Item ─────────────────────────────────────────────────────────
function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const s = STYLES[toast.type];

  useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => dismiss(toast.id), 300);
  };

  return (
    <div
      className={`relative flex items-start gap-3 w-full max-w-sm rounded-xl border shadow-lg overflow-hidden px-4 py-3 transition-all duration-300 ${s.bg} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {/* Left color bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar} rounded-l-xl`} />

      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${s.icon}`}>{ICONS[toast.type]}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && <p className={`text-sm font-bold ${s.title}`}>{toast.title}</p>}
        <p className={`text-sm font-semibold ${s.text} ${toast.title ? "mt-0.5" : ""}`}>{toast.message}</p>
      </div>

      {/* Close */}
      <button onClick={handleDismiss} className={`flex-shrink-0 mt-0.5 ${s.close} transition-colors`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Container ─────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto w-full max-w-sm">
          <ToastItem toast={t} dismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
