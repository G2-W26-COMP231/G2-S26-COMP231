import { useEffect, useState } from "react";
import client from "../../api/client";
import AdminTabs from "./AdminTabs";
import Modal from "../../components/Modal";

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [statusFilter, setStatusFilter] = useState("open");
  const [error, setError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    client
      .get("/admin/reports", { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setReports(res.data.reports))
      .catch((err) => setError(err.response?.data?.error || "Could not load reports."));
  }

  useEffect(load, [statusFilter]);

  async function handleConfirm() {
    if (!confirmTarget) return;
    setBusy(true);
    try {
      if (confirmTarget.type === "dismiss") {
        await client.post(`/admin/reports/${confirmTarget.report._id}/dismiss`);
      } else {
        await client.post(`/admin/reports/${confirmTarget.report._id}/remove-message`);
      }
      setConfirmTarget(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not complete this action.");
      setConfirmTarget(null);
    } finally {
      setBusy(false);
    }
  }

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
          {r.status === "open" && (
            <div className="modal-actions" style={{ marginTop: 10 }}>
              <button className="secondary" onClick={() => setConfirmTarget({ type: "dismiss", report: r })}>Dismiss</button>
              <button className="danger" onClick={() => setConfirmTarget({ type: "remove", report: r })}>Remove message</button>
            </div>
          )}
        </div>
      ))}

      {confirmTarget && (
        <Modal
          title={confirmTarget.type === "dismiss" ? "Dismiss this report?" : "Remove this message?"}
          description={
            confirmTarget.type === "dismiss"
              ? "The report will be marked as dismissed with no further action."
              : "This will hide the message from the group and mark the report resolved."
          }
          confirmLabel={confirmTarget.type === "dismiss" ? "Dismiss" : "Remove message"}
          busy={busy}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}