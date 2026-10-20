"use client";

import { useMemo, useState, type FormEvent } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useCollection } from "@/hooks/use-collection";
import { newId, nowIso } from "@/lib/schema";
import type { Atividade } from "@/lib/types";

const empty = {
  date: new Date().toISOString().slice(0, 10),
  titulo: "",
  notas: "",
  projetoId: "",
};

export default function TrajetoriaPage() {
  const { items, upsert, remove, loading } = useCollection("atividades");
  const projetos = useCollection("projetos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Atividade | null>(null);
  const [form, setForm] = useState(empty);

  const timeline = useMemo(() => {
    const byDate = new Map<string, Atividade[]>();
    for (const a of items) {
      const list = byDate.get(a.date) ?? [];
      list.push(a);
      byDate.set(a.date, list);
    }
    return [...byDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, entries]) => ({
        date,
        entries: entries.sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)),
      }));
  }, [items]);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(a: Atividade) {
    setEditing(a);
    setForm({
      date: a.date,
      titulo: a.titulo,
      notas: a.notas ?? "",
      projetoId: a.projetoId ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const now = nowIso();
    await upsert({
      id: editing?.id ?? newId(),
      date: form.date,
      titulo: form.titulo.trim(),
      notas: form.notas.trim() || undefined,
      projetoId: form.projetoId || undefined,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    });
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Trajetória"
        subtitle="Linha do tempo do que você fez — o mais recente sempre no topo."
        actions={
          <button type="button" className="btn" onClick={openNew}>
            Novo registro
          </button>
        }
      />

      {loading ? (
        <EmptyState title="Carregando trajetória…" />
      ) : timeline.length === 0 ? (
        <EmptyState
          title="Nenhum registro ainda"
          hint="Registre o primeiro feito da sua trajetória."
        />
      ) : (
        <div className="timeline">
          {timeline.map((group) => {
            const label = new Date(`${group.date}T12:00:00`).toLocaleDateString(
              "pt-BR",
              {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              },
            );
            return (
              <section key={group.date} className="timeline__group">
                <header className="timeline__date">
                  <span className="timeline__dot" aria-hidden />
                  <h2>{label}</h2>
                </header>
                <div className="timeline__entries">
                  {group.entries.map((a) => {
                    const projeto = projetos.items.find((p) => p.id === a.projetoId);
                    return (
                      <article key={a.id} className="timeline__card">
                        <h3 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem" }}>
                          {a.titulo}
                        </h3>
                        {projeto ? (
                          <p style={{ margin: "0 0 0.35rem", color: "var(--ink-soft)" }}>
                            Projeto: {projeto.titulo}
                          </p>
                        ) : null}
                        {a.notas ? <p className="timeline__extra">{a.notas}</p> : null}
                        <div className="item-actions" style={{ marginTop: "0.75rem" }}>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => openEdit(a)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            onClick={() => void remove(a.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Editar registro" : "Novo registro"}</h2>
            <form className="form-grid" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="a-date">Data</label>
                <input
                  id="a-date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="a-titulo">Título</label>
                <input
                  id="a-titulo"
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="a-notas">Notas</label>
                <textarea
                  id="a-notas"
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="a-projeto">Projeto (opcional)</label>
                <select
                  id="a-projeto"
                  value={form.projetoId}
                  onChange={(e) => setForm({ ...form, projetoId: e.target.value })}
                >
                  <option value="">—</option>
                  {projetos.items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo}
                    </option>
                  ))}
                </select>
              </div>
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
