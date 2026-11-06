import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import "../auth.form.scss";
import { useAuth } from "../hooks/useAuth";
import { FiActivity, FiBriefcase, FiTarget } from "react-icons/fi";

const Login = () => {
  const { loading, error, handleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await handleLogin({ email, password });
    if (success) {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <main className="auth-shell">
        <h1>Loading.......</h1>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <aside className="auth-showcase">
        <div className="auth-showcase__brand">
          <span className="auth-showcase__brand-mark">C</span>
          <span>Career</span>
          <span className="auth-showcase__brand-light">path</span>
        </div>
        <div className="auth-showcase__message">
          <span className="auth-showcase__eyebrow">CAREER, WITH DIRECTION</span>
          <h2>Your next chapter starts with the right opportunity.</h2>
          <p>
            Bring your skills, applications, and preparation together in one
            focused workspace.
          </p>
        </div>
        <div className="auth-showcase__features">
          <div>
            <FiBriefcase />
            <span>Discover roles built around your skills</span>
          </div>
          <div>
            <FiTarget />
            <span>See where your experience aligns</span>
          </div>
          <div>
            <FiActivity />
            <span>Keep your interview preparation moving</span>
          </div>
        </div>
        <span className="auth-showcase__footer">
          A clearer path from preparation to placement.
        </span>
      </aside>
      <div className="form-container">
        <span className="page-eyebrow">WELCOME BACK</span>
        <h1>Sign in to your account</h1>
        <p className="auth-form-intro">
          Pick up where your career search left off.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              type="email"
              id="email"
              name="email"
              placeholder="Enter email address"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              type="password"
              id="password"
              name="password"
              placeholder="Enter password"
            />
          </div>
          <button className="button primary-button">Login</button>
        </form>
        <p>
          Don't have an account? <Link to={"/register"}>Register</Link>
        </p>
      </div>
    </main>
  );
};

export default Login;
