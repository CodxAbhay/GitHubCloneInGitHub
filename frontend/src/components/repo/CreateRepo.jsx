import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../user/Navbar";
import "./createRepo.css";
import { API_BASE_URL } from "../../apiBase";

const RepoIcon = () => (
  <svg height="24" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="24" data-view-component="true" className="primer-icon primer-icon-public">
    <path fillRule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"></path>
  </svg>
);

const LockIcon = () => (
  <svg height="24" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="24" data-view-component="true" className="primer-icon primer-icon-private">
    <path fillRule="evenodd" d="M4 4v2h-.25A1.75 1.75 0 002 7.75v5.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 13.25v-5.5A1.75 1.75 0 0012.25 6H12V4a4 4 0 10-8 0zm6.5 2V4a2.5 2.5 0 00-5 0v2h5zM12 7.5h.25a.25.25 0 01.25.25v5.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-5.5a.25.25 0 01.25-.25H12z"></path>
  </svg>
);

const CheckIcon = () => (
  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="primer-icon-success">
    <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
  </svg>
);

const XIcon = () => (
  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="primer-icon-error">
    <path fillRule="evenodd" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
  </svg>
);

const CreateRepository = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addReadme, setAddReadme] = useState(false);
  const [nameStatus, setNameStatus] = useState("idle"); // idle | checking | available | taken | invalid
  const [nameHint, setNameHint] = useState("");
  const checkTimerRef = useRef(null);

  const [ownerUsername, setOwnerUsername] = useState("owner");

  useEffect(() => {
    // Attempt to fetch current user profile just to get correct owner name on screen
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if(userId && token) {
      fetch(`${API_BASE_URL}/userProfile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(d => {
        if(d?.success) setOwnerUsername(d.data.username);
      }).catch(e => console.error("Error fetching username for UI"));
    }
  }, []);

  useEffect(() => {
    const cleanedName = name.trim();
    const validName = cleanedName ? /^[a-zA-Z0-9._-]+$/.test(cleanedName) : true;

    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);

    if (!cleanedName) {
      setNameStatus("idle");
      setNameHint("");
      return;
    }

    if (!validName) {
      setNameStatus("invalid");
      setNameHint("Use only letters, numbers, '.', '_' and '-' in the name.");
      return;
    }

    setNameStatus("checking");
    setNameHint("Checking availability…");

    checkTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/repo/name/${encodeURIComponent(cleanedName)}`);
        if (res.status === 404) {
          setNameStatus("available");
          setNameHint(`${cleanedName} is available.`);
          return;
        }
        const data = await res.json();
        if (data?.success && data?.data?._id) {
          setNameStatus("taken");
          setNameHint(`The repository ${cleanedName} already exists on this account.`);
          return;
        }
        setNameStatus("available");
        setNameHint(`${cleanedName} is available.`);
      } catch (e) {
        setNameStatus("idle");
        setNameHint("");
      }
    }, 450);

    return () => {
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    };
  }, [name]);

  const handleCreateRepo = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    setError("");

    const cleanedName = name.trim();
    const validName = /^[a-zA-Z0-9._-]+$/.test(cleanedName);

    if (!cleanedName) { setError("Repository name is required."); return; }
    if (!validName) { setError("Use only letters, numbers, '.', '_' and '-' in the name."); return; }
    if (nameStatus === "taken") { setError("This repository name is already taken."); return; }

    try {
      setLoading(true);
      const content = addReadme ? `# ${cleanedName}\n\n${description?.trim() || "A new AbhayGit repository."}\n` : "";

      const response = await axios.post(
        `${API_BASE_URL}/repo/create`,
        {
          name: cleanedName,
          description: description,
          content: content,
          visibility: visibility,
          owner: userId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/repo/${response?.data?.data?._id || ""}` || "/");
    } catch (error) {
      console.error("Error creating repo:", error);
      setError(error?.response?.data?.message || "Failed to create repository");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="gh-create-repo-page">
        <div className="gh-create-repo-container">
          
          <div className="gh-create-header">
            <h1>Create a new repository</h1>
            <p className="subtitle">
              A repository contains all project files, including the revision history. Already have a project repository elsewhere?
            </p>
          </div>

          <form className="gh-create-form" onSubmit={handleCreateRepo}>
            
            <div className="gh-repo-name-segment">
              <div className="gh-repo-owner-col">
                <label>Owner <span style={{color: '#f85149'}}>*</span></label>
                <div className="gh-select-box">
                  <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="owner" className="gh-owner-avatar" />
                  <span>{ownerUsername}</span>
                </div>
              </div>

              <span className="gh-slash">/</span>

              <div className="gh-repo-name-col">
                <label>Repository name <span style={{color: '#f85149'}}>*</span></label>
                <input
                  type="text"
                  className={`gh-input-text ${nameStatus === 'invalid' || nameStatus === 'taken' ? 'input-error' : ''} ${nameStatus === 'available' ? 'input-success' : ''}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {nameStatus === 'available' && <div className="gh-status-icon"><CheckIcon /></div>}
              {(nameStatus === 'taken' || nameStatus === 'invalid') && <div className="gh-status-icon"><XIcon /></div>}
            </div>

            {nameHint && (
              <p className={`gh-hint-text ${nameStatus === 'taken' || nameStatus === 'invalid' ? 'gh-hint-error' : 'gh-hint-success'}`}>
                {nameStatus === 'available' && <CheckIcon />} 
                {nameStatus === 'taken' && <XIcon />} 
                {nameStatus === 'invalid' && <XIcon />} 
                {nameHint}
              </p>
            )}

            <p className="gh-input-desc">
              Great repository names are short and memorable. Need inspiration? How about <strong>stunning-tribble</strong>?
            </p>

            <div className="gh-field">
              <label>Description <span>(optional)</span></label>
              <input
                type="text"
                className="gh-input-text gh-input-full"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <hr className="gh-divider" />

            <div className="gh-visibility-segment">
              <label className={`gh-radio-card ${visibility === true ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === true}
                  onChange={() => setVisibility(true)}
                />
                <div className="gh-radio-content">
                  <RepoIcon />
                  <div className="gh-radio-text">
                    <strong>Public</strong>
                    <p>Anyone on the internet can see this repository. You choose who can commit.</p>
                  </div>
                </div>
              </label>

              <label className={`gh-radio-card ${visibility === false ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === false}
                  onChange={() => setVisibility(false)}
                />
                <div className="gh-radio-content">
                  <LockIcon />
                  <div className="gh-radio-text">
                    <strong>Private</strong>
                    <p>You choose who can see and commit to this repository.</p>
                  </div>
                </div>
              </label>
            </div>

            <hr className="gh-divider" />

            <div className="gh-initialize-segment">
              <h2>Initialize this repository with:</h2>
              <p className="gh-init-desc">Skip this step if you're importing an existing repository.</p>

              <label className="gh-checkbox-row">
                <input
                  type="checkbox"
                  checked={addReadme}
                  onChange={(e) => setAddReadme(e.target.checked)}
                />
                <div className="gh-checkbox-text">
                  <strong>Add a README file</strong>
                  <p>This is where you can write a long description for your project.</p>
                </div>
              </label>
            </div>

            <hr className="gh-divider" />

            {error && <div className="gh-form-error"><XIcon /> {error}</div>}

            <div className="gh-actions">
              <button
                type="submit"
                className="gh-btn-primary"
                disabled={loading || nameStatus === "checking" || nameStatus === "taken" || nameStatus === "invalid" || !name.trim()}
              >
                {loading ? "Creating repository…" : "Create repository"}
              </button>
            </div>

          </form>

        </div>
      </div>
    </>
  );
};

export default CreateRepository;