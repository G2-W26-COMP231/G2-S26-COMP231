import { useEffect, useState } from "react";
import client from "../../api/client";
import AdminTabs from "./AdminTabs";

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [statusFilter, setStatusFilter] = useState("open");
  const [error, setError] = useState("");

  function load() {
    client
      .get("/admin/reports", { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setReports(res.data.reports))
      .catch((err) => setError(err.response?.data?.error || "Could not load reports."));
  }
  useEffect(load, [statusFilter]);

  return (
    <div className="content-area">
      <AdminTabs />
      <div className="tabs" style={{ marginBottom: 12 }}>
        {["open", "resolved", "dismissed", ""].map((s) => (
          <span
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? "active" : ""}
            style={{ cursor: "pointer" }}
          >
            {s ? s[0].toUpperCase() + s.slice(1) : "All"}
          </span>
        ))}
      </div>
      {error && <p className="error-text">{error}</p>}
      {reports === null && !error && <p className="muted">Loading...</p>}
      {reports && reports.length === 0 && <div className="empty-state">No reports here.</div>}
      {reports && reports.map((r) => (
        <div className="card report" key={r._id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{r.groupId?.name || "Unknown group"}</strong>
            <span className="status-pill">{r.status}</span>
          </div>
          <p className="muted" style={{ margin: "6px 0" }}>
            Reported by {r.reportedBy?.name || "Unknown"} {r.reason ? `— "${r.reason}"` : ""}
          </p>
          <div className="card" style={{ background: "rgba(0,0,0,0.04)" }}>
            <p style={{ margin: 0 }}>
              <strong>{r.messageId?.senderId?.name || "Unknown sender"}:</strong>{" "}
              {r.messageId?.isRemoved ? <em>(message removed)</em> : r.messageId?.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}