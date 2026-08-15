import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import AdminTabs from "./AdminTabs";
import Modal from "../../components/Modal";

/** Admin's list of every group in the system, with search, pagination, and a View/Delete button on each. */
export default function AdminGroups() {
  const [groups, setGroups] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    const params = { page, limit: 10 };
    if (search.trim()) params.search = search.trim();

    client
      .get("/admin/groups", { params })
      .then((res) => {
        setGroups(res.data.groups);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch((err) => setError(err.response?.data?.error || "Could not load groups."));
  }

  useEffect(load, [page, search]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await client.delete(`/admin/groups/${confirmDelete._id}`);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete this group.");
      setConfirmDelete(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="content-area">
      <AdminTabs />

      <form onSubmit={handleSearchSubmit} style={{ marginBottom: 16 }}>
        <input
          placeholder="Search by group name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
      </form>

      {error && <p className="error-text">{error}</p>}
      {groups === null && !error && <p className="muted">Loading...</p>}
      {groups && groups.length === 0 && (
        <div className="empty-state">
          {search.trim() ? `No groups match "${search.trim()}".` : "No groups yet."}
        </div>
      )}

      <div className="card">
        {groups && groups.map((g) => (
          <div className="list-row" key={g._id}>
            <span>
              {g.name} <span className="muted">— {g.memberCount} members · organized by {g.organizerId?.name || "Unknown"}</span>
            </span>
            <span style={{ display: "flex", gap: 10 }}>
              <Link to={`/admin/groups/${g._id}`}><button className="secondary">View</button></Link>
              <button className="danger" onClick={() => setConfirmDelete(g)}>Delete</button>
            </span>
          </div>
        ))}
      </div>

      {groups && groups.length > 0 && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
          <button className="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="muted">Page {page} of {totalPages}</span>
          <button className="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}

      {confirmDelete && (
        <Modal
          title={`Delete "${confirmDelete.name}"?`}
          description="This permanently deletes the group, its members, events, messages, and expenses. This cannot be undone."
          confirmLabel="Delete group"
          busy={busy}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}