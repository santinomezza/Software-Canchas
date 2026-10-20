import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SigninForm } from "@/components/app/auth-forms";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

type PageParams = { params: Promise<{ locale: string }> };

export default async function SigninPage({ params }: PageParams) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SigninForm />;
}
