import React, { useState, useRef } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useToast } from "../../../shared/ToastContext";
import { analyzeResume } from "../services/resume.api";
import {
  FiAlertCircle,
  FiCheck,
  FiCode,
  FiFileText,
  FiInfo,
  FiRefreshCw,
  FiTarget,
  FiUser,
} from "react-icons/fi";
import "../jobs.scss";
import "../profile.scss";

const Profile = () => {
  const { user, handleUpdateProfile, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [skillsInput, setSkillsInput] = useState(
    (user?.skills || []).join(", "),
  );
  const [savingSkills, setSavingSkills] = useState(false);

  const [targetRole, setTargetRole] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const fileInputRef = useRef();

  const handleSaveSkills = async (e) => {
    e.preventDefault();
    setSavingSkills(true);
    try {
      const skills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const success = await handleUpdateProfile({ skills });
      if (success) {
        showToast("Skills updated.", "success");
      }
    } finally {
      setSavingSkills(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files[0];
    if (!file) {
      setAnalysisError("Select a PDF resume to get started.");
      showToast("Please select a PDF resume first.", "error");
      return;
    }
    if (!targetRole.trim()) {
      setAnalysisError(
        "Enter your target role so the score and skill comparison can be tailored to your goal.",
      );
      showToast("Please enter a target role.", "error");
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);
    setAnalysisError("");
    try {
      const data = await analyzeResume(file, targetRole);
      setAnalysis(data.analysis);
      setSkillsInput(data.updatedSkills.join(", "));
      await refreshUser();
      showToast("Resume analyzed! Your skills have been updated.", "success");
    } catch (error) {
      setAnalysisError(
        error.response?.data?.message ||
          "We could not analyze this resume. Check the PDF and try again.",
      );
      showToast(
        error.response?.data?.message || "Failed to analyze resume.",
        "error",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const startAnotherAnalysis = () => {
    setAnalysis(null);
    setAnalysisError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="jobs-page profile-page">
      <div className="page-heading">
        <span className="page-eyebrow">CANDIDATE PROFILE</span>
        <h1>Make your next move count.</h1>
        <p className="page-description">
          Keep your skills current and use resume insights to present your
          experience clearly.
        </p>
      </div>

      <section className="profile-overview">
        <div className="profile-overview__identity">
          <span className="profile-overview__avatar">
            <FiUser />
          </span>
          <div>
            <strong>{user?.username}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
        <div className="profile-overview__skill-count">
          <strong>{user?.skills?.length || 0}</strong>
          <span>skills on profile</span>
        </div>
      </section>

      <div className="profile-layout">
        <section className="profile-section profile-section--skills">
          <div className="profile-section__heading">
            <span className="profile-section__icon">
              <FiCode />
            </span>
            <div>
              <span className="profile-section__step">01 / PROFILE</span>
              <h2>Your skills</h2>
            </div>
          </div>
          <p className="profile-hint">
            Add the technologies and strengths you want recruiters to find.
            Separate each skill with a comma.
          </p>
          <form onSubmit={handleSaveSkills} className="profile-form">
            <label htmlFor="profile-skills">Skills</label>
            <textarea
              id="profile-skills"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. Java, React, MongoDB, Node.js"
              rows={5}
            />
            <button className="button primary-button" disabled={savingSkills}>
              {savingSkills ? "Saving..." : "Save skills"}
            </button>
          </form>
        </section>

        <section className="profile-section profile-section--resume">
          <div className="profile-section__heading">
            <span className="profile-section__icon profile-section__icon--resume">
              <FiFileText />
            </span>
            <div>
              <span className="profile-section__step">02 / RESUME</span>
              <h2>AI resume analysis</h2>
            </div>
          </div>
          <p className="profile-hint">
            Compare your resume with a specific role to get an estimated
            ATS-style score and evidence-based suggestions. Detected skills will
            update the skills on your profile.
          </p>
          <form onSubmit={handleAnalyze} className="profile-form">
            <label className="file-input-label" htmlFor="resume-file">
              Resume PDF
            </label>
            <input
              id="resume-file"
              type="file"
              accept=".pdf,application/pdf"
              ref={fileInputRef}
            />
            <label htmlFor="target-role">
              Target role <span>required for role-specific results</span>
            </label>
            <input
              id="target-role"
              type="text"
              required
              maxLength={150}
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Backend Developer"
            />
            <button
              className="button primary-button"
              disabled={analyzing || !targetRole.trim()}
            >
              {analyzing ? (
                <>
                  <span className="analysis-spinner" /> Analyzing resume...
                </>
              ) : analysis ? (
                "Analyze new resume"
              ) : (
                "Analyze resume"
              )}
            </button>
          </form>

          {analyzing && (
            <div
              className="analysis-state analysis-state--loading"
              role="status"
            >
              <span className="analysis-spinner" />
              <div>
                <strong>Reviewing your resume</strong>
                <span>
                  Matching its evidence to {targetRole.trim()} requirements.
                  This may take a moment.
                </span>
              </div>
            </div>
          )}
          {analysisError && !analyzing && (
            <div className="analysis-state analysis-state--error" role="alert">
              <FiAlertCircle />
              <span>{analysisError}</span>
            </div>
          )}

          {analysis && (
            <div className="analysis-result" aria-live="polite">
              <div className="analysis-result__topline">
                <div>
                  <span className="analysis-result__eyebrow">
                    <FiTarget /> RESUME INSIGHTS
                  </span>
                  <h3>Analysis for {analysis.targetRole}</h3>
                </div>
                <button
                  type="button"
                  className="analysis-result__reset"
                  onClick={startAnotherAnalysis}
                >
                  <FiRefreshCw /> New analysis
                </button>
              </div>

              <div className="analysis-score-panel">
                <div
                  className="analysis-score-ring"
                  style={{ "--score-progress": `${analysis.atsScore}%` }}
                  role="img"
                  aria-label={`Estimated ATS-style Score: ${analysis.atsScore} out of 100`}
                >
                  <div className="analysis-score-ring__inner">
                    <strong>{analysis.atsScore}</strong>
                    <span>out of 100</span>
                  </div>
                </div>
                <div className="analysis-score-panel__copy">
                  <span className="analysis-score-panel__label">
                    Estimated ATS-style Score
                  </span>
                  <p>{analysis.summary}</p>
                  <span className="analysis-score-panel__disclaimer">
                    <FiInfo /> An estimate based on this resume and target role,
                    not an ATS vendor score or hiring outcome.
                  </span>
                </div>
              </div>

              <section
                className="analysis-breakdown"
                aria-labelledby="analysis-breakdown-title"
              >
                <div className="analysis-subsection-heading">
                  <div>
                    <span className="analysis-result__eyebrow">
                      HOW IT ADDS UP
                    </span>
                    <h4 id="analysis-breakdown-title">Score breakdown</h4>
                  </div>
                  <span className="analysis-breakdown__total">
                    {analysis.atsScore}
                    <small> / 100</small>
                  </span>
                </div>
                <div className="analysis-breakdown__grid">
                  {[
                    ["Skills match", analysis.scoreBreakdown.skillsMatch],
                    [
                      "Experience & projects",
                      analysis.scoreBreakdown.experienceAndProjects,
                    ],
                    ["Role keywords", analysis.scoreBreakdown.roleKeywords],
                    [
                      "Clarity & evidence",
                      analysis.scoreBreakdown.clarityAndEvidence,
                    ],
                  ].map(([label, item]) => (
                    <div className="analysis-breakdown__item" key={label}>
                      <div>
                        <strong>{label}</strong>
                        <span>
                          {item.score}
                          <small> / 25</small>
                        </span>
                      </div>
                      <p>{item.rationale}</p>
                      <span className="analysis-breakdown__track">
                        <i style={{ width: `${item.score * 4}%` }} />
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="analysis-skills-grid">
                <section
                  className="analysis-skill-section"
                  aria-labelledby="skills-found-title"
                >
                  <div className="analysis-subsection-heading">
                    <div>
                      <span className="analysis-result__eyebrow">
                        EVIDENCE IN YOUR PDF
                      </span>
                      <h4 id="skills-found-title">
                        Skills Found in Your Resume
                      </h4>
                    </div>
                    <span className="analysis-skill-count analysis-skill-count--found">
                      {analysis.extractedSkills.length}
                    </span>
                  </div>
                  {analysis.extractedSkills.length ? (
                    <div className="analysis-skill-list">
                      {analysis.extractedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="analysis-skill-badge analysis-skill-badge--found"
                        >
                          <FiCheck />
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="analysis-empty">
                      No clearly supported skills were detected in the extracted
                      text.
                    </p>
                  )}
                </section>
                <section
                  className="analysis-skill-section analysis-skill-section--missing"
                  aria-labelledby="skills-missing-title"
                >
                  <div className="analysis-subsection-heading">
                    <div>
                      <span className="analysis-result__eyebrow">
                        FOR {analysis.targetRole.toUpperCase()}
                      </span>
                      <h4 id="skills-missing-title">
                        Target-Role Skills Not Detected
                      </h4>
                    </div>
                    <span className="analysis-skill-count analysis-skill-count--missing">
                      {analysis.missingSkills.length}
                    </span>
                  </div>
                  {analysis.missingSkills.length ? (
                    <div className="analysis-skill-list">
                      {analysis.missingSkills.map((skill) => (
                        <span
                          key={skill}
                          className="analysis-skill-badge analysis-skill-badge--missing"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="analysis-empty">
                      All role skills in this comparison were detected in your
                      resume.
                    </p>
                  )}
                  <p className="analysis-skill-note">
                    Not detected means the resume may not show this skill; it
                    does not mean you lack it.
                  </p>
                </section>
              </div>

              <section
                className="analysis-recommendations"
                aria-labelledby="analysis-recommendations-title"
              >
                <div className="analysis-subsection-heading">
                  <div>
                    <span className="analysis-result__eyebrow">
                      YOUR NEXT EDITS
                    </span>
                    <h4 id="analysis-recommendations-title">
                      Personalized recommendations
                    </h4>
                  </div>
                </div>
                <ol>
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={`${index}-${suggestion}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{suggestion}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Profile;
