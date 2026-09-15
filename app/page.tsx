"use client";

import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated, isLoading, user } = useKindeBrowserClient();

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p>Loading session…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Home</h1>
      {isAuthenticated && user ? (
        <>
          <p>Signed in as {user.email}</p>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-md border px-4 py-2 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
            >
              Dashboard
            </Link>
            <LogoutLink className="rounded-md border px-4 py-2 hover:bg-black/[.04] dark:hover:bg-white/[.08]">
              Log out
            </LogoutLink>
          </div>
        </>
      ) : (
        <div className="flex gap-3">
          <LoginLink
            postLoginRedirectURL="/dashboard"
            className="rounded-md border px-4 py-2 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
          >
            Log in
          </LoginLink>
          <RegisterLink
            postLoginRedirectURL="/dashboard"
            className="rounded-md border px-4 py-2 hover:bg-black/[.04] dark:hover:bg-white/[.08]"
          >
            Sign up
          </RegisterLink>
        </div>
      )}
    </main>
  );
}
