"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const colors = {
    success: { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46", icon: "✓" },
    error: { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", icon: "✕" },
    info: { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF", icon: "ℹ" },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, alignItems: "center",
        pointerEvents: "none",
      }}>
        {toasts.map((t) => {
          const c = colors[t.type];
          return (
            <div key={t.id} style={{
              padding: "14px 28px", background: c.bg, border: `1px solid ${c.border}`,
              borderRadius: 14, fontSize: 15, fontWeight: 600, color: c.text,
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 10,
              animation: "fadeIn 0.2s ease-out",
              pointerEvents: "auto",
            }}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{c.icon}</span>
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
