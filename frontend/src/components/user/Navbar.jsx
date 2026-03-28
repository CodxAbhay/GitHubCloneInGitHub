import React, { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./navbar.css";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import { API_BASE_URL } from "../../apiBase";

const PlusIcon = () => (
  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" className="octicon octicon-plus"><path fill="currentColor" d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"></path></svg>
);

const IssueIcon = () => (
  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" className="octicon octicon-issue-opened"><path fill="currentColor" d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path fill="currentColor" d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>
);

const PullRequestIcon = () => (
  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" className="octicon octicon-git-pull-request"><path fill="currentColor" d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm7.362 1.536a.75.75 0 0 1-1.06-1.06l2-2a.75.75 0 0 1 1.06 0l2 2a.75.75 0 1 1-1.06 1.06L10.5 3.44V8.5a1.5 1.5 0 0 1-1.5 1.5H8.25v1.25a2.25 2.25 0 1 1-1.5 0v-1.25A3 3 0 0 1 9.75 7h.75V3.44l-1.638 1.346ZM3 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm4.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"></path></svg>
);

const BellIcon = () => (
  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" className="octicon octicon-bell"><path fill="currentColor" d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c.002.004.006.011.018.011h10.962c.012 0 .016-.007.018-.011a.018.018 0 0 0 .002-.016L11.792 8.92a1.755 1.755 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z"></path></svg>
);

const Navbar = ({ onSearch }) => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [allUsers, setAllUsers] = useState(null);

  const [createMenu, setCreateMenu] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [sidebar, setSidebar] = useState(false);

  const sidebarRef = useRef(null);
  const searchRef = useRef(null);
  const createRef = useRef(null);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  const anyOverlayOpen = useMemo(
    () =>
      sidebar ||
      createMenu ||
      notifications ||
      profileMenu ||
      results.length > 0 ||
      userResults.length > 0,
    [sidebar, createMenu, notifications, profileMenu, results.length, userResults.length],
  );

  useOnClickOutside(sidebarRef, () => setSidebar(false), sidebar);
  useOnClickOutside(
    searchRef,
    () => {
      setResults([]);
      setUserResults([]);
    },
    results.length > 0 || userResults.length > 0,
  );
  useOnClickOutside(createRef, () => setCreateMenu(false), createMenu);
  useOnClickOutside(notificationsRef, () => setNotifications(false), notifications);
  useOnClickOutside(profileRef, () => setProfileMenu(false), profileMenu);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);

    if (onSearch) onSearch(value);

    if (value.length < 2) {
      setResults([]);
      setUserResults([]);
      return;
    }

    try {
      // repos
      const res = await fetch(`${API_BASE_URL}/repo/search/${value}`);
      const data = await res.json();
      setResults(data.data || []);

      // users (load once, filter client-side)
      if (!allUsers) {
        const usersRes = await fetch(`${API_BASE_URL}/allUsers`);
        const usersData = await usersRes.json();
        setAllUsers(usersData.data || []);
        const filtered =
          (usersData.data || []).filter((u) =>
            u.username?.toLowerCase().includes(value.toLowerCase()),
          ) || [];
        setUserResults(filtered.slice(0, 5));
      } else {
        const filtered = allUsers.filter((u) =>
          u.username?.toLowerCase().includes(value.toLowerCase()),
        );
        setUserResults(filtered.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && search.trim() !== "") {
      navigate(`/search?q=${search}`);
      setResults([]);
      setUserResults([]);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/auth");
  };

  return (
    <>
      {/* SIDEBAR */}
      {sidebar && (
        <div className="sidebar-overlay" aria-hidden={!sidebar}>
          <div className="sidebar" ref={sidebarRef} role="dialog" aria-label="Sidebar">

          <div className="sidebar-header">
            <img
              src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
              alt="github"
            />

            <span onClick={() => setSidebar(false)}>✕</span>
          </div>

          <div className="sidebar-links">
            <div onClick={() => { navigate("/"); setSidebar(false); }}>Home Dashboard</div>
            <div onClick={() => { navigate("/search"); setSidebar(false); }}>Explore Repositories</div>
            <div onClick={() => { navigate("/profile"); setSidebar(false); }}>Your Profile</div>
            <div onClick={() => { navigate("/repo"); setSidebar(false); }}>Starred Repositories</div>
          </div>

          <hr />

          <div className="sidebar-links">
            <div onClick={() => { navigate("/create"); setSidebar(false); }}>Create Repository</div>
            <div onClick={() => { navigate("/guide"); setSidebar(false); }}>Documentation</div>
            <div onClick={() => { logout(); setSidebar(false); }}>Sign Out</div>
          </div>

          </div>
        </div>
      )}

      <header className="navbar">

        {/* LEFT */}
        <div className="nav-left">

          <div
            className="menu-icon"
            onClick={() => setSidebar((v) => !v)}
          >
            ☰
          </div>

          <Link to="/" className="github-logo">
            <img
              src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
              alt="github"
            />
          </Link>

          <Link to="/" className="nav-title">
            Dashboard
          </Link>

        </div>


        {/* RIGHT */}
        <div className="nav-right">

          {/* SEARCH */}
          <div className="search-container" ref={searchRef}>

            <input
              className="nav-search"
              placeholder="Type / to search"
              value={search}
              onChange={handleSearch}
              onKeyDown={handleKeyDown}
            />

            {(results.length > 0 || userResults.length > 0) && (
              <div className="search-dropdown">
                {results.length > 0 && (
                  <>
                    <div className="search-section-label">Repositories</div>
                    {results.map((repo) => (
                      <div
                        key={repo._id}
                        className="search-item"
                        onClick={() => {
                          setResults([]);
                          setUserResults([]);
                          navigate(`/repo/${repo._id}`);
                        }}
                      >
                        {repo.name}
                      </div>
                    ))}
                  </>
                )}

                {userResults.length > 0 && (
                  <>
                    {results.length > 0 && <hr />}
                    <div className="search-section-label">Users</div>
                    {userResults.map((user) => (
                      <div
                        key={user._id}
                        className="search-item"
                        onClick={() => {
                          setResults([]);
                          setUserResults([]);
                          navigate(`/user/${user._id}`);
                        }}
                      >
                        {user.username}
                      </div>
                    ))}
                  </>
                )}

              </div>
            )}

          </div>


          {/* ICONS */}
          <div className="nav-icons" style={{ display: "flex", alignItems: "center", gap: "12px" }}>

            <span className="nav-icon" title="Issues" onClick={() => navigate("/search")}>
              <IssueIcon />
            </span>

            <span className="nav-icon" title="Pull Requests" onClick={() => navigate("/search")}>
              <PullRequestIcon />
            </span>

            {/* CREATE MENU */}
            <div ref={createRef} style={{ position: "relative" }}>
              <span
                className="nav-icon"
                title="Create new..."
                onClick={() => setCreateMenu((v) => !v)}
              >
                <PlusIcon /> ▾
              </span>

              {createMenu && (
                <div className="create-dropdown">
                  <div onClick={() => { navigate("/create"); setCreateMenu(false); }}>
                    New repository
                  </div>
                  <div onClick={() => { navigate("/create"); setCreateMenu(false); }}>
                    Import repository
                  </div>
                  <div onClick={() => { navigate("/search"); setCreateMenu(false); }}>
                    New issue (Select Repo)
                  </div>
                  <div onClick={() => { navigate("/guide"); setCreateMenu(false); }}>
                    Read Documentation
                  </div>
                  <div onClick={() => { navigate("/profile"); setCreateMenu(false); }}>
                    Update profile
                  </div>
                </div>
              )}
            </div>

            {/* NOTIFICATIONS */}
            <div ref={notificationsRef} style={{ position: "relative" }}>
              <span
                className="nav-icon"
                title="Notifications"
                onClick={() => setNotifications((v) => !v)}
              >
                <BellIcon />
              </span>

              {notifications && (
                <div className="notification-box">
                  No new notifications
                </div>
              )}
            </div>

          </div>


          {/* PROFILE */}
          <div
            className="profile-menu"
            ref={profileRef}
          >

            <img
              src="https://avatars.githubusercontent.com/u/9919?s=200&v=4"
              alt="profile"
              onClick={() => setProfileMenu((v) => !v)}
            />

            {profileMenu && (
              <div className="dropdown">

                <Link to="/profile">Your Profile</Link>

                <Link to="/repo">Starred Repositories</Link>

                <button onClick={logout}>
                  Logout
                </button>

              </div>
            )}

          </div>

        </div>

      </header>
    </>
  );
};

export default Navbar;