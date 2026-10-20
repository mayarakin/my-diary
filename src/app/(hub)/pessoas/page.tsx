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
        subtitle="Cadastro com contexto e 1:1s ligados a cada pessoa."
        actions={
          <button type="button" className="btn" onClick={openNew}>
            Nova pessoa
          </button>
        }
      />

      {loading ? (
        <EmptyState title="Carregando pessoas…" />
      ) : sorted.length === 0 ? (
        <EmptyState title="Nenhuma pessoa cadastrada" hint="Adicione quem aparece nos seus 1:1s." />
      ) : (
        <div className="list-stack">
          {sorted.map((p) => {
            const linked = oneones.items
              .filter(
                (o) =>
                  o.pessoaId === p.id ||
                  (o.pessoaNome &&
                    o.pessoaNome.toLowerCase() === p.nome.toLowerCase()),
              )
              .sort((a, b) => b.data.localeCompare(a.data));
            return (
              <div key={p.id} className="list-item">
                <div>
                  <h3>{p.nome}</h3>
                  {p.contexto ? <p>{p.contexto}</p> : null}
                  {p.notas ? <p>{p.notas}</p> : null}
                  <p style={{ marginTop: "0.55rem" }}>
                    <strong>1:1s:</strong>{" "}
                    {linked.length === 0
                      ? "nenhum ainda"
                      : linked
                          .slice(0, 4)
                          .map((o) =>
                            new Date(`${o.data}T12:00:00`).toLocaleDateString("pt-BR"),
                          )
                          .join(" · ")}
                    {linked.length > 4 ? ` (+${linked.length - 4})` : ""}
                  </p>
                </div>
                <div className="item-actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => openEdit(p)}>
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
