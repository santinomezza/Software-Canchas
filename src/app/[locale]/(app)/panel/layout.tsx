import { setRequestLocale } from "next-intl/server";
import { getSessionUser } from "@/lib/auth";
import { getComplexForMember } from "@/lib/db/repo";
import { PanelShell } from "@/components/app/panel-shell";
import { signOutAction } from "@/app/[locale]/actions/panel";

type PageParams = { params: Promise<{ locale: string }> };

export default async function PanelLayout({ children, params }: PageParams & { children: React.ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The layout never redirects: each page resolves its own permissions so
  // that deep links keep the `next` parameter intact.
  const user = await getSessionUser();
  const complex = user ? getComplexForMember(user.id) : undefined;

  return (
    <PanelShell
      userName={user?.name ?? ""}
      publicPath={complex ? `/c/${complex.slug}` : undefined}
      signOut={signOutAction}
    >
      {children}
    </PanelShell>
  );
}
