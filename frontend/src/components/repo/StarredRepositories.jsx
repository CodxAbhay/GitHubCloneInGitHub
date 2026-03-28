import React, { useEffect, useState } from "react";
import Navbar from "../user/Navbar";
import "./starredRepositories.css";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../apiBase";

const StarredRepositories = () => {
  const navigate = useNavigate();

  const [repos, setRepos] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    const fetchStarred = async () => {

      try {

        const response = await fetch(
          `${API_BASE_URL}/repo/starred/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        setRepos(data.data || []);

      } catch (error) {

        console.error("Error fetching starred repos:", error);

      }

    };

    fetchStarred();

  }, []);

  return (
    <>
      <Navbar />

      <div className="starred-container">

        <div className="starred-header">
          <h2>Stars</h2>
          <div className="starred-search">
            <input
              placeholder="Search starred repositories"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {repos.length === 0 ? (

          <p>No starred repositories yet</p>

        ) : (

          <div className="starred-list">
            {repos
              .filter((r) =>
                q
                  ? `${r?.owner?.username || ""}/${r?.name || ""}`
                      .toLowerCase()
                      .includes(q.toLowerCase())
                  : true,
              )
              .map((repo) => (
                <div
                  key={repo._id}
                  className="starred-row"
                  onClick={() => navigate(`/repo/${repo._id}`)}
                >
                  <div className="starred-row-top">
                    <div className="starred-name">
                      {repo?.owner?.username ? `${repo.owner.username}/` : ""}
                      <span>{repo?.name}</span>
                    </div>
                    <span className="repo-visibility">
                      {repo?.visibility ? "Public" : "Private"}
                    </span>
                  </div>
                  <div className="starred-desc">
                    {repo?.description || "No description provided."}
                  </div>
                  <div className="starred-meta">
                    <span>⭐ {repo?.stars?.length || 0}</span>
                    <span>🐞 {repo?.issues?.length || 0}</span>
                  </div>
                </div>
              ))}
          </div>

        )}

      </div>
    </>
  );
};

export default StarredRepositories;