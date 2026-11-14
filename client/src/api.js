import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
});

// The browser's time zone (e.g. "Asia/Kolkata"). The server uses it to decide what "today" is,
// so the "Date cannot be in the future" rule matches the user's own calendar.
const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Attach the login token and time zone to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["X-Timezone"] = TIME_ZONE;
  return config;
});

// If the token has expired, clear it and go back to login.
// (Login/register 401s are normal "wrong password" errors, so skip those.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// What kind of problem is this? Used by <ErrorPage> to pick the right screen.
export const errorKind = (err) => {
  const status = err?.response?.status;
  if (!err?.response) return "network"; // no answer: offline, server down, timeout
  if (status === 401) return "session";
  if (status === 403) return "forbidden";
  if (status === 404) return "notfound";
  if (status === 429) return "ratelimit";
  if (status >= 500) return "server";
  return "generic";
};

// Pull the server's friendly message out of an error.
export const errorMessage = (err) =>
  err.response?.data?.error || "Could not reach the server. Please try again.";

export default api;
