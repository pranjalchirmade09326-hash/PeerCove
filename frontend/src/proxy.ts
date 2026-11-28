import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const proxy = createMiddleware(routing);

export default proxy;
export { proxy };

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next`, `/_vercel` or `/docs`
  //   (developer-facing reference pages — no locale)
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: [
    // Explicitly match root path for locale redirection
    "/",
    // Match all localized and general application paths
    "/((?!api|trpc|_next|_vercel|docs|apple-icon|.*\\..*).*)",
  ],
};
