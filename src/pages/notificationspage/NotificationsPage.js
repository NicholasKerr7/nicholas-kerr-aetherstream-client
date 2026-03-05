import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { API_URL, getAuthHeaders } from "../../components/utilities/Utilities";
import "./NotificationsPage.scss";

const NOTIFICATION_PREFERENCE_KEYS = ["likes", "comments", "follows"];

const PREFERENCE_LABELS = {
  likes: "Likes",
  comments: "Comments",
  follows: "Follows",
};

const formatNotificationTime = (timestamp) => {
  const numericTimestamp = Number(timestamp);

  if (!numericTimestamp) {
    return "";
  }

  return new Date(numericTimestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getNotificationTargetPath = (notification = {}) => {
  if (notification.videoId) {
    return `/videos/${notification.videoId}`;
  }

  if (notification.creatorId) {
    return `/creators/${notification.creatorId}`;
  }

  return "/notifications";
};

const normalizePreferences = (rawPreferences = {}) => ({
  likes: rawPreferences.likes !== false,
  comments: rawPreferences.comments !== false,
  follows: rawPreferences.follows !== false,
});

function NotificationsPage() {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(normalizePreferences());
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [updatingNotificationIds, setUpdatingNotificationIds] = useState([]);
  const [notificationError, setNotificationError] = useState("");
  const hasEnabledPreferences = useMemo(
    () => NOTIFICATION_PREFERENCE_KEYS.some((preferenceKey) => preferences[preferenceKey]),
    [preferences]
  );

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setIsLoadingNotifications(false);
      setNotifications([]);
      setUnreadCount(0);
      setNotificationError("");
      return;
    }

    setIsLoadingNotifications(true);
    setNotificationError("");

    try {
      const response = await axios.get(`${API_URL}notifications`, {
        headers: getAuthHeaders(token),
      });
      const responseNotifications = Array.isArray(response.data?.notifications)
        ? response.data.notifications
        : [];
      const responsePreferences = normalizePreferences(response.data?.preferences || {});

      setNotifications(responseNotifications);
      setUnreadCount(Math.max(0, Number(response.data?.unreadCount) || 0));
      setPreferences(responsePreferences);
    } catch (error) {
      console.log(error);
      setNotificationError("Notifications are temporarily unavailable.");
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  if (!isAuthenticated) {
    return <Navigate replace to="/auth" />;
  }

  const updatePreference = async (preferenceKey, nextPreferenceValue) => {
    if (
      !NOTIFICATION_PREFERENCE_KEYS.includes(preferenceKey) ||
      !isAuthenticated ||
      !token ||
      isSavingPreferences
    ) {
      return;
    }

    const previousPreferences = preferences;
    const nextPreferences = {
      ...previousPreferences,
      [preferenceKey]: nextPreferenceValue,
    };

    setPreferences(nextPreferences);
    setIsSavingPreferences(true);
    setNotificationError("");

    try {
      const response = await axios.put(
        `${API_URL}notifications/preferences`,
        nextPreferences,
        {
          headers: getAuthHeaders(token),
        }
      );
      const persistedPreferences = normalizePreferences(response.data?.preferences || {});

      setPreferences(persistedPreferences);
      await loadNotifications();
    } catch (error) {
      console.log(error);
      setPreferences(previousPreferences);
      setNotificationError("Could not update notification preferences.");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    if (
      !notificationId ||
      !isAuthenticated ||
      !token ||
      updatingNotificationIds.includes(notificationId)
    ) {
      return;
    }

    setUpdatingNotificationIds((previousIds) => [...previousIds, notificationId]);

    try {
      const response = await axios.patch(
        `${API_URL}notifications/${notificationId}/read`,
        {},
        {
          headers: getAuthHeaders(token),
        }
      );

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                isRead: true,
                readAt: Number(response.data?.readAt) || Date.now(),
              }
            : notification
        )
      );
      setUnreadCount(Math.max(0, Number(response.data?.unreadCount) || 0));
    } catch (error) {
      console.log(error);
    } finally {
      setUpdatingNotificationIds((previousIds) =>
        previousIds.filter((existingId) => existingId !== notificationId)
      );
    }
  };

  const markAllAsRead = async () => {
    if (!isAuthenticated || !token || !unreadCount || isMarkingAllRead) {
      return;
    }

    setIsMarkingAllRead(true);
    setNotificationError("");

    try {
      await axios.put(
        `${API_URL}notifications/read-all`,
        {},
        {
          headers: getAuthHeaders(token),
        }
      );

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || Date.now(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.log(error);
      setNotificationError("Could not mark notifications as read.");
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  return (
    <section className="notifications-page">
      <article className="notifications-page__panel">
        <div className="notifications-page__head">
          <div>
            <p className="notifications-page__eyebrow">Notification Center</p>
            <h1 className="notifications-page__title">Your Updates</h1>
            <p className="notifications-page__subtitle">
              {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
            </p>
          </div>
          <button
            className="notifications-page__mark-all"
            type="button"
            disabled={!unreadCount || isMarkingAllRead}
            onClick={markAllAsRead}
          >
            {isMarkingAllRead ? "Updating..." : "Mark all read"}
          </button>
        </div>

        <div className="notifications-page__preferences">
          <h2 className="notifications-page__preferences-title">Preferences</h2>
          <p className="notifications-page__preferences-copy">
            Control which events create new notifications.
          </p>
          <div className="notifications-page__preferences-grid">
            {NOTIFICATION_PREFERENCE_KEYS.map((preferenceKey) => (
              <label
                key={preferenceKey}
                className={`notifications-page__toggle ${preferences[preferenceKey] ? "notifications-page__toggle--active" : ""}`}
              >
                <span>{PREFERENCE_LABELS[preferenceKey]}</span>
                <input
                  type="checkbox"
                  checked={Boolean(preferences[preferenceKey])}
                  onChange={(event) =>
                    updatePreference(preferenceKey, event.target.checked)
                  }
                  disabled={isSavingPreferences}
                />
              </label>
            ))}
          </div>
        </div>

        {notificationError && <p className="notifications-page__status">{notificationError}</p>}
        {!notificationError && isLoadingNotifications && (
          <p className="notifications-page__status">Loading notifications...</p>
        )}
        {!notificationError &&
          !isLoadingNotifications &&
          !hasEnabledPreferences && (
            <p className="notifications-page__status">
              All notification types are muted.
            </p>
          )}
        {!notificationError &&
          !isLoadingNotifications &&
          hasEnabledPreferences &&
          !notifications.length && (
            <p className="notifications-page__status">You are all caught up.</p>
          )}
        {!notificationError &&
          !isLoadingNotifications &&
          !!notifications.length && (
            <div className="notifications-page__list">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  className={`notifications-page__item ${notification.isRead ? "" : "notifications-page__item--unread"}`}
                  to={getNotificationTargetPath(notification)}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <p className="notifications-page__item-message">
                    {notification.message || "New activity on your content."}
                  </p>
                  <p className="notifications-page__item-time">
                    {formatNotificationTime(notification.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
      </article>
    </section>
  );
}

export default NotificationsPage;
