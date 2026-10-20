"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn(
        "group border-b border-line last:border-b-0",
        "transition-colors data-[state=open]:border-accent/25",
        className,
      )}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "flex flex-1 items-center justify-between gap-6 py-5 text-left",
          "font-display text-lg tracking-tight text-ink transition-colors duration-200",
          "hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
          className,
        )}
        {...props}
      >
        {children}
        <span
          aria-hidden
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border border-line",
            "text-ink-2 transition-[transform,background-color,color,border-color] duration-300",
            "group-data-[state=open]:rotate-45 group-data-[state=open]:border-accent/45 group-data-[state=open]:bg-accent/12 group-data-[state=open]:text-accent",
          )}
        >
          <Plus className="size-4" strokeWidth={1.5} />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        "overflow-hidden text-sm leading-relaxed text-ink-2",
        "data-[state=closed]:animate-[accordion-up_0.24s_cubic-bezier(0.22,1,0.36,1)]",
        "data-[state=open]:animate-[accordion-down_0.3s_cubic-bezier(0.22,1,0.36,1)]",
        className,
      )}
      {...props}
    >
      <div className="pb-6 pr-10">{children}</div>
    </AccordionPrimitive.Content>
  );
}
