"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue>({
  confirm: () => Promise.resolve(false),
});

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function handleClose(result: boolean) {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => handleClose(false)}
          />
          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 animate-fade-in">
            <h3 className="text-lg font-serif font-semibold text-violet mb-2">
              {options.title}
            </h3>
            <p className="text-sm text-aether-gray mb-6 leading-relaxed">
              {options.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleClose(false)}
                className="rounded-lg border border-lavender-dark px-4 py-2 text-sm font-medium text-aether-gray hover:bg-lavender transition"
              >
                {options.cancelLabel ?? "Abbrechen"}
              </button>
              <button
                onClick={() => handleClose(true)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                autoFocus
              >
                {options.confirmLabel ?? "Löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
