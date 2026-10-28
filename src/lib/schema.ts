import type {
  Atividade,
  CollectionMap,
  CollectionName,
  Demanda,
  Meta,
  Nota,
  NotaTarefa,
  OneOnOne,
  Pessoa,
  PautaAssunto,
  Projeto,
  ProjetoStatus,
  Recorrencia,
  RecorrenciaTipo,
} from "./types";

const PROJETO_STATUSES: ProjetoStatus[] = [
  "backlog",
  "em_andamento",
  "pausado",
  "concluido",
];

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function emptyCollections(): CollectionMap {
  return {
    demandas: [],
    projetos: [],
    atividades: [],
    oneones: [],
    notas: [],
    pessoas: [],
  };
}

export function defaultMeta(): Meta {
  return {
    schemaVersion: 1,
    lastSync: null,
  };
}

function parseRecorrencia(raw: unknown): Recorrencia | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const tipo = asString(o.tipo) as RecorrenciaTipo;
  if (
    tipo !== "semanal" &&
    tipo !== "quinzenal" &&
    tipo !== "a_cada_n_dias"
  ) {
    return undefined;
  }
  const dataInicio = asString(o.dataInicio);
  if (!dataInicio) return undefined;
  return {
    tipo,
    dataInicio,
    diaSemana:
      typeof o.diaSemana === "number" && o.diaSemana >= 0 && o.diaSemana <= 6
        ? o.diaSemana
        : undefined,
    intervaloDias:
      typeof o.intervaloDias === "number" && o.intervaloDias > 0
        ? o.intervaloDias
        : undefined,
  };
}

export function parseDemanda(raw: unknown): Demanda | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asString(o.id);
  const titulo = asString(o.titulo);
  if (!id || !titulo) return null;
  return {
    id,
    titulo,
    feita: asBoolean(o.feita),
    prioridade:
      o.prioridade === "baixa" ||
      o.prioridade === "media" ||
      o.prioridade === "alta"
        ? o.prioridade
        : undefined,
    prazo: asString(o.prazo) || undefined,
    recorrencia: parseRecorrencia(o.recorrencia),
    feitasEm: asStringArray(o.feitasEm),
    createdAt: asString(o.createdAt, new Date().toISOString()),
    updatedAt: asString(o.updatedAt, new Date().toISOString()),
  };
}

export function parseProjeto(raw: unknown): Projeto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asString(o.id);
  const titulo = asString(o.titulo);
  if (!id || !titulo) return null;
  const status = PROJETO_STATUSES.includes(o.status as ProjetoStatus)
    ? (o.status as ProjetoStatus)
    : "backlog";
  const updates = Array.isArray(o.updates)
    ? o.updates
        .map((u) => {
          if (!u || typeof u !== "object") return null;
          const uu = u as Record<string, unknown>;
          const uid = asString(uu.id);
          const texto = asString(uu.texto);
          if (!uid || !texto) return null;
          return {
            id: uid,
            texto,
            createdAt: asString(uu.createdAt, new Date().toISOString()),
          };
        })
        .filter((u): u is NonNullable<typeof u> => u !== null)
    : [];
  return {
    id,
    titulo,
    status,
    descricao: asString(o.descricao),
    impacto: asString(o.impacto),
    links: asStringArray(o.links),
    updates,
    pessoaId: asString(o.pessoaId) || undefined,
    pessoaNome: asString(o.pessoaNome) || undefined,
    ajudaDescricao: asString(o.ajudaDescricao) || undefined,
    data: asString(o.data) || undefined,
    createdAt: asString(o.createdAt, new Date().toISOString()),
    updatedAt: asString(o.updatedAt, new Date().toISOString()),
  };
}

export function parseAtividade(raw: unknown): Atividade | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asString(o.id);
  const titulo = asString(o.titulo);
  const date = asString(o.date);
  if (!id || !titulo || !date) return null;
  return {
    id,
    date,
    titulo,
    notas: asString(o.notas) || undefined,
    projetoId: asString(o.projetoId) || undefined,
    createdAt: asString(o.createdAt, new Date().toISOString()),
    updatedAt: asString(o.updatedAt, new Date().toISOString()),
  };
}

