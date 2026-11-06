import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { io } from "socket.io-client";
import { FiMapPin } from "react-icons/fi";
import { getMyApplications } from "../../jobs/services/jobs.api";
import { useToast } from "../../../shared/ToastContext";
import "../jobs.scss";

const STATUS_LABELS = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  interviewing: "Interviewing",
  offered: "Offered",
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchApplications = async (page = 1) => {
    setLoading(true);
    try {
      const data = await getMyApplications(page, pagination.limit);
      setApplications(data.applications);
      setPagination(data.pagination);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to load your applications.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const socket = io("http://localhost:4000", { withCredentials: true });

    socket.on("applicationStatusUpdated", (event) => {
      showToast(
        `"${event.jobTitle}" status updated to ${STATUS_LABELS[event.status] || event.status}`,
        "success",
      );
      setApplications((prev) =>
        prev.map((app) =>
          app._id === event.applicationId
            ? { ...app, status: event.status }
            : app,
        ),
      );
    });

    socket.on("connect_error", () => {
      // Live updates unavailable — the page still works via normal HTTP.
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchApplications(page);
  };

  if (loading && applications.length === 0) {
    return (
      <main className="page-shell">
        <p className="loading-state">Loading your applications...</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-heading applications-heading">
        <span className="page-eyebrow">YOUR JOB SEARCH</span>
        <div className="applications-heading__row">
          <div>
            <h1>My applications</h1>
            <p className="page-description">
              A clear view of every opportunity you’ve pursued and where it
              stands.
            </p>
          </div>
          <div className="applications-heading__count">
            <strong>{pagination.total}</strong>
            <span>applications</span>
          </div>
        </div>
      </div>

      {applications.length === 0 && (
        <p className="empty-state">
          You haven't applied to any jobs yet.{" "}
          <span className="empty-state__link" onClick={() => navigate("/")}>
            Browse open jobs →
          </span>
        </p>
      )}

      <div className="applications-list">
        {applications.map((app) => (
          <div
            key={app._id}
            className="application-card"
            onClick={() => app.job?._id && navigate(`/jobs/${app.job._id}`)}
          >
            <div className="application-card__identity">
              <span className="application-card__mark">
                {(app.job?.title || "J").slice(0, 1).toUpperCase()}
              </span>
              <div>
                <h2>{app.job?.title || "Job no longer available"}</h2>
                {app.job?.location && (
                  <p className="job-card__location">
                    <FiMapPin size={13} /> {app.job.location}
                  </p>
                )}
              </div>
            </div>
            <div className="application-card__status">
              <span className="application-card__label">
                APPLICATION STATUS
              </span>
              <p className={`status-badge status-badge--${app.status}`}>
                {STATUS_LABELS[app.status] || app.status}
              </p>
            </div>
            <div className="application-card__match">
              <div className="application-card__match-label">
                <span>Skill match</span>
                <strong>{app.matchScore}%</strong>
              </div>
              <div className="application-card__match-track">
                <span style={{ width: `${app.matchScore}%` }} />
              </div>
            </div>
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

export default MyApplications;
