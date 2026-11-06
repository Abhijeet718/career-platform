import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  FiArrowUpRight,
  FiBriefcase,
  FiMapPin,
  FiPlus,
  FiUsers,
} from "react-icons/fi";
import { createJob, getMyJobs } from "../../jobs/services/jobs.api";
import { useToast } from "../../../shared/ToastContext";
import "../../student/jobs.scss";
import "../recruiter.scss";

const RecruiterHome = () => {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [location, setLocation] = useState("");

  const fetchJobs = async (page = 1) => {
    setLoading(true);
    try {
      const data = await getMyJobs(page, pagination.limit);
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to load your jobs.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(1);
    
  }, []);

  const handlePostJob = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      const requiredSkills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await createJob({
        title,
        description,
        requiredSkills,
        location: location || undefined,
      });
      showToast("Job posted successfully!", "success");
      setTitle("");
      setDescription("");
      setSkillsInput("");
      setLocation("");
      setShowForm(false);
      fetchJobs(1);
    } catch (error) {
      const backendErrors = error.response?.data?.errors;
      const message =
        backendErrors?.[0]?.message ||
        error.response?.data?.message ||
        "Failed to post job.";
      showToast(message, "error");
    } finally {
      setPosting(false);
    }
  };

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchJobs(page);
  };

  return (
    <main className="page-shell">
      <div className="recruiter-heading">
        <div>
          <span className="page-eyebrow">HIRING WORKSPACE</span>
          <h1>Manage your roles</h1>
          <p className="page-description">
            Publish opportunities and keep every candidate pipeline moving.
          </p>
        </div>
        <button
          className="button primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            "Cancel"
          ) : (
            <>
              <FiPlus size={16} /> Post a role
            </>
          )}
        </button>
      </div>

      <section className="recruiter-metrics" aria-label="Job listing summary">
        <div className="recruiter-metric">
          <span className="recruiter-metric__icon">
            <FiBriefcase />
          </span>
          <span className="recruiter-metric__copy">
            <strong>{pagination.total}</strong>
            <small>Posted roles</small>
          </span>
        </div>
        <div className="recruiter-metric">
          <span className="recruiter-metric__icon recruiter-metric__icon--green">
            <FiUsers />
          </span>
          <span className="recruiter-metric__copy">
            <strong>
              {jobs.filter((job) => job.status === "open").length}
            </strong>
            <small>Open roles on this page</small>
          </span>
        </div>
      </section>

      {showForm && (
        <form className="post-job-form" onSubmit={handlePostJob}>
          <div className="form-heading">
            <span className="page-eyebrow">NEW OPPORTUNITY</span>
            <h2>Tell candidates about the role</h2>
            <p>Share the details applicants need to decide if they’re a fit.</p>
          </div>
          <div className="input-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Backend Engineer"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, and requirements..."
              rows={5}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="skills">Required Skills (comma-separated)</label>
            <input
              id="skills"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. Node.js, MongoDB, React"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="location">Location (optional)</label>
            <input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Remote, Bangalore"
            />
          </div>
          <button className="button primary-button" disabled={posting}>
            {posting ? "Posting..." : "Post Job"}
          </button>
        </form>
      )}

      {loading && jobs.length === 0 && (
        <p className="loading-state">Loading your jobs...</p>
      )}
      {!loading && jobs.length === 0 && (
        <p className="empty-state">You haven't posted any jobs yet.</p>
      )}

      <div className="recruiter-list-heading">
        <div>
          <h2>Your listings</h2>
          <span>{pagination.total} total</span>
        </div>
      </div>
      <div className="recruiter-jobs-list">
        {jobs.map((job) => (
          <div
            key={job._id}
            className="recruiter-job-row"
            onClick={() => navigate(`/recruiter/jobs/${job._id}/applicants`)}
          >
            <span className="recruiter-job-row__icon">
              <FiBriefcase />
            </span>
            <div className="recruiter-job-row__main">
              <div className="recruiter-job-row__title">
                <h3>{job.title}</h3>
                <span
                  className={`job-status-badge job-status-badge--${job.status}`}
                >
                  {job.status}
                </span>
              </div>
              {job.location && (
                <p className="job-card__location">
                  <FiMapPin size={13} /> {job.location}
                </p>
              )}
              <div className="job-card__skills">
                {job.requiredSkills.slice(0, 5).map((skill) => (
                  <span key={skill} className="skill-chip">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <span className="recruiter-job-row__link">
              Applicants <FiArrowUpRight />
            </span>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination__btn"
            disabled={pagination.page <= 1 || loading}
            onClick={() => goToPage(pagination.page - 1)}
          >
            Previous
          </button>
          <span className="pagination__label">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="pagination__btn"
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() => goToPage(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
};

export default RecruiterHome;
