<div align="center">
  <h1>🪐 AntiGitHUB</h1>
  <p>An advanced, modern full-stack GitHub clone featuring a premium dark-mode, glassmorphic UI, real-time socket connections, and a globally installable Command Line Interface.</p>

  <a href="https://antigit.vercel.app/">🌐 Live App</a> &nbsp;•&nbsp;
  <a href="https://antigithub-backend.onrender.com">⚙️ API Backend</a> &nbsp;•&nbsp;
  <a href="https://www.npmjs.com/package/antigithub-cli">📦 npm CLI</a>
</div>

---

## 🚀 Features

- **Premium UI/UX:** Stunning dark-mode interface with glassmorphism, gradients, and micro-animations.
- **Custom CLI Tool:** A globally installable npm package (`antigithub-cli`) lets any user push & pull code from the terminal — no source code needed.
- **Repository Management:** Create, star, fork, and explore repositories. Browse files, syntax-highlighted code, and a GitHub-style file tree.
- **Issue Tracking:** Open, filter, and close issues just like real GitHub.
- **Real-time Engine:** `socket.io` for live updates.
- **Robust Authentication:** JWT-based login/signup and Personal Access Tokens (PAT).
- **Activity Feed & Heatmaps:** GitHub-style profile heatmaps and personalized dashboard.

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Custom Vanilla CSS |
| Backend | Node.js, Express, MongoDB (Mongoose), Socket.io |
| CLI Tool | Node.js, Yargs, Axios, FormData (npm: `antigithub-cli`) |
| Auth | JWT, bcrypt, PAT (Personal Access Tokens) |
| Storage | AWS S3 (file content), MongoDB (metadata) |

---

## 📦 CLI — antigithub-cli

The AntiGitHUB CLI is a **standalone npm package** that any user can install. No source code required — just Node.js.

### Install Globally

```bash
npm install -g antigithub-cli
```

That's it. You now have the `antigithub` command available **anywhere** in your terminal.

---

### Quick Start Guide

#### Step 1 — Login to your account

```bash
antigithub login --email your@email.com --password yourpassword
```

Your token is **saved automatically** on your machine. You won't need to type it again.

> ✅ After this, all push/pull commands will use your saved credentials automatically.

---

#### Step 2 — Create a Personal Access Token (PAT)

PATs are **safer** than your password for pushing code (you can revoke them anytime from your profile).

```bash
antigithub pat:create --name my-laptop
```

You'll see your token once — copy and save it somewhere safe:
```
✓ PAT created successfully!
Your token (copy it now, it won't be shown again):

  pat_390ed7722dc4b2a5de6272485d7469c1302c7049c53c5569
```

---

#### Step 3 — Find your Repository ID

1. Open [https://antigit.vercel.app/](https://antigit.vercel.app/)
2. Go to your repository page
3. Look at the **right sidebar** under **"Repo ID"**
4. Copy the ID (looks like: `69a71d5b7bbcef2e404a977b`)

---

#### Step 4 — Navigate into your project folder

> ⚠️ **Critical:** Make sure you are **inside your project folder** before pushing. If you push from the wrong directory, you may upload unintended files.

```bash
cd C:\Users\yourname\projects\my-project
```

Or on Mac/Linux:
```bash
cd ~/projects/my-project
```

---

#### Step 5 — Push your code

```bash
antigithub push --repo YOUR_REPO_ID --message "Initial commit"
```

**The CLI will show you a confirmation screen first:**

```
⚠  About to push the following directory:
   Path:     C:\Users\yourname\projects\my-project
   Files:    12 file(s), 45.6 KiB total
   Repo ID:  69a71d5b7bbcef2e404a977b
   Message:  Initial commit

   Files to be pushed:
   + index.js
   + package.json
   + src/App.jsx
   + src/index.css
   ...

Proceed with push? (y/N):
```

Type `y` and press Enter to confirm, or `N` to cancel.

---

### All Available Commands

#### `login` — Save your credentials

```bash
antigithub login --email your@email.com --password yourpassword
```

#### `pat:create` — Create a Personal Access Token

```bash
antigithub pat:create --name my-laptop
```

#### `push` — Push a folder to a repository

```bash
# Basic push (current folder, shows confirmation)
antigithub push --repo YOUR_REPO_ID --message "Your commit message"

# Push a SPECIFIC folder (recommended to avoid mistakes)
antigithub push --repo YOUR_REPO_ID --path ./my-project --message "Initial commit"

# Skip the confirmation prompt (for scripts/automation)
antigithub push --repo YOUR_REPO_ID --message "Update" --yes
```

> ⚠️ **Always use `--path`** to specify exactly which folder you want to push. If you omit it, the CLI pushes your **current working directory**.

#### `pull` — Download a repository to a folder

```bash
# Pull into the current folder
antigithub pull --repo YOUR_REPO_ID

# Pull into a specific folder
antigithub pull --repo YOUR_REPO_ID --path ./downloaded-project

# Pull a private repository (requires token)
antigithub pull --repo YOUR_REPO_ID --token pat_yourtoken --path ./my-folder
```

#### `whoami` — Check who you're logged in as

```bash
antigithub whoami
```

#### `logout` — Clear saved credentials

```bash
antigithub logout
```

---

### Common Mistakes & Fixes

| Problem | Cause | Fix |
|---|---|---|
| `Unknown arguments: message` | Missing `--` before `message` | Use `--message "text"` (with double hyphens) |
| Pushed the wrong folder | Ran push from the wrong directory | Use `--path ./correct-folder` to specify the exact folder |
| `error: No token` | Not logged in and no `--token` provided | Run `antigithub login` first, or pass `--token pat_xxx` |
| Missing URL error on pull | Old file URLs expired | Re-push those files to generate fresh URLs |
| Push cancelled | Typed `n` at the confirmation prompt | Type `y` to confirm, or add `--yes` to skip |

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- AWS S3 bucket (for file storage)

### 1. Clone the repository
```bash
git clone https://github.com/CodxAbhay/AntiGitHUB.git
cd AntiGitHUB
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
```env
PORT=3002
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_super_secret_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket_name
```

Start the backend:
```bash
node index.js start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:3002
```

Start the frontend:
```bash
npm run dev
```

App runs at `http://localhost:5173/`.

---

## 🌐 Live Deployment

| Service | URL |
|---|---|
| 🎨 Frontend (Vercel) | [https://antigit.vercel.app/](https://antigit.vercel.app/) |
| ⚙️ Backend API (Render) | [https://antigithub-backend.onrender.com](https://antigithub-backend.onrender.com) |
| 📦 CLI (npm) | `npm install -g antigithub-cli` |

---

*Built by [Abhay Pratap Verma](https://github.com/CodxAbhay)*
