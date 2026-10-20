"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { invalid?: boolean }
>(function Input({ className, type = "text", invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full rounded-[var(--radius-sm)] border border-line bg-surface-1 px-3.5 text-sm text-ink",
        "placeholder:text-ink-3 transition-colors duration-200",
        "hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25",
        "disabled:cursor-not-allowed disabled:opacity-55",
        invalid && "border-danger/70 focus:border-danger focus:ring-danger/25",
        className,
      )}
      {...props}
    />
  );
});

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.ComponentProps<"label"> & { required?: boolean }
>(function Label({ className, required, children, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn("mb-1.5 block text-sm font-medium text-ink-2", className)}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden className="ml-0.5 text-accent">
          *
        </span>
      ) : null}
    </label>
  );
});

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs text-danger">
      {children}
    </p>
  );
}

export function FieldHint({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs text-ink-3">{children}</p>;
}
