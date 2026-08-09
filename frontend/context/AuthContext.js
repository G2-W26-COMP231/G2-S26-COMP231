import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";
import { disconnectSocket } from "../socket";

const AuthContext = createContext(null);

/**
 * Wraps the whole app and keeps track of who's logged in. Checks
 * localStorage on load to see if there's already a saved session, and if
 * so verifies it's still valid by hitting /auth/me. Also handles login,
 * register, and logout, and saves the token/user to localStorage so
 * refreshing the page doesn't log you out.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
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

    /**
   * Saves the token/user to localStorage and updates state. Shared by
   * both login and register since they do the same thing after a
   * successful response.
   *
   * @param {Object} data - the API response, needs token and user
   */
  function persistSession(data) {
    localStorage.setItem("crewup_token", data.token);
    localStorage.setItem("crewup_user", JSON.stringify(data.user));
    setUser(data.user);
  }

   /**
   * Logs a user in and saves their session.
   * @param {string} email
   * @param {string} password
   */
  async function login(email, password) {
    const res = await client.post("/auth/login", { email, password });
    persistSession(res.data);
  }

   /**
   * Registers a new account and logs them in right away.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   */
  async function register(name, email, password) {
    const res = await client.post("/auth/register", { name, email, password });
    persistSession(res.data);
  }

    /** Clears the saved session, 
     * disconnects the chat socket, and logs the user out. 
    */
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

/**
 * Hook to grab the current user/login/logout/etc from anywhere in the app.
 * Throws if you try to use it outside of AuthProvider so you get a clear
 * error instead of a confusing "cannot read property of null" bug.
 *
 * @returns {{user: Object|null, loading: boolean, login: Function, register: Function, logout: Function}}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}