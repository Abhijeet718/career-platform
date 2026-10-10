import api from "../../../shared/api"

export async function register({ username, email, password, role, companyName }) {
    const response = await api.post('/api/auth/register', {
        username, email, password, role, ...(companyName && { companyName })
    })
    return response.data.data
}

export async function login({ email, password }) {
    const response = await api.post("/api/auth/login", {
        email, password
    })
    return response.data.data
}

export async function logout() {
    const response = await api.get("/api/auth/logout")
    return response.data.data
}

export async function getMe() {
    const response = await api.get("/api/auth/get-me")
    return response.data.data
}

export async function updateProfile(fields) {
    const response = await api.patch("/api/auth/profile", fields)
    return response.data.data
}