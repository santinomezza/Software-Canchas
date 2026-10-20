import * as React from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/layout/section";

export type SectionHeadingProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
  children?: React.ReactNode;
  as?: "h1" | "h2" | "h3";
};

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
  titleClassName,
  children,
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Tag
        className={cn(
          "text-balance font-display text-3xl leading-[1.06] tracking-[-0.03em] text-ink sm:text-4xl",
          titleClassName,
        )}
      >
        {title}
      </Tag>
      {lead ? (
        <p
          className={cn(
            "max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg",
            align === "center" && "mx-auto",
          )}
        >
          {lead}
        </p>
      ) : null}
      {children}
    </div>
  );
}
