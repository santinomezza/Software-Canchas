"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

export type TiltProps = {
  children: React.ReactNode;
  className?: string;
  /** Maximum rotation in degrees. */
  max?: number;
};

/**
 * Subtle 3D tilt that follows the pointer. Disabled for reduced motion and
 * for coarse pointers (touch), where it has no meaning.
 */
export function Tilt({ children, className, max = 6 }: TiltProps) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const [finePointer, setFinePointer] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    setFinePointer(query.matches);
    const onChange = (event: MediaQueryListEvent) => setFinePointer(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 160, damping: 18, mass: 0.4 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), springConfig);

  const disabled = reduce || !finePointer;

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={disabled ? undefined : { rotateX, rotateY, transformPerspective: 1200 }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
