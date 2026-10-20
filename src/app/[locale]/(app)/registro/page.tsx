import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SignupForm } from "@/components/app/auth-forms";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "Crear cuenta",
  robots: { index: false, follow: false },
};

type PageParams = { params: Promise<{ locale: string }> };

export default async function SignupPage({
  params,
  searchParams,
}: PageParams & { searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);
  return <SignupForm next={next} />;
}
