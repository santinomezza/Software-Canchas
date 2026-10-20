import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium tracking-[0.02em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-line bg-surface-2 text-ink-2",
        accent: "border-accent/30 bg-accent/10 text-accent",
        gold: "border-gold/30 bg-gold/10 text-gold",
        outline: "border-line-strong text-ink-2",
        solid: "border-transparent bg-accent text-accent-contrast",
      },
      size: {
        sm: "h-6 px-2.5 text-[0.6875rem]",
        md: "h-7 px-3 text-xs",
        lg: "h-8 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };
