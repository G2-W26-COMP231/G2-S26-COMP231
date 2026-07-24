import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function AcceptInvite() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("working");
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    client
      .post(`/invitations/${token}/accept`)
      .then((res) => {
        setStatus("done");
        setTimeout(() => navigate(`/groups/${res.data.groupId}`), 1200);
      })
      .catch((err) => {
        setStatus("error");
        setError(err.response?.data?.error || "Could not accept this invitation.");
      });
  }, [loading, user, token, navigate]);

  return (
    <div className="content-area" style={{ maxWidth: 420, paddingTop: 48 }}>
      <div className="card">
        <h1>Group invitation</h1>
        {status === "working" && <p className="muted">Accepting your invitation...</p>}
        {status === "done" && <p>You're in! Taking you to the group...</p>}
        {status === "error" && (
          <>
            <p className="error-text">{error}</p>
            <Link to="/"><button className="secondary">Back to my groups</button></Link>
          </>
        )}
      </div>
    </div>
  );
}
