"use client";

import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useCollection } from "@/hooks/use-collection";
import { newId, nowIso } from "@/lib/schema";
import type { Nota, NotaTarefa } from "@/lib/types";

type FormTarefa = { key: string; texto: string; feita: boolean };

const emptyForm = { titulo: "", corpo: "", tags: "", tarefas: [] as FormTarefa[] };

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

function toFormTarefas(tarefas?: NotaTarefa[]): FormTarefa[] {
  return (tarefas ?? []).map((t) => ({
    key: t.id,
    texto: t.texto,
    feita: t.feita,
  }));
}

function fromFormTarefas(tarefas: FormTarefa[]): NotaTarefa[] {
  return tarefas
    .map((t) => ({
      id: t.key || newId(),
      texto: t.texto.trim(),
      feita: t.feita,
    }))
    .filter((t) => t.texto.length > 0);
}

export default function NotasPage() {
  const { items, upsert, remove, loading } = useCollection("notas");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Nota | null>(null);
  const [form, setForm] = useState(emptyForm);
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
        n.tags.some((t) => t.toLowerCase().includes(q)) ||
        (n.tarefas ?? []).some((t) => t.texto.toLowerCase().includes(q)),
    );
  }, [items, query]);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, tarefas: [] });
    setOpen(true);
  }

  function openEdit(n: Nota) {
    setEditing(n);
    setForm({
      titulo: n.titulo,
      corpo: n.corpo,
      tags: n.tags.join(", "),
      tarefas: toFormTarefas(n.tarefas),
    });
    setOpen(true);
  }

  function addTarefa() {
    setForm((f) => ({
      ...f,
      tarefas: [...f.tarefas, { key: newId(), texto: "", feita: false }],
    }));
  }

  function updateTarefa(key: string, patch: Partial<FormTarefa>) {
    setForm((f) => ({
      ...f,
      tarefas: f.tarefas.map((t) => (t.key === key ? { ...t, ...patch } : t)),
    }));
  }

  function removeTarefa(key: string) {
    setForm((f) => ({
      ...f,
      tarefas: f.tarefas.filter((t) => t.key !== key),
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const now = nowIso();
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const tarefas = fromFormTarefas(form.tarefas);
    const corpo = form.corpo.trim();
    if (!corpo && tarefas.length === 0) return;
    await upsert({
      id: editing?.id ?? newId(),
      titulo: form.titulo.trim(),
      corpo,
      tags,
      ...(tarefas.length ? { tarefas } : {}),
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    });
    setOpen(false);
  }

  async function toggleTarefa(nota: Nota, tarefaId: string) {
    const tarefas = (nota.tarefas ?? []).map((t) =>
      t.id === tarefaId ? { ...t, feita: !t.feita } : t,
    );
    await upsert({
      ...nota,
      tarefas,
      updatedAt: nowIso(),
    });
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

  const canSave =
    form.titulo.trim().length > 0 &&
    (form.corpo.trim().length > 0 || fromFormTarefas(form.tarefas).length > 0);

  return (
    <div>
      <PageHeader
        title="Bloco de notas"
        subtitle="Post-it rápido ou nota completa com texto e checklist."
        actions={
          <button type="button" className="btn" onClick={openNew}>
            Nota completa
          </button>
        }
      />

      <div className="postit-composer-wrap">
        <div
          className={`postit-composer${quickOpen ? " is-open" : ""}`}
          onClick={() => {
            if (!quickOpen) setQuickOpen(true);
          }}
        >
          {!quickOpen ? (
            <p className="postit-composer__placeholder">Nota rápida…</p>
          ) : (
            <div className="postit-composer__fields" onClick={(e) => e.stopPropagation()}>
              <input
                className="postit-composer__title"
                placeholder="Título"
                value={quickTitulo}
                onChange={(e) => setQuickTitulo(e.target.value)}
                autoFocus
              />
              <textarea
                className="postit-composer__body"
                placeholder="Escreva no post-it…"
                value={quickCorpo}
                onChange={(e) => setQuickCorpo(e.target.value)}
                onKeyDown={onQuickKey}
                rows={4}
              />
              <div className="postit-composer__actions">
                <span className="postit-composer__hint">Ctrl/⌘ + Enter</span>
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
                  Fixar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="field" style={{ marginBottom: "1rem", maxWidth: 420 }}>
        <label htmlFor="nota-busca">Buscar</label>
        <input
          id="nota-busca"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Título, corpo, tag ou tarefa…"
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
          {filtered.map((n) => {
            const tarefas = n.tarefas ?? [];
            const feitas = tarefas.filter((t) => t.feita).length;
            const isPostit =
              n.tags.some((t) => t.toLowerCase() === "rápida") &&
              tarefas.length === 0;
            const visibleTags = n.tags.filter(
              (t) => !(isPostit && t.toLowerCase() === "rápida"),
            );
            return (
              <article
                key={n.id}
                className={`keep-card${isPostit ? " keep-card--postit" : " keep-card--full"}`}
                style={{ background: colorForId(n.id) }}
              >
                <button
                  type="button"
                  className="keep-card__main"
                  onClick={() => openEdit(n)}
                >
                  <h3>{n.titulo}</h3>
                  {n.corpo ? <p>{n.corpo}</p> : null}
                  {tarefas.length ? (
                    <p className="keep-card__progress">
                      {feitas}/{tarefas.length} feitas
                    </p>
                  ) : null}
                  {visibleTags.length ? (
                    <div className="tag-row">
                      {visibleTags.map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
                {tarefas.length ? (
                  <ul className="nota-checklist nota-checklist--card">
                    {tarefas.map((t) => (
                      <li key={t.id} className={t.feita ? "is-done" : undefined}>
                        <label>
                          <input
                            type="checkbox"
                            checked={t.feita}
                            onChange={() => void toggleTarefa(n, t.id)}
                          />
                          <span>{t.texto}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : null}
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
            );
          })}
        </div>
      )}

      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
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
                <label htmlFor="n-corpo">Texto (opcional se houver tarefas)</label>
                <textarea
                  id="n-corpo"
                  value={form.corpo}
                  onChange={(e) => setForm({ ...form, corpo: e.target.value })}
                  style={{ minHeight: 120 }}
                  placeholder="Anotações livres…"
                />
              </div>

              <div className="field">
                <div className="nota-tarefas__head">
                  <label>Tarefas a fazer</label>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={addTarefa}>
                    + Adicionar tarefa
                  </button>
                </div>
                {form.tarefas.length === 0 ? (
                  <p className="nota-tarefas__empty">
                    Sem checklist ainda. Adicione itens tipo “preciso ajustar X”.
                  </p>
                ) : (
                  <ul className="nota-checklist nota-checklist--edit">
                    {form.tarefas.map((t) => (
                      <li key={t.key} className={t.feita ? "is-done" : undefined}>
                        <input
                          type="checkbox"
                          checked={t.feita}
                          onChange={(e) => updateTarefa(t.key, { feita: e.target.checked })}
                          aria-label="Marcar como feita"
                        />
                        <input
                          type="text"
                          className="nota-tarefas__input"
                          value={t.texto}
                          onChange={(e) => updateTarefa(t.key, { texto: e.target.value })}
                          placeholder="Ex.: preciso ajustar o relatório"
                          autoFocus={!t.texto}
                        />
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => removeTarefa(t.key)}
                          aria-label="Remover tarefa"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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
                <button type="submit" className="btn" disabled={!canSave}>
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
