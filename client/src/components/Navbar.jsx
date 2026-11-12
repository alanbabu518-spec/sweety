import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="navbar">
      <strong className="brand">Sweety</strong>
      <nav>
        <NavLink to="/" end>
          Readings
        </NavLink>
        <NavLink to="/reports">Reports</NavLink>
      </nav>
      <div className="navbar-user">
        <span>{user.name}</span>
        <button className="btn btn-secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}
