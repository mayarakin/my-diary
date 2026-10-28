"use client";

import { useState, type FormEvent } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useCollection } from "@/hooks/use-collection";
import { newId, nowIso } from "@/lib/schema";
import type { Pessoa } from "@/lib/types";

const empty = { nome: "", contexto: "", notas: "" };

export default function PessoasPage() {
  const { items, upsert, remove, loading } = useCollection("pessoas");
  const projetos = useCollection("projetos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pessoa | null>(null);
  const [form, setForm] = useState(empty);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(p: Pessoa) {
    setEditing(p);
    setForm({
      nome: p.nome,
      contexto: p.contexto ?? "",
      notas: p.notas ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const now = nowIso();
    await upsert({
      id: editing?.id ?? newId(),
      nome: form.nome.trim(),
      contexto: form.contexto.trim() || undefined,
      notas: form.notas.trim() || undefined,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    });
    setOpen(false);
  }

  const sorted = [...items].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <div>
      <PageHeader
        title="Pessoas"
        subtitle="Toque no nome para ver projetos e a contribuição de cada pessoa."
        actions={
          <button type="button" className="btn" onClick={openNew}>
            Nova pessoa
          </button>
        }
      />

      {loading ? (
        <EmptyState title="Carregando pessoas…" />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="Nenhuma pessoa cadastrada"
          hint="Adicione alguém ou vincule ao salvar um projeto."
        />
      ) : (
        <div className="list-stack">
          {sorted.map((p) => {
            const isOpen = expandedId === p.id;
            const linkedProjetos = projetos.items.filter(
              (proj) =>
                proj.pessoaId === p.id ||
                (proj.pessoaNome &&
                  proj.pessoaNome.toLowerCase() === p.nome.toLowerCase()),
            );
            const comAjuda = linkedProjetos.filter((proj) => proj.ajudaDescricao?.trim());

            return (
              <div key={p.id} className={`list-item list-item--pessoa${isOpen ? " is-open" : ""}`}>
                <div className="pessoa-row">
                  <button
                    type="button"
                    className="pessoa-row__toggle"
                    onClick={() => setExpandedId(isOpen ? null : p.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="pessoa-row__chevron" aria-hidden>
                      {isOpen ? "▾" : "▸"}
                    </span>
                    <span className="pessoa-row__main">
                      <span className="pessoa-row__name">{p.nome}</span>
                      {p.contexto ? (
                        <span className="pessoa-row__contexto">{p.contexto}</span>
                      ) : null}
                      {!isOpen && linkedProjetos.length > 0 ? (
                        <span className="pessoa-row__hint">
                          {linkedProjetos.length} projeto
                          {linkedProjetos.length === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </span>
                  </button>
                  <div className="item-actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => openEdit(p)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => void remove(p.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {isOpen ? (
                  <div className="pessoa-details">
                    {p.notas ? <p className="pessoa-details__notas">{p.notas}</p> : null}

                    <div className="pessoa-block">
                      <strong>Projetos</strong>
                      {linkedProjetos.length === 0 ? (
                        <p style={{ margin: 0 }}>nenhum ainda</p>
                      ) : (
                        <ul className="pessoa-proj-list">
                          {linkedProjetos.map((proj) => (
                            <li key={proj.id}>{proj.titulo}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="pessoa-block">
                      <strong>Contribuição no Projeto</strong>
                      {comAjuda.length === 0 ? (
                        <p style={{ margin: 0 }}>
                          nada registrado ainda — preencha no projeto o campo
                          “Contribuição no Projeto”.
                        </p>
                      ) : (
                        <ul className="pessoa-ajuda-list">
                          {comAjuda.map((proj) => (
                            <li key={proj.id}>
                              <span className="pessoa-ajuda-list__proj">{proj.titulo}</span>
                              <span className="pessoa-ajuda-list__text">
                                {proj.ajudaDescricao}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {open ? (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Editar pessoa" : "Nova pessoa"}</h2>
            <form className="form-grid" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="pe-nome">Nome</label>
                <input
                  id="pe-nome"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="pe-contexto">Contexto</label>
                <input
                  id="pe-contexto"
                  value={form.contexto}
                  onChange={(e) => setForm({ ...form, contexto: e.target.value })}
                  placeholder="Time, relação, papel…"
                />
              </div>
              <div className="field">
                <label htmlFor="pe-notas">Notas</label>
                <textarea
                  id="pe-notas"
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
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
