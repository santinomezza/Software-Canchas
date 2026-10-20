"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-full font-medium tracking-[-0.01em]",
    "transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
    "active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent",
    "[&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-contrast shadow-[0_10px_30px_-10px_var(--accent)] hover:bg-[color-mix(in_oklab,var(--accent)_88%,white)] hover:shadow-[0_16px_38px_-10px_var(--accent)]",
        secondary:
          "border border-line-strong bg-transparent text-ink hover:border-accent/55 hover:bg-accent/8 hover:text-ink",
        glass:
          "glass text-ink hover:bg-[color-mix(in_oklab,var(--bg-surface-1)_75%,var(--accent)_8%)] hover:border-accent/35",
        ghost: "text-ink-2 hover:bg-ink/6 hover:text-ink",
        gold: "border border-gold/35 bg-gold/10 text-gold hover:bg-gold/18 hover:border-gold/55",
        outline:
          "border border-line-strong text-ink hover:border-accent/55 hover:text-ink",
      },
      size: {
        sm: "h-9 px-4 text-sm [&_svg]:size-4",
        md: "h-11 px-5 text-sm [&_svg]:size-4",
        lg: "h-13 px-7 text-base [&_svg]:size-[1.125rem]",
        icon: "size-11 [&_svg]:size-[1.125rem]",
        "icon-sm": "size-9 [&_svg]:size-4",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    loadingText?: string;
  };

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <span className="inline-flex items-center justify-center gap-2">
          {loading ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
          <span className={cn(loading && loadingText ? "sr-only" : undefined)}>
            {loading && loadingText ? loadingText : children}
          </span>
        </span>
      )}
    </Comp>
  );
}

export { buttonVariants };
