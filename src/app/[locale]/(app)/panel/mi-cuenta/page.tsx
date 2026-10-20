import { KeyRound, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAccountUser, roleFor } from "@/lib/auth";
import { getComplexForMember, mustChangePassword } from "@/lib/db/repo";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordForm } from "@/components/app/change-password-form";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "@/lib/permissions";

type PageParams = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ primer?: string }>;
};

export default async function AccountPage({ params, searchParams }: PageParams) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("account");
  const user = await requireAccountUser();
  const complex = getComplexForMember(user.id);
  const role = complex ? roleFor(complex, user.id) : undefined;
  const isFirst = query.primer === "1" || mustChangePassword(user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Badge variant={isFirst ? "gold" : "accent"}>{t("eyebrow")}</Badge>
      <h1 className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        {isFirst ? t("firstTitle") : t("title")}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">
        {isFirst ? t("firstLead") : t("lead")}
      </p>

      {isFirst ? (
        <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-lg)] border border-gold/35 bg-gold/10 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold/15">
            <ShieldCheck className="size-4 text-gold" strokeWidth={1.7} aria-hidden />
          </span>
          <p className="text-sm text-ink-2">{t("firstNotice")}</p>
        </div>
      ) : null}

      <section className="mt-8 rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] border border-accent/25 bg-accent/10">
            <KeyRound className="size-4 text-accent" strokeWidth={1.6} aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg tracking-tight text-ink">{t("sectionTitle")}</p>
            <p className="text-sm text-ink-2">{t("sectionLead")}</p>
          </div>
        </div>

        <div className="mt-6">
          <ChangePasswordForm isFirst={isFirst} />
        </div>
      </section>

      {complex && role ? (
        <section className="mt-4 rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-3">
            {t("profileTitle")}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-3">{t("name")}</dt>
              <dd className="text-ink">{user.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-3">{t("email")}</dt>
              <dd className="text-ink">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-3">{t("complex")}</dt>
              <dd className="text-ink">{complex.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-3">{t("role")}</dt>
              <dd>
                <Badge size="sm" variant={role === "owner" ? "gold" : "default"}>
                  {t(ROLE_LABELS[role as Role])}
                </Badge>
              </dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-ink-3">
            {t(ROLE_DESCRIPTIONS[role as Role])}
          </p>
        </section>
      ) : null}
    </div>
  );
}
