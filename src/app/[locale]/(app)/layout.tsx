/**
 * Layout for the product surface: auth screens, admin panel and the public
 * complex page. No marketing chrome.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-base">{children}</div>;
}
