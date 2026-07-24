import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import GroupTabs from "../components/GroupTabs";

export default function Expenses() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [splitType, setSplitType] = useState("equal");
  const [customShares, setCustomShares] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function loadExpenses() {
    client.get(`/groups/${groupId}/expenses`).then((res) => setExpenses(res.data.expenses)).catch(() => {});
  }

  useEffect(() => {
    client.get(`/groups/${groupId}`).then((res) => {
      setGroup(res.data.group);
      setMyRole(res.data.myRole);
      if (res.data.myRole === "organizer") {
        client.get(`/groups/${groupId}/members`).then((r) => setMembers(r.data.members));
        loadExpenses();
      }
    });
  }, [groupId]);

  function toggleMember(id) {
    setSelectedMembers((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  const customShareTotal = selectedMembers.reduce((sum, id) => sum + (Number(customShares[id]) || 0), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const amountNum = Number(amount);
    if (!description.trim() || !amountNum || amountNum <= 0 || !payerId || selectedMembers.length === 0) {
      setError("Fill in a description, a positive amount, a payer, and at least one member.");
      return;
    }

    const payload = { description, amount: amountNum, payerId, memberIds: selectedMembers, splitType };
    if (splitType === "custom") {
      if (Math.abs(customShareTotal - amountNum) > 0.001) {
        setError(`Custom split must add up exactly to $${amountNum.toFixed(2)}. It currently adds up to $${customShareTotal.toFixed(2)}.`);
        return;
      }
      payload.customShares = Object.fromEntries(selectedMembers.map((id) => [id, Number(customShares[id]) || 0]));
    }

    setBusy(true);
    try {
      await client.post(`/groups/${groupId}/expenses`, payload);
      setDescription(""); setAmount(""); setPayerId(""); setSelectedMembers([]); setCustomShares({});
      loadExpenses();
    } catch (err) {
      setError(err.response?.data?.error || "Could not log this expense.");
    } finally {
      setBusy(false);
    }
  }

  if (myRole && myRole !== "organizer") {
    return (
      <div className="content-area">
        <GroupTabs groupId={groupId} groupName={group?.name || "..."} myRole={myRole} />
        <div className="empty-state">
          Viewing shared expenses as a member isn't part of this release yet.
        </div>
      </div>
    );
  }

  return (
    <div className="content-area">
      <GroupTabs groupId={groupId} groupName={group?.name || "..."} myRole={myRole} />

      <h2>Recent Expenses</h2>
      {expenses.length === 0 && <div className="empty-state">No expenses logged yet.</div>}
      {expenses.map((exp) => (
        <div className="expense-row-card filled" key={exp._id}>
          <span>{exp.purpose}</span>
          <span className="amount">Paid by {exp.paidBy?.name || "Unknown"} - ${(exp.amount / 100).toFixed(2)}</span>
        </div>
      ))}

      <div className="card filled" style={{ marginTop: 20 }}>
        <h2 style={{ color: "#fff" }}>Log Shared Expense</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="amount">Amount..</label>
          <input id="amount" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />

          <label htmlFor="description">Description</label>
          <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} required />

          <label htmlFor="payerId">Paid by..</label>
          <select id="payerId" value={payerId} onChange={(e) => setPayerId(e.target.value)} required>
            <option value="">Select who paid...</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <label>Split Type</label>
          <div style={{ display: "flex", gap: 16, margin: "8px 0", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, margin: 0, fontWeight: 400, color: "#fff" }}>
              <input type="radio" style={{ width: "auto" }} checked={splitType === "equal"} onChange={() => setSplitType("equal")} /> Equal
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, margin: 0, fontWeight: 400, color: "#fff" }}>
              <input type="radio" style={{ width: "auto" }} checked={splitType === "custom"} onChange={() => setSplitType("custom")} /> Custom
            </label>
          </div>

          <label>Members included</label>
          {members.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <input type="checkbox" id={`m-${m.id}`} style={{ width: "auto" }} checked={selectedMembers.includes(m.id)} onChange={() => toggleMember(m.id)} />
              <label htmlFor={`m-${m.id}`} style={{ margin: 0, fontWeight: 400, color: "#fff" }}>{m.name}</label>
              {splitType === "custom" && selectedMembers.includes(m.id) && (
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  style={{ width: 100, marginLeft: "auto" }}
                  value={customShares[m.id] || ""}
                  onChange={(e) => setCustomShares((prev) => ({ ...prev, [m.id]: e.target.value }))}
                />
              )}
            </div>
          ))}
          {splitType === "custom" && selectedMembers.length > 0 && (
            <p style={{ fontSize: "0.8rem", color: "#e5e2ff" }}>
              Custom shares so far: ${customShareTotal.toFixed(2)}{amount ? ` of $${Number(amount).toFixed(2)}` : ""}
            </p>
          )}

          {error && <p className="error-text" style={{ color: "#ffd7d0" }}>{error}</p>}

          <div className="form-actions">
            <button type="button" className="secondary" style={{ background: "transparent", color: "#fff", borderColor: "#fff" }} onClick={() => { setDescription(""); setAmount(""); setPayerId(""); setSelectedMembers([]); }}>Cancel</button>
            <button type="submit" disabled={busy} style={{ background: "#fff", color: "var(--brand)" }}>{busy ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}