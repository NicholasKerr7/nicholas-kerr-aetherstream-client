import "./CreatorPage.scss";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL, getAuthHeaders } from "../../components/utilities/Utilities";
import { useAuth } from "../../context/AuthContext";

const formatCompactNumber = (value) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(
    Math.max(0, Number(value) || 0)
  );

const formatPublishedDate = (timestamp) => {
  const numericTimestamp = Number(timestamp);

  if (!numericTimestamp) {
    return "";
  }

  return new Date(numericTimestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function CreatorPage() {
  const { creatorId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [isLoadingCreator, setIsLoadingCreator] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [creatorError, setCreatorError] = useState("");

  const loadCreatorProfile = useCallback(async () => {
    if (!creatorId) {
      setCreatorError("Creator profile is unavailable.");
      return;
    }

    setIsLoadingCreator(true);
    setCreatorError("");

    try {
      const response = await axios.get(`${API_URL}creators/${creatorId}`, {
        headers: getAuthHeaders(token),
      });

      setCreatorProfile(response.data);
    } catch (error) {
      console.log(error);
      setCreatorError(
        error.response?.status === 404
          ? "This creator profile does not exist."
          : "Failed to load creator profile."
      );
    } finally {
      setIsLoadingCreator(false);
    }
  }, [creatorId, token]);

  useEffect(() => {
    loadCreatorProfile();
  }, [loadCreatorProfile]);

  const isOwnCreator = Boolean(user?.id && creatorProfile?.id === user.id);
  const followButtonLabel = creatorProfile?.isFollowedByCurrentUser
    ? "Following"
    : "Follow";
  const totalViews = useMemo(
    () => formatCompactNumber(creatorProfile?.totalViews || 0),
    [creatorProfile]
  );
  const totalLikes = useMemo(
    () => formatCompactNumber(creatorProfile?.totalLikes || 0),
    [creatorProfile]
  );

  const handleFollowToggle = async () => {
    if (!creatorProfile) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    setIsUpdatingFollow(true);

    try {
      const response = await axios.put(
        `${API_URL}creators/${creatorProfile.id}/follow`,
        {
          following: !creatorProfile.isFollowedByCurrentUser,
        },
        {
          headers: getAuthHeaders(token),
        }
      );

      setCreatorProfile((previousProfile) => {
        if (!previousProfile) {
          return previousProfile;
        }

        return {
          ...previousProfile,
          isFollowedByCurrentUser: Boolean(response.data.following),
          followersCount: Number(response.data.followersCount) || 0,
        };
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  if (isLoadingCreator) {
    return (
      <section className="creator-page creator-page--loading">
        <p className="creator-page__status">Loading creator profile...</p>
      </section>
    );
  }

  if (creatorError) {
    return (
      <section className="creator-page creator-page--loading">
        <p className="creator-page__status">{creatorError}</p>
      </section>
    );
  }

  if (!creatorProfile) {
    return null;
  }

  return (
    <section className="creator-page">
      <div className="creator-page__hero">
        <div className="creator-page__identity">
          {creatorProfile.avatarUrl ? (
            <img
              className="creator-page__avatar"
              src={creatorProfile.avatarUrl}
              alt={`${creatorProfile.name} avatar`}
            />
          ) : (
            <span className="creator-page__avatar creator-page__avatar--fallback">
              {(creatorProfile.name || "Creator").slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <p className="creator-page__eyebrow">Creator Profile</p>
            <h1 className="creator-page__title">{creatorProfile.name}</h1>
            <p className="creator-page__meta">
              {creatorProfile.videoCount} videos •{" "}
              {formatCompactNumber(creatorProfile.followersCount)} followers
            </p>
          </div>
        </div>
        {!isOwnCreator && (
          <button
            className={`creator-page__follow ${creatorProfile.isFollowedByCurrentUser ? "creator-page__follow--active" : ""}`}
            type="button"
            disabled={isUpdatingFollow}
            onClick={handleFollowToggle}
          >
            {isUpdatingFollow ? "Updating..." : followButtonLabel}
          </button>
        )}
      </div>

      <div className="creator-page__stats">
        <article className="creator-page__stat">
          <p className="creator-page__stat-label">Total Views</p>
          <p className="creator-page__stat-value">{totalViews}</p>
        </article>
        <article className="creator-page__stat">
          <p className="creator-page__stat-label">Total Likes</p>
          <p className="creator-page__stat-value">{totalLikes}</p>
        </article>
        <article className="creator-page__stat">
          <p className="creator-page__stat-label">Followers</p>
          <p className="creator-page__stat-value">
            {formatCompactNumber(creatorProfile.followersCount)}
          </p>
        </article>
      </div>

      <div className="creator-page__videos">
        <div className="creator-page__videos-header">
          <h2 className="creator-page__videos-title">Recent Uploads</h2>
          <p className="creator-page__videos-hint">
            {creatorProfile.videos.length} published videos
          </p>
        </div>
        {!creatorProfile.videos.length && (
          <p className="creator-page__status">No published videos yet.</p>
        )}
        {!!creatorProfile.videos.length && (
          <div className="creator-page__video-grid">
            {creatorProfile.videos.map((video) => (
              <article className="creator-page__video-card" key={video.id}>
                <Link to={`/videos/${video.id}`} className="creator-page__video-thumb-link">
                  <img
                    className="creator-page__video-thumb"
                    src={video.image}
                    alt={video.title}
                  />
                </Link>
                <div className="creator-page__video-content">
                  <Link to={`/videos/${video.id}`} className="creator-page__video-title">
                    {video.title}
                  </Link>
                  <p className="creator-page__video-description">{video.description}</p>
                  <p className="creator-page__video-meta">
                    {video.duration || "0:00"}
                    {video.views && ` • ${video.views} views`}
                    {formatPublishedDate(video.timestamp) &&
                      ` • ${formatPublishedDate(video.timestamp)}`}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default CreatorPage;
