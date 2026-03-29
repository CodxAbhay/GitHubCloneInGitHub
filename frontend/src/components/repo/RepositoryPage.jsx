import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../user/Navbar";
import "./repositoryPage.css";
import { API_BASE_URL } from "../../apiBase";

import FileTree from "./FileTree";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const RepositoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tree, setTree] = useState({});
  const [repoMeta, setRepoMeta] = useState(null);
  const [starsCount, setStarsCount] = useState(0);
  const [watchersCount, setWatchersCount] = useState(0);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [originalFileContent, setOriginalFileContent] = useState("");
  const [isEditingFile, setIsEditingFile] = useState(false);
  const [editorContent, setEditorContent] = useState("");

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showAddFileMenu, setShowAddFileMenu] = useState(false);

  const [uploadFiles, setUploadFiles] = useState([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const isOwner = useMemo(
    () => String(repoMeta?.owner?._id) === localStorage.getItem("userId"),
    [repoMeta?.owner?._id],
  );
  const canWrite = useMemo(() => {
    const uid = localStorage.getItem("userId");
    if (!uid || !repoMeta) return false;
    const ownerId = repoMeta?.owner?._id;
    const collabs = repoMeta?.collaborators || [];
    const isCollab = collabs.some(
      (c) => String(typeof c === "object" ? c?._id : c) === String(uid),
    );
    return String(ownerId) === String(uid) || isCollab;
  }, [repoMeta]);

  const canFork = useMemo(() => {
    const uid = localStorage.getItem("userId");
    return Boolean(uid && repoMeta && !isOwner);
  }, [repoMeta, isOwner]);

  useEffect(() => {
    fetchFiles();
    fetchTree();
    fetchRepoMeta();
  }, [id]);

  const fetchRepoMeta = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/repo/${id}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setRepoMeta(data.data);
        setStarsCount(data.data.stars?.length || 0);
        setWatchersCount(data.data.watchers?.length || 0);
      }
    } catch (err) {
      console.error("Repo fetch error:", err);
    }
  };

  const deleteFile = async (filePath) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/repo/file/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repoId: id,
          filePath,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("File deleted");
        setSelectedFile(null);
        setFileContent("");
        setEditorContent("");
        setIsEditingFile(false);
        fetchFiles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/repo/tree/${id}`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      setTree(data.tree || {});
    } catch (err) {
      console.error("Fetch tree error:", err);
    }
  };

  const fetchTree = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/repo/tree/${id}`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      setTree(data.tree || {});
    } catch (err) {
      console.error("Tree fetch error:", err);
    }
  };

  const openFile = async (url, fileName) => {
    try {
      setSelectedFile(fileName);

      const res = await fetch(url);

      const text = await res.text();

      setFileContent(text);
      setOriginalFileContent(text);
      setEditorContent(text);
      setIsEditingFile(false);
    } catch (err) {
      console.error("File open error:", err);
    }
  };

  const uploadCommit = async () => {
    try {
      setUploadError("");
      if (!canWrite) {
        setUploadError("You do not have write access to this repository.");
        return;
      }
      if (!uploadFiles || uploadFiles.length === 0) {
        alert("Select files first");
        return;
      }

      const formData = new FormData();

      formData.append("repoId", id);
      formData.append("message", commitMessage);

      for (let file of uploadFiles) {
        const relativePathRaw = file.webkitRelativePath || file.name;
        const relativePath = String(relativePathRaw).replaceAll("\\", "/");

        formData.append("files", file);
        formData.append("paths", relativePath);
      }

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/commit/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok || !data.success) {
        setUploadError(
          data.message ||
            (res.status === 413
              ? "Upload rejected: file or total size limit exceeded."
              : res.status === 429
                ? "Too many uploads. Try again in a few minutes."
                : `Upload failed (${res.status})`),
        );
        return;
      }

      setUploadFiles([]);
      setCommitMessage("");

      fetchFiles();
      fetchTree();
      fetchRepoMeta();
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Upload failed");
    }
  };

  const commitEditedFile = async () => {
    if (!canWrite || !selectedFile) return;
    if (editorContent === originalFileContent) {
      setUploadError("No changes to commit for this file.");
      return;
    }

    try {
      setUploadError("");
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("repoId", id);
      formData.append("message", commitMessage || `Update ${selectedFile}`);
      const blob = new Blob([editorContent], { type: "text/plain" });
      formData.append("files", blob, selectedFile);
      formData.append("paths", selectedFile);

      const res = await fetch(`${API_BASE_URL}/commit/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setUploadError(data.message || "Commit failed");
        return;
      }
      setFileContent(editorContent);
      setOriginalFileContent(editorContent);
      setIsEditingFile(false);
      setCommitMessage("");
      fetchFiles();
      fetchRepoMeta();
    } catch (err) {
      setUploadError(err.message || "Commit failed");
    }
  };

  const commitNewFile = async () => {
    if (!canWrite) return;
    if (!newFileName.trim()) {
      setUploadError("File name cannot be empty.");
      return;
    }

    try {
      setUploadError("");
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("repoId", id);
      formData.append("message", commitMessage || `Create ${newFileName}`);
      const blob = new Blob([editorContent], { type: "text/plain" });
      formData.append("files", blob, newFileName);
      formData.append("paths", newFileName);

      const res = await fetch(`${API_BASE_URL}/commit/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setUploadError(data.message || "Commit failed");
        return;
      }
      setIsCreatingFile(false);
      setNewFileName("");
      setCommitMessage("");
      fetchFiles();
      fetchRepoMeta();
    } catch (err) {
      setUploadError(err.message || "Commit failed");
    }
  };

  const handleFork = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      navigate("/auth");
      return;
    }
    if (isOwner) return;

    try {
      const res = await fetch(`${API_BASE_URL}/repo/fork/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success && data.data?._id) {
        navigate(`/repo/${data.data._id}`);
      } else {
        alert(data.message || "Could not fork repository");
      }
    } catch (e) {
      console.error(e);
      alert("Could not fork repository");
    }
  };

  const handleStarToggle = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/repo/star/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (data.success) {
        setStarsCount(data.starsCount);
      }
    } catch (err) {
      console.error("Star toggle error:", err);
    }
  };

  const handleWatchToggle = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/repo/watch/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (data.success) {
        setWatchersCount(data.watchersCount);
      }
    } catch (err) {
      console.error("Watch toggle error:", err);
    }
  };

  const detectLanguage = (fileName) => {
    const ext = fileName.split(".").pop();

    const map = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      py: "python",
      java: "java",
      css: "css",
      html: "html",
      json: "json",
      md: "markdown",
      txt: "text",
    };

    return map[ext] || "text";
  };

  /* ------------------------------
     FILE TREE RENDER FUNCTION
  ------------------------------ */

  const renderTree = (node) => {
    return Object.entries(node).map(([name, value]) => {
      if (value.type === "file") {
        return (
          <div
            key={name}
            className="file-item"
            onClick={() => openFile(value.url, name)}
          >
            📄 {name}
          </div>
        );
      }

      return (
        <div key={name} className="folder">
          <div className="folder-name">📁 {name}</div>

          <div className="folder-children">{renderTree(value)}</div>
        </div>
      );
    });
  };

  const calculateLanguages = (treeNode) => {
    const extCounts = {};
    const traverse = (node) => {
      Object.entries(node).forEach(([name, value]) => {
        if (value.type === "file") {
          const ext = name.split(".").pop().toLowerCase();
          if (ext && ext !== name.toLowerCase()) {
            extCounts[ext] = (extCounts[ext] || 0) + 1;
          }
        } else if (value.type === "folder" || typeof value === "object") {
          traverse(value);
        }
      });
    };
    if (treeNode) traverse(treeNode);
    
    const langMap = {
      js: { name: "JavaScript", color: "#f1e05a" },
      jsx: { name: "JavaScript", color: "#f1e05a" },
      ts: { name: "TypeScript", color: "#3178c6" },
      tsx: { name: "TypeScript", color: "#3178c6" },
      html: { name: "HTML", color: "#e34c26" },
      css: { name: "CSS", color: "#563d7c" },
      py: { name: "Python", color: "#3572A5" },
      java: { name: "Java", color: "#b07219" },
      json: { name: "JSON", color: "#292929" },
      md: { name: "Markdown", color: "#083fa1" },
      txt: { name: "Text", color: "#cccccc" }
    };
    
    let totalFiles = 0;
    const langStats = {};
    Object.entries(extCounts).forEach(([ext, count]) => {
      const mapping = langMap[ext] || { name: ext.toUpperCase(), color: "#8b949e" };
      if (!langStats[mapping.name]) {
         langStats[mapping.name] = { count: 0, color: mapping.color };
      }
      langStats[mapping.name].count += count;
      totalFiles += count;
    });
    
    if (totalFiles === 0) return [];
    
    return Object.entries(langStats)
      .map(([name, data]) => ({
         name, 
         color: data.color, 
         percentage: ((data.count / totalFiles) * 100).toFixed(1)
      }))
      .sort((a,b) => parseFloat(b.percentage) - parseFloat(a.percentage));
  };
  
  const languages = useMemo(() => calculateLanguages(tree), [tree]);

  return (
    <>
      <Navbar />

      <div className="repo-page-gh">
        <div className="repo-header-gh">
          <div className="repo-title-gh">
            <button
              className="repo-link"
              onClick={() => repoMeta?.owner?._id && navigate(`/user/${repoMeta.owner._id}`)}
            >
              {repoMeta?.owner?.username || "user"}
            </button>
            <span className="repo-sep">/</span>
            <span className="repo-name-gh">{repoMeta?.name || "repository"}</span>
            <span className="repo-pill">{repoMeta?.visibility ? "Public" : "Private"}</span>
          </div>

          <div className="repo-actions-gh">
            <button className="header-btn" onClick={handleWatchToggle}>
              👀 Watch <span className="count">• {watchersCount}</span>
            </button>
            <button className="header-btn" onClick={handleStarToggle}>
              ⭐ Star <span className="count">• {starsCount}</span>
            </button>
            {canFork ? (
              <button type="button" className="header-btn primary" onClick={handleFork}>
                Fork
              </button>
            ) : null}
          </div>
        </div>

        {repoMeta?.description && (
          <div className="repo-description-gh">{repoMeta.description}</div>
        )}

        {uploadError ? (
          <div className="repo-upload-error" role="alert">
            {uploadError}
          </div>
        ) : null}

        <div className="repo-tabs-gh">
          <button className="tab-button active" onClick={() => navigate(`/repo/${id}`)}>
            Code
          </button>
          <button className="tab-button" onClick={() => navigate(`/repo/${id}/issues`)}>
            Issues
          </button>
          <button className="tab-button" onClick={() => navigate(`/repo/${id}/commits`)}>
            Commits
          </button>
          
          {isOwner && (
            <button className="tab-button" onClick={() => navigate(`/repo/${id}/settings`)}>
              Settings
            </button>
          )}
        </div>

        <div className="repo-content-gh">
            <div className="repo-file-card">
              <div className="repo-file-card-header">
                <div className="branch-pill">main</div>
                <div className="repo-file-actions">
                  <button className="small-btn" onClick={() => navigate(`/repo/${id}/commits`)}>
                    View commits
                  </button>
                  {canWrite ? (
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <button
                        className="small-btn primary"
                        onClick={() => setShowAddFileMenu(!showAddFileMenu)}
                      >
                        Add file ▾
                      </button>
                      {showAddFileMenu && (
                        <div className="add-file-dropdown">
                          <button
                            onClick={() => {
                              setIsCreatingFile(true);
                              setShowAddFileMenu(false);
                              setSelectedFile(null);
                              setEditorContent("");
                              setNewFileName("");
                            }}
                          >
                            Create new file
                          </button>
                          <button
                            onClick={() => {
                              setShowAddFileMenu(false);
                              document.getElementById("file-upload-input")?.click();
                            }}
                          >
                            Upload files
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                  {canWrite && uploadFiles?.length > 0 ? (
                    <button
                      className="small-btn primary"
                      onClick={uploadCommit}
                    >
                      Commit files ({uploadFiles.length})
                    </button>
                  ) : null}
                </div>
              </div>

              {canWrite && (
                <div className="upload-box-gh">
                  <label className="upload-label">
                    Add files
                    <input
                      id="file-upload-input"
                      type="file"
                      multiple
                      onChange={(e) => {
                        setUploadError("");
                        setUploadFiles(e.target.files);
                      }}
                    />
                  </label>

                  <label className="upload-label">
                    Add folder
                    <input
                      type="file"
                      multiple
                      ref={(input) => {
                        if (input) {
                          input.setAttribute("webkitdirectory", "");
                          input.setAttribute("directory", "");
                        }
                      }}
                      onChange={(e) => {
                        setUploadError("");
                        setUploadFiles(e.target.files);
                      }}
                    />
                  </label>

                  <input
                    className="commit-input"
                    type="text"
                    placeholder="Commit message"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                  />
                </div>
              )}

              <div className="repo-file-tree">
                <FileTree tree={tree} onFileClick={openFile} />
              </div>
              {canWrite && !Object.keys(tree).some((k) => k.toLowerCase() === "readme.md") && !isCreatingFile && !selectedFile && (
                <div className="readme-prompt">
                  <button
                    className="small-btn primary"
                    onClick={() => {
                      setIsCreatingFile(true);
                      setNewFileName("README.md");
                      setEditorContent(`# ${repoMeta?.name}\n\n`);
                    }}
                  >
                    Add a README
                  </button>
                </div>
              )}
            </div>

            <div className="repo-view-card">
              {isCreatingFile ? (
                <>
                  <div className="file-header">
                    <input
                      type="text"
                      className="new-file-input"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="Name your file..."
                    />
                    <button className="delete-btn" onClick={() => setIsCreatingFile(false)}>
                      Cancel
                    </button>
                  </div>
                  <textarea
                    className="repo-editor"
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    placeholder="Enter file contents here"
                  />
                  <div className="repo-editor-actions">
                    <input
                      type="text"
                      className="commit-input"
                      style={{ background: "#0d1117", borderColor: "#30363d", color: "#c9d1d9", padding: "6px 12px", borderRadius: "6px" }}
                      placeholder="Commit message"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                    />
                    <button className="small-btn primary" onClick={commitNewFile}>
                      Commit new file
                    </button>
                  </div>
                </>
              ) : selectedFile ? (
                <>
                  <div className="file-header">
                    <h3>{selectedFile}</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                      {canWrite && (
                        <>
                          <button
                            className="delete-btn"
                            onClick={() => setIsEditingFile((v) => !v)}
                          >
                            {isEditingFile ? "Cancel edit" : "Edit"}
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => deleteFile(selectedFile)}
                          >
                            🗑 Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditingFile ? (
                    <div>
                      <textarea
                        className="repo-editor"
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                      />
                      <div className="repo-editor-actions">
                        <button
                          className="small-btn primary"
                          onClick={commitEditedFile}
                          disabled={editorContent === originalFileContent}
                        >
                          Commit changes
                        </button>
                        <span className="repo-editor-hint">
                          {editorContent === originalFileContent
                            ? "No changes yet"
                            : "Changes detected"}
                        </span>
                      </div>
                    </div>
                  ) : selectedFile.toLowerCase().endsWith(".md") ? (
                    <div className="markdown-preview-body" style={{ padding: "16px", color: "#c9d1d9Line", lineHeight: 1.6 }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {fileContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <SyntaxHighlighter
                      language={detectLanguage(selectedFile)}
                      style={vscDarkPlus}
                      showLineNumbers
                    >
                      {fileContent}
                    </SyntaxHighlighter>
                  )}
                </>
              ) : (
                <div className="empty-view">Select a file to view</div>
              )}
            </div>

          <aside className="repo-sidebar-gh">
            <div className="about-card">
              <div className="about-title">About</div>
              <div className="about-desc">
                {repoMeta?.description || "No description provided."}
              </div>
              <div className="about-meta">
                <div>⭐ {starsCount} stars</div>
                <div>👀 {watchersCount} watching</div>
                <div>🐞 {repoMeta?.issues?.length || 0} issues</div>
              </div>
            </div>

            <div className="about-card" style={{ marginTop: 12 }}>
              <div className="about-title">Languages</div>
              {languages.length > 0 ? (
                <>
                  <div className="language-bar" style={{ display: "flex", width: "100%", height: "8px", borderRadius: "4px", overflow: "hidden", marginTop: "12px", marginBottom: "12px" }}>
                    {languages.map((lang, idx) => (
                      <div key={idx} style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }} title={`${lang.name} ${lang.percentage}%`} />
                    ))}
                  </div>
                  <ul className="language-list" style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "12px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {languages.map((lang, idx) => (
                      <li key={idx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: lang.color }}></span>
                        <span style={{ color: "#c9d1d9", fontWeight: 600 }}>{lang.name}</span>
                        <span style={{ color: "#8b949e" }}>{lang.percentage}%</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="about-desc">No languages detected.</div>
              )}
            </div>

            <div className="about-card" style={{ marginTop: 12 }}>
              <div className="about-title">Repo ID</div>
              <div className="about-desc" style={{ wordBreak: "break-all", color: "#c9d1d9", fontSize: "12px" }}>
                {id}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default RepositoryPage;
