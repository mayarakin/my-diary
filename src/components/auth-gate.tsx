"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthenticatedUser, type GithubUser } from "@/lib/github-api";
import { clearToken, getToken } from "@/lib/token";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<GithubUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const token = getToken();
      if (!token) {
        router.replace("/login/");
        return;
      }
      try {
        const me = await getAuthenticatedUser();
        if (!cancelled) {
          setUser(me);
          setChecking(false);
        }
      } catch (err: unknown) {
        const status =
          err && typeof err === "object" && "status" in err
            ? Number((err as { status: number }).status)
            : undefined;
        if (status === 401) {
          clearToken();
          router.replace("/login/");
          return;
        }
        // Network / other errors: keep token, still allow shell
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="boot-screen">
        <p className="boot-screen__brand">My Diary</p>
        <p className="boot-screen__msg">Abrindo seu espaço…</p>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <span className="sr-only">Conectado como {user.login}</span>
      ) : null}
      {children}
    </>
  );
}
