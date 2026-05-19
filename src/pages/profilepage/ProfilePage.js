import { useCallback, useEffect, useMemo, useState } from "react";
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

const ANALYTICS_WINDOWS = [7, 30, 90];
const CATEGORY_OPTIONS = [
  "General",
  "Adventure",
  "Action Sports",
  "Wellness",
  "Technology",
  "Lifestyle",
];
const MANAGED_VIDEO_FORM_DEFAULTS = {
  title: "",
  description: "",
  category: "General",
  tags: "",
};

const formatCompactNumber = (value) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(
    Math.max(0, Number(value) || 0)
  );

const formatPercent = (value) => `${Math.max(0, Math.round(Number(value) || 0))}%`;

const getRequestErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message || fallbackMessage;

const buildManagedVideoFormValues = (video = {}) => ({
  title: video.title || "",
  description: video.description || "",
  category: video.category || "General",
  tags: Array.isArray(video.tags) ? video.tags.join(", ") : "",
});

function ProfilePage() {
  const { user, token, isAuthenticated, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [watchHistory, setWatchHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [savedVideos, setSavedVideos] = useState([]);
  const [isLoadingSavedVideos, setIsLoadingSavedVideos] = useState(false);
  const [savedVideosError, setSavedVideosError] = useState("");
  const [creatorVideos, setCreatorVideos] = useState([]);
  const [isLoadingCreatorVideos, setIsLoadingCreatorVideos] = useState(false);
  const [creatorVideosError, setCreatorVideosError] = useState("");
  const [editingVideoId, setEditingVideoId] = useState("");
  const [editingVideoFields, setEditingVideoFields] = useState(
    MANAGED_VIDEO_FORM_DEFAULTS
  );
  const [isSavingManagedVideo, setIsSavingManagedVideo] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState("");
  const [managementFeedback, setManagementFeedback] = useState("");
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
    const loadSavedVideos = async () => {
      if (!isAuthenticated || !token) {
        setIsLoadingSavedVideos(false);
        setSavedVideos([]);
        setSavedVideosError("");
        return;
      }

      setIsLoadingSavedVideos(true);
      setSavedVideosError("");

      try {
        const response = await axios.get(`${API_URL}videos/saved`, {
          headers: getAuthHeaders(token),
        });

        setSavedVideos(
          Array.isArray(response.data?.videos) ? response.data.videos : []
        );
      } catch (error) {
        console.log(error);
        setSavedVideosError("Saved videos are temporarily unavailable.");
      } finally {
        setIsLoadingSavedVideos(false);
      }
    };

    loadSavedVideos();
  }, [isAuthenticated, token]);

  const loadCreatorVideos = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setIsLoadingCreatorVideos(false);
      setCreatorVideos([]);
      setCreatorVideosError("");
      return;
    }

    setIsLoadingCreatorVideos(true);
    setCreatorVideosError("");

    try {
      const response = await axios.get(`${API_URL}videos/mine`, {
        headers: getAuthHeaders(token),
      });

      setCreatorVideos(
        Array.isArray(response.data?.videos) ? response.data.videos : []
      );
    } catch (error) {
      console.log(error);
      setCreatorVideosError("Your video library is temporarily unavailable.");
    } finally {
      setIsLoadingCreatorVideos(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    loadCreatorVideos();
  }, [loadCreatorVideos]);

  const loadCreatorAnalytics = useCallback(async () => {
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
  }, [isAuthenticated, selectedAnalyticsWindowDays, token]);

  useEffect(() => {
    loadCreatorAnalytics();
  }, [loadCreatorAnalytics]);

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

  const handleStartEditingVideo = (video) => {
    setEditingVideoId(video.id);
    setEditingVideoFields(buildManagedVideoFormValues(video));
    setManagementFeedback("");
  };

  const handleCancelEditingVideo = () => {
    setEditingVideoId("");
    setEditingVideoFields(MANAGED_VIDEO_FORM_DEFAULTS);
  };

  const handleManagedVideoFieldChange = (field, value) => {
    setEditingVideoFields((previousFields) => ({
      ...previousFields,
      [field]: value,
    }));
  };

  const handleUpdateManagedVideo = async (event, videoId) => {
    event.preventDefault();

    const title = editingVideoFields.title.trim();
    const description = editingVideoFields.description.trim();
    const tags = editingVideoFields.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!title || !description) {
      setManagementFeedback("Title and description are required.");
      return;
    }

    setIsSavingManagedVideo(true);
    setManagementFeedback("");

    try {
      const response = await axios.patch(
        `${API_URL}videos/${videoId}`,
        {
          title,
          description,
          category: editingVideoFields.category,
          tags: tags.join(","),
        },
        {
          headers: getAuthHeaders(token),
        }
      );
      const updatedVideo = response.data;

      setCreatorVideos((previousVideos) =>
        previousVideos.map((video) =>
          video.id === videoId ? { ...video, ...updatedVideo } : video
        )
      );
      setEditingVideoId("");
      setEditingVideoFields(MANAGED_VIDEO_FORM_DEFAULTS);
      setManagementFeedback("Video details updated.");
      await loadCreatorAnalytics();
    } catch (error) {
      console.log(error);
      setManagementFeedback(
        getRequestErrorMessage(error, "Could not update this video.")
      );
    } finally {
      setIsSavingManagedVideo(false);
    }
  };

  const handleDeleteManagedVideo = async (video) => {
    const confirmed = window.confirm(
      `Delete "${video.title}"? This removes the video and its activity.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingVideoId(video.id);
    setManagementFeedback("");

    try {
      await axios.delete(`${API_URL}videos/${video.id}`, {
        headers: getAuthHeaders(token),
      });
      setCreatorVideos((previousVideos) =>
        previousVideos.filter((creatorVideo) => creatorVideo.id !== video.id)
      );
      setSavedVideos((previousVideos) =>
        previousVideos.filter((savedVideo) => savedVideo.id !== video.id)
      );

      if (editingVideoId === video.id) {
        handleCancelEditingVideo();
      }

      setManagementFeedback("Video deleted.");
      await loadCreatorAnalytics();
    } catch (error) {
      console.log(error);
      setManagementFeedback(
        getRequestErrorMessage(error, "Could not delete this video.")
      );
    } finally {
      setDeletingVideoId("");
    }
  };

  return (
    <section className="profile-page">
      <div className="profile-page__top-grid">
        <div className="profile-page__card profile-page__card--identity">
          <p className="profile-page__eyebrow">Creator Identity</p>
          <h1 className="profile-page__title">Your Profile</h1>
          <p className="profile-page__identity-meta">{user?.email}</p>

          <div className="profile-page__avatar-block">
            {getAvatarUrl({ avatarUrl }) ? (
              <img
                className="profile-page__avatar-image"
                src={getAvatarUrl({ avatarUrl })}
                alt={`${name || user?.name || "Creator"} avatar`}
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
                  <div className="profile-page__history-list profile-page__history-list--analytics">
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
      </div>

      <div className="profile-page__card profile-page__card--management">
        <div className="profile-page__section-head">
          <div>
            <p className="profile-page__eyebrow">Creator Studio</p>
            <h2 className="profile-page__title profile-page__title--history">
              Your Videos
            </h2>
          </div>
          <Link className="profile-page__section-action" to="/upload">
            Publish
          </Link>
        </div>
        {managementFeedback && (
          <p className="profile-page__status">{managementFeedback}</p>
        )}
        {creatorVideosError && (
          <p className="profile-page__status">{creatorVideosError}</p>
        )}
        {!creatorVideosError && isLoadingCreatorVideos && (
          <p className="profile-page__status">Loading your videos...</p>
        )}
        {!creatorVideosError && !isLoadingCreatorVideos && !creatorVideos.length && (
          <p className="profile-page__status">
            Publish a video to manage metadata and performance from here.
          </p>
        )}
        {!creatorVideosError && !isLoadingCreatorVideos && !!creatorVideos.length && (
          <div className="profile-page__management-list">
            {creatorVideos.map((video) => {
              const isEditing = editingVideoId === video.id;
              const isDeleting = deletingVideoId === video.id;

              return (
                <article className="profile-page__management-item" key={video.id}>
                  <img
                    className="profile-page__management-thumb"
                    src={video.image}
                    alt={video.title}
                  />
                  <div className="profile-page__management-content">
                    <div className="profile-page__management-summary">
                      <div>
                        <h3 className="profile-page__history-title">{video.title}</h3>
                        <p className="profile-page__history-meta">
                          {video.duration || "0:00"}
                          {formatPublishedDate(video.timestamp) &&
                            ` • ${formatPublishedDate(video.timestamp)}`}
                        </p>
                      </div>
                      <div className="profile-page__management-actions">
                        <Link
                          className="profile-page__management-btn"
                          to={`/videos/${video.id}`}
                        >
                          View
                        </Link>
                        <button
                          className="profile-page__management-btn"
                          type="button"
                          onClick={() => handleStartEditingVideo(video)}
                        >
                          Edit
                        </button>
                        <button
                          className="profile-page__management-btn profile-page__management-btn--danger"
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDeleteManagedVideo(video)}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                    <p className="profile-page__history-meta">
                      {video.category || "General"} • {video.views || "0"} views •{" "}
                      {video.likes || "0"} likes • {video.commentsCount || 0} comments
                    </p>
                    {!!video.tags?.length && (
                      <div className="profile-page__tag-list">
                        {video.tags.map((tag) => (
                          <span className="profile-page__tag" key={`${video.id}-${tag}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {isEditing && (
                      <form
                        className="profile-page__management-form"
                        onSubmit={(event) =>
                          handleUpdateManagedVideo(event, video.id)
                        }
                      >
                        <label className="profile-page__label" htmlFor={`title-${video.id}`}>
                          Title
                        </label>
                        <input
                          className="profile-page__input"
                          id={`title-${video.id}`}
                          value={editingVideoFields.title}
                          onChange={(event) =>
                            handleManagedVideoFieldChange("title", event.target.value)
                          }
                          required
                        />
                        <label
                          className="profile-page__label"
                          htmlFor={`description-${video.id}`}
                        >
                          Description
                        </label>
                        <textarea
                          className="profile-page__textarea"
                          id={`description-${video.id}`}
                          rows={4}
                          value={editingVideoFields.description}
                          onChange={(event) =>
                            handleManagedVideoFieldChange(
                              "description",
                              event.target.value
                            )
                          }
                          required
                        />
                        <div className="profile-page__management-form-grid">
                          <div>
                            <label
                              className="profile-page__label"
                              htmlFor={`category-${video.id}`}
                            >
                              Category
                            </label>
                            <select
                              className="profile-page__input"
                              id={`category-${video.id}`}
                              value={editingVideoFields.category}
                              onChange={(event) =>
                                handleManagedVideoFieldChange(
                                  "category",
                                  event.target.value
                                )
                              }
                            >
                              {CATEGORY_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label
                              className="profile-page__label"
                              htmlFor={`tags-${video.id}`}
                            >
                              Tags
                            </label>
                            <input
                              className="profile-page__input"
                              id={`tags-${video.id}`}
                              value={editingVideoFields.tags}
                              onChange={(event) =>
                                handleManagedVideoFieldChange(
                                  "tags",
                                  event.target.value
                                )
                              }
                              placeholder="travel, alps, mountain"
                            />
                          </div>
                        </div>
                        <div className="profile-page__management-form-actions">
                          <button
                            className="profile-page__management-btn profile-page__management-btn--primary"
                            type="submit"
                            disabled={isSavingManagedVideo}
                          >
                            {isSavingManagedVideo ? "Saving..." : "Save Changes"}
                          </button>
                          <button
                            className="profile-page__management-btn"
                            type="button"
                            onClick={handleCancelEditingVideo}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="profile-page__card profile-page__card--saved">
        <p className="profile-page__eyebrow">Library</p>
        <h2 className="profile-page__title profile-page__title--history">
          Saved Videos
        </h2>
        {savedVideosError && (
          <p className="profile-page__status">{savedVideosError}</p>
        )}
        {!savedVideosError && isLoadingSavedVideos && (
          <p className="profile-page__status">Loading saved videos...</p>
        )}
        {!savedVideosError && !isLoadingSavedVideos && !savedVideos.length && (
          <p className="profile-page__status">
            Save videos from the watch page to build your library.
          </p>
        )}
        {!savedVideosError && !isLoadingSavedVideos && !!savedVideos.length && (
          <div className="profile-page__history-list profile-page__history-list--saved">
            {savedVideos.map((video) => (
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
                  <p className="profile-page__history-channel">{video.channel}</p>
                  <p className="profile-page__history-meta">
                    {video.duration || "0:00"}
                    {formatPublishedDate(video.timestamp) &&
                      ` • ${formatPublishedDate(video.timestamp)}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
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
          <div className="profile-page__history-list profile-page__history-list--history">
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
