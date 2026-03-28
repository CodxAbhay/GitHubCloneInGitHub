import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./profile.css";
import Navbar from "./Navbar";
import { UnderlineNav } from "@primer/react";
import { BookIcon, RepoIcon, LocationIcon, OrganizationIcon } from "@primer/octicons-react";
import HeatMapProfile from "./HeatMap";
import { useAuth } from "../../AuthContext";
import { API_BASE_URL } from "../../apiBase";

const Profile = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { setCurrentUser } = useAuth();

  const [userDetails, setUserDetails] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [profileDraft, setProfileDraft] = useState({
    avatarUrl: "",
    bio: "",
    leetcode: "",
    linkedin: "",
    instagram: "",
    website: "",
    company: "",
    location: "",
  });
  const [publicRepos, setPublicRepos] = useState([]);

  const viewerId = useMemo(() => localStorage.getItem("userId"), []);
  const isOwnProfile = userDetails?._id && viewerId && userDetails._id === viewerId;
  const avatarSrc =
    userDetails?.avatarUrl?.trim() ||
    "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";

  useEffect(() => {
    const fetchUserDetails = async () => {
      const viewerIdLocal = localStorage.getItem("userId");
      const profileUserId = params?.id || viewerIdLocal;

      if (!viewerIdLocal) {
        navigate("/auth");
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/userProfile/${profileUserId}`
        );

        setUserDetails(response.data.data);
        setProfileDraft({
          avatarUrl: response.data.data?.avatarUrl || "",
          bio: response.data.data?.bio || "",
          leetcode: response.data.data?.leetcode || "",
          linkedin: response.data.data?.linkedin || "",
          instagram: response.data.data?.instagram || "",
          website: response.data.data?.website || "",
          company: response.data.data?.company || "",
          location: response.data.data?.location || "",
        });

        // fetch followers / following for the profile user
        const [followersRes, followingRes, reposRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/user/${profileUserId}/followers`),
          axios.get(`${API_BASE_URL}/user/${profileUserId}/following`),
          axios.get(`${API_BASE_URL}/repo/public/user/${profileUserId}`),
        ]);

        setFollowers(followersRes.data.data || []);
        setFollowing(followingRes.data.data || []);
        setPublicRepos(reposRes.data.data || []);

        // initialize follow state (viewer -> profile)
        if (profileUserId && viewerIdLocal && profileUserId !== viewerIdLocal) {
          const viewerFollowingRes = await axios.get(
            `${API_BASE_URL}/user/${viewerIdLocal}/following`,
          );
          const viewerFollowing = viewerFollowingRes.data.data || [];
          setIsFollowing(
            viewerFollowing.some((u) => u?._id?.toString?.() === profileUserId),
          );
        } else {
          setIsFollowing(false);
        }
      } catch (err) {
        console.error("Cannot fetch user details:", err);
      }
    };

    fetchUserDetails();
  }, [navigate, params?.id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setCurrentUser(null);
    navigate("/auth");
  };

  const handleFollowToggle = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (!userDetails || !userId || !token) return;

      const targetId = userDetails._id;

      // if you are on your own profile, do nothing
      if (targetId === userId) return;

      const url = isFollowing
        ? `${API_BASE_URL}/user/${targetId}/unfollow`
        : `${API_BASE_URL}/user/${targetId}/follow`;

      await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsFollowing(!isFollowing);
      // refresh follower/following counts quickly
      const [followersRes, followingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/user/${targetId}/followers`),
        axios.get(`${API_BASE_URL}/user/${targetId}/following`),
      ]);
      setFollowers(followersRes.data.data || []);
      setFollowing(followingRes.data.data || []);
    } catch (err) {
      console.error("Follow/unfollow failed:", err);
    }
  };

  const saveProfile = async () => {
    try {
      setSaveLoading(true);
      setSaveError("");
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      if (!token || !userId) return;

      await axios.put(
        `${API_BASE_URL}/updateProfile/${userId}`,
        {
          avatarUrl: profileDraft.avatarUrl,
          bio: profileDraft.bio,
          leetcode: profileDraft.leetcode,
          linkedin: profileDraft.linkedin,
          instagram: profileDraft.instagram,
          website: profileDraft.website,
          company: profileDraft.company,
          location: profileDraft.location,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setEditing(false);
      // refresh profile
      const response = await axios.get(`${API_BASE_URL}/userProfile/${userId}`);
      setUserDetails(response.data.data);
    } catch (e) {
      console.error(e);
      setSaveError("Failed to save profile");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <UnderlineNav aria-label="Repository">
        <UnderlineNav.Item icon={BookIcon}>
          Overview
        </UnderlineNav.Item>

        <UnderlineNav.Item
          icon={RepoIcon}
          onClick={() => navigate("/repo")}
        >
          Starred Repositories
        </UnderlineNav.Item>
      </UnderlineNav>

      <button id="logout" onClick={handleLogout}>
        Logout
      </button>

      <div className="profile-page-wrapper">

        {/* LEFT PROFILE */}
        <div className="user-profile-section">

          <img className="profile-image" src={avatarSrc} alt="profile" />

          <h3>{userDetails?.username || "Loading..."}</h3>

          {userDetails?.bio && !editing && (
            <p className="profile-bio">{userDetails.bio}</p>
          )}

          {isOwnProfile && (
            <button
              className="follow-btn"
              onClick={() => {
                setSaveError("");
                setEditing((v) => !v);
              }}
            >
              {editing ? "Cancel edit" : "Edit profile"}
            </button>
          )}

          {userDetails?._id && userDetails._id !== localStorage.getItem("userId") && (
            <button className="follow-btn" onClick={handleFollowToggle}>
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}

          <div className="follower">
            <button
              type="button"
              className="follow-count-btn"
              onClick={() => setShowFollowers(true)}
            >
              {followers.length} Followers
            </button>
            <button
              type="button"
              className="follow-count-btn"
              onClick={() => setShowFollowing(true)}
            >
              {following.length} Following
            </button>
          </div>

          {editing && (
            <div className="profile-edit">
              <label>Avatar URL</label>
              <input
                value={profileDraft.avatarUrl}
                onChange={(e) =>
                  setProfileDraft((d) => ({ ...d, avatarUrl: e.target.value }))
                }
                placeholder="https://..."
              />

              <label>Bio</label>
              <textarea
                rows={3}
                value={profileDraft.bio}
                onChange={(e) =>
                  setProfileDraft((d) => ({ ...d, bio: e.target.value }))
                }
                placeholder="Tell people about yourself"
              />

              <label>Company</label>
              <input
                value={profileDraft.company}
                onChange={(e) =>
                  setProfileDraft((d) => ({ ...d, company: e.target.value }))
                }
                placeholder="Company"
              />

              <label>Location</label>
              <input
                value={profileDraft.location}
                onChange={(e) =>
                  setProfileDraft((d) => ({ ...d, location: e.target.value }))
                }
                placeholder="Location"
              />

              <label>Website</label>
              <input
                value={profileDraft.website}
                onChange={(e) =>
                  setProfileDraft((d) => ({ ...d, website: e.target.value }))
                }
                placeholder="https://..."
              />

              <label>LeetCode</label>
              <input
                value={profileDraft.leetcode}
                onChange={(e) =>
                  setProfileDraft((d) => ({ ...d, leetcode: e.target.value }))
                }
                placeholder="https://leetcode.com/username"
              />

              <label>LinkedIn</label>
              <input
                value={profileDraft.linkedin}
                onChange={(e) =>
                  setProfileDraft((d) => ({ ...d, linkedin: e.target.value }))
                }
                placeholder="https://linkedin.com/in/..."
              />

              <label>Instagram</label>
              <input
                value={profileDraft.instagram}
                onChange={(e) =>
                  setProfileDraft((d) => ({ ...d, instagram: e.target.value }))
                }
                placeholder="https://instagram.com/..."
              />

              {saveError && <div className="form-error">{saveError}</div>}
              <button className="create-btn" type="button" disabled={saveLoading} onClick={saveProfile}>
                {saveLoading ? "Saving…" : "Save"}
              </button>
            </div>
          )}

          {!editing && (
            <div className="profile-links">
              {userDetails?.company && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8b949e", marginBottom: "4px" }}>
                  <OrganizationIcon size={16} /> {userDetails.company}
                </div>
              )}
              {userDetails?.location && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8b949e", marginBottom: "4px" }}>
                  <LocationIcon size={16} /> {userDetails.location}
                </div>
              )}
              {userDetails?.website && (
                <a href={userDetails.website.startsWith('http') ? userDetails.website : `https://${userDetails.website}`} target="_blank" rel="noreferrer">
                  🌐 Website
                </a>
              )}
              {userDetails?.leetcode && (
                <a href={userDetails.leetcode} target="_blank" rel="noreferrer">
                  🧩 LeetCode
                </a>
              )}
              {userDetails?.linkedin && (
                <a href={userDetails.linkedin} target="_blank" rel="noreferrer">
                  💼 LinkedIn
                </a>
              )}
              {userDetails?.instagram && (
                <a href={userDetails.instagram} target="_blank" rel="noreferrer">
                  📸 Instagram
                </a>
              )}
            </div>
          )}

        </div>

        {/* RIGHT CONTENT */}
        <div className="heat-map-section">
          <HeatMapProfile userId={userDetails?._id} />
          <div className="public-repos-block">
            <h4>Public repositories</h4>
            {publicRepos.length === 0 ? (
              <div className="public-repo-empty">No public repositories yet.</div>
            ) : (
              publicRepos.map((repo) => (
                <div
                  key={repo._id}
                  className="public-repo-card"
                  onClick={() => navigate(`/repo/${repo._id}`)}
                >
                  <div className="public-repo-title">{repo.name}</div>
                  <div className="public-repo-desc">
                    {repo.description || "No description"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {(showFollowers || showFollowing) && (
        <div className="follow-modal-overlay">
          <div className="follow-modal">
            <div className="follow-modal-header">
              <h4>{showFollowers ? "Followers" : "Following"}</h4>
              <button
                type="button"
                onClick={() => {
                  setShowFollowers(false);
                  setShowFollowing(false);
                }}
              >
                ✕
              </button>
            </div>
            <div className="follow-modal-body">
              {(showFollowers ? followers : following).length === 0 ? (
                <p>No users yet</p>
              ) : (
                (showFollowers ? followers : following).map((u) => (
                  <div
                    key={u._id}
                    className="follow-user-row"
                    onClick={() => {
                      setShowFollowers(false);
                      setShowFollowing(false);
                      navigate(`/user/${u._id}`);
                    }}
                  >
                    <div className="follow-avatar" />
                    <div className="follow-user-text">
                      <div className="follow-username">{u.username}</div>
                      <div className="follow-email">{u.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;