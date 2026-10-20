"use client";

import { useMemo, useState, type FormEvent } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useCollection } from "@/hooks/use-collection";
import {
  describeRecorrencia,
  isDemandaDoneOn,
  isDemandaDueOn,
  toDateKey,
  weekdayLabel,
} from "@/lib/recurrence";
import { newId, nowIso } from "@/lib/schema";
import type { Demanda, DemandaPrioridade, RecorrenciaTipo } from "@/lib/types";

type FormState = {
  titulo: string;
  prioridade: DemandaPrioridade | "";
  modo: "prazo" | "recorrente";
  prazo: string;
  tipo: RecorrenciaTipo;
  diaSemana: number;
  intervaloDias: number;
  dataInicio: string;
};

const emptyForm = (): FormState => ({
  titulo: "",
  prioridade: "",
  modo: "recorrente",
  prazo: toDateKey(new Date()),
  tipo: "a_cada_n_dias",
  diaSemana: 5,
  intervaloDias: 15,
  dataInicio: toDateKey(new Date()),
});

export default function HojePage() {
  const { items, upsert, remove, loading } = useCollection("demandas");
  const [dateKey, setDateKey] = useState(() => toDateKey(new Date()));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const dueToday = useMemo(() => {
    return items
      .filter((d) => isDemandaDueOn(d, dateKey))
      .sort((a, b) => {
        const aDone = isDemandaDoneOn(a, dateKey) ? 1 : 0;
        const bDone = isDemandaDoneOn(b, dateKey) ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return a.titulo.localeCompare(b.titulo, "pt-BR");
      });
  }, [items, dateKey]);

  const dateLabel = useMemo(() => {
    const d = new Date(`${dateKey}T12:00:00`);
    return d.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [dateKey]);

  async function toggle(d: Demanda) {
    if (d.recorrencia) {
      const set = new Set(d.feitasEm ?? []);
      if (set.has(dateKey)) set.delete(dateKey);
      else set.add(dateKey);
      await upsert({
        ...d,
        feitasEm: [...set].sort(),
        updatedAt: nowIso(),
      });
      return;
    }
    await upsert({
      ...d,
      feita: !d.feita,
      updatedAt: nowIso(),
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const now = nowIso();
    const base: Demanda = {
      id: newId(),
      titulo: form.titulo.trim(),
      feita: false,
      prioridade: form.prioridade || undefined,
      createdAt: now,
      updatedAt: now,
      feitasEm: [],
    };

    if (form.modo === "prazo") {
      await upsert({
        ...base,
        prazo: form.prazo,
      });
    } else {
      await upsert({
        ...base,
        recorrencia: {
          tipo: form.tipo,
          diaSemana: form.diaSemana,
          intervaloDias:
            form.tipo === "a_cada_n_dias" ? form.intervaloDias : undefined,
          dataInicio: form.dataInicio,
        },
      });
    }
    setOpen(false);
    setForm(emptyForm());
  }

  const pending = dueToday.filter((d) => !isDemandaDoneOn(d, dateKey)).length;

  return (
    <div>
      <PageHeader
        title="Demandas de hoje"
        subtitle="Abra este link no dia e veja só o que cai nesta data — inclusive recorrências (ex.: a cada 15 dias na sexta)."
        actions={
          <button
            type="button"
            className="btn"
            onClick={() => {
              setForm(emptyForm());
              setOpen(true);
            }}
          >
            Nova demanda
          </button>
        }
      />

      <section className="today-hero">
        <p className="today-hero__date">{dateLabel}</p>
        <p className="today-hero__meta">
          {pending === 0
            ? "Nada pendente neste dia"
            : `${pending} demanda(s) pendente(s)`}
        </p>
        <div className="field" style={{ marginTop: "0.9rem", maxWidth: 260 }}>
          <label htmlFor="hoje-data">Ver outro dia</label>
          <input
            id="hoje-data"
            type="date"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
          />
        </div>
        <p className="today-hero__meta" style={{ marginTop: "0.65rem" }}>
          Atalho fixo:{" "}
          <code style={{ fontSize: "0.9em" }}>/hoje/</code> — sempre mostra o
          dia atual quando você abrir o link.
        </p>
      </section>

      {loading ? (
        <EmptyState title="Carregando demandas…" />
      ) : dueToday.length === 0 ? (
        <EmptyState
          title="Nenhuma demanda para este dia"
          hint="Crie uma com prazo neste dia, ou uma recorrente (ex.: a cada 15 dias na sexta)."
        />
      ) : (
        <div className="checklist">
          {dueToday.map((d) => {
            const done = isDemandaDoneOn(d, dateKey);
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
                        ? `Prazo ${d.prazo}`
                        : "Sem recorrência"}
                    {d.prioridade ? ` · Prioridade ${d.prioridade}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => void remove(d.id)}
                >
                  Excluir
                </button>
              </div>
            );
          })}
        </div>
      )}

      <section className="panel" style={{ marginTop: "1.25rem" }}>
        <h2 style={{ margin: "0 0 0.5rem", fontFamily: "var(--font-display)" }}>
          Todas as recorrências
        </h2>
        <p style={{ margin: "0 0 0.85rem", color: "var(--ink-soft)" }}>
          Visão rápida do que se repete — a lista de cima filtra só o dia
          escolhido.
        </p>
        {items.filter((d) => d.recorrencia).length === 0 ? (
          <EmptyState title="Nenhuma demanda recorrente ainda" />
        ) : (
          <div className="list-stack">
            {items
              .filter((d) => d.recorrencia)
              .map((d) => (
                <div key={d.id} className="list-item">
                  <div>
                    <h3>{d.titulo}</h3>
                    <p>{describeRecorrencia(d.recorrencia)}</p>
                    <p>
                      Início:{" "}
                      {new Date(
                        `${d.recorrencia!.dataInicio}T12:00:00`,
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => void remove(d.id)}
                  >
                    Excluir
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>

      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nova demanda do dia</h2>
            <form className="form-grid" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="h-titulo">Título</label>
                <input
                  id="h-titulo"
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex.: Fechar relatório quinzenal"
                />
              </div>
              <div className="field">
                <label htmlFor="h-prio">Prioridade</label>
                <select
                  id="h-prio"
                  value={form.prioridade}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      prioridade: e.target.value as DemandaPrioridade | "",
                    })
                  }
                >
                  <option value="">—</option>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="h-modo">Tipo</label>
                <select
                  id="h-modo"
                  value={form.modo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      modo: e.target.value as FormState["modo"],
                    })
                  }
                >
                  <option value="recorrente">Recorrente</option>
                  <option value="prazo">Só em uma data</option>
                </select>
              </div>

              {form.modo === "prazo" ? (
                <div className="field">
                  <label htmlFor="h-prazo">Data</label>
                  <input
                    id="h-prazo"
                    type="date"
                    required
                    value={form.prazo}
                    onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  <div className="field">
                    <label htmlFor="h-tipo">Recorrência</label>
                    <select
                      id="h-tipo"
                      value={form.tipo}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tipo: e.target.value as RecorrenciaTipo,
                        })
                      }
                    >
                      <option value="a_cada_n_dias">A cada N dias</option>
                      <option value="quinzenal">A cada 2 semanas</option>
                      <option value="semanal">Toda semana</option>
                    </select>
                  </div>
                  {form.tipo === "a_cada_n_dias" ? (
                    <div className="field">
                      <label htmlFor="h-intervalo">Intervalo (dias)</label>
                      <input
                        id="h-intervalo"
                        type="number"
                        min={1}
                        value={form.intervaloDias}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            intervaloDias: Number(e.target.value) || 15,
                          })
                        }
                      />
                    </div>
                  ) : null}
                  <div className="field">
                    <label htmlFor="h-dia">Dia da semana</label>
                    <select
                      id="h-dia"
                      value={form.diaSemana}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          diaSemana: Number(e.target.value),
                        })
                      }
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                        <option key={d} value={d}>
                          {weekdayLabel(d)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="h-inicio">Data de início (1ª ocorrência)</label>
                    <input
                      id="h-inicio"
                      type="date"
                      required
                      value={form.dataInicio}
                      onChange={(e) =>
                        setForm({ ...form, dataInicio: e.target.value })
                      }
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                    Exemplo: a cada 15 dias na sexta → escolha “A cada N dias”,
                    intervalo 15, dia Sexta, e a data da próxima sexta como
                    início.
                  </p>
                </>
              )}

              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
