import {
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    User,
    Mail,
    LockKeyhole,
    Eye,
    EyeOff,
    BookOpen,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";


export default function Register() {

    const navigate =
        useNavigate();


    const {
        register,
    } = useAuth();


    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");


        const trimmedName =
            name.trim();

        const trimmedEmail =
            email.trim();


        if (trimmedName.length < 2) {

            setError(
                "Name must contain at least 2 characters."
            );

            return;
        }


        if (!trimmedEmail) {

            setError(
                "Please enter your email address."
            );

            return;
        }


        if (password.length < 8) {

            setError(
                "Password must contain at least 8 characters."
            );

            return;
        }


        if (password !== confirmPassword) {

            setError(
                "Passwords do not match."
            );

            return;
        }


        try {

            setLoading(true);


            await register({
                name: trimmedName,
                email: trimmedEmail,
                password,
            });


            navigate(
                "/login",
                {
                    replace: true,
                    state: {
                        registered: true,
                    },
                }
            );

        } catch (err) {

            setError(
                err.message ||
                "Unable to create your account."
            );

        } finally {

            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-[#EEEEEE]">

            <div className="flex min-h-screen">

                {/* ---------------------------------------- */}
                {/* Left Branding */}
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
                                Your Learning Companion
                            </p>

                            <h1 className="text-5xl font-bold leading-tight">
                                Make every study
                                <br />
                                session count.
                            </h1>

                            <p className="mt-6 max-w-md text-base leading-7 text-white/75">
                                Create your EduMind account and
                                transform your study material into
                                an interactive learning experience.
                            </p>

                        </div>

                    </div>


                    <p className="text-sm text-white/50">
                        AI-powered learning with EduMind
                    </p>

                </div>


                {/* ---------------------------------------- */}
                {/* Register Section */}
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
                                    Create your account
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    Start your personalized learning journey.
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

                                {/* Name */}

                                <div className="mb-4">

                                    <label
                                        htmlFor="register-name"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Full name
                                    </label>


                                    <div className="relative">

                                        <User
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            id="register-name"
                                            type="text"
                                            value={name}
                                            onChange={(event) =>
                                                setName(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Your name"
                                            autoComplete="name"
                                            className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#2FA084] focus:ring-2 focus:ring-[#6FCF97]/30"
                                        />

                                    </div>

                                </div>


                                {/* Email */}

                                <div className="mb-4">

                                    <label
                                        htmlFor="register-email"
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
                                            id="register-email"
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

                                <div className="mb-4">

                                    <label
                                        htmlFor="register-password"
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
                                            id="register-password"
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
                                            placeholder="At least 8 characters"
                                            autoComplete="new-password"
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


                                {/* Confirm Password */}

                                <div className="mb-6">

                                    <label
                                        htmlFor="register-confirm-password"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Confirm password
                                    </label>


                                    <div className="relative">

                                        <LockKeyhole
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            id="register-confirm-password"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={confirmPassword}
                                            onChange={(event) =>
                                                setConfirmPassword(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Repeat your password"
                                            autoComplete="new-password"
                                            className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-12 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#2FA084] focus:ring-2 focus:ring-[#6FCF97]/30"
                                        />


                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    (current) =>
                                                        !current
                                                )
                                            }
                                            aria-label={
                                                showConfirmPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                                        >

                                            {showConfirmPassword ? (
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
                                        ? "Creating account..."
                                        : "Create account"
                                    }

                                </button>

                            </form>


                            {/* Login */}

                            <p className="mt-6 text-center text-sm text-gray-500">

                                Already have an account?{" "}

                                <Link
                                    to="/login"
                                    className="font-semibold text-[#1F6F5F] hover:underline"
                                >
                                    Sign in
                                </Link>

                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}