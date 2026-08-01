import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import AdminTabs from "./AdminTabs";
export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    client
      .get("/admin/overview")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || "Could not load the moderation overview."));
  }, []);
  return (
    <div className="content-area">
      <AdminTabs />
      {error && <p className="error-text">{error}</p>}
      {!data && !error && <p className="muted">Loading...</p>}
      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
            <div className="card"><div className="muted">Open reports</div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{data.summary.openReports}</div></div>
            <div className="card"><div className="muted">Total reports</div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{data.summary.totalReports}</div></div>
            <div className="card"><div className="muted">Banned users</div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{data.summary.bannedUsers}</div></div>
            <div className="card"><div className="muted">Total users</div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{data.summary.totalUsers}</div></div>
            <div className="card"><div className="muted">Total groups</div><div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{data.summary.totalGroups}</div></div>
          </div>
          <h2>Recent open reports</h2>
          {data.recentReports.length === 0 && <div className="empty-state">Nothing to review right now.</div>}
          <div className="card">
            {data.recentReports.map((r) => (
              <div className="list-row" key={r._id}>
                <span>{r.groupId?.name || "Unknown group"} · reported by {r.reportedBy?.name || "Unknown"}</span>
                <Link to="/admin/reports"><button className="secondary">Review</button></Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
