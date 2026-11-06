import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import "../auth.form.scss";
import { useAuth } from "../hooks/useAuth";
import { FiActivity, FiBriefcase, FiTarget } from "react-icons/fi";

const Register = () => {
  const navigate = useNavigate();
  const { loading, error, handleRegister } = useAuth();

  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await handleRegister({
      username,
      email,
      password,
      role,
      companyName,
    });
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
          <h2>Make your skills visible to the opportunities ahead.</h2>
          <p>
            Create a focused workspace for roles, applications, and interview
            preparation.
          </p>
        </div>
        <div className="auth-showcase__features">
          <div>
            <FiBriefcase />
            <span>Explore opportunities in one place</span>
          </div>
          <div>
            <FiTarget />
            <span>Highlight the skills you bring</span>
          </div>
          <div>
            <FiActivity />
            <span>Build momentum with focused practice</span>
          </div>
        </div>
        <span className="auth-showcase__footer">
          A clearer path from preparation to placement.
        </span>
      </aside>
      <div className="form-container">
        <span className="page-eyebrow">GET STARTED</span>
        <h1>Create your account</h1>
        <p className="auth-form-intro">
          Choose how you’ll use Careerpath to get moving.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="role-toggle">
          <button
            type="button"
            className={role === "student" ? "active" : ""}
            onClick={() => setRole("student")}
          >
            I'm a Student
          </button>
          <button
            type="button"
            className={role === "recruiter" ? "active" : ""}
            onClick={() => setRole("recruiter")}
          >
            I'm a Recruiter
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              type="text"
              id="username"
              name="username"
              placeholder="Enter username"
            />
          </div>
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
              placeholder="Enter password (min. 8 characters)"
            />
          </div>

          {role === "recruiter" && (
            <div className="input-group">
              <label htmlFor="companyName">Company Name</label>
              <input
                onChange={(e) => {
                  setCompanyName(e.target.value);
                }}
                type="text"
                id="companyName"
                name="companyName"
                placeholder="Enter your company name"
              />
            </div>
          )}

          <button className="button primary-button">Register</button>
        </form>

        <p>
          Already have an account? <Link to={"/login"}>Login</Link>
        </p>
      </div>
    </main>
  );
};

export default Register;
