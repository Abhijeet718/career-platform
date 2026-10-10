import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from 'react'
import AppHeader from "./AppHeader";

const Protected = ({ children, allowedRoles }) => {
    const { loading, user } = useAuth()

    if (loading) {
        return (<main><h1>Loading...</h1></main>)
    }

    if (!user) {
        return <Navigate to={'/login'} />
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={'/'} />
    }

    return (
        <>
            <AppHeader />
            {children}
        </>
    )
}

export default Protected