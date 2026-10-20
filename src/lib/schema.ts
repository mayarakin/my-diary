import type {
  Atividade,
  CollectionMap,
  CollectionName,
  Demanda,
  Meta,
  Nota,
  OneOnOne,
  Pessoa,
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

export function parseOneOnOne(raw: unknown): OneOnOne | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asString(o.id);
  const data = asString(o.data);
  if (!id || !data) return null;
  return {
    id,
    pessoaId: asString(o.pessoaId) || undefined,
    pessoaNome: asString(o.pessoaNome) || undefined,
    data,
    pauta: asString(o.pauta),
    combinados: asString(o.combinados),
    followUps: asString(o.followUps),
    createdAt: asString(o.createdAt, new Date().toISOString()),
    updatedAt: asString(o.updatedAt, new Date().toISOString()),
  };
}

export function parseNota(raw: unknown): Nota | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = asString(o.id);
  const titulo = asString(o.titulo);
  if (!id || !titulo) return null;
  return {
    id,
    titulo,
    corpo: asString(o.corpo),
    tags: asStringArray(o.tags),
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
