import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/section";

type PageParams = { params: Promise<{ locale: string }> };

export default async function NotFound({ params }: PageParams) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");

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
        <a href="/">{tNav("brandAria")}</a>
      </Button>
      <span className="sr-only">{t("ariaScrollTop")}</span>
    </Container>
  );
}
