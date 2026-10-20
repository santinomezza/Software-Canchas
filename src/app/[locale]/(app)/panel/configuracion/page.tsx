import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { getComplexForUser } from "@/lib/db/repo";
import { ComplexForm } from "@/components/app/complex-form";
import { Button } from "@/components/ui/button";
import { publishComplexAction } from "@/app/[locale]/actions/panel";

type PageParams = { params: Promise<{ locale: string }> };

export default async function SettingsPage({ params }: PageParams) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app");
  const user = await requireUser("/panel/configuracion");
  const complex = getComplexForUser(user.id);

  if (!complex) {
    return <p className="text-sm text-ink-2">{t("onboardingComplex")}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
        {t("navSettings")}
      </h1>

      <div className="mt-8 rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 sm:p-8">
        <p className="font-display text-lg tracking-tight text-ink">{t("complexFormTitle")}</p>
        <div className="mt-6">
          <ComplexForm complex={complex} />
        </div>
      </div>

      {complex.status !== "ready" ? (
        <form action={publishComplexAction} className="mt-6">
          <Button type="submit">{t("onboardingDone")}</Button>
        </form>
      ) : null}
    </div>
  );
}
