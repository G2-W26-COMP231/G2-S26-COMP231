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

/** Shows the admin action log - who did what, and when, newest first. Filterable by action type and date range. */
export default function AdminLogs() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  function load() {
    const params = {};
    if (actionFilter !== "all") params.action = actionFilter;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;

    client
      .get("/admin/logs", { params })
      .then((res) => setLogs(res.data.logs))
      .catch((err) => setError(err.response?.data?.error || "Could not load the activity log."));
  }

  useEffect(load, [actionFilter, fromDate, toDate]);

  return (
    <div className="content-area">
      <AdminTabs />

      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <label htmlFor="action-filter">Action type</label>
          <select id="action-filter" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ minWidth: 200 }}>
            <option value="all">All actions</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="from-date">From</label>
          <input id="from-date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="to-date">To</label>
          <input id="to-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        {(actionFilter !== "all" || fromDate || toDate) && (
          <button
            type="button"
            className="secondary"
            onClick={() => { setActionFilter("all"); setFromDate(""); setToDate(""); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}
      {logs === null && !error && <p className="muted">Loading...</p>}
      {logs && logs.length === 0 && <div className="empty-state">No admin actions match these filters.</div>}

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