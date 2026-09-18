import {
    CalendarDays,
    Check,
    Edit3,
    Mail,
    Save,
    User,
    X,
    Camera,
    ShieldCheck,
    ArrowUpRight,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Profile() {
    const {
        user,
        authFetch,
        refreshUser,
    } = useAuth();

    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [imagePreview, setImagePreview] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        setName(user?.name || "");
        setEmail(user?.email || "");
    }, [user]);

    const profileImageUrl = user?.profile_image
        ? `${API_BASE_URL}${user.profile_image}`
        : null;

    const handleEdit = () => {
        setError("");
        setSuccess("");
        setName(user?.name || "");
        setEmail(user?.email || "");
        setIsEditing(true);
    };

    const handleCancel = () => {
        setName(user?.name || "");
        setEmail(user?.email || "");
        setError("");
        setSuccess("");
        setIsEditing(false);
    };

    const handleSave = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const trimmedName = name.trim();
        const trimmedEmail = email.trim();

        if (trimmedName.length < 2) {
            setError("Name must contain at least 2 characters.");
            return;
        }

        if (!trimmedEmail) {
            setError("Email address is required.");
            return;
        }

        try {
            setLoading(true);

            const response = await authFetch(
                `${API_BASE_URL}/api/auth/me`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: trimmedName,
                        email: trimmedEmail,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Unable to update your profile."
                );
            }

            await refreshUser();

            setSuccess("Profile updated successfully.");
            setIsEditing(false);
        } catch (error) {
            console.error("Profile update failed:", error);

            setError(
                error.message ||
                "Unable to update your profile."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleImageButtonClick = () => {
        if (imageLoading) {
            return;
        }

        fileInputRef.current?.click();
    };

    const handleImageChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");
        setSuccess("");

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            setError(
                "Please select a JPG, PNG, or WebP image."
            );

            event.target.value = "";
            return;
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            setError(
                "Profile image must be smaller than 5 MB."
            );

            event.target.value = "";
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);

        try {
            setImageLoading(true);

            const formData = new FormData();
            formData.append("file", file);

            const response = await authFetch(
                `${API_BASE_URL}/api/profile/image`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Unable to upload profile image."
                );
            }

            await refreshUser();

            setImagePreview(null);

            setSuccess(
                "Profile picture updated successfully."
            );
        } catch (error) {
            console.error(
                "Profile image upload failed:",
                error
            );

            setImagePreview(null);

            setError(
                error.message ||
                "Unable to upload profile image."
            );
        } finally {
            setImageLoading(false);
            event.target.value = "";
        }
    };

    const formatCreatedDate = () => {
        if (!user?.created_at) {
            return "Not available";
        }

        const date = new Date(user.created_at);

        if (Number.isNaN(date.getTime())) {
            return "Not available";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }
        );
    };

    const initial = (
        user?.name ||
        "U"
    )
        .charAt(0)
        .toUpperCase();

    const avatarImage =
        imagePreview ||
        profileImageUrl;

    const accountStatus =
        user?.is_active
            ? "Active"
            : "Inactive";

    return (
        <div className="min-h-full bg-[#f4f7f6]">
            <div className="mx-auto w-full max-w-[1450px] px-4 pb-10 pt-5 sm:px-6 sm:pb-12 lg:px-8 lg:pt-7 xl:px-10">

                {/* ================================================== */}
                {/* Page Header */}
                {/* ================================================== */}

                <motion.section
                    initial={{
                        opacity: 0,
                        y: 10,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.35,
                    }}
                    className="relative mb-6 overflow-hidden rounded-[26px] border border-[#dfeae5] bg-gradient-to-br from-white via-white to-[#eef9f4] px-5 py-6 shadow-[0_8px_32px_rgba(23,33,30,0.045)] sm:px-7 sm:py-7"
                >
                    <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#6fcf97]/10 blur-3xl" />

                    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-[#cdeee1]/25 blur-3xl" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex min-w-0 items-center gap-4">

                            {/* Clean Header Icon */}
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#cdeee1] bg-[#e8f6f0] text-[#1f6f5f] shadow-sm">
                                <User
                                    size={25}
                                    strokeWidth={2}
                                />
                            </div>

                            <div className="min-w-0">

                                <div className="mb-1.5 flex flex-wrap items-center gap-2">

                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7c938a]">
                                        Account
                                    </span>

                                    <span className="h-1 w-1 rounded-full bg-[#a9dfcc]" />

                                    <span className="text-[10px] font-semibold text-[#2fa084]">
                                        Personal profile
                                    </span>

                                </div>

                                <h1 className="text-[25px] font-bold tracking-[-0.03em] text-[#176b5b] sm:text-[29px]">
                                    My Profile
                                </h1>

                                <p className="mt-1 max-w-xl text-sm font-medium leading-5 text-[#7b8984]">
                                    Manage your identity, account details, and profile picture.
                                </p>

                            </div>
                        </div>

                        {!isEditing && (
                            <button
                                type="button"
                                onClick={handleEdit}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2fa084] px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(47,160,132,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#278c73] hover:shadow-[0_8px_22px_rgba(47,160,132,0.24)] focus:outline-none focus:ring-2 focus:ring-[#6fcf97]/40 focus:ring-offset-2"
                            >
                                <Edit3 size={16} />
                                Edit Profile
                            </button>
                        )}
                    </div>
                </motion.section>

                {/* ================================================== */}
                {/* Feedback */}
                {/* ================================================== */}

                {success && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: -6,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        className="mb-5 flex items-center gap-3 rounded-2xl border border-[#cdeee1] bg-[#f3faf7] px-4 py-3.5 text-sm font-semibold text-[#287762] shadow-sm"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dff3e9] text-[#2fa084]">
                            <Check
                                size={16}
                                strokeWidth={2.5}
                            />
                        </span>

                        <span>{success}</span>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: -6,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        className="mb-5 rounded-2xl border border-[#f0d8d8] bg-[#fff7f7] px-4 py-3.5 text-sm font-semibold text-[#a85b5b] shadow-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {/* ================================================== */}
                {/* Main Profile Card */}
                {/* ================================================== */}

                <motion.section
                    initial={{
                        opacity: 0,
                        y: 12,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.4,
                        delay: 0.05,
                    }}
                    className="overflow-visible rounded-[26px] border border-[#dfe7e3] bg-white shadow-[0_8px_34px_rgba(23,33,30,0.055)]"
                >

                    {/* ================================================== */}
                    {/* Banner */}
                    {/* ================================================== */}

                    <div className="relative h-32 overflow-hidden rounded-t-[26px] bg-gradient-to-r from-[#dff4eb] via-[#eaf8f2] to-[#f3faf7] sm:h-36">

                        <div className="absolute -right-12 -top-20 h-48 w-48 rounded-full bg-white/50 blur-2xl" />

                        <div className="absolute bottom-[-90px] left-[45%] h-52 w-52 rounded-full bg-[#6fcf97]/10 blur-3xl" />

                        <div className="absolute right-6 top-5 hidden items-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 backdrop-blur-sm sm:flex">

                            <ShieldCheck
                                size={14}
                                className="text-[#2fa084]"
                            />

                            <span className="text-[10px] font-bold text-[#4d7569]">
                                Account secured
                            </span>

                        </div>
                    </div>

                    {/* ================================================== */}
                    {/* Identity Area */}
                    {/* ================================================== */}

                    <div className="px-5 pb-7 sm:px-8 sm:pb-8">

                        {/*
                            IMPORTANT:
                            This is intentionally a GRID rather than the
                            previous flex layout.

                            Column 1 = avatar
                            Column 2 = identity
                            Column 3 = account status

                            This prevents the avatar from visually
                            colliding with / covering the user's name.
                        */}

                        <div className="relative -mt-12 grid grid-cols-[112px_minmax(0,1fr)] items-end gap-x-5 gap-y-4 sm:-mt-14 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:gap-x-5">

                            {/* ================================================== */}
                            {/* Avatar */}
                            {/* ================================================== */}

                            <div className="relative z-20 h-28 w-28 shrink-0">

                                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-[#cdeee1] text-3xl font-bold text-[#1f6f5f] shadow-[0_8px_24px_rgba(23,33,30,0.14)]">

                                    {avatarImage ? (
                                        <img
                                            src={avatarImage}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        initial
                                    )}

                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />

                                <button
                                    type="button"
                                    onClick={handleImageButtonClick}
                                    disabled={imageLoading}
                                    className="absolute bottom-0 right-0 z-30 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-[#2fa084] text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-[#278c73] disabled:cursor-not-allowed disabled:opacity-60"
                                    aria-label="Change profile picture"
                                    title="Change profile picture"
                                >
                                    <Camera size={16} />
                                </button>

                                {imageLoading && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/25">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    </div>
                                )}

                            </div>

                            {/* ================================================== */}
                            {/* User Identity */}
                            {/* ================================================== */}

                            <div className="min-w-0 self-end pb-1.5">

                                <h2 className="block whitespace-nowrap text-2xl font-bold tracking-[-0.02em] text-[#17211e] sm:text-[27px]">
                                    {user?.name || "Student"}
                                </h2>

                                <p className="mt-1 whitespace-nowrap text-sm font-medium text-[#7a8983]">
                                    EduMind Student
                                </p>

                            </div>

                            {/* ================================================== */}
                            {/* Account Status */}
                            {/* ================================================== */}

                            <div className="col-span-2 shrink-0 sm:col-span-1 sm:self-end sm:pb-1">

                                <span className="inline-flex items-center gap-2 rounded-full border border-[#d6ede3] bg-[#f2faf6] px-3.5 py-2 text-xs font-bold text-[#287762]">

                                    <span className="h-1.5 w-1.5 rounded-full bg-[#2fa084]" />

                                    {accountStatus} Account

                                </span>

                            </div>

                        </div>

                        {/* ================================================== */}
                        {/* Divider */}
                        {/* ================================================== */}

                        <div className="my-8 h-px bg-[#edf1ef]" />

                        {/* ================================================== */}
                        {/* Account Information */}
                        {/* ================================================== */}

                        <div>

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">

                                <div>

                                    <h3 className="text-lg font-bold tracking-[-0.01em] text-[#17211e]">
                                        Account Information
                                    </h3>

                                    <p className="mt-1 text-sm font-medium text-[#82908b]">
                                        Your basic EduMind account details.
                                    </p>

                                </div>

                                {!isEditing && (
                                    <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-[#a0aca7] sm:block">
                                        Read only
                                    </span>
                                )}

                            </div>

                            <form
                                onSubmit={handleSave}
                                className="mt-6 grid gap-5 lg:grid-cols-2"
                            >

                                {/* ================================================== */}
                                {/* Name */}
                                {/* ================================================== */}

                                <div>

                                    <label
                                        htmlFor="profile-name"
                                        className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#697973]"
                                    >
                                        Full Name
                                    </label>

                                    <div className="relative">

                                        <User
                                            size={17}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa7a2]"
                                        />

                                        <input
                                            id="profile-name"
                                            type="text"
                                            value={name}
                                            onChange={(event) =>
                                                setName(event.target.value)
                                            }
                                            disabled={!isEditing}
                                            className={`w-full rounded-xl border py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition-all duration-200 ${
                                                isEditing
                                                    ? "border-[#cfdcd7] bg-white text-[#17211e] placeholder:text-[#a4afab] focus:border-[#2fa084] focus:ring-4 focus:ring-[#2fa084]/10"
                                                    : "border-[#e5ebe8] bg-[#f7f9f8] text-[#53635d]"
                                            }`}
                                        />

                                    </div>
                                </div>

                                {/* ================================================== */}
                                {/* Email */}
                                {/* ================================================== */}

                                <div>

                                    <label
                                        htmlFor="profile-email"
                                        className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#697973]"
                                    >
                                        Email Address
                                    </label>

                                    <div className="relative">

                                        <Mail
                                            size={17}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa7a2]"
                                        />

                                        <input
                                            id="profile-email"
                                            type="email"
                                            value={email}
                                            onChange={(event) =>
                                                setEmail(event.target.value)
                                            }
                                            disabled={!isEditing}
                                            className={`w-full rounded-xl border py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition-all duration-200 ${
                                                isEditing
                                                    ? "border-[#cfdcd7] bg-white text-[#17211e] placeholder:text-[#a4afab] focus:border-[#2fa084] focus:ring-4 focus:ring-[#2fa084]/10"
                                                    : "border-[#e5ebe8] bg-[#f7f9f8] text-[#53635d]"
                                            }`}
                                        />

                                    </div>
                                </div>

                                {/* ================================================== */}
                                {/* Account Created */}
                                {/* ================================================== */}

                                <div className="lg:col-span-2">

                                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#697973]">
                                        Account Created
                                    </label>

                                    <div className="flex items-center gap-3 rounded-xl border border-[#e5ebe8] bg-[#f7f9f8] px-4 py-3.5 text-sm font-medium text-[#53635d]">

                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#7d8d86] shadow-sm">
                                            <CalendarDays size={16} />
                                        </span>

                                        {formatCreatedDate()}

                                    </div>
                                </div>

                                {/* ================================================== */}
                                {/* Edit Actions */}
                                {/* ================================================== */}

                                {isEditing && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            height: 0,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            height: "auto",
                                        }}
                                        className="flex flex-col gap-3 border-t border-[#edf1ef] pt-5 sm:flex-row sm:justify-end lg:col-span-2"
                                    >

                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={loading}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d9e2de] bg-white px-5 py-3 text-sm font-semibold text-[#53635d] transition-all duration-200 hover:bg-[#f7f9f8] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <X size={16} />
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2fa084] px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(47,160,132,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#278c73] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Save size={16} />

                                            {loading
                                                ? "Saving..."
                                                : "Save Changes"}

                                        </button>

                                    </motion.div>
                                )}

                            </form>
                        </div>
                    </div>
                </motion.section>

                {/* ================================================== */}
                {/* Supporting Cards */}
                {/* ================================================== */}

                <div className="mt-6 grid gap-5 lg:grid-cols-3">

                    {/* ================================================== */}
                    {/* Learning Role */}
                    {/* ================================================== */}

                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 10,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            delay: 0.1,
                        }}
                        className="group rounded-[22px] border border-[#dfe7e3] bg-white p-5 shadow-[0_6px_24px_rgba(23,33,30,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(23,33,30,0.07)]"
                    >

                        <div className="flex items-start justify-between">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d7eee4] bg-[#e8f6f0] text-[#1f6f5f]">

                                <User
                                    size={20}
                                    strokeWidth={2}
                                />

                            </div>

                            <ArrowUpRight
                                size={16}
                                className="text-[#b2beb9] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            />

                        </div>

                        <div className="mt-5">

                            <h3 className="font-bold text-[#17211e]">
                                Learning Role
                            </h3>

                            <p className="mt-1 text-xs font-medium leading-5 text-[#87938e]">
                                Your current role in the EduMind learning environment.
                            </p>

                        </div>

                        <div className="mt-5 rounded-xl border border-[#e5f0eb] bg-[#f6faf8] px-4 py-3.5">

                            <p className="text-sm font-bold text-[#1f6f5f]">
                                Student
                            </p>

                            <p className="mt-1 text-xs font-medium leading-5 text-[#71817b]">
                                Your learning experience is personalized around your study activity.
                            </p>

                        </div>

                    </motion.div>

                    {/* ================================================== */}
                    {/* Account Status */}
                    {/* ================================================== */}

                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 10,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            delay: 0.15,
                        }}
                        className="group rounded-[22px] border border-[#dfe7e3] bg-white p-5 shadow-[0_6px_24px_rgba(23,33,30,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(23,33,30,0.07)]"
                    >

                        <div className="flex items-start justify-between">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d7eee4] bg-[#e8f6f0] text-[#1f6f5f]">

                                <ShieldCheck
                                    size={20}
                                    strokeWidth={2}
                                />

                            </div>

                            <ArrowUpRight
                                size={16}
                                className="text-[#b2beb9] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            />

                        </div>

                        <div className="mt-5">

                            <h3 className="font-bold text-[#17211e]">
                                Account Status
                            </h3>

                            <p className="mt-1 text-xs font-medium leading-5 text-[#87938e]">
                                Current availability of your EduMind account.
                            </p>

                        </div>

                        <div className="mt-5 rounded-xl border border-[#e5f0eb] bg-[#f6faf8] px-4 py-3.5">

                            <div className="flex items-center gap-2">

                                <span
                                    className={`h-2 w-2 rounded-full ${
                                        user?.is_active
                                            ? "bg-[#2fa084]"
                                            : "bg-[#c96363]"
                                    }`}
                                />

                                <p
                                    className={`text-sm font-bold ${
                                        user?.is_active
                                            ? "text-[#1f6f5f]"
                                            : "text-[#a85b5b]"
                                    }`}
                                >
                                    {accountStatus}
                                </p>

                            </div>

                            <p className="mt-1 text-xs font-medium leading-5 text-[#71817b]">
                                Your account is currently available for use.
                            </p>

                        </div>

                    </motion.div>

                    {/* ================================================== */}
                    {/* Profile Picture */}
                    {/* ================================================== */}

                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 10,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            delay: 0.2,
                        }}
                        className="group rounded-[22px] border border-[#dfe7e3] bg-white p-5 shadow-[0_6px_24px_rgba(23,33,30,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(23,33,30,0.07)]"
                    >

                        <div className="flex items-start justify-between">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d7eee4] bg-[#e8f6f0] text-[#1f6f5f]">

                                <Camera
                                    size={20}
                                    strokeWidth={2}
                                />

                            </div>

                            <ArrowUpRight
                                size={16}
                                className="text-[#b2beb9] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            />

                        </div>

                        <div className="mt-5">

                            <h3 className="font-bold text-[#17211e]">
                                Profile Picture
                            </h3>

                            <p className="mt-1 text-xs font-medium leading-5 text-[#87938e]">
                                Keep your account identity recognizable across EduMind.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={handleImageButtonClick}
                            disabled={imageLoading}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7e8e1] bg-[#f7faf9] px-4 py-3 text-xs font-bold text-[#2b7765] transition-all duration-200 hover:border-[#b9ded0] hover:bg-[#edf8f3] disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            <Camera size={15} />

                            {imageLoading
                                ? "Uploading..."
                                : "Change Picture"}

                        </button>

                    </motion.div>
                </div>

                <p className="mt-6 text-center text-[10px] font-medium text-[#a0aaa6]">
                    EduMind · Account & Profile
                </p>

            </div>
        </div>
    );
}