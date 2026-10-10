import React from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import './app-header.scss'

const AppHeader = () => {
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()

    const onLogout = async () => {
        await handleLogout()
        navigate('/login')
    }

    return (
        <header className="app-header">
            <div className="app-header__brand" onClick={() => navigate('/')}>
                Career Platform
            </div>
            <nav className="app-header__nav">
                {user?.role === 'student' && (
                    <>
                        <Link to="/">Jobs</Link>
                        <Link to="/applications">My Applications</Link>
                        <Link to="/dsa">DSA Tracker</Link>
                        <Link to="/profile">Profile</Link>
                    </>
                )}
                {user?.role === 'recruiter' && (
                    <>
                        <Link to="/">My Jobs</Link>
                        <Link to="/dsa">DSA Tracker</Link>
                    </>
                )}
            </nav>
            <div className="app-header__right">
                {user && <span className="app-header__username">{user.username} <span className="app-header__role">({user.role})</span></span>}
                <button className="app-header__logout" onClick={onLogout}>
                    Logout
                </button>
            </div>
        </header>
    )
}

export default AppHeader