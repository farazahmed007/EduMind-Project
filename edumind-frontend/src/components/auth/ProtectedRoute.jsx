import {
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";


export default function ProtectedRoute() {

    const {
        isAuthenticated,
        loading,
    } = useAuth();


    const location =
        useLocation();


    // --------------------------------------------------
    // Wait while checking existing JWT
    // --------------------------------------------------

    if (loading) {

        return (
            <div className="flex min-h-screen items-center justify-center bg-[#EEEEEE]">
                <div className="text-center">

                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#6FCF97]/30 border-t-[#1F6F5F]" />

                    <p className="text-sm font-medium text-gray-600">
                        Checking your session...
                    </p>

                </div>
            </div>
        );
    }


    // --------------------------------------------------
    // Redirect unauthenticated users
    // --------------------------------------------------

    if (!isAuthenticated) {

        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname,
                }}
            />
        );
    }


    return <Outlet />;
}