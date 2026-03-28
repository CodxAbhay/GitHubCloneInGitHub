<div align="center">
  <h1>🪐 AntiGitHUB</h1>
  <p>An advanced, modern full-stack GitHub clone featuring a premium dark-mode, glassmorphic UI, real-time socket connections, and a custom built-in Command Line Interface.</p>
</div>

---

## 🚀 Features

- **Premium UI/UX:** Stunning, responsive interface built with modern vanilla CSS featuring deep-space dark mode, glassmorphism, and dynamic micro-animations.
- **Custom CLI Tool:** AntiGitHUB comes with its own command-line interface! Run commands like `node index.js push-api`, `pull-api`, `commit`, and `revert-api` straight from your terminal to manage your codebase.
- **Repository Management:** Create, star, and explore code repositories. Browse files, folders, and syntax-highlighted code previews dynamically.
- **Issue Tracking:** Create, filter, and close issues just like on the real GitHub.
- **Real-time Engine:** Integrated `socket.io` for live updates and future real-time expansions.
- **Robust Authentication:** Secure JWT-based login, signup, and Personal Access Tokens (PAT).
- **Activity Feed & Heatmaps:** GitHub-style profile heatmaps and a personalized dashboard activity feed.

## 💻 Tech Stack

- **Frontend:** React 19, Vite, React Router DOM, Custom Vanilla CSS.
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.io, Yargs (for the CLI).
- **Authentication:** JWT (JSON Web Tokens).

## 🛠️ Local Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/AntiGitHUB.git
cd AntiGitHUB
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder and add your environment variables:
```env
PORT=3002
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```
Start the backend server:
```bash
node index.js start
```

### 3. Frontend Setup
Open a new terminal tab and navigate to the frontend folder:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```
The application will launch on `http://localhost:5173/`.

## 🌐 Deployment Ready
- The **Frontend** can be deployed instantly on platforms like **Vercel** or **Netlify** (Ensure you set the `VITE_API_BASE_URL` environment variable).
- The **Backend** is configured to run smoothly on platforms like **Render** or **Heroku**.

---
*Built by Abhay Pratap Verma*
