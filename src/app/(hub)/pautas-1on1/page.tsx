"use client";

import { useState, type FormEvent } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useCollection } from "@/hooks/use-collection";
import { newId, nowIso } from "@/lib/schema";
import type { OneOnOne } from "@/lib/types";

const empty = {
  pessoaId: "",
  pessoaNome: "",
  data: new Date().toISOString().slice(0, 10),
  pauta: "",
  combinados: "",
  followUps: "",
};

export default function Pautas1on1Page() {
  const { items, upsert, remove, loading } = useCollection("oneones");
  const pessoas = useCollection("pessoas");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OneOnOne | null>(null);
  const [form, setForm] = useState(empty);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(o: OneOnOne) {
    setEditing(o);
    setForm({
      pessoaId: o.pessoaId ?? "",
      pessoaNome: o.pessoaNome ?? "",
      data: o.data,
      pauta: o.pauta,
      combinados: o.combinados,
      followUps: o.followUps,
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const now = nowIso();
    const pessoa = pessoas.items.find((p) => p.id === form.pessoaId);
    await upsert({
      id: editing?.id ?? newId(),
      pessoaId: form.pessoaId || undefined,
      pessoaNome: pessoa?.nome || form.pessoaNome.trim() || undefined,
      data: form.data,
      pauta: form.pauta.trim(),
      combinados: form.combinados.trim(),
      followUps: form.followUps.trim(),
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    });
    setOpen(false);
  }

  const sorted = [...items].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div>
      <PageHeader
        title="Pautas 1:1"
        subtitle="Pessoa, data, pauta, combinados e follow-ups."
        actions={
          <button type="button" className="btn" onClick={openNew}>
            Nova pauta
          </button>
        }
      />

      {loading ? (
        <EmptyState title="Carregando pautas…" />
      ) : sorted.length === 0 ? (
        <EmptyState title="Nenhuma pauta 1:1" hint="Registre a próxima conversa." />
      ) : (
        <div className="list-stack">
          {sorted.map((o) => (
            <div key={o.id} className="list-item">
              <div>
                <h3>
                  {o.pessoaNome || "Sem pessoa"} ·{" "}
                  {new Date(`${o.data}T12:00:00`).toLocaleDateString("pt-BR")}
                </h3>
                {o.pauta ? <p><strong>Pauta:</strong> {o.pauta}</p> : null}
                {o.combinados ? <p><strong>Combinados:</strong> {o.combinados}</p> : null}
                {o.followUps ? <p><strong>Follow-ups:</strong> {o.followUps}</p> : null}
              </div>
              <div className="item-actions">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => openEdit(o)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => void remove(o.id)}
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
            <h2>{editing ? "Editar 1:1" : "Nova pauta 1:1"}</h2>
            <form className="form-grid" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="o-pessoa">Pessoa</label>
                <select
                  id="o-pessoa"
                  value={form.pessoaId}
                  onChange={(e) => {
                    const pessoa = pessoas.items.find((p) => p.id === e.target.value);
                    setForm({
                      ...form,
                      pessoaId: e.target.value,
                      pessoaNome: pessoa?.nome ?? form.pessoaNome,
                    });
                  }}
                >
                  <option value="">Nome livre…</option>
                  {pessoas.items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              {!form.pessoaId ? (
                <div className="field">
                  <label htmlFor="o-nome">Nome da pessoa</label>
                  <input
                    id="o-nome"
                    value={form.pessoaNome}
                    onChange={(e) => setForm({ ...form, pessoaNome: e.target.value })}
                    placeholder="Nome"
                  />
                </div>
              ) : null}
              <div className="field">
                <label htmlFor="o-data">Data</label>
                <input
                  id="o-data"
                  type="date"
                  required
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="o-pauta">Pauta</label>
                <textarea
                  id="o-pauta"
                  value={form.pauta}
                  onChange={(e) => setForm({ ...form, pauta: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="o-combinados">Combinados</label>
                <textarea
                  id="o-combinados"
                  value={form.combinados}
                  onChange={(e) => setForm({ ...form, combinados: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="o-follow">Follow-ups</label>
                <textarea
                  id="o-follow"
                  value={form.followUps}
                  onChange={(e) => setForm({ ...form, followUps: e.target.value })}
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
