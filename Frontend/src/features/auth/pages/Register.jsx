import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Register = () => {
    const navigate = useNavigate()
    const { loading, error, handleRegister } = useAuth()

    const [role, setRole] = useState("student")
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [companyName, setCompanyName] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        const success = await handleRegister({ username, email, password, role, companyName })
        if (success) {
            navigate("/")
        }
    }

    if (loading) {
        return (<main><h1>Loading.......</h1></main>)
    }

    return (
        <main>
            <div className="form-container">
                <h1>Register</h1>
                {error && <p className="form-error" role="alert">{error}</p>}

                <div className="role-toggle">
                    <button type="button" className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}>
                        I'm a Student
                    </button>
                    <button type="button" className={role === 'recruiter' ? 'active' : ''} onClick={() => setRole('recruiter')}>
                        I'm a Recruiter
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            onChange={(e) => { setUsername(e.target.value) }}
                            type="text" id="username" name='username' placeholder='Enter username' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Enter email address' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password (min. 8 characters)' />
                    </div>

                    {role === 'recruiter' && (
                        <div className="input-group">
                            <label htmlFor="companyName">Company Name</label>
                            <input
                                onChange={(e) => { setCompanyName(e.target.value) }}
                                type="text" id="companyName" name='companyName' placeholder='Enter your company name' />
                        </div>
                    )}

                    <button className='button primary-button'>Register</button>
                </form>

                <p>Already have an account? <Link to={"/login"}>Login</Link></p>
            </div>
        </main>
    )
}

export default Register