import { useEffect, useState } from "react";
import client from "../../api/client";
import AdminTabs from "./AdminTabs";

const ACTION_LABELS = {
  ban_user: "Banned user",
  reactivate_user: "Reactivated user",
  remove_user_from_group: "Removed user from group",
  delete_group: "Deleted group",
  dismiss_report: "Dismissed report",
  remove_reported_message: "Removed reported message",
};

export default function AdminLogs() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    client
      .get("/admin/logs")
      .then((res) => setLogs(res.data.logs))
      .catch((err) => setError(err.response?.data?.error || "Could not load the activity log."));
  }, []);

  return (
    <div className="content-area">
      <AdminTabs />
      {error && <p className="error-text">{error}</p>}
      {logs === null && !error && <p className="muted">Loading...</p>}
      {logs && logs.length === 0 && <div className="empty-state">No admin actions recorded yet.</div>}

      <div className="card">
        {logs && logs.map((l) => (
          <div className="list-row" key={l._id}>
            <span>
              <strong>{ACTION_LABELS[l.action] || l.action}</strong> by {l.adminId?.name || "Unknown admin"}
              {l.details && <span className="muted"> — {l.details}</span>}
            </span>
            <span className="muted" style={{ fontSize: "0.8rem" }}>{new Date(l.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}