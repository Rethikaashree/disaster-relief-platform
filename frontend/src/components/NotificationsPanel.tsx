import { useEffect, useState } from "react";
import { Bell, Check, RefreshCw } from "lucide-react";
import { notificationApi } from "../api";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationsPanel() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setError("");
    try {
      const { data } = await notificationApi.list();
      setItems(data.items);
    } catch {
      setError("Notifications are temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const markRead = async (item: NotificationItem) => {
    try {
      await notificationApi.markRead(item.id);
      setItems((current) =>
        current.map((notification) =>
          notification.id === item.id
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
    } catch {
      setError("This notification could not be updated.");
    }
  };

  return (
    <section className="role-section notifications-panel">
      <div className="role-section-heading">
        <div>
          <h2>
            <Bell size={17} /> Notifications
          </h2>
          <p>{items.filter((item) => !item.is_read).length} unread</p>
        </div>
        <button
          className="icon-button"
          type="button"
          title="Refresh notifications"
          aria-label="Refresh notifications"
          onClick={() => void refresh()}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      {error && (
        <div role="alert" className="alert danger">
          {error}
        </div>
      )}
      {loading ? (
        <div className="empty-state">Loading notifications...</div>
      ) : items.length ? (
        items.map((item) => (
          <article
            className={`notification-row ${item.is_read ? "read" : "unread"}`}
            key={item.id}
          >
            <span className="notification-marker" />
            <div>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
              <time>{new Date(item.created_at).toLocaleString()}</time>
            </div>
            {!item.is_read && (
              <button
                className="icon-button"
                type="button"
                title="Mark as read"
                aria-label={`Mark ${item.title} as read`}
                onClick={() => void markRead(item)}
              >
                <Check size={16} />
              </button>
            )}
          </article>
        ))
      ) : (
        <div className="empty-state">No notifications yet.</div>
      )}
    </section>
  );
}
