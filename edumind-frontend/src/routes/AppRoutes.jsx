import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";

import ProtectedRoute from "../components/auth/ProtectedRoute";

import { useAuth } from "../context/AuthContext";

import Dashboard from "../pages/Dashboard/Dashboard";
import Library from "../pages/Library/Library";
import Tutor from "../pages/Tutor/Tutor";
import Quiz from "../pages/Quiz/Quiz";
import Flashcards from "../pages/Flashcards/Flashcards";
import Analytics from "../pages/Analytics/Analytics";
import Planner from "../pages/Planner/Planner";
import Exam from "../pages/Exam/Exam";
import MaterialDetails from "../pages/Library/MaterialDetails";
import Settings from "../pages/Settings/Settings";
import Profile from "../pages/Profile/Profile";

import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";


function PublicRoute({
    children,
}) {

    const {
        isAuthenticated,
        loading,
    } = useAuth();


    if (loading) {

        return (
            <div className="flex min-h-screen items-center justify-center bg-[#EEEEEE]">

                <div className="text-center">

                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#6FCF97]/30 border-t-[#1F6F5F]" />

                    <p className="text-sm font-medium text-gray-600">
                        Loading EduMind...
                    </p>

                </div>

            </div>
        );
    }


    if (isAuthenticated) {

        return (
            <Navigate
                to="/"
                replace
            />
        );
    }


    return children;
}


export default function AppRoutes() {

    return (

        <BrowserRouter>

            <Routes>

                {/* -------------------------------------- */}
                {/* Public Authentication Routes */}
                {/* -------------------------------------- */}

                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />


                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    }
                />


                {/* -------------------------------------- */}
                {/* Protected Application Routes */}
                {/* -------------------------------------- */}

                <Route element={<ProtectedRoute />}>

                    <Route
                        element={<AppLayout />}
                    >

                        <Route
                            path="/"
                            element={<Dashboard />}
                        />

                        <Route
                            path="/library"
                            element={<Library />}
                        />

                        <Route
                            path="/library/:id"
                            element={<MaterialDetails />}
                        />

                        <Route
                            path="/tutor"
                            element={<Tutor />}
                        />

                        <Route
                            path="/quiz"
                            element={<Quiz />}
                        />

                        <Route
                            path="/flashcards"
                            element={<Flashcards />}
                        />

                        <Route
                            path="/analytics"
                            element={<Analytics />}
                        />

                        <Route
                            path="/planner"
                            element={<Planner />}
                        />

                        <Route
                            path="/exam"
                            element={<Exam />}
                        />

                        <Route
                            path="/settings"
                            element={<Settings />}
                        />

                        <Route
                            path="/profile"
                            element={<Profile />}
                        />

                    </Route>

                </Route>


                {/* -------------------------------------- */}
                {/* Unknown Route */}
                {/* -------------------------------------- */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}