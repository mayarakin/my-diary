"use client";

import { useMemo, useState, type FormEvent } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useCollection } from "@/hooks/use-collection";
import { newId, nowIso } from "@/lib/schema";
import type { Nota } from "@/lib/types";

const empty = { titulo: "", corpo: "", tags: "" };

export default function NotasPage() {
  const { items, upsert, remove, loading } = useCollection("notas");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Nota | null>(null);
  const [form, setForm] = useState(empty);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (!q) return list;
    return list.filter(
      (n) =>
        n.titulo.toLowerCase().includes(q) ||
        n.corpo.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [items, query]);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(n: Nota) {
    setEditing(n);
    setForm({
      titulo: n.titulo,
      corpo: n.corpo,
      tags: n.tags.join(", "),
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const now = nowIso();
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await upsert({
      id: editing?.id ?? newId(),
      titulo: form.titulo.trim(),
      corpo: form.corpo,
      tags,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    });
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Bloco de notas"
        subtitle="Notas livres com busca simples por texto e tags."
        actions={
          <button type="button" className="btn" onClick={openNew}>
            Nova nota
          </button>
        }
      />

      <div className="field" style={{ marginBottom: "1rem", maxWidth: 420 }}>
        <label htmlFor="nota-busca">Buscar</label>
        <input
          id="nota-busca"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Título, corpo ou tag…"
        />
      </div>

      {loading ? (
        <EmptyState title="Carregando notas…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? "Nada encontrado" : "Nenhuma nota ainda"}
          hint={query ? "Tente outro termo." : "Escreva a primeira ideia."}
        />
      ) : (
        <div className="list-stack">
          {filtered.map((n) => (
            <div key={n.id} className="list-item">
              <div>
                <h3>{n.titulo}</h3>
                <p>{n.corpo}</p>
                {n.tags.length ? (
                  <div className="tag-row">
                    {n.tags.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="item-actions">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => openEdit(n)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => void remove(n.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Editar nota" : "Nova nota"}</h2>
            <form className="form-grid" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="n-titulo">Título</label>
                <input
                  id="n-titulo"
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="n-corpo">Corpo</label>
                <textarea
                  id="n-corpo"
                  required
                  value={form.corpo}
                  onChange={(e) => setForm({ ...form, corpo: e.target.value })}
                  style={{ minHeight: 160 }}
                />
              </div>
              <div className="field">
                <label htmlFor="n-tags">Tags (separadas por vírgula)</label>
                <input
                  id="n-tags"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="ideia, sync, leitura"
                />
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
