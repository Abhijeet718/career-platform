import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { FiSearch } from 'react-icons/fi'
import { getApplicantsForJob, updateApplicationStatus } from '../../jobs/services/jobs.api'
import { useToast } from '../../../shared/ToastContext'
import '../../student/jobs.scss'
import '../recruiter.scss'

const STATUS_OPTIONS = ['applied', 'shortlisted', 'rejected', 'interviewing', 'offered']

const ApplicantsView = () => {
    const { jobId } = useParams()
    const navigate = useNavigate()
    const { showToast } = useToast()

    const [applications, setApplications] = useState([])
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("")
    const [search, setSearch] = useState("")

    const fetchApplicants = async (page = 1) => {
        setLoading(true)
        try {
            const filters = { page, limit: pagination.limit }
            if (statusFilter) filters.status = statusFilter
            if (search) filters.search = search
            const data = await getApplicantsForJob(jobId, filters)
            setApplications(data.applications)
            setPagination(data.pagination)
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to load applicants.', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchApplicants(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter])

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        fetchApplicants(1)
    }

    const handleStatusChange = async (applicationId, newStatus) => {
        try {
            await updateApplicationStatus(applicationId, newStatus)
            showToast('Status updated.', 'success')
            setApplications(prev => prev.map(a => a._id === applicationId ? { ...a, status: newStatus } : a))
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update status.', 'error')
        }
    }

    const goToPage = (page) => {
        if (page < 1 || page > pagination.totalPages) return
        fetchApplicants(page)
    }

    return (
        <main className="page-shell">
            <button className="button secondary-button" onClick={() => navigate('/')}>← Back to my jobs</button>

            <div className="page-shell__header">
                <h1>Applicants</h1>
            </div>

            <form className="applicant-filters" onSubmit={handleSearchSubmit}>
                <div className="applicant-filters__search-wrap">
                    <FiSearch size={14} />
                    <input
                        placeholder="Search by name or skill..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All statuses</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="button secondary-button">Search</button>
            </form>

            {loading && applications.length === 0 && <p className="loading-state">Loading applicants...</p>}
            {!loading && applications.length === 0 && <p className="empty-state">No applicants match these filters.</p>}

            <div className="applicants-list">
                {applications.map(app => (
                    <div key={app._id} className="applicant-card">
                        <div className="applicant-card__info">
                            <h3>{app.applicant?.username}</h3>
                            <p className="applicant-card__email">{app.applicant?.email}</p>
                            <div className="job-card__skills">
                                {(app.applicant?.skills || []).map(skill => (
                                    <span key={skill} className="skill-chip">{skill}</span>
                                ))}
                            </div>
                        </div>
                        <div className="applicant-card__actions">
                            <span className="applicant-card__score">{app.matchScore}% match</span>
                            <select value={app.status} onChange={(e) => handleStatusChange(app._id, e.target.value)}>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
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

export default ApplicantsView