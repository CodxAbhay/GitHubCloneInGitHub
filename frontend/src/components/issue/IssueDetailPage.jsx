import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../user/Navbar";
import "./issues.css";
import { API_BASE_URL } from "../../apiBase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const IssueDetailPage = () => {
  const navigate = useNavigate();
  const { id: repoId, issueId } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const statusClass = useMemo(() => {
    const s = issue?.status || "open";
    return `issue-status issue-${s}`;
  }, [issue?.status]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE_URL}/issue/${issueId}`);
        const data = await res.json();
        if (!data?.success) {
          setError(data?.message || "Issue not found");
          setIssue(null);
          return;
        }
        setIssue(data.data);
      } catch (e) {
        console.error(e);
        setError("Failed to load issue");
      } finally {
        setLoading(false);
      }
    };
    if (issueId) run();
  }, [issueId]);

  const toggleStatus = async () => {
    if (!issue) return;
    const next = issue.status === "closed" ? "open" : "closed";
    try {
      setUpdating(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/issue/update/${issue._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: next }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setIssue(data.data);
      }
    } catch (e) {
      console.error("Toggle issue status failed:", e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="issues-page">
        <div className="issue-detail-header">
          <button
            className="issue-back-btn"
            onClick={() => navigate(`/repo/${repoId}/issues`)}
          >
            ← Back to issues
          </button>
        </div>

        {loading ? (
          <div className="issue-empty">Loading…</div>
        ) : error ? (
          <div className="issue-empty">{error}</div>
        ) : (
          <div className="issue-detail-card">
            <div className="issue-detail-title-row">
              <h2 className="issue-detail-title">{issue?.title}</h2>
              <span className={statusClass}>{issue?.status}</span>
            </div>

            <div className="issue-detail-subtitle">
              In{" "}
              <button
                className="issue-link-btn"
                onClick={() => navigate(`/repo/${repoId}`)}
              >
                {issue?.repository?.name || "repository"}
              </button>
            </div>

            <div className="issue-detail-body">
              <div className="issue-detail-section-title">Description</div>
              <div className="issue-detail-description markdown-preview-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {issue?.description || ""}
                </ReactMarkdown>
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  className="issue-small-btn"
                  type="button"
                  disabled={updating}
                  onClick={toggleStatus}
                >
                  {issue?.status === "closed" ? "Reopen issue" : "Close issue"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default IssueDetailPage;

