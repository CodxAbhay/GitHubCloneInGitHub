# antigithub-cli

> Official command-line interface for [AntiGitHUB](https://antigit.vercel.app/) — push, pull, and manage your repositories from the terminal, just like Git.

[![npm version](https://img.shields.io/npm/v/antigithub-cli.svg)](https://www.npmjs.com/package/antigithub-cli)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

---

## Requirements

- **Node.js v16+** ([download](https://nodejs.org/))
- An account on [antigit.vercel.app](https://antigit.vercel.app/)

---

## Install

```bash
npm install -g antigithub-cli
```

Verify the install:
```bash
antigithub --help
```

---

## Quick Start (5 Steps)

### 1 — Login

```bash
antigithub login --email your@email.com --password yourpassword
```

Your token is saved automatically. You won't need to type it again.

---

### 2 — Create a Personal Access Token (PAT)

```bash
antigithub pat:create --name my-laptop
```

⚠️ **Copy the token now** — it's shown only once.

```
✓ PAT created successfully!
Your token (copy it now, it won't be shown again):

  pat_390ed7722dc4b2a5de6272485d7469c1302c7049c53c5569
```

---

### 3 — Find your Repository ID

1. Open [antigit.vercel.app](https://antigit.vercel.app/)
2. Go to your repository page
3. Look at the **right sidebar** → **"Repo ID"** card
4. Copy the ID (e.g. `69a71d5b7bbcef2e404a977b`)

---

### 4 — Push your code

> ⚠️ **Navigate into your project folder first!** Pushing from the wrong directory will upload unintended files.

```bash
cd path/to/my-project

antigithub push --repo YOUR_REPO_ID --message "Initial commit"
```

The CLI shows a **confirmation screen** before uploading:

```
⚠  About to push the following directory:
   Path:     /Users/yourname/projects/my-project
   Files:    12 file(s), 45.6 KiB total
   Repo ID:  69a71d5b7bbcef2e404a977b
   Message:  Initial commit

   + index.js
   + package.json
   + src/App.jsx
   ...

Proceed with push? (y/N): y
```

```
[agh] enumerating objects…
  12 object(s), 45.6 KiB
[ok] branch 'main' -> 966b3ba1-a05
  12 file(s) changed, 45.6 KiB
```

---

### 5 — Pull code

```bash
antigithub pull --repo YOUR_REPO_ID --path ./downloaded-project
```

---

## All Commands

### `login`
```bash
antigithub login --email <email> --password <password>
```
Logs you in and saves credentials locally.

---

### `pat:create`
```bash
antigithub pat:create --name <token-name>
```
Creates a Personal Access Token. Use a descriptive name like `my-laptop` or `work-pc`.

---

### `push`
```bash
antigithub push --repo <repoId> [options]
```

| Option | Description | Default |
|---|---|---|
| `--repo` | Repository ID *(required)* | — |
| `--message` | Commit message | `"Update files"` |
| `--path` | Specific folder to push | `.` (current directory) |
| `--token` | PAT token (uses saved login if omitted) | — |
| `--yes` / `-y` | Skip confirmation prompt | `false` |

**Examples:**
```bash
# Push current folder
antigithub push --repo abc123 --message "Fix bug"

# Push a specific subfolder
antigithub push --repo abc123 --path ./src --message "Update source"

# Skip confirmation (useful in scripts)
antigithub push --repo abc123 --yes
```

---

### `pull`
```bash
antigithub pull --repo <repoId> [options]
```

| Option | Description | Default |
|---|---|---|
| `--repo` | Repository ID *(required)* | — |
| `--path` | Destination folder | `.` (current directory) |
| `--token` | Required for private repositories | — |

**Examples:**
```bash
# Pull a public repo
antigithub pull --repo abc123 --path ./my-project

# Pull a private repo
antigithub pull --repo abc123 --token pat_xxx --path ./my-project
```

---

### `whoami`
```bash
antigithub whoami
```
Shows your currently saved login info.

---

### `logout`
```bash
antigithub logout
```
Removes your saved credentials from this machine.

---

## Common Mistakes

| Problem | Fix |
|---|---|
| `Unknown arguments: message "text"` | Use `--message "text"` (double dashes) |
| Pushed wrong folder | Use `--path ./correct-folder` to specify the exact folder |
| `error: No token found` | Run `antigithub login` first |
| `warning: skipping file — URL expired` | Re-push those files to refresh their URLs |

---

## Files Automatically Ignored

The CLI **never** pushes these (even if they're in your folder):
- `node_modules/`
- `.git/`
- `dist/`, `build/`
- `.env`, `.env.local`, `.env.production`

---

## Where are credentials stored?

Your login token is saved to `~/.antigithub-cli.json` on your machine. Run `antigithub logout` to delete it.

---

## Links

- 🌐 **Web App:** [https://antigit.vercel.app/](https://antigit.vercel.app/)
- 📖 **Full Guide (in-app):** [https://antigit.vercel.app/guide](https://antigit.vercel.app/guide)
- ⚙️ **Backend API:** [https://antigithub-backend.onrender.com](https://antigithub-backend.onrender.com)

---

Made by [Abhay Pratap Verma](https://github.com/CodxAbhay)
