"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GitHubApiError, validateToken } from "@/lib/github-api";
import { getToken, setToken } from "@/lib/token";

export default function LoginPage() {
  const router = useRouter();
  const [token, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/");
    }
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await validateToken(token.trim());
      setToken(token.trim());
      router.replace("/");
    } catch (err: unknown) {
      if (err instanceof GitHubApiError) {
        if (err.status === 401) {
          setError(
            "Token inválido ou sem scope gist. Gere um PAT com scope somente gist.",
          );
        } else if (err.status === 0) {
          setError(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError("Não foi possível validar o token.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="login-card__brand">My Diary</p>
        <p className="login-card__lead">
          Entre com um Personal Access Token (scope <strong>gist</strong>) para
          ler e gravar seu Gist privado <em>My Diary — dados</em>.
        </p>
        <form onSubmit={onSubmit} className="form-grid">
          <div className="field">
            <label htmlFor="pat">Personal Access Token</label>
            <input
              id="pat"
              name="pat"
              type="password"
              autoComplete="off"
              placeholder="ghp_…"
              value={token}
              onChange={(e) => setTokenInput(e.target.value)}
              required
            />
          </div>
          <button className="btn" type="submit" disabled={loading || !token.trim()}>
            {loading ? "Validando…" : "Entrar no My Diary"}
          </button>
        </form>
        {error ? <p className="login-error">{error}</p> : null}
        <p className="login-card__hint">
          GitHub → Settings → Developer settings → Personal access tokens.
          Crie um token classic com scope <strong>somente gist</strong>. O token
          fica só no localStorage deste navegador.
        </p>
      </div>
    </div>
  );
}
