import api from "../../../shared/api"

export const analyzeResume = async (file, targetRole) => {
    const formData = new FormData()
    formData.append("resume", file)
    if (targetRole) formData.append("targetRole", targetRole)

    const response = await api.post("/api/resume/analyze", formData)
    return response.data.data
}