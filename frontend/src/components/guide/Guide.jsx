import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../user/Navbar";
import "./guide.css";

/* ─── data ─────────────────────────────────────────────── */
const STEPS = [
  {
    id: "install",
    icon: "📦",
    title: "Install the CLI",
    subtitle: "One command. Works on Windows, Mac & Linux.",
    badge: "Step 1",
    badgeColor: "purple",
    content: (
      <>
        <p className="guide-para">
          The <code>antigithub-cli</code> is a standalone npm package. You only
          need <strong>Node.js</strong> installed — no source code, no GitHub
          account for npm. Just run:
        </p>
        <CodeBlock lang="bash" code={`npm install -g antigithub-cli`} />
        <p className="guide-para">
          That's it. The <code>antigithub</code> command is now available
          globally in your terminal from <strong>any folder</strong>.
        </p>
        <InfoBox type="tip">
          Verify the install worked by running:{" "}
          <code>antigithub --help</code>
        </InfoBox>
      </>
    ),
  },
  {
    id: "login",
    icon: "🔐",
    title: "Login to Your Account",
    subtitle: "Save your token once — never type it again.",
    badge: "Step 2",
    badgeColor: "blue",
    content: (
      <>
        <p className="guide-para">
          Login with the same email and password you use on the website. Your
          token will be saved locally so you never need to type it again.
        </p>
        <CodeBlock
          lang="bash"
          code={`antigithub login --email your@email.com --password yourpassword`}
        />
        <p className="guide-para">On success you'll see:</p>
        <CodeBlock
          lang="output"
          code={`✓ Logged in successfully! Token saved to ~/.antigithub-cli.json`}
        />
        <InfoBox type="warning">
          <strong>Never share your password.</strong> Use a PAT (Personal Access
          Token) for day-to-day pushes instead.
        </InfoBox>
      </>
    ),
  },
  {
    id: "pat",
    icon: "🔑",
    title: "Create a Personal Access Token",
    subtitle: "Safer than a password — create one per device.",
    badge: "Step 3",
    badgeColor: "green",
    content: (
      <>
        <p className="guide-para">
          A PAT is a secure token you use instead of your password. You can
          revoke it anytime from your profile. Create one named after the device
          you're using:
        </p>
        <CodeBlock lang="bash" code={`antigithub pat:create --name my-laptop`} />
        <p className="guide-para">You'll see your token exactly once — copy it now:</p>
        <CodeBlock
          lang="output"
          code={`✓ PAT created successfully!
Your token (copy it now, it won't be shown again):

  pat_390ed7722dc4b2a5de6272485d7469c1302c7049c53c5569`}
        />
        <InfoBox type="warning">
          <strong>Copy your PAT immediately.</strong> It is shown only once and
          cannot be recovered. If you lose it, just create a new one.
        </InfoBox>
        <p className="guide-para">
          You can now use this PAT instead of your password for all push/pull
          commands via <code>--token pat_xxx</code>.
        </p>
      </>
    ),
  },
  {
    id: "repoid",
    icon: "🆔",
    title: "Find Your Repository ID",
    subtitle: "Every repo has a unique ID — find yours in 3 seconds.",
    badge: "Step 4",
    badgeColor: "orange",
    content: (
      <>
        <p className="guide-para">
          Every push and pull needs a <strong>Repository ID</strong>. Here's how
          to find it:
        </p>
        <ol className="guide-list">
          <li>
            Open <a href="https://antigit.vercel.app/" target="_blank" rel="noreferrer">antigit.vercel.app</a>
          </li>
          <li>Go to the repository page</li>
          <li>
            Look at the <strong>right sidebar</strong> — find the{" "}
            <strong>"Repo ID"</strong> card at the bottom
          </li>
          <li>Copy the ID (looks like: <code>69a71d5b7bbcef2e404a977b</code>)</li>
        </ol>
        <InfoBox type="tip">
          The Repo ID is also visible in the browser URL when you're on a repo
          page: <code>antigit.vercel.app/repo/<strong>69a71d5b7bbcef2e404a977b</strong></code>
        </InfoBox>
      </>
    ),
  },
  {
    id: "push",
    icon: "🚀",
    title: "Push Your Code",
    subtitle: "Upload your project files to a repository.",
    badge: "Step 5",
    badgeColor: "purple",
    content: (
      <>
        <InfoBox type="warning">
          <strong>⚠ Always navigate into your project folder first!</strong>{" "}
          If you push from the wrong directory, you may upload unintended files
          (like your entire Desktop or Documents folder).
        </InfoBox>

        <p className="guide-para">
          First, navigate into your project:
        </p>
        <CodeBlock lang="bash" code={`cd C:\\Users\\yourname\\projects\\my-project`} />

        <p className="guide-para">Then push:</p>
        <CodeBlock
          lang="bash"
          code={`antigithub push --repo YOUR_REPO_ID --message "Initial commit"`}
        />

        <p className="guide-para">
          The CLI will show a <strong>confirmation screen</strong> before
          uploading anything:
        </p>
        <CodeBlock
          lang="output"
          code={`⚠  About to push the following directory:
   Path:     C:\\Users\\yourname\\projects\\my-project
   Files:    12 file(s), 45.6 KiB total
   Repo ID:  69a71d5b7bbcef2e404a977b
   Message:  Initial commit

   Files to be pushed:
   + index.js
   + package.json
   + src/App.jsx
   + src/index.css
   ...

Proceed with push? (y/N): y`}
        />

        <p className="guide-para">
          Type <code>y</code> and press Enter. On success:
        </p>
        <CodeBlock
          lang="output"
          code={`[agh] enumerating objects…
  12 object(s), 45.6 KiB
[agh] writing objects…
[agh] counting objects: 12, done.
[ok] branch 'main' -> 966b3ba1-a05
  12 file(s) changed, 45.6 KiB`}
        />

        <p className="guide-para guide-subheading">Push options:</p>
        <div className="guide-table-wrap">
          <table className="guide-table">
            <thead>
              <tr><th>Flag</th><th>Description</th><th>Example</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><code>--repo</code></td>
                <td>Repository ID <em>(required)</em></td>
                <td><code>--repo 69a71d5b...</code></td>
              </tr>
              <tr>
                <td><code>--message</code></td>
                <td>Commit message <em>(default: "Update files")</em></td>
                <td><code>--message "Fix bug"</code></td>
              </tr>
              <tr>
                <td><code>--path</code></td>
                <td>Specific folder to push <em>(default: current dir)</em></td>
                <td><code>--path ./my-project</code></td>
              </tr>
              <tr>
                <td><code>--token</code></td>
                <td>PAT token <em>(uses saved login if omitted)</em></td>
                <td><code>--token pat_xxx</code></td>
              </tr>
              <tr>
                <td><code>--yes / -y</code></td>
                <td>Skip confirmation prompt</td>
                <td><code>--yes</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "pull",
    icon: "⬇️",
    title: "Pull Code from a Repo",
    subtitle: "Download files from any repository to your machine.",
    badge: "Step 6",
    badgeColor: "green",
    content: (
      <>
        <p className="guide-para">
          Pull the latest snapshot of a repository into a local folder:
        </p>
        <CodeBlock
          lang="bash"
          code={`antigithub pull --repo YOUR_REPO_ID --path ./my-downloaded-project`}
        />
        <p className="guide-para">
          For <strong>private repositories</strong>, include your token:
        </p>
        <CodeBlock
          lang="bash"
          code={`antigithub pull --repo YOUR_REPO_ID --token pat_xxx --path ./my-project`}
        />
        <p className="guide-para">On success:</p>
        <CodeBlock
          lang="output"
          code={`[agh] fetching from https://antigithub-backend.onrender.com …
  repository: 69a71d5b7bbcef2e404a977b
[agh] receiving objects: 12, done.
[ok] updated 12 path(s).
  HEAD -> 966b3ba1-a055-4a25 | Initial commit`}
        />
        <InfoBox type="tip">
          If you see <em>"skipping file — URL expired"</em>, just re-push that
          file from your machine to refresh its download URL.
        </InfoBox>
      </>
    ),
  },
];

const UTILS = [
  {
    cmd: "antigithub whoami",
    desc: "Show who you're currently logged in as, along with the backend URL and user ID",
    icon: "👤",
  },
  {
    cmd: "antigithub logout",
    desc: "Delete your saved credentials from this machine",
    icon: "🚪",
  },
  {
    cmd: "antigithub --help",
    desc: "Show all available commands and options",
    icon: "❓",
  },
  {
    cmd: "antigithub push --help",
    desc: "Show all available options for the push command",
    icon: "📖",
  },
];

const MISTAKES = [
  {
    problem: 'Unknown arguments: message "..."',
    cause: "Missing -- before message flag",
    fix: 'Use --message "your text" (double hyphens)',
    bad: 'antigithub push --repo ID message "text"',
    good: 'antigithub push --repo ID --message "text"',
  },
  {
    problem: "Pushed the wrong folder",
    cause: "Ran push from the wrong directory",
    fix: "Use --path ./correct-folder to specify exact folder",
    bad: "antigithub push --repo ID (from Desktop)",
    good: "cd my-project && antigithub push --repo ID",
  },
  {
    problem: "error: No token found",
    cause: "Not logged in and no --token provided",
    fix: "Run antigithub login first, or pass --token pat_xxx",
    bad: "antigithub push --repo ID",
    good: "antigithub login --email x --password y",
  },
  {
    problem: "warning: skipping file — URL expired",
    cause: "Old files have expired download links",
    fix: "Re-push those files to regenerate fresh URLs",
    bad: "—",
    good: "antigithub push --repo ID --message \"Refresh files\"",
  },
];

/* ─── sub-components ────────────────────────────────────── */
function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={`guide-code-block ${lang === "output" ? "output" : ""}`}>
      <div className="guide-code-header">
        <span className="guide-code-lang">{lang === "output" ? "Terminal Output" : lang}</span>
        {lang !== "output" && (
          <button className="guide-copy-btn" onClick={copy}>
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        )}
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

function InfoBox({ type, children }) {
  const icons = { tip: "💡", warning: "⚠️", note: "📝" };
  const labels = { tip: "Tip", warning: "Warning", note: "Note" };
  return (
    <div className={`guide-infobox guide-infobox--${type}`}>
      <span className="guide-infobox-icon">{icons[type]}</span>
      <div>
        <strong>{labels[type]}: </strong>
        {children}
      </div>
    </div>
  );
}

/* ─── main page ─────────────────────────────────────────── */
const Guide = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState("install");

  const activeData = STEPS.find((s) => s.id === activeStep);

  return (
    <>
      <Navbar />
      <div className="guide-page">

        {/* Hero */}
        <div className="guide-hero">
          <div className="guide-hero-badge">📦 antigithub-cli</div>
          <h1 className="guide-hero-title">CLI Documentation</h1>
          <p className="guide-hero-sub">
            Push and pull code from any terminal — just like Git, but for AntiGitHUB.
            Works on Windows, Mac & Linux. All you need is Node.js.
          </p>
          <div className="guide-hero-install">
            <CodeBlock lang="bash" code="npm install -g antigithub-cli" />
          </div>
          <div className="guide-hero-links">
            <a href="https://www.npmjs.com/package/antigithub-cli" target="_blank" rel="noreferrer" className="guide-badge-link">
              📦 View on npm
            </a>
            <a href="https://antigit.vercel.app/" target="_blank" rel="noreferrer" className="guide-badge-link">
              🌐 Open Web App
            </a>
          </div>
        </div>

        {/* Main Layout */}
        <div className="guide-layout">

          {/* Sidebar Navigation */}
          <nav className="guide-sidebar">
            <div className="guide-sidebar-section">
              <div className="guide-sidebar-label">Getting Started</div>
              {STEPS.map((s) => (
                <button
                  key={s.id}
                  className={`guide-nav-item ${activeStep === s.id ? "active" : ""}`}
                  onClick={() => setActiveStep(s.id)}
                >
                  <span className="guide-nav-icon">{s.icon}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
            <div className="guide-sidebar-section">
              <div className="guide-sidebar-label">Reference</div>
              <button className={`guide-nav-item ${activeStep === "utils" ? "active" : ""}`} onClick={() => setActiveStep("utils")}>
                <span className="guide-nav-icon">⚙️</span>
                <span>Other Commands</span>
              </button>
              <button className={`guide-nav-item ${activeStep === "mistakes" ? "active" : ""}`} onClick={() => setActiveStep("mistakes")}>
                <span className="guide-nav-icon">🐛</span>
                <span>Common Mistakes</span>
              </button>
            </div>
          </nav>

          {/* Content Area */}
          <main className="guide-content">

            {/* Steps */}
            {activeData && (
              <div className="guide-content-card">
                <div className="guide-content-header">
                  <span className={`guide-step-badge badge--${activeData.badgeColor}`}>
                    {activeData.badge}
                  </span>
                  <h2 className="guide-content-title">
                    {activeData.icon} {activeData.title}
                  </h2>
                  <p className="guide-content-subtitle">{activeData.subtitle}</p>
                </div>
                <div className="guide-content-body">
                  {activeData.content}
                </div>
                {/* Prev / Next navigation */}
                <div className="guide-step-nav">
                  {STEPS.findIndex((s) => s.id === activeStep) > 0 && (
                    <button
                      className="guide-step-btn prev"
                      onClick={() => {
                        const i = STEPS.findIndex((s) => s.id === activeStep);
                        setActiveStep(STEPS[i - 1].id);
                      }}
                    >
                      ← {STEPS[STEPS.findIndex((s) => s.id === activeStep) - 1]?.title}
                    </button>
                  )}
                  {STEPS.findIndex((s) => s.id === activeStep) < STEPS.length - 1 && (
                    <button
                      className="guide-step-btn next"
                      onClick={() => {
                        const i = STEPS.findIndex((s) => s.id === activeStep);
                        setActiveStep(STEPS[i + 1].id);
                      }}
                    >
                      {STEPS[STEPS.findIndex((s) => s.id === activeStep) + 1]?.title} →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Other Commands */}
            {activeStep === "utils" && (
              <div className="guide-content-card">
                <div className="guide-content-header">
                  <h2 className="guide-content-title">⚙️ Other Commands</h2>
                  <p className="guide-content-subtitle">Useful utilities for managing your session.</p>
                </div>
                <div className="guide-content-body">
                  <div className="guide-utils-grid">
                    {UTILS.map((u, i) => (
                      <div key={i} className="guide-util-card">
                        <div className="guide-util-icon">{u.icon}</div>
                        <CodeBlock lang="bash" code={u.cmd} />
                        <p className="guide-util-desc">{u.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Common Mistakes */}
            {activeStep === "mistakes" && (
              <div className="guide-content-card">
                <div className="guide-content-header">
                  <h2 className="guide-content-title">🐛 Common Mistakes & Fixes</h2>
                  <p className="guide-content-subtitle">
                    Things that trip up most new users — and how to fix them instantly.
                  </p>
                </div>
                <div className="guide-content-body">
                  {MISTAKES.map((m, i) => (
                    <div key={i} className="guide-mistake-card">
                      <div className="guide-mistake-problem">
                        <span className="guide-mistake-label">Problem</span>
                        <code>{m.problem}</code>
                      </div>
                      <div className="guide-mistake-row">
                        <div className="guide-mistake-col">
                          <span className="guide-mistake-label cause">Cause</span>
                          <p>{m.cause}</p>
                        </div>
                        <div className="guide-mistake-col">
                          <span className="guide-mistake-label fix">Fix</span>
                          <p>{m.fix}</p>
                        </div>
                      </div>
                      <div className="guide-mistake-compare">
                        <div className="guide-mistake-bad">
                          <span>✗ Wrong</span>
                          <code>{m.bad}</code>
                        </div>
                        <div className="guide-mistake-good">
                          <span>✓ Correct</span>
                          <code>{m.good}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Quick Reference Footer */}
        <div className="guide-quick-ref">
          <h2>⚡ Quick Reference</h2>
          <div className="guide-quick-grid">
            {[
              { label: "Install CLI", code: "npm install -g antigithub-cli" },
              { label: "Login", code: "antigithub login --email x@x.com --password pass" },
              { label: "Create PAT", code: "antigithub pat:create --name my-device" },
              { label: "Push code", code: "antigithub push --repo REPO_ID --message \"msg\"" },
              { label: "Pull code", code: "antigithub pull --repo REPO_ID --path ./folder" },
              { label: "Who am I?", code: "antigithub whoami" },
            ].map((item, i) => (
              <div key={i} className="guide-quick-item">
                <span className="guide-quick-label">{item.label}</span>
                <CodeBlock lang="bash" code={item.code} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

export default Guide;