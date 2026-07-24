import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";
import { disconnectSocket } from "../socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("crewup_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("crewup_token");
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("crewup_user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem("crewup_token");
        localStorage.removeItem("crewup_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function persistSession(data) {
    localStorage.setItem("crewup_token", data.token);
    localStorage.setItem("crewup_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function login(email, password) {
    const res = await client.post("/auth/login", { email, password });
    persistSession(res.data);
  }

  async function register(name, email, password) {
    const res = await client.post("/auth/register", { name, email, password });
    persistSession(res.data);
  }

  function logout() {
    localStorage.removeItem("crewup_token");
    localStorage.removeItem("crewup_user");
    disconnectSocket();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
