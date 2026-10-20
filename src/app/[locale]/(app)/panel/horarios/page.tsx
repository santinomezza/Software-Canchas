import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { getComplexForUser, listOpeningHours } from "@/lib/db/repo";
import { HoursForm } from "@/components/app/hours-form";
import { Badge } from "@/components/ui/badge";

type PageParams = { params: Promise<{ locale: string }> };

export default async function HoursPage({ params }: PageParams) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app");
  const user = await requireUser("/panel/horarios");
  const complex = getComplexForUser(user.id);

  if (!complex) {
    return <p className="text-sm text-ink-2">{t("onboardingComplex")}</p>;
  }

  const hours = listOpeningHours(complex.id);

  return (
    <div className="mx-auto max-w-3xl">
      <Badge variant="accent">{t("onboardingHours")}</Badge>
      <h1 className="mt-4 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        {t("hoursTitle")}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">{t("hoursLead")}</p>

      <div className="mt-8 rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 sm:p-8">
        <HoursForm hours={hours} />
      </div>
    </div>
  );
}
