import { setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { getComplexForUser } from "@/lib/db/repo";
import { PanelShell } from "@/components/app/panel-shell";
import { signOutAction } from "@/app/[locale]/actions/panel";

type PageParams = { params: Promise<{ locale: string }> };

export default async function PanelLayout({ children, params }: PageParams & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireUser("/panel");
  const complex = getComplexForUser(user.id);

  return (
    <PanelShell
      userName={user.name}
      publicPath={complex ? `/c/${complex.slug}` : undefined}
      signOut={signOutAction}
    >
      {children}
    </PanelShell>
  );
}
