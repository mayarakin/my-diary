"use client";

import { useMemo, useState, type FormEvent } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useCollection } from "@/hooks/use-collection";
import { toDateKey } from "@/lib/recurrence";
import { newId, nowIso } from "@/lib/schema";
import type { OneOnOne, PautaAssunto } from "@/lib/types";

type AssuntoForm = { key: string; texto: string; alinhado: string };

function toAssuntoForms(o?: OneOnOne): AssuntoForm[] {
  let list: PautaAssunto[] = [];
  if (o?.assuntos && o.assuntos.length > 0) {
    list = o.assuntos;
  } else if (o?.pauta) {
    list = o.pauta
      .split("\n")
      .map((l) => l.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean)
      .map((texto) => ({ id: newId(), texto }));
  }
  if (list.length === 0) {
    return [{ key: newId(), texto: "", alinhado: "" }];
  }
  return list.map((a) => ({
    key: a.id || newId(),
    texto: a.texto,
    alinhado: a.alinhado ?? "",
  }));
}

const emptyForm = () => ({
  data: toDateKey(new Date()),
  assuntos: [{ key: newId(), texto: "", alinhado: "" }] as AssuntoForm[],
  combinados: "",
  followUps: "",
});

export default function Pautas1on1Page() {
  const { items, upsert, remove, loading } = useCollection("oneones");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OneOnOne | null>(null);
  const [form, setForm] = useState(emptyForm);

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
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(o: OneOnOne) {
    setEditing(o);
    setForm({
      data: o.data,
      assuntos: toAssuntoForms(o),
      combinados: o.combinados,
      followUps: o.followUps,
    });
    setOpen(true);
  }

  function updateAssunto(key: string, patch: Partial<AssuntoForm>) {
    setForm((prev) => ({
      ...prev,
      assuntos: prev.assuntos.map((a) =>
        a.key === key ? { ...a, ...patch } : a,
      ),
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const now = nowIso();
    const assuntos: PautaAssunto[] = form.assuntos
      .map((a) => ({
        id: a.key,
        texto: a.texto.trim(),
        alinhado: a.alinhado.trim() || undefined,
      }))
      .filter((a) => a.texto);

    if (assuntos.length === 0) return;

    await upsert({
      id: editing?.id ?? newId(),
      data: form.data,
      assuntos,
      pauta: assuntos.map((a) => a.texto).join("\n"),
      combinados: form.combinados.trim(),
      followUps: form.followUps.trim(),
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
        subtitle="Linha do tempo por data. Depois da conversa, registre o alinhado ao lado de cada assunto."
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
          hint="Crie a data do próximo 1:1 e liste os assuntos."
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
                    const assuntos =
                      o.assuntos && o.assuntos.length > 0
                        ? o.assuntos
                        : toAssuntoForms(o).map((a) => ({
                            id: a.key,
                            texto: a.texto,
                            alinhado: a.alinhado || undefined,
                          }));
                    return (
                      <article key={o.id} className="timeline__card">
                        <ul className="assunto-list">
                          {assuntos.map((a) => (
                            <li
                              key={a.id}
                              className={`assunto-row${a.alinhado ? " is-done" : ""}`}
                            >
                              <span className="assunto-row__texto">{a.texto}</span>
                              {a.alinhado ? (
                                <span className="assunto-row__alinhado">
                                  {a.alinhado}
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
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
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
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
                <label>Assuntos</label>
                <p style={{ margin: "0 0 0.55rem", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                  Escreva o assunto. Depois da conversa, preencha o alinhado à direita
                  (o assunto fica sublinhado, como no Docs).
                </p>
                <div className="assunto-editor">
                  {form.assuntos.map((a, index) => (
                    <div key={a.key} className="assunto-editor__row">
                      <input
                        aria-label={`Assunto ${index + 1}`}
                        placeholder="Assunto da pauta"
                        value={a.texto}
                        onChange={(e) =>
                          updateAssunto(a.key, { texto: e.target.value })
                        }
                        required={index === 0}
                      />
                      <input
                        aria-label={`Alinhado do assunto ${index + 1}`}
                        placeholder="O que foi alinhado…"
                        value={a.alinhado}
                        onChange={(e) =>
                          updateAssunto(a.key, { alinhado: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            assuntos:
                              prev.assuntos.length === 1
                                ? [{ key: newId(), texto: "", alinhado: "" }]
                                : prev.assuntos.filter((x) => x.key !== a.key),
                          }))
                        }
                        aria-label="Remover assunto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  style={{ marginTop: "0.55rem", alignSelf: "flex-start" }}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      assuntos: [
                        ...prev.assuntos,
                        { key: newId(), texto: "", alinhado: "" },
                      ],
                    }))
                  }
                >
                  + Assunto
                </button>
              </div>

              <div className="field">
                <label htmlFor="o-combinados">Combinados gerais (opcional)</label>
                <textarea
                  id="o-combinados"
                  value={form.combinados}
                  onChange={(e) => setForm({ ...form, combinados: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="o-follow">Follow-ups gerais (opcional)</label>
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
