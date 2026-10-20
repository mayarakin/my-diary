"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useCollection } from "@/hooks/use-collection";
import { isDemandaDoneOn, isDemandaDueOn, toDateKey } from "@/lib/recurrence";
import { newId, nowIso } from "@/lib/schema";
import type { Demanda, DemandaPrioridade } from "@/lib/types";

type Filter = "abertas" | "feitas" | "todas";

function isLate(d: Demanda): boolean {
  if (d.feita || !d.prazo) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const prazo = new Date(`${d.prazo}T00:00:00`);
  return prazo < today;
}

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
  const notas = useCollection("notas");

  const [filter, setFilter] = useState<Filter>("abertas");
  const [titulo, setTitulo] = useState("");
  const [prazo, setPrazo] = useState("");
  const [prioridade, setPrioridade] = useState<DemandaPrioridade | "">("");

  const hojeKey = toDateKey(new Date());
  const demandasHoje = demandas.items.filter((d) => isDemandaDueOn(d, hojeKey));
  const demandasHojePendentes = demandasHoje.filter(
    (d) => !isDemandaDoneOn(d, hojeKey),
  );
  const abertas = demandas.items.filter((d) => !d.feita && !d.recorrencia);
  const emAndamento = projetos.items.filter((p) => p.status === "em_andamento");
  const proximo1on1 = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [...oneones.items]
      .filter((o) => new Date(`${o.data}T00:00:00`) >= today)
      .sort((a, b) => a.data.localeCompare(b.data))[0];
  }, [oneones.items]);
  const notasRecentes = [...notas.items]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  const filtered = useMemo(() => {
    let list = [...demandas.items];
    if (filter === "abertas") list = list.filter((d) => !d.feita);
    if (filter === "feitas") list = list.filter((d) => d.feita);
    return list.sort((a, b) => {
      if (a.feita !== b.feita) return a.feita ? 1 : -1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [demandas.items, filter]);

  async function toggle(d: Demanda) {
    await demandas.upsert({
      ...d,
      feita: !d.feita,
      updatedAt: nowIso(),
    });
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    const now = nowIso();
    await demandas.upsert({
      id: newId(),
      titulo: titulo.trim(),
      feita: false,
      prioridade: prioridade || undefined,
      prazo: prazo || undefined,
      createdAt: now,
      updatedAt: now,
    });
    setTitulo("");
    setPrazo("");
    setPrioridade("");
  }

  return (
    <div>
      <PageHeader
        title="Home"
        subtitle="Resumo do dia e checklist de demandas do My Diary."
        actions={
          <Link href="/hoje/" className="btn">
            Ver demandas de hoje
          </Link>
        }
      />

      <section className="summary-row" aria-label="Resumo">
        <article className="summary-tile">
          <p className="summary-tile__label">Para hoje</p>
          <p className="summary-tile__value">{demandasHojePendentes.length}</p>
          <p className="summary-tile__meta">
            {demandasHoje.length} no total ·{" "}
            <Link href="/hoje/" style={{ textDecoration: "underline" }}>
              abrir
            </Link>
          </p>
        </article>
        <article className="summary-tile">
          <p className="summary-tile__label">Demandas abertas</p>
          <p className="summary-tile__value">{abertas.length}</p>
          <p className="summary-tile__meta">
            {abertas.filter(isLate).length} atrasada(s)
          </p>
        </article>
        <article className="summary-tile">
          <p className="summary-tile__label">Projetos ativos</p>
          <p className="summary-tile__value">{emAndamento.length}</p>
          <p className="summary-tile__meta">em andamento</p>
        </article>
        <article className="summary-tile">
          <p className="summary-tile__label">Próximo 1:1</p>
          <p className="summary-tile__value">
            {proximo1on1
              ? formatDate(proximo1on1.data)
              : "—"}
          </p>
          <p className="summary-tile__meta">
            {proximo1on1?.pessoaNome ||
              (proximo1on1 ? "Sem nome" : "Nenhum agendado")}
          </p>
        </article>
      </section>

      <section className="panel">
        <h2 style={{ margin: "0 0 0.85rem", fontFamily: "var(--font-display)" }}>
          Demandas
        </h2>

        <form onSubmit={onAdd} className="form-grid form-grid--2" style={{ marginBottom: "1rem" }}>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="demanda-titulo">Nova demanda</label>
            <input
              id="demanda-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="O que precisa ser feito?"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="demanda-prazo">Prazo</label>
            <input
              id="demanda-prazo"
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="demanda-prio">Prioridade</label>
            <select
              id="demanda-prio"
              value={prioridade}
              onChange={(e) =>
                setPrioridade(e.target.value as DemandaPrioridade | "")
              }
            >
              <option value="">—</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <button className="btn" type="submit">
              Adicionar
            </button>
          </div>
        </form>

        <div className="filters">
          {(
            [
              ["abertas", "Abertas"],
              ["feitas", "Feitas"],
              ["todas", "Todas"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`filter-chip${filter === key ? " is-active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {demandas.loading ? (
          <EmptyState title="Carregando demandas…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhuma demanda neste filtro"
            hint="Adicione uma acima para começar o checklist."
          />
        ) : (
          <div className="checklist">
            {filtered.map((d) => (
              <div
                key={d.id}
                className={`check-row${d.feita ? " is-done" : ""}${
                  isLate(d) ? " is-late" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={d.feita}
                  onChange={() => void toggle(d)}
                  aria-label={`Marcar ${d.titulo}`}
                />
                <div>
                  <p className="check-row__title">{d.titulo}</p>
                  <p className="check-row__meta">
                    {d.prioridade ? `Prioridade ${d.prioridade}` : "Sem prioridade"}
                    {" · "}
                    {d.prazo
                      ? `Prazo ${formatDate(d.prazo)}${isLate(d) ? " · atrasada" : ""}`
                      : "Sem prazo"}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => void demandas.remove(d.id)}
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {notasRecentes.length > 0 ? (
        <section className="panel" style={{ marginTop: "1rem" }}>
          <h2 style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-display)" }}>
            Últimas notas
          </h2>
          <div className="list-stack">
            {notasRecentes.map((n) => (
              <div key={n.id} className="list-item">
                <div>
                  <h3>{n.titulo}</h3>
                  <p>
                    {n.corpo.slice(0, 140)}
                    {n.corpo.length > 140 ? "…" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
