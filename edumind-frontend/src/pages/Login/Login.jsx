import {
    useState,
} from "react";

import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    BookOpen,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";


export default function Login() {

    const navigate =
        useNavigate();

    const location =
        useLocation();


    const {
        login,
    } = useAuth();


    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");


        const normalizedEmail =
            email.trim();


        if (!normalizedEmail) {

            setError(
                "Please enter your email address."
            );

            return;
        }


        if (!password) {

            setError(
                "Please enter your password."
            );

            return;
        }


        try {

            setLoading(true);


            await login({
                email: normalizedEmail,
                password,
            });


            const destination =
                location.state?.from ||
                "/";


            navigate(
                destination,
                {
                    replace: true,
                }
            );

        } catch (err) {

            setError(
                err.message ||
                "Unable to log in. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-[#EEEEEE]">

            <div className="flex min-h-screen">

                {/* ---------------------------------------- */}
                {/* Left Branding Section */}
                {/* ---------------------------------------- */}

                <div className="hidden w-1/2 flex-col justify-between bg-[#1F6F5F] p-12 text-white lg:flex">

                    <div>

                        <div className="mb-8 flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">

                                <BookOpen
                                    size={24}
                                />

                            </div>

                            <span className="text-2xl font-bold">
                                EduMind
                            </span>

                        </div>


                        <div className="max-w-lg">

                            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#A8E6BF]">
                                Adaptive Learning
                            </p>

                            <h1 className="text-5xl font-bold leading-tight">
                                Learn smarter.
                                <br />
                                Study better.
                            </h1>

                            <p className="mt-6 max-w-md text-base leading-7 text-white/75">
                                Turn your study material into
                                personalized summaries, AI tutoring,
                                quizzes, flashcards, and learning
                                insights.
                            </p>

                        </div>

                    </div>


                    <p className="text-sm text-white/50">
                        AI-powered learning with EduMind
                    </p>

                </div>


                {/* ---------------------------------------- */}
                {/* Login Section */}
                {/* ---------------------------------------- */}

                <div className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">

                    <div className="w-full max-w-md">

                        {/* Mobile Logo */}

                        <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6FCF97]/30 text-[#1F6F5F]">

                                <BookOpen
                                    size={24}
                                />

                            </div>

                            <span className="text-2xl font-bold text-[#1F6F5F]">
                                EduMind
                            </span>

                        </div>


                        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

                            <div className="mb-8">

                                <h2 className="text-2xl font-bold text-gray-900">
                                    Welcome back
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    Sign in to continue your learning journey.
                                </p>

                            </div>


                            {/* Error */}

                            {error && (

                                <div
                                    role="alert"
                                    className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                >
                                    {error}
                                </div>

                            )}


                            <form
                                onSubmit={handleSubmit}
                                noValidate
                            >

                                {/* Email */}

                                <div className="mb-5">

                                    <label
                                        htmlFor="login-email"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Email address
                                    </label>


                                    <div className="relative">

                                        <Mail
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            id="login-email"
                                            type="email"
                                            value={email}
                                            onChange={(event) =>
                                                setEmail(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#2FA084] focus:ring-2 focus:ring-[#6FCF97]/30"
                                        />

                                    </div>

                                </div>


                                {/* Password */}

                                <div className="mb-6">

                                    <label
                                        htmlFor="login-password"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Password
                                    </label>


                                    <div className="relative">

                                        <LockKeyhole
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            id="login-password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-12 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#2FA084] focus:ring-2 focus:ring-[#6FCF97]/30"
                                        />


                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    (current) =>
                                                        !current
                                                )
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                                        >

                                            {showPassword ? (
                                                <EyeOff
                                                    size={18}
                                                />
                                            ) : (
                                                <Eye
                                                    size={18}
                                                />
                                            )}

                                        </button>

                                    </div>

                                </div>


                                {/* Submit */}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex h-12 w-full items-center justify-center rounded-xl bg-[#1F6F5F] text-sm font-semibold text-white transition hover:bg-[#185B4D] disabled:cursor-not-allowed disabled:opacity-60"
                                >

                                    {loading
                                        ? "Signing in..."
                                        : "Sign in"
                                    }

                                </button>

                            </form>


                            {/* Register */}

                            <p className="mt-6 text-center text-sm text-gray-500">

                                Don't have an account?{" "}

                                <Link
                                    to="/register"
                                    className="font-semibold text-[#1F6F5F] hover:underline"
                                >
                                    Create one
                                </Link>

                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}