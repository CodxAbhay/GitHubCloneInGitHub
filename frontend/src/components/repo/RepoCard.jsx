import React, { useState } from "react";
import "./repoCard.css";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../apiBase";

const RepoCard = ({ repo }) => {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");

  // initial star count
  const [stars, setStars] = useState(repo?.stars?.length || 0);

  // track if current user starred
  const [starred, setStarred] = useState(
    repo?.stars?.includes(userId)
  );

  // open repo page
  const handleCardClick = () => {
    if (!repo?._id) return;
    navigate(`/repo/${repo._id}`);
  };

  // ⭐ toggle star
  const toggleStar = async (e) => {
    e.stopPropagation(); // prevent card click

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/repo/star/${repo._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setStars(data.starsCount);
        setStarred(data.starred);
      }
    } catch (err) {
      console.error("Star error:", err);
    }
  };

  return (
    <div className="repo-card" onClick={handleCardClick}>
      <div className="repo-card-header">
        <h3 className="repo-name">
          {repo?.name || "Repository"}
        </h3>

        <span className="repo-visibility">
          {repo?.visibility ? "Public" : "Private"}
        </span>
      </div>

      <p className="repo-description">
        {repo?.description || "No description provided."}
      </p>

      <div className="repo-footer">
        <div className="repo-info">

          {/* ⭐ STAR BUTTON */}
          <span
            className={`star-btn ${starred ? "starred" : ""}`}
            onClick={toggleStar}
          >
            ⭐ {stars}
          </span>

          <span>🍴 0</span>

          <span>🐞 {repo?.issues?.length || 0}</span>
        </div>

        <div className="repo-language">
          <span className="language-dot"></span>
          JavaScript
        </div>
      </div>
    </div>
  );
};

export default RepoCard;