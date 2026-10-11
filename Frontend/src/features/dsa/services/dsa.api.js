import api from "../../../shared/api"

export const createDsaEntry = async (entry) => {
    const response = await api.post("/api/dsa", entry)
    return response.data.data.entry
}

export const getMyDsaEntries = async (filters = {}) => {
    const response = await api.get("/api/dsa", { params: filters })
    return response.data.data
}

export const updateDsaEntry = async (entryId, fields) => {
    const response = await api.patch(`/api/dsa/${entryId}`, fields)
    return response.data.data.entry
}

export const deleteDsaEntry = async (entryId) => {
    await api.delete(`/api/dsa/${entryId}`)
}

export const getDsaStats = async () => {
    const response = await api.get("/api/dsa/stats")
    return response.data.data
}