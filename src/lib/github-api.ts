import { clearToken, getToken } from "./token";

const API = "https://api.github.com";

export class GitHubApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
  }
}

export type GithubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  /** When true, 401 clears stored token. Default true. */
  clearOn401?: boolean;
};

export async function githubFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.token ?? getToken();
  if (!token) {
    throw new GitHubApiError("Token ausente. Faça login novamente.", 401);
  }

  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new GitHubApiError(
      "Falha de rede ao falar com o GitHub. Seu token foi mantido.",
      0,
    );
  }

  if (response.status === 401) {
    if (options.clearOn401 !== false) {
      clearToken();
    }
    throw new GitHubApiError("Token inválido ou sem permissão (401).", 401);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const err = (await response.json()) as { message?: string };
      detail = err.message ? `: ${err.message}` : "";
    } catch {
      /* ignore */
    }
    throw new GitHubApiError(
      `GitHub API ${response.status}${detail}`,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function validateToken(token: string): Promise<GithubUser> {
  return githubFetch<GithubUser>("/user", {
    token,
    clearOn401: false,
  });
}

export async function getAuthenticatedUser(): Promise<GithubUser> {
  return githubFetch<GithubUser>("/user");
}
