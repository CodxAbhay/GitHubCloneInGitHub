import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../user/Navbar";
import "./commitHistory.css";
import { API_BASE_URL } from "../../apiBase";

const CommitHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [commits, setCommits] = useState([]);
  const [canWrite, setCanWrite] = useState(false);

  const fetchCommits = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/commit/repo/${id}`, { headers });
      const data = await res.json();

      setCommits(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    fetchCommits();
  }, [fetchCommits]);

  useEffect(() => {
    const loadPerm = async () => {
      const uid = localStorage.getItem("userId");
      if (!uid || !id) {
        setCanWrite(false);
        return;
      }
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/repo/${id}`, { headers });
      const data = await res.json();
      if (!data.success || !data.data) {
        setCanWrite(false);
        return;
      }

      const ownerId = data.data.owner?._id;
      const collabs = data.data.collaborators || [];
      const isOwner = ownerId && String(ownerId) === String(uid);
      const isCollab = collabs.some(
        (c) =>
          String(typeof c === "object" ? c?._id : c) === String(uid),
      );
      setCanWrite(isOwner || isCollab);
    };
    loadPerm();
  }, [id]);

  const revertTo = async (targetCommitId) => {
    const ok = window.confirm(
      "Create a new commit that restores this snapshot? Your history will show a new “revert” commit.",
    );
    if (!ok) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Login required to revert.");
        return;
      }
      const res = await fetch(`${API_BASE_URL}/commit/revert/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetCommitId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCommits();
        navigate(`/repo/${id}`);
      } else {
        alert(data.message || `Revert failed (${res.status})`);
      }
    } catch (err) {
      console.error(err);
      alert("Revert failed");
    }
  };

  return (
    <>
      <Navbar />

      <div className="commit-page">
        <div className="commit-page-header">
          <button
            type="button"
            className="commit-back"
            onClick={() => navigate(`/repo/${id}`)}
          >
            ← Code
          </button>
          <h1>Commits</h1>
          <p className="commit-sub">
            Newest first. Revert adds a commit that copies the selected snapshot
            (for people with write access).
          </p>
        </div>

        <div className="commit-list">
          {commits.length === 0 ? (
            <div className="commit-empty">No commits yet.</div>
          ) : null}

          {commits.map((commit) => (
            <article className="commit-card" key={commit._id || commit.commitId}>
              <div className="commit-card-top">
                <div className="commit-message">{commit.commitMessage}</div>
                {canWrite ? (
                  <button
                    type="button"
                    className="commit-revert-btn"
                    onClick={() => revertTo(commit.commitId)}
                  >
                    Revert to this
                  </button>
                ) : null}
              </div>

              <div className="commit-meta">
                Commit <span className="commit-hash">{commit.commitId}</span>
              </div>

              <div className="commit-date">
                {commit.createdAt
                  ? new Date(commit.createdAt).toLocaleString()
                  : ""}
              </div>

              <div className="commit-files">
                {(commit.changedFiles?.length ? commit.changedFiles : commit.files || []).map((file) => (
                  <div key={(file.filePath || file.fileName) + commit.commitId}>
                    {file.status ? `[${file.status}] ` : ""}{file.filePath || file.fileName}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
};

export default CommitHistory;
