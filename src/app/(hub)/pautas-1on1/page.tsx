"use client";

import { useMemo, useState, type FormEvent } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useCollection } from "@/hooks/use-collection";
import { newId, nowIso } from "@/lib/schema";
import { toDateKey } from "@/lib/recurrence";
import type { OneOnOne } from "@/lib/types";

const empty = {
  data: toDateKey(new Date()),
  pauta: "",
  combinados: "",
  followUps: "",
};

function pautaLines(pauta: string): string[] {
  return pauta
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

export default function Pautas1on1Page() {
  const { items, upsert, remove, loading } = useCollection("oneones");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OneOnOne | null>(null);
  const [form, setForm] = useState(empty);

  const timeline = useMemo(() => {
    const byDate = new Map<string, OneOnOne[]>();
    for (const o of items) {
      const list = byDate.get(o.data) ?? [];
      list.push(o);
      byDate.set(o.data, list);
    }
    return [...byDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([data, entries]) => ({
        data,
        entries: entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      }));
  }, [items]);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(o: OneOnOne) {
    setEditing(o);
    setForm({
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
    await upsert({
      id: editing?.id ?? newId(),
      data: form.data,
      pauta: form.pauta.trim(),
      combinados: form.combinados.trim(),
      followUps: form.followUps.trim(),
      // Mantém vínculo antigo se existir ao editar; nova pauta não pede pessoa
      pessoaId: editing?.pessoaId,
      pessoaNome: editing?.pessoaNome,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    });
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Pautas 1:1"
        subtitle="Linha do tempo por data — como no Docs: data do 1:1 e cada assunto em uma linha."
        actions={
          <button type="button" className="btn" onClick={openNew}>
            Nova pauta
          </button>
        }
      />

      {loading ? (
        <EmptyState title="Carregando pautas…" />
      ) : timeline.length === 0 ? (
        <EmptyState
          title="Nenhuma pauta ainda"
          hint="Crie a data do próximo 1:1 e liste os assuntos, um por linha."
        />
      ) : (
        <div className="timeline">
          {timeline.map((group) => {
            const label = new Date(`${group.data}T12:00:00`).toLocaleDateString(
              "pt-BR",
              {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              },
            );
            return (
              <section key={group.data} className="timeline__group">
                <header className="timeline__date">
                  <span className="timeline__dot" aria-hidden />
                  <h2>{label}</h2>
                </header>
                <div className="timeline__entries">
                  {group.entries.map((o) => {
                    const lines = pautaLines(o.pauta);
                    return (
                      <article key={o.id} className="timeline__card">
                        {lines.length > 0 ? (
                          <ul className="timeline__topics">
                            {lines.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="timeline__empty">Sem assuntos listados</p>
                        )}
                        {o.combinados ? (
                          <p className="timeline__extra">
                            <strong>Combinados:</strong> {o.combinados}
                          </p>
                        ) : null}
                        {o.followUps ? (
                          <p className="timeline__extra">
                            <strong>Follow-ups:</strong> {o.followUps}
                          </p>
                        ) : null}
                        <div className="item-actions" style={{ marginTop: "0.75rem" }}>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => openEdit(o)}
                          >
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
            <h2>{editing ? "Editar pauta" : "Nova pauta 1:1"}</h2>
            <form className="form-grid" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="o-data">Data do 1:1</label>
                <input
                  id="o-data"
                  type="date"
                  required
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="o-pauta">Assuntos (um por linha)</label>
                <textarea
                  id="o-pauta"
                  required
                  value={form.pauta}
                  onChange={(e) => setForm({ ...form, pauta: e.target.value })}
                  placeholder={"Feedback do sprint\nPrioridades da próxima semana\nBloqueios"}
                  style={{ minHeight: 160 }}
                />
              </div>
              <div className="field">
                <label htmlFor="o-combinados">Combinados (opcional)</label>
                <textarea
                  id="o-combinados"
                  value={form.combinados}
                  onChange={(e) => setForm({ ...form, combinados: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="o-follow">Follow-ups (opcional)</label>
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
