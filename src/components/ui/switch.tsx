"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
        "border border-line-strong bg-surface-3 transition-colors duration-200",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent",
        "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-4.5 translate-x-0.5 rounded-full bg-ink shadow-sm",
          "transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "data-[state=checked]:translate-x-[1.375rem] data-[state=checked]:bg-accent-contrast",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
