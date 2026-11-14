import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AppShell from "./components/AppShell";
import ErrorPage from "./components/ErrorPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Readings from "./pages/Readings";
import Reports from "./pages/Reports";

// Shown briefly while the saved login is confirmed with the server.
function CheckingSession() {
  return (
    <div
      role="status"
      className="grid min-h-dvh place-items-center text-sm font-medium text-muted"
    >
      Loading…
    </div>
  );
}

function ProtectedLayout() {
  const { user, checking } = useAuth();
  if (checking) return <CheckingSession />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

// Unknown address: show a 404 (inside the app layout when logged in).
function NotFound() {
  const { user, checking } = useAuth();
  if (checking) return <CheckingSession />;
  if (!user) return <ErrorPage kind="notfound" />;
  return (
    <AppShell>
      <ErrorPage kind="notfound" variant="inline" />
    </AppShell>
  );
}

function GuestRoute({ children }) {
  const { user, checking } = useAuth();
  if (checking) return <CheckingSession />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Readings />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
