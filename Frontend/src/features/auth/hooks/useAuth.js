import { useContext, useState } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, updateProfile, getMe } from "../services/auth.api";

export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context
    const [error, setError] = useState(null)

    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        setError(null)
        try {
            const data = await login({ email, password })
            setUser(data.user)
            return true
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please try again.")
            return false
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password, role, companyName }) => {
        setLoading(true)
        setError(null)
        try {
            const data = await register({ username, email, password, role, companyName })
            setUser(data.user)
            return true
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.")
            return false
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        setError(null)
        try {
            await logout()
            setUser(null)
        } catch (err) {
            setError(err.response?.data?.message || "Logout failed. Please try again.")
        } finally {
            setLoading(false)
        }
    }

        const handleUpdateProfile = async (fields) => {
        setError(null)
        try {
            const data = await updateProfile(fields)
            setUser(data.user)
            return true
        } catch (err) {
            setError(err.response?.data?.message || "Could not update profile.")
            return false
        }
    }

    const refreshUser = async () => {
        try {
            const data = await getMe()
            setUser(data.user)
        } catch (err) {
            // If this fails, the user state just stays as it was.
        }
    }

    return { user, loading, error, handleRegister, handleLogin, handleLogout, handleUpdateProfile, refreshUser }
}