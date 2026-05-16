"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface DialogState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setDialog({ ...options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    dialog?.resolve(true);
    setDialog(null);
  };

  const handleCancel = () => {
    dialog?.resolve(false);
    setDialog(null);
  };

  const variantStyles = {
    danger:  { icon: "bg-red-100 text-red-600",    btn: "bg-red-600 hover:bg-red-700 text-white",    title: "text-red-700" },
    warning: { icon: "bg-yellow-100 text-yellow-600", btn: "bg-yellow-500 hover:bg-yellow-600 text-white", title: "text-yellow-700" },
    info:    { icon: "bg-blue-100 text-blue-600",   btn: "bg-blue-600 hover:bg-blue-700 text-white",   title: "text-blue-700" },
  };

  const v = variantStyles[dialog?.variant ?? "info"];

  const ICONS = {
    danger: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs border border-gray-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${v.icon}`}>
                  {ICONS[dialog.variant ?? "info"]}
                </div>
                <div className="flex-1 min-w-0">
                  {dialog.title && (
                    <h3 className={`text-sm font-bold mb-0.5 ${v.title}`}>{dialog.title}</h3>
                  )}
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">{dialog.message}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-4 pb-4 justify-end">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors"
              >
                {dialog.cancelLabel ?? "Cancel"}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${v.btn}`}
              >
                {dialog.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmDialogProvider>");
  return ctx.confirm;
}
