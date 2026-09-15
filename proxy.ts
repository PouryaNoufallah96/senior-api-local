import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default withAuth(
  async function proxy() {},
  {
    /**
     * API routes are excluded from Kinde's page-level redirect handling: the
     * oRPC handlers read the session themselves and answer with typed JSON
     * 401/403 errors instead of redirecting API clients to the login page.
     * Anchored regexes keep e.g. `/api/v1x` or `/api/rpcs` protected.
     */
    publicPaths: ["/", /^\/api\/rpc(?:\/|$)/, /^\/api\/v1(?:\/|$)/],
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
