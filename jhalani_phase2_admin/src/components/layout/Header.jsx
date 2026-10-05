import { useEffect, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../api/notificationApi";

import "../../styles/layout.css";

export default function Header() {
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  /* ============================================================
     LOAD NOTIFICATIONS
     ============================================================ */

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);

      const [notificationsResponse, countResponse] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);

      setNotifications(
        notificationsResponse?.data?.notifications || []
      );

      setUnreadCount(
        Number(countResponse?.data?.count || 0)
      );
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );
    } finally {
      setLoadingNotifications(false);
    }
  };

  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  /* ============================================================
     LOGOUT
     ============================================================ */

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  /* ============================================================
     USER INITIAL
     ============================================================ */

  const getInitial = () => {
    if (!user?.name) {
      return "S";
    }

    return user.name
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  /* ============================================================
     ROLE NAME
     ============================================================ */

  const getRoleName = () => {
    if (!user?.role) {
      return "Administrator";
    }

    return user.role
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  /* ============================================================
     DATE
     ============================================================ */

  const today = new Date();

  const formattedDate = today.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  /* ============================================================
     MARK ONE AS READ
     ============================================================ */

  const handleMarkAsRead = async (notification) => {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);

        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  is_read: 1,
                  read_at: new Date().toISOString(),
                }
              : item
          )
        );

        setUnreadCount((prev) =>
          Math.max(0, prev - 1)
        );
      }
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    }
  };

  /* ============================================================
     MARK ALL AS READ
     ============================================================ */

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: 1,
          read_at:
            item.read_at ||
            new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error
      );
    }
  };

  /* ============================================================
     DELETE NOTIFICATION
     ============================================================ */

  const handleDeleteNotification = async (
    notification
  ) => {
    try {
      await deleteNotification(notification.id);

      setNotifications((prev) =>
        prev.filter(
          (item) => item.id !== notification.id
        )
      );

      if (!notification.is_read) {
        setUnreadCount((prev) =>
          Math.max(0, prev - 1)
        );
      }
    } catch (error) {
      console.error(
        "Failed to delete notification:",
        error
      );
    }
  };

  /* ============================================================
     TOGGLE NOTIFICATION PANEL
     ============================================================ */

  const handleNotificationToggle = () => {
    setShowNotifications((prev) => !prev);

    if (!showNotifications) {
      loadNotifications();
    }
  };

  return (
    <header className="admin-header">

      {/* ======================================================
          LEFT
          ====================================================== */}

      <div className="header-left">

        <div className="header-page-title">
          Jhalani Enterprises
        </div>

      </div>

      {/* ======================================================
          RIGHT
          ====================================================== */}

      <div className="header-right">

        <div className="header-date">
          {formattedDate}
        </div>

        {/* ====================================================
            NOTIFICATIONS
            ==================================================== */}

        <div className="header-notification-wrapper">

          <button
            type="button"
            className="header-notification-button"
            onClick={handleNotificationToggle}
            title="Notifications"
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">

              {/* HEADER */}

              <div className="notification-dropdown-header">

                <strong>
                  Notifications
                </strong>

                <div className="notification-header-actions">

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={
                        handleMarkAllAsRead
                      }
                      title="Mark all as read"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}

                </div>

              </div>

              {/* BODY */}

              <div className="notification-list">

                {loadingNotifications ? (
                  <div className="notification-empty">
                    Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="notification-empty">
                    No notifications
                  </div>
                ) : (
                  notifications.map(
                    (notification) => (
                      <div
                        key={notification.id}
                        className={`notification-item ${
                          !notification.is_read
                            ? "unread"
                            : ""
                        }`}
                        onClick={() =>
                          handleMarkAsRead(
                            notification
                          )
                        }
                      >

                        <div className="notification-item-content">

                          <strong>
                            {notification.title}
                          </strong>

                          <p>
                            {notification.message}
                          </p>

                          <small>
                            {new Date(
                              notification.created_at
                            ).toLocaleString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </small>

                        </div>

                        <button
                          type="button"
                          className="notification-delete"
                          onClick={(event) => {
                            event.stopPropagation();

                            handleDeleteNotification(
                              notification
                            );
                          }}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>
                    )
                  )
                )}

              </div>

            </div>
          )}

        </div>

        {/* ====================================================
            USER
            ==================================================== */}

        <div className="header-user">

          <div className="header-avatar">
            {getInitial()}
          </div>

          <div className="header-user-info">

            <strong>
              {user?.name ||
                "System Administrator"}
            </strong>

            <span>
              {getRoleName()}
            </span>

          </div>

        </div>

        {/* ====================================================
            LOGOUT
            ==================================================== */}

        <button
          type="button"
          className="header-logout"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </header>
  );
}