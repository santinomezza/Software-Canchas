"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

/**
 * Persistent CTA. Appears once the visitor scrolls past the hero and hides
 * again when the trial form is on screen, so it never covers the conversion
 * point it points to.
 */
export function StickyCta() {
  const t = useTranslations("hero");
  const reduce = useReducedMotion();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const form = document.getElementById("contacto");
    const hero = document.getElementById("top");

    const onScroll = () => {
      const pastHero = hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > 640;
      const formVisible = form
        ? form.getBoundingClientRect().top < window.innerHeight * 0.9 &&
          form.getBoundingClientRect().bottom > window.innerHeight * 0.1
        : false;
      setVisible(pastHero && !formVisible);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:px-0 sm:pb-0"
        >
          <div
            data-sticky-cta
            className="glass-strong flex items-center gap-3 rounded-full p-1.5 pl-5 shadow-[var(--shadow-xl)]"
          >
            <span className="hidden text-sm font-medium text-ink md:block">
              {t("scrollHint")}
            </span>
            <Button
              size="md"
              onClick={() => track({ name: "cta_click", props: { placement: "sticky" } })}
              asChild
            >
              <a href="#empezar">{t("ctaPrimary")}</a>
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
