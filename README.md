# My Diary

Hub pessoal de gestão (frontend estático) com persistência em um **Gist privado** da sua conta GitHub.

- Produto: **My Diary**
- Gist de dados (description): **`My Diary — dados`**
- Stack: Next.js (App Router) + React + TypeScript
- Hosting: GitHub Pages (Actions) — sem backend, sem banco, sem Vercel
- Auth no app: Personal Access Token com scope **somente `gist`** (salvo em `localStorage`)

URL esperada após o deploy:

`https://<user>.github.io/my-diary/`

## 1. Configurar GitHub CLI (ambiente de desenvolvimento)

```bash
gh --version
gh auth login
# GitHub.com → HTTPS → login via browser (ou token)
# Escopos necessários no ambiente: pelo menos repo + gist (+ workflow para Actions)

gh auth status
git --version
```

Se `gh auth status` falhar, autentique antes de criar o repositório ou o Gist.

## 2. Clonar e rodar localmente

```bash
git clone https://github.com/<user>/my-diary.git
cd my-diary
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Em desenvolvimento o `basePath` não é aplicado; no Pages ele será `/my-diary`.

Build estático local (como no CI):

```bash
GITHUB_PAGES=true npm run build
# gera a pasta out/
```

## 3. Gerar o PAT do app (login no My Diary)

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens**
2. Crie um token (classic) com scope **somente `gist`**
3. No My Diary, abra `/login`, cole o token e entre

O app valida com `GET /user`. Em **401** o token é limpo do `localStorage`. Erros de rede **não** apagam o token. O botão **Sair** limpa o storage.

## 4. Ativar GitHub Pages (Actions)

1. Faça push da branch `main` (o workflow `.github/workflows/deploy.yml` roda sozinho)
2. No repositório: **Settings → Pages → Build and deployment → Source = GitHub Actions**
3. Alternativa via CLI (com permissão):

```bash
gh api -X PUT repos/<user>/my-diary/pages -f build_type=workflow
```

O workflow faz `npm ci` → `GITHUB_PAGES=true npm run build` → publica `out/`.

## 5. Onde ficam os dados

- Os **dados** ficam no Gist privado com description exatamente **`My Diary — dados`**
- Arquivos: `demandas.json`, `projetos.json`, `atividades.json`, `oneones.json`, `notas.json`, `pessoas.json`, `meta.json`
- Na **primeira gravação**, o app cria esse Gist automaticamente se ainda não existir
- O **código** do repositório pode ser público; o Gist permanece privado

## Módulos

| Área | Rota | Conteúdo |
|------|------|----------|
| Home | `/` | Resumo + demandas do dia |
| Demandas | `/demandas/` | O que cai **neste dia** (prazo ou recorrência) |
| Projetos | `/projetos/` | Kanban + data opcional + pessoa que ajudou |
| Pautas 1:1 | `/pautas-1on1/` | Linha do tempo: assuntos + alinhado por item |
| Bloco de notas | `/notas/` | Notas rápidas (Keep) + busca |
| Pessoas | `/pessoas/` | Cadastro + projetos/trajetória/1:1s |
| Trajetória | `/trajetoria/` | Linha do tempo do que você fez (mais recente no topo) |
| Links | `/links/` | Atalhos do dia a dia por tipo de demanda (VP, ID, CSAT) |

## Arquitetura (resumo)

```
Browser (My Diary no GitHub Pages) → api.github.com → Gist privado "My Diary — dados"
```

Sem servidor Node em produção: apenas arquivos estáticos em `out/`.
