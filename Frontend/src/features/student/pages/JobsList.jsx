import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { getAllJobs } from '../../jobs/services/jobs.api'
import { useToast } from '../../../shared/ToastContext'
import '../jobs.scss'

const JobsList = () => {
    const [jobs, setJobs] = useState([])
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const { showToast } = useToast()

    const fetchJobs = async (page = 1) => {
        setLoading(true)
        try {
            const data = await getAllJobs(page, pagination.limit)
            setJobs(data.jobs)
            setPagination(data.pagination)
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to load jobs.', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchJobs(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const goToPage = (page) => {
        if (page < 1 || page > pagination.totalPages) return
        fetchJobs(page)
    }

    if (loading && jobs.length === 0) {
        return <main className="jobs-page"><p>Loading jobs...</p></main>
    }

    return (
        <main className="jobs-page">
            <h1>Open Positions</h1>

            {jobs.length === 0 && <p className="jobs-empty">No open jobs right now — check back soon.</p>}

            <div className="jobs-list">
                {jobs.map(job => (
                    <div key={job._id} className="job-card" onClick={() => navigate(`/jobs/${job._id}`)}>
                        <h2>{job.title}</h2>
                        <p className="job-card__company">{job.postedBy?.companyName || job.postedBy?.username}</p>
                        {job.location && <p className="job-card__location">📍 {job.location}</p>}
                        <div className="job-card__skills">
                            {job.requiredSkills.slice(0, 5).map(skill => (
                                <span key={skill} className="skill-chip">{skill}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button className="pagination__btn" disabled={pagination.page <= 1 || loading} onClick={() => goToPage(pagination.page - 1)}>Previous</button>
                    <span className="pagination__label">Page {pagination.page} of {pagination.totalPages}</span>
                    <button className="pagination__btn" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => goToPage(pagination.page + 1)}>Next</button>
                </div>
            )}
        </main>
    )
}

export default JobsList