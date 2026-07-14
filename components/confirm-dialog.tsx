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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onKeyDown={(e) => {
            if (e.key === "Escape") handleClose(false);
          }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => handleClose(false)}
            aria-hidden="true"
          />
          {/* Dialog */}
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            className="relative rounded-card bg-card border border-outline-variant/30 shadow-2xl max-w-sm w-full mx-4 p-6 animate-fade-in"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error/10">
                <span className="material-symbols-outlined text-error text-xl" aria-hidden="true">warning</span>
              </div>
              <div>
                <h3 id="confirm-dialog-title" className="font-headline text-lg font-semibold text-on-surface mb-1">
                  {options.title}
                </h3>
                <p id="confirm-dialog-message" className="font-body text-sm text-on-surface-variant leading-relaxed">
                  {options.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => handleClose(false)}
                className="rounded-button border border-outline-variant/40 px-5 py-2.5 font-label text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors duration-250 ease-out"
              >
                {options.cancelLabel ?? "Abbrechen"}
              </button>
              <button
                onClick={() => handleClose(true)}
                className="rounded-button bg-error px-5 py-2.5 font-label text-sm font-semibold text-on-error hover:brightness-110 transition-all duration-250 ease-out"
                autoFocus
              >
                {options.confirmLabel ?? "L\u00F6schen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
