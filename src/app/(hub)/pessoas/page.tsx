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
  const oneones = useCollection("oneones");
  const projetos = useCollection("projetos");
  const atividades = useCollection("atividades");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pessoa | null>(null);
  const [form, setForm] = useState(empty);

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
        subtitle="Cadastro com 1:1s, projetos em que ajudaram e atividades ligadas."
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
            const linked1on1 = oneones.items
              .filter(
                (o) =>
                  o.pessoaId === p.id ||
                  (o.pessoaNome &&
                    o.pessoaNome.toLowerCase() === p.nome.toLowerCase()),
              )
              .sort((a, b) => b.data.localeCompare(a.data));

            const linkedProjetos = projetos.items.filter(
              (proj) =>
                proj.pessoaId === p.id ||
                (proj.pessoaNome &&
                  proj.pessoaNome.toLowerCase() === p.nome.toLowerCase()),
            );

            const projetoIds = new Set(linkedProjetos.map((proj) => proj.id));
            const linkedAtividades = atividades.items
              .filter((a) => a.projetoId && projetoIds.has(a.projetoId))
              .sort((a, b) => b.date.localeCompare(a.date));

            return (
              <div key={p.id} className="list-item">
                <div>
                  <h3>{p.nome}</h3>
                  {p.contexto ? <p>{p.contexto}</p> : null}
                  {p.notas ? <p>{p.notas}</p> : null}

                  <div className="pessoa-block">
                    <strong>Projetos em que ajudou</strong>
                    <p style={{ margin: 0 }}>
                      {linkedProjetos.length === 0
                        ? "nenhum ainda"
                        : linkedProjetos.map((proj) => proj.titulo).join(" · ")}
                    </p>
                  </div>

                  <div className="pessoa-block">
                    <strong>Trajetória nesses projetos</strong>
                    <p style={{ margin: 0 }}>
                      {linkedAtividades.length === 0
                        ? "nenhuma ainda"
                        : linkedAtividades
                            .slice(0, 5)
                            .map(
                              (a) =>
                                `${new Date(`${a.date}T12:00:00`).toLocaleDateString("pt-BR")}: ${a.titulo}`,
                            )
                            .join(" · ")}
                      {linkedAtividades.length > 5
                        ? ` (+${linkedAtividades.length - 5})`
                        : ""}
                    </p>
                  </div>

                  <div className="pessoa-block">
                    <strong>1:1s</strong>
                    <p style={{ margin: 0 }}>
                      {linked1on1.length === 0
                        ? "nenhum ainda"
                        : linked1on1
                            .slice(0, 4)
                            .map((o) =>
                              new Date(`${o.data}T12:00:00`).toLocaleDateString(
                                "pt-BR",
                              ),
                            )
                            .join(" · ")}
                      {linked1on1.length > 4
                        ? ` (+${linked1on1.length - 4})`
                        : ""}
                    </p>
                  </div>
                </div>
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
