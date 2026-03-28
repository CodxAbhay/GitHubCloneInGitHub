import React, { useState, useEffect } from "react";
import "./dashboard.css";
import Navbar from "../user/Navbar";
import RepoCard from "../repo/RepoCard";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../apiBase";
import { RepoIcon, GitCommitIcon, StarIcon } from "@primer/octicons-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.warn("User not logged in");
      return;
    }

    const fetchRepositories = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_BASE_URL}/repo/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch repositories");
        }

        const data = await response.json();

        setRepositories(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        console.error("Error fetching repositories:", err);
        setRepositories([]);
      }
    };

    const fetchSuggestedRepositories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/repo/all`);

        if (!response.ok) {
          throw new Error("Failed to fetch suggested repositories");
        }

        const data = await response.json();

        setSuggestedRepositories(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        console.error("Error fetching suggested repositories:", err);
        setSuggestedRepositories([]);
      }
    };

    fetchRepositories();
    fetchSuggestedRepositories();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults(repositories);
    } else {
      const filteredRepo = repositories.filter((repo) =>
        repo?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setSearchResults(filteredRepo);
    }
  }, [searchQuery, repositories]);

  return (
    <>
      {/* Navbar search connected */}
      <Navbar />

      <div className="dashboard-container">
        {/* LEFT SIDEBAR */}
        <aside className="dashboard-left">
          <h3>Suggested Repositories</h3>

          {suggestedRepositories.length === 0 ? (
            <p className="empty">No repositories found</p>
          ) : (
            suggestedRepositories.slice(0, 5).map((repo) => (
              <div
                key={repo._id}
                className="repo-suggestion"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/repo/${repo._id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/repo/${repo._id}`);
                }}
              >
                <h4>{repo.name}</h4>
                <p>{repo.description || "No description"}</p>
              </div>
            ))
          )}
        </aside>

        {/* MAIN CONTENT */}
        <main className="dashboard-main">
          <div className="dashboard-header">
            <h2>Your Repositories</h2>
          </div>

          {searchResults.length === 0 ? (
            <p className="empty">No repositories found</p>
          ) : (
            <div className="repo-grid">
              {searchResults.map((repo) => (
                <RepoCard key={repo._id} repo={repo} />
              ))}
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="dashboard-right">
          <div className="activity-feed-card">
            <h3>Recent Activity</h3>
            <div className="activity-feed">
              <div className="activity-item">
                <RepoIcon className="activity-icon repo-icon" size={16} />
                <span>You created a repository <strong>github-clone</strong></span>
              </div>
              <div className="activity-item">
                <StarIcon className="activity-icon star-icon" size={16} />
                <span>You starred <strong>react-router</strong></span>
              </div>
              <div className="activity-item">
                <GitCommitIcon className="activity-icon commit-icon" size={16} />
                <span>Pushed to <strong>main</strong> in <strong>github-clone</strong></span>
              </div>
            </div>
          </div>

          <div 
            className="terminal-guide-card cli-cta-card" 
            onClick={() => navigate('/guide')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") navigate('/guide'); }}
            style={{ cursor: "pointer", transition: "all 0.2s ease" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span role="img" aria-label="book" style={{ fontSize: "1.4rem" }}>📖</span>
              <h3 style={{ margin: 0, fontWeight: "600", color: "#e6edf3" }}>CLI Documentation</h3>
            </div>
            <p style={{ margin: 0, color: "#8b949e", fontSize: "0.9rem", lineHeight: "1.5" }}>
              Master the AbhayGit terminal! Learn how to push, pull, and revert your codebase securely.
            </p>
            <button className="create-btn" style={{ marginTop: "16px", width: "100%", justifyContent: "center" }}>
              Read the Guide
            </button>
          </div>
        </aside>
      </div>
    </>
  );
};

export default Dashboard;
