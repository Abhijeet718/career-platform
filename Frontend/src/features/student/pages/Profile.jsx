import React, { useState, useRef } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useToast } from '../../../shared/ToastContext'
import { analyzeResume } from '../services/resume.api'
import '../jobs.scss'
import '../profile.scss'

const Profile = () => {
    const { user, handleUpdateProfile, refreshUser } = useAuth()
    const { showToast } = useToast()

    const [skillsInput, setSkillsInput] = useState((user?.skills || []).join(', '))
    const [savingSkills, setSavingSkills] = useState(false)

    const [targetRole, setTargetRole] = useState("")
    const [analyzing, setAnalyzing] = useState(false)
    const [analysis, setAnalysis] = useState(null)
    const fileInputRef = useRef()

    const handleSaveSkills = async (e) => {
        e.preventDefault()
        setSavingSkills(true)
        try {
            const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean)
            const success = await handleUpdateProfile({ skills })
            if (success) {
                showToast('Skills updated.', 'success')
            }
        } finally {
            setSavingSkills(false)
        }
    }

    const handleAnalyze = async (e) => {
        e.preventDefault()
        const file = fileInputRef.current?.files[0]
        if (!file) {
            showToast('Please select a PDF resume first.', 'error')
            return
        }

        setAnalyzing(true)
        setAnalysis(null)
        try {
            const data = await analyzeResume(file, targetRole)
            setAnalysis(data.analysis)
            setSkillsInput(data.updatedSkills.join(', '))
            await refreshUser()
            showToast('Resume analyzed! Your skills have been updated.', 'success')
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to analyze resume.', 'error')
        } finally {
            setAnalyzing(false)
        }
    }

    return (
        <main className="jobs-page">
            <h1>Profile</h1>

            <section className="profile-section">
                <h2>Your Skills</h2>
                <form onSubmit={handleSaveSkills} className="profile-form">
                    <textarea
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        placeholder="e.g. Java, React, MongoDB, Node.js"
                        rows={2}
                    />
                    <button className="button primary-button" disabled={savingSkills}>
                        {savingSkills ? 'Saving...' : 'Save Skills'}
                    </button>
                </form>
            </section>

            <section className="profile-section">
                <h2>AI Resume Analysis</h2>
                <p className="profile-hint">
                    Upload your resume (PDF) to auto-extract your skills and get an ATS-style score
                    with improvement suggestions. This will overwrite your manually entered skills above.
                </p>
                <form onSubmit={handleAnalyze} className="profile-form">
                    <input type="file" accept=".pdf,application/pdf" ref={fileInputRef} />
                    <input
                        type="text"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="Target role (optional, e.g. Backend Developer)"
                    />
                    <button className="button primary-button" disabled={analyzing}>
                        {analyzing ? 'Analyzing...' : 'Analyze Resume'}
                    </button>
                </form>

                {analysis && (
                    <div className="analysis-result">
                        <div className="analysis-result__score">
                            <span className="analysis-result__score-value">{analysis.atsScore}</span>
                            <span className="analysis-result__score-label">ATS Score</span>
                        </div>
                        <p className="analysis-result__summary">{analysis.summary}</p>

                        <h3>Extracted Skills</h3>
                        <div className="job-card__skills">
                            {analysis.extractedSkills.map(skill => (
                                <span key={skill} className="skill-chip">{skill}</span>
                            ))}
                        </div>

                        <h3>Suggestions</h3>
                        <ul className="analysis-result__suggestions">
                            {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </div>
                )}
            </section>
        </main>
    )
}

export default Profile