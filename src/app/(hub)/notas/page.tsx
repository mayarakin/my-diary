"use client";

import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useCollection } from "@/hooks/use-collection";
import { newId, nowIso } from "@/lib/schema";
import type { Nota } from "@/lib/types";

const empty = { titulo: "", corpo: "", tags: "" };

const KEEP_COLORS = [
  "var(--keep-1)",
  "var(--keep-2)",
  "var(--keep-3)",
  "var(--keep-4)",
  "var(--keep-5)",
];

function colorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i) * 17) % 997;
  return KEEP_COLORS[hash % KEEP_COLORS.length];
}

export default function NotasPage() {
  const { items, upsert, remove, loading } = useCollection("notas");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Nota | null>(null);
  const [form, setForm] = useState(empty);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickTitulo, setQuickTitulo] = useState("");
  const [quickCorpo, setQuickCorpo] = useState("");

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

  async function saveQuick() {
    const corpo = quickCorpo.trim();
    const titulo = quickTitulo.trim() || corpo.split("\n")[0]?.slice(0, 60) || "Nota rápida";
    if (!corpo && !quickTitulo.trim()) return;
    const now = nowIso();
    await upsert({
      id: newId(),
      titulo,
      corpo: corpo || titulo,
      tags: ["rápida"],
      createdAt: now,
      updatedAt: now,
    });
    setQuickTitulo("");
    setQuickCorpo("");
    setQuickOpen(false);
  }

  function onQuickKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void saveQuick();
    }
  }

  return (
    <div>
      <PageHeader
        title="Bloco de notas"
        subtitle="Nota rápida estilo Keep, ou nota completa com tags."
        actions={
          <button type="button" className="btn" onClick={openNew}>
            Nota completa
          </button>
        }
      />

      <div
        className={`keep-composer${quickOpen ? " is-open" : ""}`}
        onClick={() => {
          if (!quickOpen) setQuickOpen(true);
        }}
      >
        {!quickOpen ? (
          <p className="keep-composer__placeholder">Anotar…</p>
        ) : (
          <div className="keep-composer__fields" onClick={(e) => e.stopPropagation()}>
            <input
              className="keep-composer__title"
              placeholder="Título"
              value={quickTitulo}
              onChange={(e) => setQuickTitulo(e.target.value)}
              autoFocus
            />
            <textarea
              className="keep-composer__body"
              placeholder="Escreva uma nota rápida…"
              value={quickCorpo}
              onChange={(e) => setQuickCorpo(e.target.value)}
              onKeyDown={onQuickKey}
              rows={3}
            />
            <div className="keep-composer__actions">
              <span className="keep-composer__hint">Ctrl/⌘ + Enter para salvar</span>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setQuickOpen(false);
                  setQuickTitulo("");
                  setQuickCorpo("");
                }}
              >
                Fechar
              </button>
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => void saveQuick()}
                disabled={!quickTitulo.trim() && !quickCorpo.trim()}
              >
                Salvar
              </button>
            </div>
          </div>
        )}
      </div>

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
          hint={query ? "Tente outro termo." : "Use a nota rápida acima."}
        />
      ) : (
        <div className="keep-grid">
          {filtered.map((n) => (
            <article
              key={n.id}
              className="keep-card"
              style={{ background: colorForId(n.id) }}
            >
              <button
                type="button"
                className="keep-card__main"
                onClick={() => openEdit(n)}
              >
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
              </button>
              <div className="keep-card__foot">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => openEdit(n)}
                >
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
            </article>
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
