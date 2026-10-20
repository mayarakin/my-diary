"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useCollection } from "@/hooks/use-collection";
import {
  describeRecorrencia,
  isDemandaDoneOn,
  isDemandaDueOn,
  toDateKey,
} from "@/lib/recurrence";
import { nowIso } from "@/lib/schema";
import type { Demanda } from "@/lib/types";

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

export default function HomePage() {
  const demandas = useCollection("demandas");
  const projetos = useCollection("projetos");
  const oneones = useCollection("oneones");

  const hojeKey = toDateKey(new Date());
  const demandasHoje = useMemo(() => {
    return demandas.items
      .filter((d) => isDemandaDueOn(d, hojeKey))
      .sort((a, b) => {
        const aDone = isDemandaDoneOn(a, hojeKey) ? 1 : 0;
        const bDone = isDemandaDoneOn(b, hojeKey) ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return a.titulo.localeCompare(b.titulo, "pt-BR");
      });
  }, [demandas.items, hojeKey]);

  const pendentes = demandasHoje.filter((d) => !isDemandaDoneOn(d, hojeKey));
  const emAndamento = projetos.items.filter((p) => p.status === "em_andamento");
  const proximo1on1 = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [...oneones.items]
      .filter((o) => new Date(`${o.data}T00:00:00`) >= today)
      .sort((a, b) => a.data.localeCompare(b.data))[0];
  }, [oneones.items]);

  const hojeLabel = new Date(`${hojeKey}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  async function toggle(d: Demanda) {
    if (d.recorrencia) {
      const set = new Set(d.feitasEm ?? []);
      if (set.has(hojeKey)) set.delete(hojeKey);
      else set.add(hojeKey);
      await demandas.upsert({
        ...d,
        feitasEm: [...set].sort(),
        updatedAt: nowIso(),
      });
      return;
    }
    await demandas.upsert({
      ...d,
      feita: !d.feita,
      updatedAt: nowIso(),
    });
  }

  return (
    <div>
      <PageHeader
        title="Home"
        subtitle={`Foco no que é de hoje · ${hojeLabel}`}
        actions={
          <Link href="/demandas/" className="btn btn--ghost">
            Gerenciar demandas
          </Link>
        }
      />

      <section className="summary-row summary-row--3" aria-label="Resumo">
        <article className="summary-tile">
          <p className="summary-tile__label">Pendentes hoje</p>
          <p className="summary-tile__value">{pendentes.length}</p>
          <p className="summary-tile__meta">{demandasHoje.length} no total</p>
        </article>
        <article className="summary-tile">
          <p className="summary-tile__label">Projetos ativos</p>
          <p className="summary-tile__value">{emAndamento.length}</p>
          <p className="summary-tile__meta">em andamento</p>
        </article>
        <article className="summary-tile">
          <p className="summary-tile__label">Próximo 1:1</p>
          <p className="summary-tile__value">
            {proximo1on1 ? formatDate(proximo1on1.data) : "—"}
          </p>
          <p className="summary-tile__meta">
            {proximo1on1 ? "na linha do tempo" : "Nenhum agendado"}
          </p>
        </article>
      </section>

      <section className="panel">
        <h2 style={{ margin: "0 0 0.85rem", fontFamily: "var(--font-display)" }}>
          Demandas
        </h2>

        {demandas.loading ? (
          <EmptyState title="Carregando…" />
        ) : demandasHoje.length === 0 ? (
          <EmptyState
            title="Nada para hoje"
            hint="Crie ou configure recorrências em Demandas."
          />
        ) : (
          <div className="checklist">
            {demandasHoje.map((d) => {
              const done = isDemandaDoneOn(d, hojeKey);
              return (
                <div
                  key={d.id}
                  className={`check-row${done ? " is-done" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => void toggle(d)}
                    aria-label={`Marcar ${d.titulo}`}
                  />
                  <div>
                    <p className="check-row__title">{d.titulo}</p>
                    <p className="check-row__meta">
                      {d.recorrencia
                        ? describeRecorrencia(d.recorrencia)
                        : d.prazo
                          ? `Prazo ${formatDate(d.prazo)}`
                          : "Para hoje"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
