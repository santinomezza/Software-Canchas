import { Trash2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireMember } from "@/lib/auth";
import { listMembers } from "@/lib/db/repo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddMemberForm, RoleSelect } from "@/components/app/team-controls";
import { removeMemberAction, updateMemberAction } from "@/app/[locale]/actions/team";
import {
  PERMISSIONS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLES,
  can,
  type Role,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

type PageParams = { params: Promise<{ locale: string }> };

const PERMISSION_LABELS: Record<string, string> = {
  "booking.read": "permBookingRead",
  "booking.write": "permBookingWrite",
  "court.read": "permCourtRead",
  "court.write": "permCourtWrite",
  "hours.read": "permHoursRead",
  "hours.write": "permHoursWrite",
  "cash.read": "permCashRead",
  "cash.write": "permCashWrite",
  "team.read": "permTeamRead",
  "team.write": "permTeamWrite",
  "settings.read": "permSettingsRead",
  "settings.write": "permSettingsWrite",
};

export default async function TeamPage({ params }: PageParams) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("team");
  const { complex, role } = await requireMember("team.read", "/panel/empleados");

  const members = listMembers(complex.id);
  const canWrite = role === "owner" || role === "admin";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="accent">{t("eyebrow")}</Badge>
          <h1 className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-2">{t("lead")}</p>
        </div>
        {canWrite ? <AddMemberForm /> : null}
      </div>

      <div className="mt-8 overflow-x-auto rounded-[var(--radius-xl)] border border-line bg-surface-1">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">{t("tableAria")}</caption>
          <thead>
            <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.1em] text-ink-3">
              <th scope="col" className="px-4 py-3 font-medium">
                {t("name")}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("email")}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("phone")}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("role")}
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                {t("status")}
              </th>
              {canWrite ? <th scope="col" className="px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-line/70 last:border-b-0">
                <th scope="row" className="px-4 py-3 font-normal">
                  <span className="block font-medium text-ink">{member.user_name}</span>
                  {member.user_id === complex.user_id ? (
                    <span className="text-xs text-ink-3">{t("you")}</span>
                  ) : null}
                </th>
                <td className="px-4 py-3 text-ink-2">{member.user_email}</td>
                <td className="px-4 py-3 text-ink-2">{member.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  {canWrite && member.role !== "owner" ? (
                    <form action={updateMemberAction} className="flex items-center gap-2">
                      <RoleSelect memberId={member.id} role={member.role as Role} />
                      <input type="hidden" name="active" value={member.active ? "1" : "0"} />
                      <Button type="submit" size="sm" variant="ghost">
                        {t("save")}
                      </Button>
                    </form>
                  ) : (
                    <Badge variant={member.role === "owner" ? "gold" : "default"} size="sm">
                      {t(ROLE_LABELS[member.role as Role])}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={member.active ? "accent" : "outline"} size="sm">
                    {member.active ? t("active") : t("inactive")}
                  </Badge>
                </td>
                {canWrite ? (
                  <td className="px-4 py-3 text-right">
                    {member.role !== "owner" ? (
                      <form action={removeMemberAction} className="inline">
                        <input type="hidden" name="member_id" value={member.id} />
                        <button
                          type="submit"
                          aria-label={t("remove")}
                          className="inline-grid size-7 place-items-center rounded-full text-ink-3 transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          <Trash2 className="size-3.5" strokeWidth={1.6} aria-hidden />
                        </button>
                      </form>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Roles matrix */}
      <section className="mt-12">
        <h2 className="font-display text-xl tracking-tight text-ink">{t("rolesTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">{t("rolesLead")}</p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ROLES.map((role) => (
            <div
              key={role}
              className="rounded-[var(--radius-lg)] border border-line bg-surface-1 p-5"
            >
              <p className="font-display text-lg tracking-tight text-ink">
                {t(ROLE_LABELS[role])}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                {t(ROLE_DESCRIPTIONS[role])}
              </p>
              <ul className="mt-3 space-y-1">
                {PERMISSIONS.map((permission) => {
                  const allowed = can(role, permission);
                  return (
                    <li
                      key={permission}
                      className={cn(
                        "text-xs",
                        allowed ? "text-accent" : "text-ink-3 line-through opacity-60",
                      )}
                    >
                      {t(PERMISSION_LABELS[permission])}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
