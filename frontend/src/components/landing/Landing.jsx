import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./landing.css";

export default function Landing() {
  const [terminalText, setTerminalText] = useState("");
  const codeSnippet = `> node index.js login --email you@example.com
→ Authenticated successfully.

> git commit -m "Shipped UI Overhaul"
[main 734b2a9] Shipped UI Overhaul
 2 files changed, 250 insertions(+)

> git push origin main
Enumerating objects: 5, done.
Writing objects: 100% (5/5), 4.2 KiB, done.
To https://github.clone/repo.git
   f32a821..734b2a9  main -> main
`;

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      setTerminalText(codeSnippet.substring(0, i));
      i++;
      if (i > codeSnippet.length) {
        clearInterval(typingInterval);
      }
    }, 25);
    return () => clearInterval(typingInterval);
  }, [codeSnippet]);

  return (
    <div className="landing">
      {/* Background glow effects */}
      <div className="landing-glow" />
      <div className="landing-glow-secondary" />

      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-logo">
            <svg height="32" viewBox="0 0 16 16" version="1.1" width="32" aria-hidden="true" fill="currentColor">
              <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            <span style={{ fontWeight: 600, fontSize: "20px" }}>AbhayGit</span>
          </Link>
          <nav className="landing-nav-links">
            <Link to="/search" className="landing-link-quiet">Explore</Link>
            <Link to="/auth" className="landing-link-quiet">Sign in</Link>
            <Link to="/signup" className="landing-btn-nav">Sign up</Link>
          </nav>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">Built for Developers</p>
              <h1 className="landing-title">
                Let's build from <span className="landing-title-accent">here</span>.
              </h1>
              <p className="landing-lead">
                The world's leading AI-powered developer platform to build, scale, and deliver secure software. Discover repositories, manage your code, and ship reliably.
              </p>
              <div className="landing-cta-row">
                <Link to="/signup" className="landing-btn-primary">
                  Sign up for AbhayGit
                </Link>
                <Link to="/search" className="landing-btn-secondary">
                  Explore public repositories &gt;
                </Link>
              </div>
            </div>

            <div className="landing-hero-visuals">
              <div className="landing-terminal-card">
                <div className="landing-terminal-bar">
                  <span />
                  <span />
                  <span />
                </div>
                <pre className="landing-terminal-body">
                  <span className="typing-text">{terminalText}</span>
                  <span className="cursor-blink">_</span>
                </pre>
              </div>

              {/* Floating aesthetic cards */}
              <div className="glass-card float-1">
                <div className="glass-icon">🚀</div>
                <div>
                  <strong>90M+</strong><br/>
                  <span>Developers</span>
                </div>
              </div>
              <div className="glass-card float-2">
                <div className="glass-icon">🔒</div>
                <div>
                  <strong>Secure</strong><br/>
                  <span>Dependabot ready</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="landing-features">
          <div className="features-container">
            <h2 className="landing-section-title">The place for anyone from anywhere to build anything</h2>
            <div className="landing-feature-grid">
              <article className="landing-feature feature-glow-1">
                <div className="feature-icon">📁</div>
                <h3>Repositories & Commits</h3>
                <p>Browse code, file trees, and full commit histories. Collaborate effortlessly with seamless code visualization.</p>
              </article>
              <article className="landing-feature feature-glow-2">
                <div className="feature-icon">🎯</div>
                <h3>Issue Tracking</h3>
                <p>Plan your work and track your progress with a powerful markdown-supported issue tracking system.</p>
              </article>
              <article className="landing-feature feature-glow-3">
                <div className="feature-icon">🛡️</div>
                <h3>Robust Permissions</h3>
                <p>Granular collaborator access controls ensure your code stays secure while enabling team collaboration.</p>
              </article>
              <article className="landing-feature feature-glow-4">
                <div className="feature-icon">⚡</div>
                <h3>Extreme Performance</h3>
                <p>Fast fetching, rapid pushing, and real-time interface rendering to keep you in the zone.</p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <svg height="24" viewBox="0 0 16 16" version="1.1" width="24" aria-hidden="true" fill="#8b949e">
              <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            <span>© 2026 AbhayGit, Inc.</span>
          </div>
          <span className="landing-footer-links">
            <Link to="/auth">Sign in</Link>
            <Link to="/signup">Sign up</Link>
            <Link to="/search">Explore</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
