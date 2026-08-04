import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../../api/client";
import AdminTabs from "./AdminTabs";
import Modal from "../../components/Modal";

export default function AdminUserDetail() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [confirmBan, setConfirmBan] = useState(false);
  const [busy, setBusy] = useState(false);

  function load() {
    client
      .get(`/admin/users/${userId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || "Could not load this user."));
  }
  useEffect(load, [userId]);

  async function toggleStatus() {
    setBusy(true);
    try {
      const nextStatus = data.user.status === "banned" ? "active" : "banned";
      await client.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      setConfirmBan(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not update this user's status.");
      setConfirmBan(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="content-area">
      <AdminTabs />
      {error && <p className="error-text">{error}</p>}
      {!data && !error && <p className="muted">Loading...</p>}
      {data && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{data.user.name}</h2>
          <p className="muted">{data.user.email}</p>
          <p>
            Status: <span className="status-pill">{data.user.status}</span>{" "}
            {data.user.role === "admin" && <span className="role-badge">Admin</span>}
          </p>
          <button className="danger" onClick={() => setConfirmBan(true)}>
            {data.user.status === "banned" ? "Reactivate account" : "Deactivate / ban account"}
          </button>
        </div>
      )}

      {confirmBan && (
        <Modal
          title={data.user.status === "banned" ? "Reactivate this account?" : "Deactivate this account?"}
          description={
            data.user.status === "banned"
              ? "The user will regain access to CrewUp."
              : "The user will be immediately signed out and unable to log back in."
          }
          confirmLabel={data.user.status === "banned" ? "Reactivate" : "Deactivate"}
          busy={busy}
          onCancel={() => setConfirmBan(false)}
          onConfirm={toggleStatus}
        />
      )}
    </div>
  );
}
