import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { isDefinedError, safe } from "@orpc/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { serverApi } from "@/lib/api/client/server";

export default async function DashboardPage() {
  const { getUser, isAuthenticated } = getKindeServerSession();

  if (!(await isAuthenticated())) {
    redirect("/api/auth/login?post_login_redirect_url=/dashboard");
  }

  const user = await getUser();
  if (!user) {
    redirect("/api/auth/login?post_login_redirect_url=/dashboard");
  }

  // Server-side API call: runs the router in-process with this request's Kinde session.
  const { data: projects, error } = await safe(serverApi.projects.list({ limit: 10 }));

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p>
        Welcome, {user.given_name ?? user.email}
        {user.email ? ` (${user.email})` : null}
      </p>

      <section className="w-full max-w-md">
        <h2 className="mb-2 text-lg font-medium">Projects</h2>
        {error ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {isDefinedError(error) && error.code === "NO_ACTIVE_ORGANIZATION"
              ? "Your session has no active organization, so there are no projects to show."
              : "Projects could not be loaded right now."}
          </p>
        ) : projects.data.length === 0 ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">No projects yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {projects.data.map((project) => (
              <li key={project.id} className="flex items-center justify-between px-4 py-2">
                <span>{project.name}</span>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {project.key} · {project.issueCount} issues
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-md border px-4 py-2 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
        >
          Home
        </Link>
        <LogoutLink className="rounded-md border px-4 py-2 hover:bg-black/[.04] dark:hover:bg-white/[.08]">
          Log out
        </LogoutLink>
      </div>
    </main>
  );
}
