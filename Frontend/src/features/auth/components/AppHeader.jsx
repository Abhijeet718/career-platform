import React from "react";
import { useNavigate, NavLink } from "react-router";
import {
  FiActivity,
  FiBriefcase,
  FiFileText,
  FiGrid,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import "./app-header.scss";

const AppHeader = () => {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await handleLogout();
    navigate("/login");
  };

  return (
    <aside className="app-header">
      <div className="app-header__brand" onClick={() => navigate("/")}>
        <span className="app-header__brand-mark">C</span>
        <span>
          Career<span className="app-header__brand-light">path</span>
        </span>
      </div>
      <p className="app-header__workspace">WORKSPACE</p>
      <nav className="app-header__nav" aria-label="Main navigation">
        {user?.role === "student" && (
          <>
            <NavLink to="/" end>
              <FiBriefcase /> <span>Explore jobs</span>
            </NavLink>
            <NavLink to="/applications">
              <FiFileText /> <span>Applications</span>
            </NavLink>
            <NavLink to="/dsa">
              <FiActivity /> <span>DSA tracker</span>
            </NavLink>
            <NavLink to="/profile">
              <FiUser /> <span>My profile</span>
            </NavLink>
          </>
        )}
        {user?.role === "recruiter" && (
          <>
            <NavLink to="/" end>
              <FiGrid /> <span>Hiring overview</span>
            </NavLink>
            <NavLink to="/dsa">
              <FiActivity /> <span>DSA tracker</span>
            </NavLink>
          </>
        )}
      </nav>
      <div className="app-header__bottom">
        {user && (
          <div className="app-header__identity">
            <span className="app-header__avatar">
              {user.username?.slice(0, 1)?.toUpperCase()}
            </span>
            <span className="app-header__username">
              {user.username}
              <small>{user.role}</small>
            </span>
          </div>
        )}
        <button
          className="app-header__logout"
          onClick={onLogout}
          aria-label="Logout"
        >
          <FiLogOut />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default AppHeader;
