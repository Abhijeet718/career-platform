import { createContext, useState, useEffect } from "react";
import { getMe } from "./services/auth.api";

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                const response = await getMe();
                setUser(response?.user ?? null);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        checkExistingSession()
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    )
}