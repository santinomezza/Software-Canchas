import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero";

type PageParams = { params: Promise<{ locale: string }> };

export default async function ProductPage({ params }: PageParams) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
    </>
  );
}
