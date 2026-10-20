import { newId, nowIso } from "./schema";
import type { Pessoa } from "./types";

/**
 * Resolve pessoa por id ou nome; se só houver nome novo, cria cadastro em Pessoas.
 */
export async function resolveOrCreatePessoa(args: {
  pessoaId?: string;
  pessoaNome?: string;
  pessoas: Pessoa[];
  upsertPessoa: (p: Pessoa) => Promise<void>;
}): Promise<{ pessoaId?: string; pessoaNome?: string }> {
  const nome = args.pessoaNome?.trim();
  if (args.pessoaId) {
    const found = args.pessoas.find((p) => p.id === args.pessoaId);
    return {
      pessoaId: args.pessoaId,
      pessoaNome: found?.nome ?? nome,
    };
  }
  if (!nome) {
    return { pessoaId: undefined, pessoaNome: undefined };
  }

  const existing = args.pessoas.find(
    (p) => p.nome.toLowerCase() === nome.toLowerCase(),
  );
  if (existing) {
    return { pessoaId: existing.id, pessoaNome: existing.nome };
  }

  const now = nowIso();
  const created: Pessoa = {
    id: newId(),
    nome,
    createdAt: now,
    updatedAt: now,
  };
  await args.upsertPessoa(created);
  return { pessoaId: created.id, pessoaNome: created.nome };
}
