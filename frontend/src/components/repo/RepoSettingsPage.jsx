import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../user/Navbar";
import { API_BASE_URL } from "../../apiBase";
import "./repoSettings.css";

const RepoSettingsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [repoMeta, setRepoMeta] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newUser, setNewUser] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  useEffect(() => {
    fetchRepoData();
  }, [id]);

  const fetchRepoData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      // 1. Fetch generic repo data first for the header
      const metaRes = await fetch(`${API_BASE_URL}/repo/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const metaData = await metaRes.json();
      if (!metaData.success) {
        setError(metaData.message || "Repository not found");
        return;
      }
      setRepoMeta(metaData.data);

      // Verify ownership before proceeding
      const currUser = localStorage.getItem("userId");
      if (metaData.data.owner?._id !== currUser) {
        setError("forbidden");
        return;
      }

      // 2. Fetch collaborators via secure endpoint
      const colRes = await fetch(`${API_BASE_URL}/repo/${id}/collaborators`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const colData = await colRes.json();
      if (colData.success) {
        setOwner(colData.data.owner);
        setCollaborators(colData.data.collaborators);
      } else {
        setError(colData.message || "Failed to load collaborators");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch settings data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!newUser.trim()) return;

    setAdding(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/repo/${id}/collaborators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ usernameOrEmail: newUser.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewUser("");
        fetchRepoData(); // Refresh list
      } else {
        alert(data.message || "Failed to add user");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding collaborator");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveCollaborator = async (collabId) => {
    const ok = window.confirm("Are you sure you want to remove this collaborator?");
    if (!ok) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/repo/${id}/collaborators/${collabId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchRepoData();
      } else {
        alert(data.message || "Failed to remove collaborator");
      }
    } catch (err) {
      console.error(err);
      alert("Error removing collaborator");
    }
  };

  const handleDeleteRepo = async () => {
    if (deleteInput !== repoMeta?.name) {
      alert(`Please type exactly "${repoMeta?.name}" to confirm.`);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/repo/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert("Repository deleted successfully.");
        navigate("/");
      } else {
        alert(data.message || "Failed to delete repository");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting repository");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ color: "white", padding: 30 }}>Loading settings...</div>
      </>
    );
  }

  if (error === "forbidden") {
    return (
      <>
        <Navbar />
        <div style={{ color: "white", padding: 30 }}>You do not have permission to view settings for this repository.</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div style={{ color: "white", padding: 30 }}>{error}</div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="repo-page-gh settings-page-wrap">
        <div className="repo-header-gh">
          <div className="repo-title-gh">
            <button
              className="repo-link"
              onClick={() => navigate(`/user/${repoMeta?.owner?._id}`)}
            >
              {repoMeta?.owner?.username || "user"}
            </button>
            <span className="repo-sep">/</span>
            <span className="repo-name-gh">{repoMeta?.name || "repository"}</span>
            <span className="repo-pill">{repoMeta?.visibility ? "Public" : "Private"}</span>
          </div>
        </div>

        <div className="repo-tabs-gh">
          <button className="tab-button" onClick={() => navigate(`/repo/${id}`)}>
            Code
          </button>
          <button className="tab-button" onClick={() => navigate(`/repo/${id}/issues`)}>
            Issues
          </button>
          <button className="tab-button" onClick={() => navigate(`/repo/${id}/commits`)}>
            Commits
          </button>
          <button className="tab-button active">
            Settings
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-sidebar">
            <div className="settings-nav-item active">Collaborators</div>
            <div className="settings-nav-item danger-nav">Danger Zone</div>
          </div>

          <div className="settings-main">
            <div className="settings-section">
              <h2>Manage Access</h2>
              <div className="settings-desc">
                Invite collaborators to work on this repository with you.
              </div>

              <div className="add-collaborator-box">
                <form onSubmit={handleAddCollaborator} className="add-collab-form">
                  <input
                    type="text"
                    placeholder="Search by username or email"
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                  />
                  <button type="submit" disabled={adding || !newUser}>
                    {adding ? "Adding..." : "Add collaborator"}
                  </button>
                </form>
              </div>

              <div className="collaborators-list">
                <div className="collab-row owner-row">
                  <div className="collab-info">
                    <img
                      src={owner?.avatarUrl || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}
                      alt="owner"
                      className="collab-avatar"
                    />
                    <div>
                      <div className="collab-name">{owner?.username} <span>(Owner)</span></div>
                      <div className="collab-email">{owner?.email}</div>
                    </div>
                  </div>
                </div>

                {collaborators.map((c) => (
                  <div className="collab-row" key={c._id}>
                    <div className="collab-info">
                      <img
                        src={c.avatarUrl || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}
                        alt="collab"
                        className="collab-avatar"
                      />
                      <div>
                        <div className="collab-name">{c.username}</div>
                        <div className="collab-email">{c.email}</div>
                      </div>
                    </div>
                    <button
                      className="collab-remove-btn"
                      onClick={() => handleRemoveCollaborator(c._id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                {collaborators.length === 0 && (
                  <div className="collab-empty">No collaborators yet.</div>
                )}
              </div>
            </div>

            <div className="settings-section danger-zone">
              <h2 className="danger-heading">Danger Zone</h2>
              
              <div className="danger-box">
                <div className="danger-box-content">
                  <div>
                    <strong>Delete this repository</strong>
                    <p>Once you delete a repository, there is no going back. Please be certain.</p>
                  </div>
                  
                  <div className="danger-action-area">
                    <label>To confirm, type "<strong>{repoMeta?.name}</strong>" in the box below</label>
                    <input 
                      type="text" 
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder={repoMeta?.name}
                    />
                    <button 
                      className="header-btn danger delete-repo-btn"
                      onClick={handleDeleteRepo}
                      disabled={deleteInput !== repoMeta?.name}
                    >
                      Delete this repository
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default RepoSettingsPage;
