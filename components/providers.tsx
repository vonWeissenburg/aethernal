"use client";

import { ToastProvider } from "./toast";
import { ConfirmProvider } from "./confirm-dialog";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
