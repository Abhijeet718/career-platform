import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Home from "./shared/Home";
import JobDetail from "./features/student/pages/JobDetail";
import ApplicantsView from "./features/recruiter/pages/ApplicantsView";
import MyApplications from "./features/student/pages/MyApplications";
import Profile from "./features/student/pages/Profile";

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/",
        element: <Protected><Home /></Protected>
    },
    {
        path: "/jobs/:jobId",
        element: <Protected allowedRoles={['student']}><JobDetail /></Protected>
    },
    {
        path: "/applications",
        element: <Protected allowedRoles={['student']}><MyApplications /></Protected>
    },
    {
        path: "/profile",
        element: <Protected allowedRoles={['student']}><Profile /></Protected>
    },
    {
        path: "/recruiter/jobs/:jobId/applicants",
        element: <Protected allowedRoles={['recruiter']}><ApplicantsView /></Protected>
    }
])