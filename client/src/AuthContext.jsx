import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

const hasToken = () => {
  try {
    return !!localStorage.getItem("token");
  } catch {
    return false;
  }
};

const readStoredUser = () => {
  // A saved user is only meaningful together with a saved token.
  if (!hasToken()) return null;
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  // True while we are confirming the saved token with the server on startup.
  const [checking, setChecking] = useState(hasToken);

  // On startup, ask the server who this token belongs to (GET /auth/me).
  // - valid   -> refresh the saved user details
  // - 401/404 -> the session is expired or the account is gone: log out
  // - network error -> keep the saved session (being offline is not "logged out")
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      clearSession();
      setUser(null);
      setChecking(false);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const { data } = await api.get("/auth/me", {
          signal: controller.signal,
        });
        // The user may have logged out / in again while we were waiting.
        if (localStorage.getItem("token") !== token) return;
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      } catch (err) {
        if (controller.signal.aborted) return;
        const status = err.response?.status;
        if (status === 401 || status === 404) {
          clearSession();
          setUser(null);
        }
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const save = ({ user, token }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) =>
    save((await api.post("/auth/login", { email, password })).data);

  const register = async (name, email, password) =>
    save((await api.post("/auth/register", { name, email, password })).data);

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, checking, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
