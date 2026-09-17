import {
    CalendarDays,
    Check,
    Edit3,
    Mail,
    Save,
    User,
    X,
    Camera,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "../../context/AuthContext";


const API_BASE_URL = "http://127.0.0.1:8000";


export default function Profile() {

    const {
        user,
        authFetch,
        refreshUser,
    } = useAuth();


    const [name, setName] = useState(
        user?.name || ""
    );

    const [email, setEmail] = useState(
        user?.email || ""
    );


    const [isEditing, setIsEditing] = useState(false);

    const [loading, setLoading] = useState(false);

    const [imageLoading, setImageLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [imagePreview, setImagePreview] = useState(null);

    const fileInputRef = useRef(null);


    // --------------------------------------------------
    // Sync local form with authenticated user
    // --------------------------------------------------

    useEffect(() => {

        setName(
            user?.name || ""
        );

        setEmail(
            user?.email || ""
        );

    }, [user]);


    // --------------------------------------------------
    // Profile image URL
    // --------------------------------------------------

    const profileImageUrl = user?.profile_image
        ? `${API_BASE_URL}${user.profile_image}`
        : null;


    // --------------------------------------------------
    // Start editing
    // --------------------------------------------------

    const handleEdit = () => {

        setError("");
        setSuccess("");

        setName(
            user?.name || ""
        );

        setEmail(
            user?.email || ""
        );

        setIsEditing(true);
    };


    // --------------------------------------------------
    // Cancel editing
    // --------------------------------------------------

    const handleCancel = () => {

        setName(
            user?.name || ""
        );

        setEmail(
            user?.email || ""
        );

        setError("");
        setSuccess("");

        setIsEditing(false);
    };


    // --------------------------------------------------
    // Save profile
    // --------------------------------------------------

    const handleSave = async (event) => {

        event.preventDefault();

        setError("");
        setSuccess("");


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
                "Email address is required."
            );

            return;
        }


        try {

            setLoading(true);


            const response =
                await authFetch(
                    `${API_BASE_URL}/api/auth/me`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            name: trimmedName,
                            email: trimmedEmail,
                        }),
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Unable to update your profile."
                );
            }


            await refreshUser();


            setSuccess(
                "Profile updated successfully."
            );

            setIsEditing(false);

        } catch (error) {

            console.error(
                "Profile update failed:",
                error
            );

            setError(
                error.message ||
                "Unable to update your profile."
            );

        } finally {

            setLoading(false);
        }
    };


    // --------------------------------------------------
    // Open image picker
    // --------------------------------------------------

    const handleImageButtonClick = () => {

        if (imageLoading) {
            return;
        }

        fileInputRef.current?.click();
    };


    // --------------------------------------------------
    // Select profile image
    // --------------------------------------------------

    const handleImageChange = async (event) => {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }


        setError("");
        setSuccess("");


        // --------------------------------------------------
        // Validate image type
        // --------------------------------------------------

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


        // --------------------------------------------------
        // Validate image size
        // --------------------------------------------------

        const maxSize =
            5 * 1024 * 1024;


        if (file.size > maxSize) {

            setError(
                "Profile image must be smaller than 5 MB."
            );

            event.target.value = "";

            return;
        }


        // --------------------------------------------------
        // Create local preview
        // --------------------------------------------------

        const previewUrl =
            URL.createObjectURL(file);

        setImagePreview(previewUrl);


        // --------------------------------------------------
        // Upload image
        // --------------------------------------------------

        try {

            setImageLoading(true);


            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );


            const response =
                await authFetch(
                    `${API_BASE_URL}/api/profile/image`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );


            const data =
                await response.json();


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


    // --------------------------------------------------
    // Format account creation date
    // --------------------------------------------------

    const formatCreatedDate = () => {

        if (!user?.created_at) {

            return "Not available";
        }


        const date =
            new Date(
                user.created_at
            );


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


    // --------------------------------------------------
    // Initial
    // --------------------------------------------------

    const initial =
        (
            user?.name ||
            "U"
        )
            .charAt(0)
            .toUpperCase();


    // --------------------------------------------------
    // Avatar image
    // --------------------------------------------------

    const avatarImage =
        imagePreview ||
        profileImageUrl;


    return (
        <div className="min-h-full bg-[#EEEEEE] px-6 py-8">

            <div className="mx-auto max-w-5xl">

                {/* ---------------------------------- */}
                {/* Page Header */}
                {/* ---------------------------------- */}

                <div className="mb-8 flex items-center justify-between">

                    <div className="flex items-center gap-4">

                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#DDF3EA]">

                            {avatarImage ? (
                                <img
                                    src={avatarImage}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <User
                                    size={30}
                                    className="text-[#1F6F5F]"
                                />
                            )}

                        </div>


                        <div>

                            <h1 className="text-3xl font-bold text-[#176B5B]">
                                My Profile
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Manage your EduMind account information.
                            </p>

                        </div>

                    </div>


                    {!isEditing && (

                        <button
                            type="button"
                            onClick={handleEdit}
                            className="flex items-center gap-2 rounded-xl bg-[#2FA084] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#278C73]"
                        >

                            <Edit3 size={17} />

                            Edit Profile

                        </button>

                    )}

                </div>


                {/* ---------------------------------- */}
                {/* Success Message */}
                {/* ---------------------------------- */}

                {success && (

                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">

                        <Check size={18} />

                        {success}

                    </div>

                )}


                {/* ---------------------------------- */}
                {/* Error Message */}
                {/* ---------------------------------- */}

                {error && (

                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">

                        {error}

                    </div>

                )}


                {/* ---------------------------------- */}
                {/* Profile Card */}
                {/* ---------------------------------- */}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">


                    {/* Profile Banner */}

                    <div className="h-32 bg-gradient-to-r from-[#DDF3EA] via-[#E8F6F0] to-[#F2FAF7]" />


                    {/* Profile Identity */}

                    <div className="px-8 pb-8">

                        <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">


                            <div className="flex items-end gap-5">


                                {/* ---------------------------------- */}
                                {/* Profile Avatar */}
                                {/* ---------------------------------- */}

                                <div className="relative">

                                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#CDEFE2] text-3xl font-bold text-[#1F6F5F] shadow-md">

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


                                    {/* Hidden file input */}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />


                                    {/* Camera button */}

                                    <button
                                        type="button"
                                        onClick={handleImageButtonClick}
                                        disabled={imageLoading}
                                        className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#2FA084] text-white shadow-md transition hover:bg-[#278C73] disabled:cursor-not-allowed disabled:opacity-60"
                                        aria-label="Change profile picture"
                                        title="Change profile picture"
                                    >

                                        <Camera size={17} />

                                    </button>

                                </div>


                                <div className="pb-1">

                                    <h2 className="text-2xl font-bold text-gray-900">

                                        {user?.name || "Student"}

                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        MCA Student
                                    </p>

                                </div>

                            </div>


                            <div className="pb-1">

                                <span className="inline-flex items-center rounded-full bg-[#E5F5EE] px-3 py-1 text-xs font-semibold text-[#1F6F5F]">

                                    Active Account

                                </span>

                            </div>

                        </div>


                        {/* ---------------------------------- */}
                        {/* Account Information */}
                        {/* ---------------------------------- */}

                        <div className="mt-10">

                            <h3 className="text-lg font-bold text-gray-900">
                                Account Information
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Your basic EduMind account details.
                            </p>


                            <form
                                onSubmit={handleSave}
                                className="mt-6 space-y-5"
                            >

                                {/* Name */}

                                <div>

                                    <label
                                        htmlFor="profile-name"
                                        className="mb-2 block text-sm font-semibold text-gray-700"
                                    >
                                        Full Name
                                    </label>


                                    <div className="relative">

                                        <User
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />


                                        <input
                                            id="profile-name"
                                            type="text"
                                            value={name}
                                            onChange={(event) =>
                                                setName(
                                                    event.target.value
                                                )
                                            }
                                            disabled={!isEditing}
                                            className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition ${
                                                isEditing
                                                    ? "border-gray-300 bg-white text-gray-900 focus:border-[#2FA084] focus:ring-2 focus:ring-[#2FA084]/20"
                                                    : "border-gray-200 bg-gray-50 text-gray-700"
                                            }`}
                                        />

                                    </div>

                                </div>


                                {/* Email */}

                                <div>

                                    <label
                                        htmlFor="profile-email"
                                        className="mb-2 block text-sm font-semibold text-gray-700"
                                    >
                                        Email Address
                                    </label>


                                    <div className="relative">

                                        <Mail
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />


                                        <input
                                            id="profile-email"
                                            type="email"
                                            value={email}
                                            onChange={(event) =>
                                                setEmail(
                                                    event.target.value
                                                )
                                            }
                                            disabled={!isEditing}
                                            className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition ${
                                                isEditing
                                                    ? "border-gray-300 bg-white text-gray-900 focus:border-[#2FA084] focus:ring-2 focus:ring-[#2FA084]/20"
                                                    : "border-gray-200 bg-gray-50 text-gray-700"
                                            }`}
                                        />

                                    </div>

                                </div>


                                {/* Account Created */}

                                <div>

                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Account Created
                                    </label>


                                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">

                                        <CalendarDays
                                            size={18}
                                            className="text-gray-400"
                                        />

                                        {formatCreatedDate()}

                                    </div>

                                </div>


                                {/* ---------------------------------- */}
                                {/* Edit Actions */}
                                {/* ---------------------------------- */}

                                {isEditing && (

                                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">

                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={loading}
                                            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >

                                            <X size={17} />

                                            Cancel

                                        </button>


                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center gap-2 rounded-xl bg-[#2FA084] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#278C73] disabled:cursor-not-allowed disabled:opacity-60"
                                        >

                                            <Save size={17} />

                                            {loading
                                                ? "Saving..."
                                                : "Save Changes"
                                            }

                                        </button>

                                    </div>

                                )}

                            </form>

                        </div>

                    </div>

                </div>


                {/* ---------------------------------- */}
                {/* Profile Information Cards */}
                {/* ---------------------------------- */}

                <div className="mt-6 grid gap-6 md:grid-cols-2">


                    {/* Learning Role */}

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E5F5EE]">

                                <User
                                    size={21}
                                    className="text-[#1F6F5F]"
                                />

                            </div>


                            <div>

                                <h3 className="font-bold text-gray-900">
                                    Learning Role
                                </h3>

                                <p className="text-sm text-gray-500">
                                    Your current role in EduMind.
                                </p>

                            </div>

                        </div>


                        <div className="mt-5 rounded-xl bg-[#F7FAF9] px-4 py-3">

                            <p className="text-sm font-semibold text-[#1F6F5F]">
                                Student
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                                Your learning experience is personalized around your study activity.
                            </p>

                        </div>

                    </div>


                    {/* Account Status */}

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E5F5EE]">

                                <Check
                                    size={21}
                                    className="text-[#1F6F5F]"
                                />

                            </div>


                            <div>

                                <h3 className="font-bold text-gray-900">
                                    Account Status
                                </h3>

                                <p className="text-sm text-gray-500">
                                    Current account state.
                                </p>

                            </div>

                        </div>


                        <div className="mt-5 rounded-xl bg-[#F7FAF9] px-4 py-3">

                            <p className="text-sm font-semibold text-[#1F6F5F]">

                                {user?.is_active
                                    ? "Active"
                                    : "Inactive"
                                }

                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                                Your EduMind account is currently available for use.
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}