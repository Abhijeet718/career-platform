import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { getJobById, applyToJob } from '../../jobs/services/jobs.api'
import { useToast } from '../../../shared/ToastContext'
import '../jobs.scss'

const JobDetail = () => {
    const { jobId } = useParams()
    const navigate = useNavigate()
    const { showToast } = useToast()

    const [job, setJob] = useState(null)
    const [loading, setLoading] = useState(true)
    const [applying, setApplying] = useState(false)
    const [applied, setApplied] = useState(false)
    const [application, setApplication] = useState(null)

    useEffect(() => {
        const fetchJob = async () => {
            setLoading(true)
            try {
                const data = await getJobById(jobId)
                setJob(data)
            } catch (error) {
                showToast(error.response?.data?.message || 'Job not found.', 'error')
                navigate('/')
            } finally {
                setLoading(false)
            }
        }
        fetchJob()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId])

    const handleApply = async () => {
        setApplying(true)
        try {
            const app = await applyToJob(jobId)
            setApplication(app)
            setApplied(true)
            showToast('Application submitted!', 'success')
        } catch (error) {
            if (error.response?.status === 409) {
                setApplied(true)
                showToast('You already applied to this job.', 'info')
            } else {
                showToast(error.response?.data?.message || 'Failed to apply.', 'error')
            }
        } finally {
            setApplying(false)
        }
    }

    if (loading) {
        return <main className="jobs-page"><p>Loading...</p></main>
    }

    if (!job) return null

    return (
        <main className="jobs-page">
            <button className="button secondary-button" onClick={() => navigate('/')}>← Back to jobs</button>

            <div className="job-detail">
                <h1>{job.title}</h1>
                <p className="job-detail__company">{job.postedBy?.companyName || job.postedBy?.username}</p>
                {job.location && <p className="job-detail__location">📍 {job.location}</p>}

                <div className="job-card__skills">
                    {job.requiredSkills.map(skill => (
                        <span key={skill} className="skill-chip">{skill}</span>
                    ))}
                </div>

                <p className="job-detail__description">{job.description}</p>

                {application && (
                    <div className="match-result">
                        <p>Your match score: <strong>{application.matchScore}%</strong></p>
                        {application.missingSkills?.length > 0 && (
                            <p className="match-result__missing">Missing skills: {application.missingSkills.join(', ')}</p>
                        )}
                    </div>
                )}

                <button
                    className="button primary-button"
                    disabled={applying || applied}
                    onClick={handleApply}
                >
                    {applied ? 'Applied ✓' : applying ? 'Applying...' : 'Apply Now'}
                </button>
            </div>
        </main>
    )
}

export default JobDetail