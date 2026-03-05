import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./Header.scss";
import searchIcon from "../../assets/Icons/search.svg";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  API_URL,
  getAuthHeaders,
  getAvatarUrl,
  getInitials,
} from "../utilities/Utilities";

const NOTIFICATIONS_POLL_INTERVAL_MS = 30000;

const NotificationIcon = () => (
  <svg
    className="header__notifications-icon"
    viewBox="0 0 20 20"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M10 3.2a4.2 4.2 0 0 0-4.2 4.2v2.6c0 .9-.3 1.8-.8 2.5L4 14h12l-.9-1.5a4.3 4.3 0 0 1-.8-2.5V7.4A4.2 4.2 0 0 0 10 3.2zM8.2 15a1.8 1.8 0 0 0 3.6 0" />
  </svg>
);

const formatNotificationTime = (timestamp) => {
  const numericTimestamp = Number(timestamp);

  if (!numericTimestamp) {
    return "";
  }

  return new Date(numericTimestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function Header({ searchQuery, onSearchChange }) {
  const { isAuthenticated, user, token, logout } = useAuth();
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const notificationsRef = useRef(null);
  const avatarUrl = getAvatarUrl(user);
  const initials = useMemo(() => getInitials(user?.name || ""), [user]);

  useEffect(() => {
    setAvatarBroken(false);
  }, [avatarUrl]);

  const loadNotifications = useCallback(
    async ({ silent = false } = {}) => {
      if (!isAuthenticated || !token) {
        setNotifications([]);
        setUnreadCount(0);
        setIsLoadingNotifications(false);
        setNotificationsError("");
        return;
      }

      if (!silent) {
        setIsLoadingNotifications(true);
      }
      setNotificationsError("");

      try {
        const response = await axios.get(`${API_URL}notifications`, {
          headers: getAuthHeaders(token),
        });
        const responseNotifications = Array.isArray(response.data?.notifications)
          ? response.data.notifications
          : [];

        setNotifications(responseNotifications);
        setUnreadCount(Math.max(0, Number(response.data?.unreadCount) || 0));
      } catch (error) {
        console.log(error);
        setNotificationsError("Notifications are temporarily unavailable.");
      } finally {
        if (!silent) {
          setIsLoadingNotifications(false);
        }
      }
    },
    [isAuthenticated, token]
  );

  const markNotificationAsRead = useCallback(
    async (notificationId) => {
      if (!notificationId || !isAuthenticated || !token) {
        return;
      }

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
      }
    },
    [isAuthenticated, token]
  );

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!isAuthenticated || !token || !unreadCount) {
      return;
    }

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
      setNotificationsError("Could not update notification status.");
    }
  }, [isAuthenticated, token, unreadCount]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return undefined;
    }

    const interval = setInterval(() => {
      loadNotifications({ silent: true });
    }, NOTIFICATIONS_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, loadNotifications, token]);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    setIsNotificationsOpen(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return undefined;
    }

    const handleDocumentClick = (event) => {
      if (!notificationsRef.current?.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [isNotificationsOpen]);

  return (
    <header className="header">
      <Link to="/" className="header__brand">
        <span className="header__brand-mark">A</span>
        <div>
          <p className="header__brand-name">AetherStream</p>
          <p className="header__brand-tag">Immersive Video Intelligence</p>
        </div>
      </Link>
      <div className="header__controls">
        <label className="header__search" htmlFor="video-search">
          <img className="header__search-icon" src={searchIcon} alt="" />
          <input
            id="video-search"
            className="header__search-bar"
            type="search"
            name="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search titles, creators, descriptions, or tags"
          />
        </label>

        <Link to="/studio/upload" className="header__studio-btn">
          Launch Studio
        </Link>

        {isAuthenticated ? (
          <div className="header__auth-controls">
            <div className="header__notifications" ref={notificationsRef}>
              <button
                className={`header__notifications-btn ${unreadCount ? "header__notifications-btn--active" : ""}`}
                type="button"
                aria-label="Open notifications"
                onClick={() => setIsNotificationsOpen((previousOpen) => !previousOpen)}
              >
                <NotificationIcon />
                {unreadCount > 0 && (
                  <span className="header__notifications-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {isNotificationsOpen && (
                <section className="header__notifications-menu">
                  <div className="header__notifications-menu-head">
                    <h2 className="header__notifications-title">Notifications</h2>
                    {!!unreadCount && (
                      <button
                        className="header__notifications-mark-read"
                        type="button"
                        onClick={markAllNotificationsAsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notificationsError && (
                    <p className="header__notifications-status">{notificationsError}</p>
                  )}
                  {!notificationsError && isLoadingNotifications && (
                    <p className="header__notifications-status">
                      Loading notifications...
                    </p>
                  )}
                  {!notificationsError && !isLoadingNotifications && !notifications.length && (
                    <p className="header__notifications-status">
                      You are all caught up.
                    </p>
                  )}
                  {!notificationsError &&
                    !isLoadingNotifications &&
                    !!notifications.length && (
                      <div className="header__notifications-list">
                        {notifications.map((notification) => (
                          <Link
                            key={notification.id}
                            className={`header__notification-item ${notification.isRead ? "" : "header__notification-item--unread"}`}
                            to={notification.videoId ? `/videos/${notification.videoId}` : "/"}
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              markNotificationAsRead(notification.id);
                            }}
                          >
                            <p className="header__notification-message">
                              {notification.message || "New activity on your content."}
                            </p>
                            <p className="header__notification-time">
                              {formatNotificationTime(notification.createdAt)}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}
                </section>
              )}
            </div>
            <Link to="/profile" className="header__profile-pill">
              {avatarUrl && !avatarBroken ? (
                <img
                  className="header__pro-img"
                  src={avatarUrl}
                  alt={`${user.name} avatar`}
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                <span className="header__pro-fallback">{initials}</span>
              )}
              <span className="header__profile-name">{user.name}</span>
            </Link>
            <button className="header__logout-btn" type="button" onClick={logout}>
              Log Out
            </button>
          </div>
        ) : (
          <Link to="/auth" className="header__auth-btn">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
