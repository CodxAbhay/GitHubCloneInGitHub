import React, { useEffect } from "react";
import { useNavigate, useRoutes } from "react-router-dom";

// Pages List
import Home from "./components/home/Home";
import Profile from "./components/user/Profile";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import CreateRepo from "./components/repo/CreateRepo";
import RepositoryPage from "./components/repo/RepositoryPage";
import SearchPage from "./components/search/SearchPage";
import StarredRepositories from "./components/repo/StarredRepositories";

import CommitHistory from "./components/pages/CommitHistory";
import RepoIssuesPage from "./components/issue/RepoIssuesPage";
import IssueDetailPage from "./components/issue/IssueDetailPage";
import RepoSettingsPage from "./components/repo/RepoSettingsPage";
import Guide from "./components/guide/Guide";

// Auth Context
import { useAuth } from "./AuthContext";

const ProjectRoutes = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const userIdFromStorage = localStorage.getItem("userId");
    const pathname = window.location.pathname;

    if (userIdFromStorage && !currentUser) {
      setCurrentUser(userIdFromStorage);
    }

    const isPublic =
      pathname === "/" ||
      pathname === "/auth" ||
      pathname === "/signup" ||
      pathname === "/search" ||
      pathname.startsWith("/repo/") ||
      pathname.startsWith("/user/");

    if (!userIdFromStorage && !isPublic) {
      navigate("/auth");
    }

    if (userIdFromStorage && pathname === "/auth") {
      navigate("/");
    }
  }, [currentUser, navigate, setCurrentUser]);

  let element = useRoutes([
    { path: "/", element: <Home /> },
    { path: "/auth", element: <Login /> },
    { path: "/signup", element: <Signup /> },
    { path: "/profile", element: <Profile /> },
    { path: "/user/:id", element: <Profile /> },
    { path: "/create", element: <CreateRepo /> },
    { path: "/repo/:id", element: <RepositoryPage /> },
    { path: "/repo/:id/issues", element: <RepoIssuesPage /> },
    { path: "/repo/:id/issues/:issueId", element: <IssueDetailPage /> },
    { path: "/search", element: <SearchPage /> },
    { path: "/repo", element: <StarredRepositories /> },
    { path: "/repo/:id/commits", element: <CommitHistory /> },
    { path: "/repo/:id/settings", element: <RepoSettingsPage /> },
    { path: "/guide", element: <Guide /> },
  ]);
  return element;
};

export default ProjectRoutes;
