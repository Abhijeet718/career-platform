import React, { useEffect, useState } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import { createDsaEntry, getMyDsaEntries, updateDsaEntry, deleteDsaEntry, getDsaStats } from '../services/dsa.api'
import { useToast } from '../../../shared/ToastContext'
import '../../student/jobs.scss'
import '../dsa.scss'

const TOPICS = ['array', 'string', 'linked-list', 'stack', 'queue', 'tree', 'graph', 'dynamic-programming', 'greedy', 'backtracking', 'binary-search', 'sliding-window', 'heap', 'other']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const STATUSES = ['solved', 'attempted', 'todo']

const DsaTracker = () => {
    const { showToast } = useToast()

    const [stats, setStats] = useState(null)
    const [entries, setEntries] = useState([])
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
    const [loading, setLoading] = useState(true)

    const [topicFilter, setTopicFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")

    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [title, setTitle] = useState("")
    const [topic, setTopic] = useState(TOPICS[0])
    const [difficulty, setDifficulty] = useState(DIFFICULTIES[0])
    const [status, setStatus] = useState("solved")
    const [platform, setPlatform] = useState("")
    const [url, setUrl] = useState("")
    const [notes, setNotes] = useState("")

    const fetchStats = async () => {
        try {
            const data = await getDsaStats()
            setStats(data)
        } catch (error) {
            // non-critical — the entry list still works without stats
        }
    }

    const fetchEntries = async (page = 1) => {
        setLoading(true)
        try {
            const filters = { page, limit: pagination.limit }
            if (topicFilter) filters.topic = topicFilter
            if (statusFilter) filters.status = statusFilter
            const data = await getMyDsaEntries(filters)
            setEntries(data.entries)
            setPagination(data.pagination)
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to load entries.', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
        fetchEntries(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topicFilter, statusFilter])

    const resetForm = () => {
        setTitle("")
        setTopic(TOPICS[0])
        setDifficulty(DIFFICULTIES[0])
        setStatus("solved")
        setPlatform("")
        setUrl("")
        setNotes("")
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await createDsaEntry({
                title, topic, difficulty, status,
                platform: platform || undefined,
                url: url || undefined,
                notes: notes || undefined
            })
            showToast('Problem logged!', 'success')
            resetForm()
            setShowForm(false)
            fetchStats()
            fetchEntries(1)
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to log problem.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleStatusChange = async (entryId, newStatus) => {
        try {
            await updateDsaEntry(entryId, { status: newStatus })
            setEntries((prev) => prev.map((e) => e._id === entryId ? { ...e, status: newStatus } : e))
            fetchStats()
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update.', 'error')
        }
    }

    const handleDelete = async (entryId) => {
        try {
            await deleteDsaEntry(entryId)
            setEntries((prev) => prev.filter((e) => e._id !== entryId))
            showToast('Entry deleted.', 'success')
            fetchStats()
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to delete.', 'error')
        }
    }

    const goToPage = (page) => {
        if (page < 1 || page > pagination.totalPages) return
        fetchEntries(page)
    }

    const maxTopicCount = stats ? Math.max(1, ...stats.topicBreakdown.map((t) => t.solved)) : 1

    return (
        <main className="page-shell dsa-page">
            <div className="page-shell__header">
                <h1>DSA Tracker</h1>
                <button className="button primary-button" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Log Problem'}
                </button>
            </div>

            {stats && (
                <section className="dsa-stats">
                    <div className="dsa-stats__top">
                        <div className="dsa-stat-card">
                            <span className="dsa-stat-card__value">{stats.totalSolved}</span>
                            <span className="dsa-stat-card__label">Problems Solved</span>
                        </div>
                        <div className="dsa-stat-card">
                            <span className="dsa-stat-card__value">{stats.currentStreak}</span>
                            <span className="dsa-stat-card__label">Day Streak</span>
                        </div>
                    </div>

                    {stats.weakestTopics.length > 0 && (
                        <div className="dsa-weak-areas">
                            <span className="dsa-weak-areas__label">Weakest areas:</span>
                            {stats.weakestTopics.map((t) => (
                                <span key={t} className="skill-chip">{t}</span>
                            ))}
                        </div>
                    )}

                    <div className="dsa-topic-breakdown">
                        {stats.topicBreakdown.map((t) => (
                            <div key={t.topic} className="dsa-topic-row">
                                <span className="dsa-topic-row__label">{t.topic}</span>
                                <div className="dsa-topic-row__bar-track">
                                    <div className="dsa-topic-row__bar-fill" style={{ width: `${(t.solved / maxTopicCount) * 100}%` }} />
                                </div>
                                <span className="dsa-topic-row__count">{t.solved}</span>
                            </div>
                        ))}
                    </div>

                    <div className="dsa-difficulty-breakdown">
                        <span>Easy: <strong>{stats.difficultyBreakdown.easy}</strong></span>
                        <span>Medium: <strong>{stats.difficultyBreakdown.medium}</strong></span>
                        <span>Hard: <strong>{stats.difficultyBreakdown.hard}</strong></span>
                    </div>
                </section>
            )}

            {showForm && (
                <form className="post-job-form" onSubmit={handleCreate}>
                    <div className="input-group">
                        <label htmlFor="dsa-title">Problem Title</label>
                        <input id="dsa-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Two Sum" required />
                    </div>
                    <div className="dsa-form-row">
                        <div className="input-group">
                            <label htmlFor="dsa-topic">Topic</label>
                            <select id="dsa-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
                                {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label htmlFor="dsa-difficulty">Difficulty</label>
                            <select id="dsa-difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label htmlFor="dsa-status">Status</label>
                            <select id="dsa-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="input-group">
                        <label htmlFor="dsa-platform">Platform (optional)</label>
                        <input id="dsa-platform" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="e.g. LeetCode" />
                    </div>
                    <div className="input-group">
                        <label htmlFor="dsa-url">Problem URL (optional)</label>
                        <input id="dsa-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="input-group">
                        <label htmlFor="dsa-notes">Notes (optional)</label>
                        <textarea id="dsa-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Approach, things to remember..." />
                    </div>
                    <button className="button primary-button" disabled={saving}>
                        {saving ? 'Saving...' : 'Log Problem'}
                    </button>
                </form>
            )}

            <div className="applicant-filters">
                <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
                    <option value="">All topics</option>
                    {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {loading && entries.length === 0 && <p className="loading-state">Loading...</p>}
            {!loading && entries.length === 0 && <p className="empty-state">No problems logged yet — add your first one above.</p>}

            <div className="dsa-entries-list">
                {entries.map((entry) => (
                    <div key={entry._id} className="dsa-entry-card">
                        <div className="dsa-entry-card__main">
                            <h3>{entry.title}</h3>
                            <div className="dsa-entry-card__meta">
                                <span className="skill-chip">{entry.topic}</span>
                                <span className={`difficulty-badge difficulty-badge--${entry.difficulty}`}>{entry.difficulty}</span>
                                {entry.platform && <span className="dsa-entry-card__platform">{entry.platform}</span>}
                            </div>
                        </div>
                        <div className="dsa-entry-card__actions">
                            <select value={entry.status} onChange={(e) => handleStatusChange(entry._id, e.target.value)}>
                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button className="dsa-entry-card__delete" onClick={() => handleDelete(entry._id)} aria-label="Delete entry">
                                <FiTrash2 size={14} />
                            </button>
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

export default DsaTracker