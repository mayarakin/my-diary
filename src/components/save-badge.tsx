"use client";

import { useSaveStatus } from "@/hooks/use-collection";

export function SaveBadge() {
  const { status, error } = useSaveStatus();

  if (status === "idle") {
    return (
      <span className="save-badge save-badge--idle" title="Pronto">
        Pronto
      </span>
    );
  }

  if (status === "loading") {
    return (
      <span className="save-badge save-badge--loading">Carregando…</span>
    );
  }

  if (status === "saving") {
    return (
      <span className="save-badge save-badge--saving">Salvando…</span>
    );
  }

  if (status === "error") {
    return (
      <span className="save-badge save-badge--error" title={error ?? "Erro"}>
        Erro ao salvar
      </span>
    );
  }

  return <span className="save-badge save-badge--saved">Salvo</span>;
}
