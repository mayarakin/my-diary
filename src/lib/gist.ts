import { githubFetch } from "./github-api";
import { getToken } from "./token";
import {
  defaultMeta,
  emptyCollections,
  parseCollection,
  parseMeta,
} from "./schema";
import {
  GIST_DESCRIPTION,
  type CollectionMap,
  type CollectionName,
  type Meta,
} from "./types";

type GistFile = {
  filename?: string;
  content?: string;
  raw_url?: string;
};

type Gist = {
  id: string;
  description: string | null;
  public: boolean;
  files: Record<string, GistFile>;
};

type GistListItem = {
  id: string;
  description: string | null;
};

function fileNameFor(name: CollectionName | "meta"): string {
  return `${name}.json`;
}

function emptyGistFiles(
  collections: CollectionMap = emptyCollections(),
  meta: Meta = defaultMeta(),
): Record<string, { content: string }> {
  const files: Record<string, { content: string }> = {};
  (Object.keys(collections) as CollectionName[]).forEach((key) => {
    files[fileNameFor(key)] = {
      content: JSON.stringify(collections[key], null, 2),
    };
  });
  files["meta.json"] = { content: JSON.stringify(meta, null, 2) };
  return files;
}

async function listAllGists(): Promise<GistListItem[]> {
  const all: GistListItem[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const batch = await githubFetch<GistListItem[]>(
      `/gists?per_page=100&page=${page}`,
    );
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

export async function findHubGist(): Promise<Gist | null> {
  const list = await listAllGists();
  const match = list.find((g) => g.description === GIST_DESCRIPTION);
  if (!match) return null;
  return githubFetch<Gist>(`/gists/${match.id}`);
}

export async function createHubGist(
  collections: CollectionMap = emptyCollections(),
  meta: Meta = defaultMeta(),
): Promise<Gist> {
  const withMeta: Meta = {
    ...meta,
    lastSync: new Date().toISOString(),
  };
  return githubFetch<Gist>("/gists", {
    method: "POST",
    body: {
      description: GIST_DESCRIPTION,
      public: false,
      files: emptyGistFiles(collections, withMeta),
    },
  });
}

async function readFileContent(file: GistFile | undefined): Promise<unknown> {
  if (!file) return null;
  if (typeof file.content === "string") {
    try {
      return JSON.parse(file.content);
    } catch {
      return null;
    }
  }
  if (file.raw_url) {
    const token = getToken();
    const res = await fetch(file.raw_url, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.raw",
          }
        : { Accept: "application/vnd.github.raw" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  return null;
}

export type HubSnapshot = {
  gistId: string | null;
  collections: CollectionMap;
  meta: Meta;
};

export async function loadHubSnapshot(): Promise<HubSnapshot> {
  const gist = await findHubGist();
  if (!gist) {
    return {
      gistId: null,
      collections: emptyCollections(),
      meta: defaultMeta(),
    };
  }

  const collections = emptyCollections();
  for (const name of Object.keys(collections) as CollectionName[]) {
    const raw = await readFileContent(gist.files[fileNameFor(name)]);
    collections[name] = parseCollection(name, raw) as never;
  }

  const metaRaw = await readFileContent(gist.files["meta.json"]);
  const meta = parseMeta(metaRaw);
  meta.gistId = gist.id;

  return { gistId: gist.id, collections, meta };
}

type PersistArgs = {
  gistId: string | null;
  collections: CollectionMap;
  dirty: CollectionName;
};

let writeChain: Promise<string | null> = Promise.resolve(null);

/**
 * Serializa writes para evitar HTTP 409.
 * Na primeira gravação (sem gist), cria um Gist privado com todos os JSON.
 */
export function enqueueGistPersist(args: PersistArgs): Promise<string | null> {
  const run = async (currentGistId: string | null): Promise<string | null> => {
    const gistId = args.gistId ?? currentGistId;
    const meta: Meta = {
      schemaVersion: 1,
      lastSync: new Date().toISOString(),
      gistId: gistId ?? undefined,
    };

    if (!gistId) {
      const created = await createHubGist(args.collections, meta);
      return created.id;
    }

    await githubFetch(`/gists/${gistId}`, {
      method: "PATCH",
      body: {
        description: GIST_DESCRIPTION,
        files: {
          [fileNameFor(args.dirty)]: {
            content: JSON.stringify(args.collections[args.dirty], null, 2),
          },
          "meta.json": {
            content: JSON.stringify({ ...meta, gistId }, null, 2),
          },
        },
      },
    });
    return gistId;
  };

  const next = writeChain.then(
    (currentGistId) => run(args.gistId ?? currentGistId),
    () => run(args.gistId),
  );
  // Mantém a fila viva mesmo se um write falhar
  writeChain = next.then(
    (id) => id,
    () => args.gistId,
  );
  return next;
}