function parseAssuntos(raw: unknown, pautaFallback: string): PautaAssunto[] {
  if (Array.isArray(raw)) {
    const parsed: PautaAssunto[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const a = item as Record<string, unknown>;
      const texto = asString(a.texto);
      if (!texto) continue;
      const alinhado = asString(a.alinhado);
      parsed.push({
        id: asString(a.id) || newId(),
        texto,
        ...(alinhado ? { alinhado } : {}),
      });
    }
    return parsed;
  }
  return pautaFallback
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
    .map((texto) => ({ id: newId(), texto }));
}

export function parseOneOnOne(raw: unknown): OneOnOne | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asString(o.id);
  const data = asString(o.data);
  if (!id || !data) return null;
  const pauta = asString(o.pauta);
  const assuntos = parseAssuntos(o.assuntos, pauta);
  return {
    id,
    pessoaId: asString(o.pessoaId) || undefined,
    pessoaNome: asString(o.pessoaNome) || undefined,
    data,
    pauta: assuntos.map((a) => a.texto).join("\n") || pauta,
    assuntos,
    combinados: asString(o.combinados),
    followUps: asString(o.followUps),
    createdAt: asString(o.createdAt, new Date().toISOString()),
    updatedAt: asString(o.updatedAt, new Date().toISOString()),
  };
}

function parseNotaTarefas(raw: unknown): NotaTarefa[] {
  if (!Array.isArray(raw)) return [];
  const out: NotaTarefa[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const t = item as Record<string, unknown>;
    const texto = asString(t.texto).trim();
    if (!texto) continue;
    out.push({
      id: asString(t.id) || newId(),
      texto,
      feita: asBoolean(t.feita),
    });
  }
  return out;
}

export function parseNota(raw: unknown): Nota | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asString(o.id);
  const titulo = asString(o.titulo);
  if (!id || !titulo) return null;
  const tarefas = parseNotaTarefas(o.tarefas);
  return {
    id,
    titulo,
    corpo: asString(o.corpo),
    tags: asStringArray(o.tags),
    ...(tarefas.length ? { tarefas } : {}),
    createdAt: asString(o.createdAt, new Date().toISOString()),
    updatedAt: asString(o.updatedAt, new Date().toISOString()),
  };
}

export function parsePessoa(raw: unknown): Pessoa | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asString(o.id);
  const nome = asString(o.nome);
  if (!id || !nome) return null;
  return {
    id,
    nome,
    contexto: asString(o.contexto) || undefined,
    notas: asString(o.notas) || undefined,
    createdAt: asString(o.createdAt, new Date().toISOString()),
    updatedAt: asString(o.updatedAt, new Date().toISOString()),
  };
}

export function parseMeta(raw: unknown): Meta {
  if (!raw || typeof raw !== "object") return defaultMeta();
  const o = raw as Record<string, unknown>;
  return {
    schemaVersion:
      typeof o.schemaVersion === "number" ? o.schemaVersion : 1,
    lastSync: typeof o.lastSync === "string" ? o.lastSync : null,
    gistId: typeof o.gistId === "string" ? o.gistId : undefined,
  };
}

const parsers = {
  demandas: parseDemanda,
  projetos: parseProjeto,
  atividades: parseAtividade,
  oneones: parseOneOnOne,
  notas: parseNota,
  pessoas: parsePessoa,
} as const;

export function parseCollection<K extends CollectionName>(
  name: K,
  raw: unknown,
): CollectionMap[K] {
  if (!Array.isArray(raw)) return [] as CollectionMap[K];
  const parser = parsers[name];
  return raw
    .map((item) => parser(item))
    .filter((item): item is NonNullable<typeof item> => item !== null) as CollectionMap[K];
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
