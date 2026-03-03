import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import adminImage from "../../../../assets-webapp/partner.jpg";

const validationSchema = Yup.object({
    otp: Yup.string()
        .required("Required")
        .matches(/^\d{6}$/, "OTP must be 6 digits"),
    password: Yup.string().min(6, "Password must be at least 6 characters").required("Required"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("Required"),
});

const AdminResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const email = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get("email") || "";
    }, [location.search]);

    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const REDIRECT_SECONDS = 7;
    const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!successMsg) return;

        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [successMsg]);

    const handleSubmit = (values, { setSubmitting }) => {
        setError("");
        setSuccessMsg("");

        // ✅ Show success popup immediately (no loading screen)
        setSuccessMsg("Password updated successfully.");
        setSecondsLeft(REDIRECT_SECONDS);

        // ✅ Redirect after 7 seconds
        const redirectTimer = setTimeout(() => {
            navigate("/admin/login");
        }, REDIRECT_SECONDS * 1000);

        // ✅ Call API in background (so UI is instant)
        axios
            .post("/api/admin/reset-password", {
                email,
                otp: values.otp,
                newPassword: values.password,
            })
            .catch((err) => {
                // If API fails, stop redirect and show error
                clearTimeout(redirectTimer);
                setSuccessMsg("");
                setError(err.response?.data?.message || "Failed to reset password. Try again.");
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen font-poppins">
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
                <img
                    src={adminImage}
                    alt="Admin Reset Password"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="flex flex-col items-center justify-center p-8 w-full lg:w-1/2 bg-white">
                <div className="w-full max-w-md">
                    <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-800">
                        Reset Password
                    </h1>
                    <p className="text-center text-gray-600 mb-6">
                        Enter the OTP sent to your email and set a new password.
                    </p>

                    {!email && (
                        <div className="bg-yellow-100 text-yellow-800 p-3 mb-4 text-center rounded-lg">
                            Email missing. Please go back and request OTP again.
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-200 text-red-600 p-3 mb-4 text-center rounded-lg">
                            {error}
                        </div>
                    )}

                    {successMsg ? (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            {/* Backdrop */}
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                            {/* Card */}
                            <div className="relative w-[92%] max-w-sm rounded-2xl border border-white/30 bg-white/80 backdrop-blur-xl shadow-2xl">
                                <div className="p-6 text-center">
                                    {/* Check Icon */}
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="h-7 w-7 text-emerald-600"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                    </div>

                                    {/* Message */}
                                    <div className="rounded-xl bg-emerald-500/10 px-4 py-3 font-semibold text-emerald-700">
                                        {successMsg}
                                    </div>

                                    {/* Redirect text only */}
                                    <div className="mt-5 text-xs font-medium text-gray-600">
                                        Redirecting in{" "}
                                        <span className="font-semibold text-gray-800">{secondsLeft}</span>s...
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Formik
                            initialValues={{ otp: "", password: "", confirmPassword: "" }}
                            validationSchema={validationSchema}
                            onSubmit={handleSubmit}
                            enableReinitialize
                        >
                            {({ isSubmitting }) => (
                                <Form className="space-y-4">
                                    {/* ✅ KEEP YOUR EXISTING FORM EXACTLY AS IT IS */}
                                    {/* Email (readonly) */}
                                    <div className="relative">
                                        <Field
                                            type="email"
                                            name="emailReadonly"
                                            value={email}
                                            readOnly
                                            className="w-full p-4 border border-gray-200 bg-gray-50 rounded-lg"
                                        />
                                    </div>

                                    {/* OTP */}
                                    <div className="relative">
                                        <Field
                                            type="text"
                                            name="otp"
                                            placeholder="Enter 6-digit OTP"
                                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                                        />
                                        <ErrorMessage name="otp" component="div" className="text-red-500 text-sm mt-1" />
                                    </div>

                                    {/* New Password */}
                                    <div className="relative">
                                        <Field
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="New Password"
                                            className="w-full p-4 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-4 flex items-center"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <FontAwesomeIcon
                                                icon={showPassword ? faEyeSlash : faEye}
                                                size="lg"
                                                className="text-gray-600"
                                            />
                                        </button>
                                        <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="relative">
                                        <Field
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            placeholder="Confirm New Password"
                                            className="w-full p-4 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-4 flex items-center"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            <FontAwesomeIcon
                                                icon={showConfirmPassword ? faEyeSlash : faEye}
                                                size="lg"
                                                className="text-gray-600"
                                            />
                                        </button>
                                        <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !email}
                                        className="w-full bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors duration-300 shadow-md disabled:bg-blue-300"
                                    >
                                        {isSubmitting ? "Updating..." : "Update Password"}
                                    </button>

                                    <div className="text-center">
                                        <Link to="/admin/login" className="text-blue-600 hover:underline text-sm">
                                            Back to Login
                                        </Link>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminResetPassword;