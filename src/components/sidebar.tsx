"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/token";
import { SaveBadge } from "./save-badge";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/demandas/", label: "Demandas" },
  { href: "/projetos/", label: "Projetos" },
  { href: "/pautas-1on1/", label: "Pautas 1:1" },
  { href: "/notas/", label: "Bloco de notas" },
  { href: "/pessoas/", label: "Pessoas" },
  { href: "/trajetoria/", label: "Trajetória" },
] as const;

function normalizePath(path: string) {
  if (!path.endsWith("/")) return `${path}/`;
  return path;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const current = normalizePath(pathname || "/");

  function logout() {
    clearToken();
    router.replace("/login/");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <p className="sidebar__mark">My Diary</p>
        <p className="sidebar__tag">Seu hub pessoal</p>
      </div>

      <nav className="sidebar__nav" aria-label="Áreas do My Diary">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? current === "/"
              : current.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar__link${active ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar__foot">
        <SaveBadge />
        <button type="button" className="btn btn--ghost" onClick={logout}>
          Sair
        </button>
      </div>
    </aside>
  );
}
