import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { FiArrowLeft, FiBriefcase, FiMapPin } from "react-icons/fi";
import { getJobById, applyToJob } from "../../jobs/services/jobs.api";
import { useToast } from "../../../shared/ToastContext";
import "../jobs.scss";

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [application, setApplication] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const data = await getJobById(jobId);
        setJob(data);
      } catch (error) {
        showToast(error.response?.data?.message || "Job not found.", "error");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const app = await applyToJob(jobId);
      setApplication(app);
      setApplied(true);
      showToast("Application submitted!", "success");
    } catch (error) {
      if (error.response?.status === 409) {
        setApplied(true);
        showToast("You already applied to this job.", "info");
      } else {
        showToast(error.response?.data?.message || "Failed to apply.", "error");
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <main className="page-shell">
        <p className="loading-state">Loading...</p>
      </main>
    );
  }

  if (!job) return null;

  return (
    <main className="page-shell">
      <button className="button back-button" onClick={() => navigate("/")}>
        <FiArrowLeft size={16} /> Back to jobs
      </button>

      <div className="job-detail-layout">
        <section className="job-detail">
          <div className="job-detail__hero">
            <span className="page-eyebrow">JOB OPPORTUNITY</span>
            <h1>{job.title}</h1>
            <p className="job-detail__company">
              {job.postedBy?.companyName || job.postedBy?.username}
            </p>
            {job.location && (
              <p className="job-detail__location">
                <FiMapPin size={14} /> {job.location}
              </p>
            )}
          </div>

          <div className="job-detail__section">
            <h2>Skills for this role</h2>
            <div className="job-card__skills">
              {job.requiredSkills.map((skill) => (
                <span key={skill} className="skill-chip">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="job-detail__section job-detail__section--description">
            <h2>About the role</h2>
            <p className="job-detail__description">{job.description}</p>
          </div>
        </section>

        <aside className="job-action-panel">
          <div className="job-action-panel__icon">
            <FiBriefcase size={19} />
          </div>
          <h2>
            {applied ? "Application received" : "Interested in this role?"}
          </h2>
          <p>
            {applied
              ? "Your application has been submitted for this position."
              : "Submit your application to be considered for this opportunity."}
          </p>
          <button
            className="button primary-button"
            disabled={applying || applied}
            onClick={handleApply}
          >
            {applied ? "Applied ✓" : applying ? "Applying..." : "Apply Now"}
          </button>

          {application && (
            <div className="match-result">
              <span className="match-result__eyebrow">YOUR SKILL MATCH</span>
              <p>
                <strong>{application.matchScore}%</strong>
              </p>
              {application.missingSkills?.length > 0 && (
                <p className="match-result__missing">
                  Missing skills: {application.missingSkills.join(", ")}
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
};

export default JobDetail;
