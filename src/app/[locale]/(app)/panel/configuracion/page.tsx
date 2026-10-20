import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireMemberAction } from "@/lib/auth";
import { getIntegration, listImages, listNotifications, listServices } from "@/lib/db/repo";
import { ComplexForm } from "@/components/app/complex-form";
import {
  GalleryManager,
  LocationForm,
  ServicesManager,
} from "@/components/app/content-settings";
import {
  IntegrationsSettings,
  type MercadoPagoStatus,
  type WhatsAppStatus,
} from "@/components/app/integrations-settings";
import { Button } from "@/components/ui/button";
import { publishComplexAction } from "@/app/[locale]/actions/panel";
import { decryptSecret, maskSecret } from "@/lib/crypto";

type PageParams = { params: Promise<{ locale: string }> };

export default async function SettingsPage({ params }: PageParams) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("app");
  const tInt = await getTranslations("integrations");
  const tContent = await getTranslations("content");
  const { complex, role } = await requireMemberAction("settings.read", "/panel/configuracion");

  const mp = getIntegration(complex.id, "mercadopago");
  const wa = getIntegration(complex.id, "whatsapp");
  const images = listImages(complex.id);
  const services = listServices(complex.id);

  const mpSecret = mp?.secret_encrypted ? decryptSecret(mp.secret_encrypted) : null;
  let mpSettings: { sandbox?: boolean } = {};
  try {
    mpSettings = mp ? (JSON.parse(mp.settings) as { sandbox?: boolean }) : {};
  } catch {
    mpSettings = {};
  }

  let waSettings: { phone?: string; phoneNumberId?: string } = {};
  try {
    waSettings = wa ? (JSON.parse(wa.settings) as typeof waSettings) : {};
  } catch {
    waSettings = {};
  }

  const mercadoPago: MercadoPagoStatus = {
    configured: Boolean(mp?.enabled && mpSecret),
    masked: mpSecret ? maskSecret(mpSecret) : null,
    publicKey: mp?.public_key ?? null,
    sandbox: Boolean(mpSettings.sandbox),
    source: mp?.enabled && mpSecret ? "complex" : "platform",
  };

  const whatsapp: WhatsAppStatus = {
    configured: Boolean(wa?.enabled && waSettings.phone && waSettings.phoneNumberId),
    phone: waSettings.phone ?? null,
    phoneNumberId: waSettings.phoneNumberId ?? null,
    source: wa?.enabled ? "complex" : "platform",
  };

  const canManage = role === "owner" || role === "admin";

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

      <section className="mt-6">
        <h2 className="font-display text-lg tracking-tight text-ink">{tInt("title")}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{tInt("lead")}</p>

        {canManage ? (
          <div className="mt-5">
            <IntegrationsSettings mercadoPago={mercadoPago} whatsapp={whatsapp} />
          </div>
        ) : (
          <p className="mt-5 rounded-[var(--radius-lg)] border border-line bg-surface-1 p-5 text-sm text-ink-2">
            {tInt("readOnly")}
          </p>
        )}

        {canManage ? <NotificationLog complexId={complex.id} /> : null}
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="font-display text-lg tracking-tight text-ink">{tContent("contentTitle")}</h2>
        <p className="text-sm leading-relaxed text-ink-2">{tContent("contentLead")}</p>

        {canManage ? (
          <>
            <GalleryManager images={images} />
            <ServicesManager services={services} />
            <LocationForm complex={complex} />
          </>
        ) : (
          <p className="rounded-[var(--radius-lg)] border border-line bg-surface-1 p-5 text-sm text-ink-2">
            {tInt("readOnly")}
          </p>
        )}
      </section>
    </div>
  );
}

async function NotificationLog({ complexId }: { complexId: number }) {
  const tInt = await getTranslations("integrations");
  const notifications = listNotifications(complexId, 8);

  return (
    <div className="mt-6 rounded-[var(--radius-xl)] border border-line bg-surface-1 p-6">
      <p className="font-display text-lg tracking-tight text-ink">{tInt("notificationTitle")}</p>

      {notifications.length === 0 ? (
        <p className="mt-3 text-sm text-ink-3">{tInt("notificationEmpty")}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className="flex items-start justify-between gap-3 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3.5 py-2.5"
            >
              <p className="min-w-0 flex-1 truncate text-xs text-ink-2">
                {notification.body.split("\n").find((line) => line.startsWith("👤")) ??
                  notification.body.split("\n")[0]}
              </p>
              <span
                className={
                  "shrink-0 rounded-full border px-2 py-0.5 text-[0.625rem] font-medium " +
                  (notification.status === "sent"
                    ? "border-accent/35 bg-accent/10 text-accent"
                    : "border-danger/35 bg-danger/10 text-danger")
                }
              >
                {notification.status === "sent"
                  ? tInt("notificationSent")
                  : tInt("notificationFailed")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
