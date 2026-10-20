import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { CookieBanner } from "@/components/sections/cookie-banner";

/**
 * Marketing chrome. Kept in a route group so the panel, the auth screens and
 * the public complex pages can use their own layout.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <CookieBanner />
    </>
  );
}
