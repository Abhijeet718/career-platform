import React from 'react'
import { useAuth } from '../features/auth/hooks/useAuth'
import StudentHome from '../features/student/pages/StudentHome'
import RecruiterHome from '../features/recruiter/pages/RecruiterHome'

const Home = () => {
    const { user } = useAuth()

    if (user?.role === 'recruiter') {
        return <RecruiterHome />
    }
    return <StudentHome />
}

export default Home