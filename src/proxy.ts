import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  return handleI18nRouting(request);
}

export const config = {
  /**
   * Skip API routes, Next internals, files with an extension (assets) and the
   * metadata routes (icon, opengraph-image, robots, sitemap) — they are not
   * localised and must be served from the root.
   */
  matcher:
    "/((?!api|_next|_vercel|icon|opengraph-image|apple-icon|twitter-image|.*\\..*).*)",
};
