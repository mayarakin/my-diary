export const GIST_DESCRIPTION = "My Diary — dados";

export const COLLECTION_FILES = [
  "demandas.json",
  "projetos.json",
  "atividades.json",
  "oneones.json",
  "notas.json",
  "pessoas.json",
  "meta.json",
] as const;

export type CollectionName =
  | "demandas"
  | "projetos"
  | "atividades"
  | "oneones"
  | "notas"
  | "pessoas";

export type CollectionFile = `${CollectionName}.json` | "meta.json";

export type ProjetoStatus =
  | "backlog"
  | "em_andamento"
  | "pausado"
  | "concluido";

export type DemandaPrioridade = "baixa" | "media" | "alta";

/** Recorrência para demandas do dia (ex.: a cada 15 dias na sexta). */
export type RecorrenciaTipo = "semanal" | "quinzenal" | "a_cada_n_dias";

export interface Recorrencia {
  tipo: RecorrenciaTipo;
  /** 0=Dom … 5=Sex … 6=Sáb */
  diaSemana?: number;
  /** Usado em a_cada_n_dias (ex.: 15) */
  intervaloDias?: number;
  /** Primeira ocorrência (YYYY-MM-DD) */
  dataInicio: string;
}

export interface Demanda {
  id: string;
  titulo: string;
  feita: boolean;
  prioridade?: DemandaPrioridade;
  prazo?: string;
  recorrencia?: Recorrencia;
  /** Datas (YYYY-MM-DD) em que uma demanda recorrente foi concluída */
  feitasEm?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjetoUpdate {
  id: string;
  texto: string;
  createdAt: string;
}

export interface Projeto {
  id: string;
  titulo: string;
  status: ProjetoStatus;
  descricao: string;
  impacto: string;
  links: string[];
  updates: ProjetoUpdate[];
  /** Pessoa que ajudou neste projeto (cadastro em Pessoas) */
  pessoaId?: string;
  pessoaNome?: string;
  /** Data opcional do projeto (YYYY-MM-DD) */
  data?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Atividade {
  id: string;
  date: string;
  titulo: string;
  notas?: string;
  projetoId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Assunto da pauta 1:1 + o que foi alinhado depois da conversa */
export interface PautaAssunto {
  id: string;
  texto: string;
  alinhado?: string;
}

export interface OneOnOne {
  id: string;
  pessoaId?: string;
  pessoaNome?: string;
  data: string;
  /** Texto legado (linhas); preferir `assuntos` */
  pauta: string;
  assuntos?: PautaAssunto[];
  combinados: string;
  followUps: string;
  createdAt: string;
  updatedAt: string;
}

export interface Nota {
  id: string;
  titulo: string;
  corpo: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Pessoa {
  id: string;
  nome: string;
  contexto?: string;
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meta {
  schemaVersion: number;
  lastSync: string | null;
  gistId?: string;
}

export type CollectionMap = {
  demandas: Demanda[];
  projetos: Projeto[];
  atividades: Atividade[];
  oneones: OneOnOne[];
  notas: Nota[];
  pessoas: Pessoa[];
};

export type HubItem = CollectionMap[CollectionName];

export type SaveStatus = "idle" | "loading" | "saving" | "saved" | "error";
