import api from "../../../shared/api"

export const getAllJobs = async (page = 1, limit = 10) => {
    const response = await api.get("/api/jobs", { params: { page, limit } })
    return response.data.data
}

export const getJobById = async (jobId) => {
    const response = await api.get(`/api/jobs/${jobId}`)
    return response.data.data.job
}

export const applyToJob = async (jobId) => {
    const response = await api.post(`/api/jobs/${jobId}/apply`)
    return response.data.data.application
}

export const createJob = async (jobData) => {
    const response = await api.post("/api/jobs", jobData)
    return response.data.data.job
}

export const getMyJobs = async (page = 1, limit = 10) => {
    const response = await api.get("/api/jobs/mine", { params: { page, limit } })
    return response.data.data
}

export const getApplicantsForJob = async (jobId, filters = {}) => {
    const response = await api.get(`/api/jobs/${jobId}/applicants`, { params: filters })
    return response.data.data
}

export const updateApplicationStatus = async (applicationId, status) => {
    const response = await api.patch(`/api/applications/${applicationId}/status`, { status })
    return response.data.data.application
}

export const getMyApplications = async (page = 1, limit = 10) => {
    const response = await api.get("/api/applications/mine", { params: { page, limit } })
    return response.data.data
}