import React, { useEffect } from "react";
import Navbar from "../user/Navbar";
import "./guide.css";

const Guide = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      <div className="guide-page">
        <div className="guide-sidebar">
          <nav>
            <div className="guide-nav-title">AbhayGit Docs</div>
            <a href="#intro" className="guide-nav-link">Introduction</a>
            <a href="#howitworks" className="guide-nav-link">How it Works</a>
            <a href="#method1" className="guide-nav-link">Method 1: Local Developer</a>
            <a href="#method2" className="guide-nav-link">Method 2: Remote API Push</a>
          </nav>
        </div>

        <main className="guide-content">
          <div className="guide-header">
            <h1 id="intro">🚀 AbhayGit CLI (Simple & Beginner-Friendly)</h1>
            <p className="guide-subtitle">
              This CLI lets you push your local files to your GitHub-like system so they appear instantly in your frontend.
            </p>
          </div>

          <section className="guide-section" id="howitworks">
            <h2>🧠 What is this CLI?</h2>
            <p>
              Think of this like a simplified version of <code>git push</code>. Instead of Git, you are using the AbhayGit CLI tool to securely transmit your codebase directly to your backend storage!
            </p>
            <div className="guide-alert guide-alert-tip">
              <strong>Your Folder → CLI → Backend API → Storage (S3) → Frontend UI</strong>
              <br/>• CLI reads your files
              <br/>• Backend saves them under your repo
              <br/>• Frontend displays them
            </div>
            
            <p><strong>There are two ways to push code depending on who you are:</strong></p>
          </section>

          <hr className="guide-divider" />

          <section className="guide-section" id="method1">
            <h2>Method 1: Developer Full Setup (Local Engine)</h2>
            <p>
              If you are a developer looking to clone the complete AbhayGit platform repository and run it entirely on your own machine, you can use the native <strong>Git-like</strong> commands provided inside the repository package:
            </p>
            <ol className="guide-list">
              <li>Open the <code>backend</code> terminal in the cloned repository.</li>
              <li><code>node index.js init</code> (Creates a hidden <code>.AbhayGit</code> staging environment).</li>
              <li><code>node index.js add .</code> (Securely stages your modified files).</li>
              <li><code>node index.js commit "My update"</code> (Builds a secure offline hash tree).</li>
              <li><code>node index.js push</code> (Synchronizes your offline staging tree to your configured Amazon S3 buckets).</li>
            </ol>
            <p>
              This requires your own MongoDB instance, S3 buckets, and complete source code configuration running locally.
            </p>
          </section>

          <hr className="guide-divider" />

          <section className="guide-section" id="method2">
            <h2>Method 2: Standalone User Push (Remote API)</h2>
            <p>
              If you are a normal user wanting to push your own project online to the live AbhayGit platform (without needing our platform source code), you will use our remote <code>push-api</code> tunnel.
            </p>

            <h3>✅ Prerequisites</h3>
            <ul className="guide-list">
              <li>Ensure you have the AbhayGit CLI node package downloaded.</li>
              <li>Have your target <strong>Repository ID</strong>.</li>
            </ul>

            <h3 style={{ marginTop: "32px" }}>🔹 Step 1: Login (One Time)</h3>
            <p>Securely save your credentials so your CLI knows who you are:</p>
            <div className="code-block">
              <div className="code-header">Terminal</div>
              <pre><code>node index.js login --backend https://your-backend-url.com --email you@example.com --password yourPassword</code></pre>
            </div>
            <p>👉 This saves your login token locally on your system.</p>

            <h3 style={{ marginTop: "32px" }}>🔹 Step 2: Create PAT (Important)</h3>
            <p>Generate a Personal Access Token to authorize hardware pushes:</p>
            <div className="code-block">
              <div className="code-header">Terminal</div>
              <pre><code>node index.js pat:create --backend https://your-backend-url.com --name "my-laptop"</code></pre>
            </div>
            <p>👉 You will get a token (e.g., <code>pat_abc123xyz</code>). <strong>Copy this token.</strong></p>

            <h3 style={{ marginTop: "32px" }}>🔹 Step 3: Get your Repository ID</h3>
            <p>Open the AbhayGit frontend dashboard, find your repository, and copy the long ID displayed in your browser URL (e.g. <code>repo_123abc</code>).</p>

            <h3 style={{ marginTop: "32px" }}>🚀 Step 4: Push Your Code</h3>
            
            <p><strong>From inside your project folder (Recommended):</strong></p>
            <div className="code-block">
              <div className="code-header">Terminal</div>
              <pre><code>cd path/to/your/project
node index.js push-api --backend https://your-backend-url.com --repo &#60;repoId&#62; --token &#60;PAT&#62; --message "initial commit" --path .</code></pre>
            </div>
            
            <p style={{ marginTop: "24px" }}><strong>Pushing specific folders from anywhere:</strong></p>
            <div className="code-block">
              <div className="code-header">Terminal</div>
              <pre><code>node index.js push-api --backend https://your-backend-url.com --repo &#60;repoId&#62; --token &#60;PAT&#62; --message "upload" --path "C:\Users\YourName\Desktop\my-project"</code></pre>
            </div>

            <div className="guide-alert guide-alert-note">
              <strong>⚠️ Important Notes:</strong> Always use quotes if your path has spaces! (e.g., <code>--path "C:\Users\Your Name\Desktop\my project"</code>). <strong>Best practice:</strong> Always push an entire folder, not a single file.
            </div>

            <h3 style={{ marginTop: "32px", color: "#4493f8" }}>⬇️ Step 5: Pulling Changes</h3>
            <p><strong>To safely synchronize your system and download a remote repository to your local folder:</strong></p>
            <div className="code-block">
              <div className="code-header">Terminal</div>
              <pre><code>node index.js pull-api --backend https://your-backend-url.com --repo &#60;repoId&#62; --token &#60;PAT&#62; --path .</code></pre>
            </div>
            
            <h3 style={{ marginTop: "32px", color: "#4493f8" }}>⏪ Step 6: Reverting Commits</h3>
            <p><strong>To permanently undo changes and cleanly roll your remote repository back to a specific commit snapshot:</strong></p>
            <div className="code-block">
              <div className="code-header">Terminal</div>
              <pre><code>node index.js revert-api --backend https://your-backend-url.com --repo &#60;repoId&#62; --token &#60;PAT&#62; --commit &#60;targetCommitId&#62;</code></pre>
            </div>

            <h3 style={{ marginTop: "32px" }}>❌ Common Errors & Fixes</h3>
            <ul className="guide-list">
              <li><strong>ECONNREFUSED</strong>: Backend not running or offline.</li>
              <li><strong>Unauthorized</strong>: Invalid token. Create a new PAT and ensure your config is saved.</li>
              <li><strong>Repo not found</strong>: Wrong Repository ID. Copy the correct ID from the web interface.</li>
              <li><strong>Forbidden</strong>: Permission issue. Make sure you are the repo owner or added as a collaborator!</li>
              <li><strong>Files not showing up</strong>: Reason is that you tried using the Developer <code>.AbhayGit</code> native push method on a remote server. Always use <code>push-api</code> for live deployments!</li>
            </ul>

          </section>

        </main>
      </div>
    </>
  );
};

export default Guide;
