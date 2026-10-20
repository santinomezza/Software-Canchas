"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { track } from "@/lib/analytics";

type TrackedCtaProps = Omit<ButtonProps, "asChild" | "onClick"> & {
  href: string;
  placement: string;
};

/**
 * Client wrapper that records the conversion event.
 * Server components cannot pass event handlers down, so every tracked CTA
 * goes through this component.
 */
export function TrackedCta({ href, placement, children, ...props }: TrackedCtaProps) {
  return (
    <Button
      asChild
      onClick={() => track({ name: "cta_click", props: { placement } })}
      {...props}
    >
      <a href={href}>{children}</a>
    </Button>
  );
}
