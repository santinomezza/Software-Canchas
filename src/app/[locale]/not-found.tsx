"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/section";
import { Link } from "@/i18n/navigation";

/**
 * Localized 404. It is a client component because Next renders `not-found`
 * without the route params, so the locale cannot be resolved on the server.
 */
export default function NotFound() {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-32 text-center">
      <p className="font-display text-[6rem] leading-none tracking-[-0.05em] text-accent/25 sm:text-[9rem]">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Esta cancha no existe
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-2">
        La página que buscabas no está o cambió de dirección. Volvé al inicio y encontrá lo que
        necesitás.
      </p>
      <Button className="mt-8" asChild>
        <Link href="/">{tNav("brandAria")}</Link>
      </Button>
      <span className="sr-only">{t("ariaScrollTop")}</span>
    </Container>
  );
}
