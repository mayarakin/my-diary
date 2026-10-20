"use client";

import { useState, type FormEvent } from "react";
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

export default function AtividadesPage() {
  const { items, upsert, remove, loading } = useCollection("atividades");
  const projetos = useCollection("projetos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Atividade | null>(null);
  const [form, setForm] = useState(empty);

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

  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader
        title="Atividades"
        subtitle="Registro do que você fez — com vínculo opcional a um projeto."
        actions={
          <button type="button" className="btn" onClick={openNew}>
            Nova atividade
          </button>
        }
      />

      {loading ? (
        <EmptyState title="Carregando atividades…" />
      ) : sorted.length === 0 ? (
        <EmptyState title="Nenhuma atividade ainda" hint="Registre o primeiro feito do dia." />
      ) : (
        <div className="list-stack">
          {sorted.map((a) => {
            const projeto = projetos.items.find((p) => p.id === a.projetoId);
            return (
              <div key={a.id} className="list-item">
                <div>
                  <h3>{a.titulo}</h3>
                  <p>
                    {new Date(`${a.date}T12:00:00`).toLocaleDateString("pt-BR")}
                    {projeto ? ` · ${projeto.titulo}` : ""}
                  </p>
                  {a.notas ? <p>{a.notas}</p> : null}
                </div>
                <div className="item-actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => openEdit(a)}>
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
              </div>
            );
          })}
        </div>
      )}

      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Editar atividade" : "Nova atividade"}</h2>
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
