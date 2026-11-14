import { useEffect, useState } from "react";
import AuthContext from "./AuthContext";
import api from "./api";

const hasToken = () => {
  try {
    return !!localStorage.getItem("token");
  } catch {
    return false;
  }
};

const readStoredUser = () => {
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
  const [checking, setChecking] = useState(hasToken);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      clearSession();
      return;
    }

    const controller = new AbortController();

    async function verifySession() {
      try {
        const { data } = await api.get("/auth/me", {
          signal: controller.signal,
        });

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
        if (!controller.signal.aborted) {
          setChecking(false);
        }
      }
    }

    verifySession();

    return () => controller.abort();
  }, []);

  const save = ({ user, token }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    save(data);
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    save(data);
  };

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
