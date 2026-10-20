"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/components/providers/theme-provider";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      offset={20}
      toastOptions={{
        classNames: {
          toast:
            "group rounded-[var(--radius-md)] border border-line bg-surface-1 text-ink shadow-[var(--shadow-xl)]",
          description: "text-ink-2",
          actionButton: "bg-accent text-accent-contrast rounded-full px-3 py-1.5 text-xs font-medium",
          cancelButton: "bg-surface-3 text-ink-2 rounded-full px-3 py-1.5 text-xs",
        },
      }}
    />
  );
}
