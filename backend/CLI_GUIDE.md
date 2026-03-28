# GitHub Clone CLI (Option A)

This project includes a simple CLI that pushes files to a repository **via the backend API**, so the pushed code appears in the frontend immediately.

## Why this exists

Your frontend repo pages show files from the backend endpoint `POST /commit/create` (stored under `repos/<repoId>/...` in S3).  
The legacy `.AbhayGit` push uploads under `commits/...` and is not tied to any `repoId`, so it will not appear in the UI.

## Prerequisites

- Backend running locally: `node index.js start`
- Or deployed backend base URL: `https://your-backend.example.com`
- A repository `repoId` (shown in the repo page sidebar under **Push from terminal**)

## 1) Login (saves JWT locally)

```bash
node index.js login --backend http://localhost:3002 --email you@example.com --password yourPassword
```

This stores a token at:

- Windows: `%USERPROFILE%\.githubclone-cli.json`
- macOS/Linux: `~/.githubclone-cli.json`

## 2) Create a Personal Access Token (PAT)

PATs are better than short-lived JWTs for pushing after deployment.

```bash
node index.js pat:create --backend http://localhost:3002 --name "my-laptop"
```

Copy the printed `pat_...` token.

## 3) Push code to a repo (API push)

From your project folder:

```bash
node index.js push-api --backend http://localhost:3002 --repo <repoId> --token <PAT> --message "initial commit" --path .
```

## 4) Pull latest snapshot to disk (`pull-api`)

Downloads the latest commit’s files from signed URLs into a folder (public repos work without a token; private repos need JWT or PAT):

```bash
node index.js pull-api --backend http://localhost:3002 --repo <repoId> --path .
# optional: --token <JWT-or-PAT>
```

## Install CLI for other users (after deployment)

When your backend is deployed, users **do not need your backend source code running locally**.
They only need the CLI installed locally.

### Option 1: Install CLI from your GitHub repo

From any machine:

```bash
npm i -g git+<your-repo-git-url>
```

Then use:

```bash
githubclone --help
githubclone login --backend https://your-backend.example.com --email you@example.com --password yourPassword
githubclone pat:create --backend https://your-backend.example.com --name "my-laptop"
githubclone push-api --backend https://your-backend.example.com --repo <repoId> --token <PAT> --message "update" --path .
```

### Option 2 (best): Publish CLI to npm

Publish this backend package to npm (as a CLI package). Then users can:

```bash
npm i -g githubclone-cli
```

And run the same `githubclone ...` commands.

### Notes

- `--path` is the folder to upload (default `.`).
- The CLI ignores common folders like `node_modules`, `dist`, `.git`, `.cursor`, and `.AbhayGit`.
- The backend enforces permissions: only the **repo owner** or a **collaborator** can push.

