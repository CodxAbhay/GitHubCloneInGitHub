import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../user/Navbar";
import "./issues.css";
import { API_BASE_URL } from "../../apiBase";

const RepoIssuesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("open");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchIssues();
  }, [id]);

  const fetchIssues = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/issue/all`);
      const data = await res.json();

      const repoIssues = (data.data || []).filter(
        (issue) => issue.repository === id || issue.repository?._id === id
      );

      setIssues(repoIssues);
    } catch (err) {
      console.error("Issues fetch failed:", err);
    }
  };

  const updateIssueStatus = async (issueId, status) => {
    try {
      setUpdatingId(issueId);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/issue/update/${issueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchIssues();
      }
    } catch (e) {
      console.error("Update issue status failed:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();

    if (!title || !description) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/issue/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          repository: id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTitle("");
        setDescription("");
        fetchIssues();
      }
    } catch (err) {
      console.error("Create issue failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="issues-page">
        <div className="issues-header">
          <h2>Issues</h2>
          <span>{issues.filter((i) => i.status !== "closed").length} open</span>
        </div>

        <div className="issues-layout">
          {/* ISSUE LIST */}
          <div className="issues-list">
            <div className="issues-toolbar">
              <div className="issues-toolbar-left">
                <button
                  className={`issues-filter-btn ${
                    filter === "open" ? "active" : ""
                  }`}
                  onClick={() => setFilter("open")}
                >
                  Open
                </button>
                <button
                  className={`issues-filter-btn ${
                    filter === "closed" ? "active" : ""
                  }`}
                  onClick={() => setFilter("closed")}
                >
                  Closed
                </button>
              </div>
            </div>

            {issues.filter((i) => (filter === "open" ? i.status !== "closed" : i.status === "closed"))
              .length === 0 ? (
              <div className="issue-empty">No {filter} issues.</div>
            ) : (
              issues
                .filter((i) =>
                  filter === "open" ? i.status !== "closed" : i.status === "closed",
                )
                .map((issue) => (
                  <div
                    key={issue._id}
                    className="issue-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/repo/${id}/issues/${issue._id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        navigate(`/repo/${id}/issues/${issue._id}`);
                    }}
                  >
                    <div>
                      <div className="issue-title">{issue.title}</div>
                      <div className="issue-meta">
                        <span className={`issue-status issue-${issue.status}`}>
                          {issue.status}
                        </span>
                        <span className="issue-meta-sep">•</span>
                        <span className="issue-id">#{String(issue._id).slice(-6)}</span>
                      </div>
                    </div>
                    <div className="issue-actions">
                      {issue.status !== "closed" ? (
                        <button
                          type="button"
                          className="issue-small-btn"
                          disabled={updatingId === issue._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateIssueStatus(issue._id, "closed");
                          }}
                        >
                          Close
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="issue-small-btn"
                          disabled={updatingId === issue._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateIssueStatus(issue._id, "open");
                          }}
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* NEW ISSUE FORM */}
          <div className="issue-form-card">
            <h3>New issue</h3>
            <form onSubmit={handleCreateIssue}>
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Issue title"
              />

              <label>Description</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue"
              />

              <button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create issue"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default RepoIssuesPage;
