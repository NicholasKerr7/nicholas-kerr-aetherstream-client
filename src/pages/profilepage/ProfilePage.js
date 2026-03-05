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

const ANALYTICS_WINDOWS = [7, 30, 90];

const formatCompactNumber = (value) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(
    Math.max(0, Number(value) || 0)
  );

const formatPercent = (value) => `${Math.max(0, Math.round(Number(value) || 0))}%`;

function ProfilePage() {
  const { user, token, isAuthenticated, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [watchHistory, setWatchHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedAnalyticsWindowDays, setSelectedAnalyticsWindowDays] = useState(30);
  const [creatorAnalytics, setCreatorAnalytics] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

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

  useEffect(() => {
    const loadCreatorAnalytics = async () => {
      if (!isAuthenticated || !token) {
        setIsLoadingAnalytics(false);
        setCreatorAnalytics(null);
        setAnalyticsError("");
        return;
      }

      setIsLoadingAnalytics(true);
      setAnalyticsError("");

      try {
        const response = await axios.get(
          `${API_URL}creators/me/analytics?windowDays=${selectedAnalyticsWindowDays}`,
          {
            headers: getAuthHeaders(token),
          }
        );

        setCreatorAnalytics(response.data || null);
      } catch (error) {
        console.log(error);
        setAnalyticsError("Creator analytics are temporarily unavailable.");
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    loadCreatorAnalytics();
  }, [isAuthenticated, selectedAnalyticsWindowDays, token]);

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

  const analyticsOverview = creatorAnalytics?.overview || null;
  const analyticsWindow = creatorAnalytics?.window || null;
  const analyticsTopVideos = Array.isArray(creatorAnalytics?.topVideos)
    ? creatorAnalytics.topVideos
    : [];

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

      <div className="profile-page__card profile-page__card--analytics">
        <div className="profile-page__analytics-head">
          <div>
            <p className="profile-page__eyebrow">Creator Studio</p>
            <h2 className="profile-page__title profile-page__title--history">
              Analytics
            </h2>
          </div>
          <div className="profile-page__analytics-window">
            {ANALYTICS_WINDOWS.map((windowDays) => (
              <button
                key={windowDays}
                className={`profile-page__analytics-window-btn ${selectedAnalyticsWindowDays === windowDays ? "profile-page__analytics-window-btn--active" : ""}`}
                type="button"
                onClick={() => setSelectedAnalyticsWindowDays(windowDays)}
              >
                {windowDays}d
              </button>
            ))}
          </div>
        </div>
        {analyticsError && <p className="profile-page__status">{analyticsError}</p>}
        {!analyticsError && isLoadingAnalytics && (
          <p className="profile-page__status">Loading creator analytics...</p>
        )}
        {!analyticsError && !isLoadingAnalytics && !analyticsOverview && (
          <p className="profile-page__status">
            Publish videos to unlock your studio analytics.
          </p>
        )}
        {!analyticsError && !isLoadingAnalytics && analyticsOverview && (
          <>
            <div className="profile-page__analytics-grid">
              <article className="profile-page__analytics-stat">
                <p className="profile-page__analytics-stat-label">Total Videos</p>
                <p className="profile-page__analytics-stat-value">
                  {formatCompactNumber(analyticsOverview.totalVideos)}
                </p>
              </article>
              <article className="profile-page__analytics-stat">
                <p className="profile-page__analytics-stat-label">Total Views</p>
                <p className="profile-page__analytics-stat-value">
                  {formatCompactNumber(analyticsOverview.totalViews)}
                </p>
              </article>
              <article className="profile-page__analytics-stat">
                <p className="profile-page__analytics-stat-label">Total Likes</p>
                <p className="profile-page__analytics-stat-value">
                  {formatCompactNumber(analyticsOverview.totalLikes)}
                </p>
              </article>
              <article className="profile-page__analytics-stat">
                <p className="profile-page__analytics-stat-label">Total Comments</p>
                <p className="profile-page__analytics-stat-value">
                  {formatCompactNumber(analyticsOverview.totalComments)}
                </p>
              </article>
              <article className="profile-page__analytics-stat">
                <p className="profile-page__analytics-stat-label">Followers</p>
                <p className="profile-page__analytics-stat-value">
                  {formatCompactNumber(analyticsOverview.totalFollowers)}
                </p>
              </article>
              <article className="profile-page__analytics-stat">
                <p className="profile-page__analytics-stat-label">Watch Hours</p>
                <p className="profile-page__analytics-stat-value">
                  {analyticsOverview.watchHours || 0}h
                </p>
              </article>
              <article className="profile-page__analytics-stat">
                <p className="profile-page__analytics-stat-label">Avg Completion</p>
                <p className="profile-page__analytics-stat-value">
                  {formatPercent(analyticsOverview.averageCompletionRatePercent)}
                </p>
              </article>
              <article className="profile-page__analytics-stat">
                <p className="profile-page__analytics-stat-label">Avg Watch Time</p>
                <p className="profile-page__analytics-stat-value">
                  {formatSecondsAsTimestamp(analyticsOverview.averageWatchTimeSeconds)}
                </p>
              </article>
            </div>

            <div className="profile-page__analytics-window-summary">
              <h3 className="profile-page__analytics-window-title">
                Last {analyticsWindow?.days || selectedAnalyticsWindowDays} Days
              </h3>
              <div className="profile-page__analytics-window-grid">
                <p className="profile-page__analytics-window-item">
                  <span>New uploads</span>
                  <strong>{analyticsWindow?.uploadedVideos || 0}</strong>
                </p>
                <p className="profile-page__analytics-window-item">
                  <span>New comments</span>
                  <strong>{formatCompactNumber(analyticsWindow?.comments || 0)}</strong>
                </p>
                <p className="profile-page__analytics-window-item">
                  <span>Comment likes</span>
                  <strong>{formatCompactNumber(analyticsWindow?.commentLikes || 0)}</strong>
                </p>
                <p className="profile-page__analytics-window-item">
                  <span>New followers</span>
                  <strong>{analyticsWindow?.newFollowers || 0}</strong>
                </p>
                <p className="profile-page__analytics-window-item">
                  <span>Watch sessions</span>
                  <strong>{formatCompactNumber(analyticsWindow?.watchSessions || 0)}</strong>
                </p>
                <p className="profile-page__analytics-window-item">
                  <span>Watch hours</span>
                  <strong>{analyticsWindow?.watchHours || 0}h</strong>
                </p>
              </div>
            </div>

            <div className="profile-page__analytics-videos">
              <div className="profile-page__analytics-videos-head">
                <h3 className="profile-page__analytics-window-title">Top Videos</h3>
                <p className="profile-page__history-meta">
                  Ranked by engagement, then views
                </p>
              </div>
              {!analyticsTopVideos.length && (
                <p className="profile-page__status">No creator videos yet.</p>
              )}
              {!!analyticsTopVideos.length && (
                <div className="profile-page__history-list">
                  {analyticsTopVideos.map((video) => (
                    <Link
                      key={video.id}
                      className="profile-page__history-item"
                      to={`/videos/${video.id}`}
                    >
                      <img
                        className="profile-page__history-thumb"
                        src={video.image}
                        alt={video.title}
                      />
                      <div className="profile-page__history-content">
                        <h3 className="profile-page__history-title">{video.title}</h3>
                        <p className="profile-page__history-meta">
                          {formatCompactNumber(video.views)} views •{" "}
                          {formatCompactNumber(video.likes)} likes •{" "}
                          {formatCompactNumber(video.comments)} comments
                        </p>
                        <p className="profile-page__history-meta">
                          {formatPercent(video.completionRatePercent)} completion •{" "}
                          {video.watchHours || 0}h watch time •{" "}
                          {formatCompactNumber(video.uniqueViewers)} unique viewers
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
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
