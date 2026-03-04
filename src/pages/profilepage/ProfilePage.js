import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import {
  API_URL,
  getAuthHeaders,
  getAvatarUrl,
  getInitials,
} from "../../components/utilities/Utilities";
import "./ProfilePage.scss";

const formatSecondsAsTimestamp = (rawSeconds = 0) => {
  const totalSeconds = Math.max(0, Math.round(Number(rawSeconds) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const formatLastWatched = (updatedAt) => {
  const timestamp = Number(updatedAt);

  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function ProfilePage() {
  const { user, token, isAuthenticated, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [watchHistory, setWatchHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name || "");
    setAvatarUrl(user.avatarUrl || "");
  }, [user]);

  const avatarFallback = useMemo(() => getInitials(name || user?.name || ""), [
    name,
    user,
  ]);

  useEffect(() => {
    const loadWatchHistory = async () => {
      if (!isAuthenticated || !token) {
        setIsLoadingHistory(false);
        setWatchHistory([]);
        setHistoryError("");
        return;
      }

      setIsLoadingHistory(true);
      setHistoryError("");

      try {
        const response = await axios.get(`${API_URL}videos/history`, {
          headers: getAuthHeaders(token),
        });

        setWatchHistory(Array.isArray(response.data?.history) ? response.data.history : []);
      } catch (error) {
        console.log(error);
        setHistoryError("Watch history is temporarily unavailable.");
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadWatchHistory();
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return <Navigate replace to="/auth" />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    setIsSaving(true);

    try {
      await updateProfile({ name, avatarUrl });
      setStatusMessage("Profile updated.");
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="profile-page">
      <div className="profile-page__card">
        <p className="profile-page__eyebrow">Creator Identity</p>
        <h1 className="profile-page__title">Your Profile</h1>

        <div className="profile-page__avatar-block">
          {getAvatarUrl({ avatarUrl }) ? (
            <img
              className="profile-page__avatar-image"
              src={getAvatarUrl({ avatarUrl })}
              alt={`${name || user.name} avatar`}
            />
          ) : (
            <span className="profile-page__avatar-fallback">{avatarFallback}</span>
          )}
        </div>

        <form className="profile-page__form" onSubmit={handleSubmit}>
          <label className="profile-page__label" htmlFor="profile-name">
            Display Name
          </label>
          <input
            id="profile-name"
            className="profile-page__input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label className="profile-page__label" htmlFor="profile-avatar-url">
            Avatar URL
          </label>
          <input
            id="profile-avatar-url"
            className="profile-page__input"
            type="url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://..."
          />

          <button className="profile-page__save" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        {statusMessage && <p className="profile-page__status">{statusMessage}</p>}
      </div>

      <div className="profile-page__card profile-page__card--history">
        <p className="profile-page__eyebrow">Viewing Timeline</p>
        <h2 className="profile-page__title profile-page__title--history">
          Watch History
        </h2>
        {historyError && <p className="profile-page__status">{historyError}</p>}
        {!historyError && isLoadingHistory && (
          <p className="profile-page__status">Loading watch history...</p>
        )}
        {!historyError && !isLoadingHistory && !watchHistory.length && (
          <p className="profile-page__status">
            Watch a few videos to build your timeline.
          </p>
        )}
        {!historyError && !isLoadingHistory && !!watchHistory.length && (
          <div className="profile-page__history-list">
            {watchHistory.map((historyEntry) => (
              <Link
                key={historyEntry.videoId}
                className="profile-page__history-item"
                to={`/videos/${historyEntry.videoId}`}
              >
                <img
                  className="profile-page__history-thumb"
                  src={historyEntry.video?.image}
                  alt={historyEntry.video?.title}
                />
                <div className="profile-page__history-content">
                  <h3 className="profile-page__history-title">
                    {historyEntry.video?.title}
                  </h3>
                  <p className="profile-page__history-channel">
                    {historyEntry.video?.channel}
                  </p>
                  <p className="profile-page__history-meta">
                    {historyEntry.completed
                      ? "Completed"
                      : `${formatSecondsAsTimestamp(historyEntry.progressSeconds)} / ${formatSecondsAsTimestamp(historyEntry.durationSeconds)}`}
                  </p>
                  <p className="profile-page__history-meta">
                    Last watched {formatLastWatched(historyEntry.updatedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProfilePage;
