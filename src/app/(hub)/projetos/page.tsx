"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState, type FormEvent } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useCollection } from "@/hooks/use-collection";
import { resolveOrCreatePessoa } from "@/lib/pessoas-sync";
import { newId, nowIso } from "@/lib/schema";
import type { Projeto, ProjetoStatus } from "@/lib/types";

const COLUMNS: { id: ProjetoStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "em_andamento", label: "Em andamento" },
  { id: "pausado", label: "Pausado" },
  { id: "concluido", label: "Concluído" },
];

function KanbanCard({
  projeto,
  onEdit,
}: {
  projeto: Projeto;
  onEdit: (p: Projeto) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: projeto.id });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.85 : 1,
        zIndex: isDragging ? 10 : undefined,
      }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="kanban-card"
      {...listeners}
      {...attributes}
    >
      <h3>{projeto.titulo}</h3>
      {projeto.pessoaNome ? <p>Com: {projeto.pessoaNome}</p> : null}
      {projeto.impacto ? <p>Impacto: {projeto.impacto}</p> : null}
      {projeto.descricao ? (
        <p>
          {projeto.descricao.slice(0, 100)}
          {projeto.descricao.length > 100 ? "…" : ""}
        </p>
      ) : null}
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        style={{ marginTop: "0.55rem" }}
        onClick={(e) => {
          e.stopPropagation();
          onEdit(projeto);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        Editar
      </button>
    </article>
  );
}

function KanbanColumn({
  status,
  label,
  items,
  onEdit,
}: {
  status: ProjetoStatus;
  label: string;
  items: Projeto[];
  onEdit: (p: Projeto) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`kanban-col${isOver ? " is-over" : ""}`}
    >
      <p className="kanban-col__title">
        {label} ({items.length})
      </p>
      {items.map((p) => (
        <KanbanCard key={p.id} projeto={p} onEdit={onEdit} />
      ))}
    </div>
  );
}

const emptyForm = {
  titulo: "",
  status: "backlog" as ProjetoStatus,
  descricao: "",
  impacto: "",
  links: "",
  update: "",
  pessoaId: "",
  pessoaNome: "",
};

export default function ProjetosPage() {
  const { items, upsert, remove, loading } = useCollection("projetos");
  const pessoas = useCollection("pessoas");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Projeto | null>(null);
  const [form, setForm] = useState(emptyForm);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(p: Projeto) {
    setEditing(p);
    setForm({
      titulo: p.titulo,
      status: p.status,
      descricao: p.descricao,
      impacto: p.impacto,
      links: p.links.join("\n"),
      update: "",
      pessoaId: p.pessoaId ?? "",
      pessoaNome: p.pessoaNome ?? "",
    });
    setOpen(true);
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const projeto = items.find((p) => p.id === active.id);
    const newStatus = over.id as ProjetoStatus;
    if (!projeto || !COLUMNS.some((c) => c.id === newStatus)) return;
    if (projeto.status === newStatus) return;
    await upsert({ ...projeto, status: newStatus, updatedAt: nowIso() });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const now = nowIso();
    const links = form.links
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const linked = await resolveOrCreatePessoa({
      pessoaId: form.pessoaId || undefined,
      pessoaNome: form.pessoaNome || undefined,
      pessoas: pessoas.items,
      upsertPessoa: pessoas.upsert,
    });

    const base: Projeto = editing
      ? { ...editing }
      : {
          id: newId(),
          titulo: "",
          status: "backlog",
          descricao: "",
          impacto: "",
          links: [],
          updates: [],
          createdAt: now,
          updatedAt: now,
        };

    const updates = [...base.updates];
    if (form.update.trim()) {
      updates.unshift({
        id: newId(),
        texto: form.update.trim(),
        createdAt: now,
      });
    }

    await upsert({
      ...base,
      titulo: form.titulo.trim(),
      status: form.status,
      descricao: form.descricao.trim(),
      impacto: form.impacto.trim(),
      links,
      updates,
      pessoaId: linked.pessoaId,
      pessoaNome: linked.pessoaNome,
      updatedAt: now,
      createdAt: base.createdAt || now,
    });
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Projetos"
        subtitle="Kanban com backlog, andamento, pausa e conclusão."
        actions={
          <button type="button" className="btn" onClick={openNew}>
            Novo projeto
          </button>
        }
      />

      {loading ? (
        <EmptyState title="Carregando projetos…" />
      ) : (
        <DndContext sensors={sensors} onDragEnd={(e) => void onDragEnd(e)}>
          <div className="kanban">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                status={col.id}
                label={col.label}
                items={items.filter((p) => p.status === col.id)}
                onEdit={openEdit}
              />
            ))}
          </div>
        </DndContext>
      )}

      {open ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Projeto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editing ? "Editar projeto" : "Novo projeto"}</h2>
            <form className="form-grid" onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="p-titulo">Título</label>
                <input
                  id="p-titulo"
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="p-status">Status</label>
                <select
                  id="p-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as ProjetoStatus })
                  }
                >
                  {COLUMNS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="p-pessoa">Quem me ajudou</label>
                <select
                  id="p-pessoa"
                  value={form.pessoaId}
                  onChange={(e) => {
                    const pessoa = pessoas.items.find((p) => p.id === e.target.value);
                    setForm({
                      ...form,
                      pessoaId: e.target.value,
                      pessoaNome: pessoa?.nome ?? "",
                    });
                  }}
                >
                  <option value="">Nome livre ou ninguém…</option>
                  {pessoas.items.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              {!form.pessoaId ? (
                <div className="field">
                  <label htmlFor="p-pessoa-nome">Nome de quem ajudou</label>
                  <input
                    id="p-pessoa-nome"
                    value={form.pessoaNome}
                    onChange={(e) =>
                      setForm({ ...form, pessoaNome: e.target.value })
                    }
                    placeholder="Ex.: Ana — sincroniza com Pessoas"
                  />
                </div>
              ) : null}
              <div className="field">
                <label htmlFor="p-desc">Descrição</label>
                <textarea
                  id="p-desc"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="p-impacto">Impacto</label>
                <input
                  id="p-impacto"
                  value={form.impacto}
                  onChange={(e) => setForm({ ...form, impacto: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="p-links">Links (um por linha)</label>
                <textarea
                  id="p-links"
                  value={form.links}
                  onChange={(e) => setForm({ ...form, links: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="p-update">Update curto (opcional)</label>
                <input
                  id="p-update"
                  value={form.update}
                  onChange={(e) => setForm({ ...form, update: e.target.value })}
                  placeholder="Ex.: alinhamos escopo com o time"
                />
              </div>
              {editing?.updates?.length ? (
                <div>
                  <p style={{ margin: "0 0 0.4rem", fontWeight: 600 }}>Updates</p>
                  <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--ink-soft)" }}>
                    {editing.updates.slice(0, 5).map((u) => (
                      <li key={u.id}>{u.texto}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="modal__actions">
                {editing ? (
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() => {
                      void remove(editing.id);
                      setOpen(false);
                    }}
                  >
                    Excluir
                  </button>
                ) : null}
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
