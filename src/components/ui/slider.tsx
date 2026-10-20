"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    /** Accessible name for the draggable thumb. */
    thumbLabel?: string;
  }
>(function Slider({ className, thumbLabel, ...props }, ref) {
  const thumbCount = Array.isArray(props.value)
    ? props.value.length
    : Array.isArray(props.defaultValue)
      ? props.defaultValue.length
      : 1;

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-line-strong">
        <SliderPrimitive.Range className="absolute h-full bg-accent" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label={thumbLabel}
          className={cn(
            "block size-6 rounded-full border-2 border-accent bg-[var(--bg-surface-1)]",
            "shadow-[0_4px_16px_-4px_var(--accent)] transition-[box-shadow,transform] duration-200",
            "hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
});
