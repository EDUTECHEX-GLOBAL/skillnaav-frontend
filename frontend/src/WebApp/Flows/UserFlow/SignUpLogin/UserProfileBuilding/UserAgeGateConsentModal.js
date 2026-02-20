// File: UserAgeGateConsentModal.jsx
import React, { useMemo, useState } from "react";

const CONSENT_VERSION = "v1";

const UserAgeGateConsentModal = ({ open, onComplete }) => {
    const [stage, setStage] = useState("AGE"); // "AGE" | "UNDER18"
    const [ageCategory, setAgeCategory] = useState(""); // "UNDER_18" | "OVER_18"

    // Under 18 consent fields
    const [guardianName, setGuardianName] = useState("");
    const [guardianEmail, setGuardianEmail] = useState("");
    const [guardianRelationship, setGuardianRelationship] = useState("Parent");
    const [agreeGuardian, setAgreeGuardian] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);

    const [error, setError] = useState("");

    const emailOk = useMemo(() => {
        if (!guardianEmail) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail);
    }, [guardianEmail]);

    if (!open) return null;

    const resetError = () => setError("");

    const handleUnder18Click = () => {
        resetError();
        setAgeCategory("UNDER_18");
        setStage("UNDER18");
    };

    const handleOver18Click = () => {
        resetError();
        // Step-1 only: just save "OVER_18" and continue.
        // Photo capture + S3 will be added in next step.
        onComplete?.({
            ageCategory: "OVER_18",
            ageGateCompleted: true,
        });
    };

    const handleUnder18Continue = () => {
        resetError();

        if (!guardianName.trim()) {
            setError("Please enter guardian name.");
            return;
        }
        if (!guardianEmail.trim() || !emailOk) {
            setError("Please enter a valid guardian email.");
            return;
        }
        if (!guardianRelationship) {
            setError("Please select relationship.");
            return;
        }
        if (!agreeGuardian) {
            setError("Please confirm guardian consent.");
            return;
        }
        if (!agreeTerms) {
            setError("Please accept Terms & Privacy.");
            return;
        }

        onComplete?.({
            ageCategory: "UNDER_18",
            ageGateCompleted: true,
            guardianConsentAccepted: true,
            guardianConsentVersion: CONSENT_VERSION,
            guardianConsentAcceptedAt: new Date().toISOString(),
            guardianName: guardianName.trim(),
            guardianEmail: guardianEmail.trim(),
            guardianRelationship,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-xl p-6">
                {/* Header */}
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        {stage === "AGE" ? "Age Confirmation" : "Guardian Consent (Under 18)"}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        {stage === "AGE"
                            ? "Please confirm your age group to continue."
                            : "A parent/guardian must provide consent to proceed."}
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 text-sm border border-red-200">
                        {error}
                    </div>
                )}

                {/* Stage 1: Age */}
                {stage === "AGE" && (
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={handleUnder18Click}
                            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
                        >
                            Under 18
                        </button>

                        <button
                            type="button"
                            onClick={handleOver18Click}
                            className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-black"
                        >
                            Over 18
                        </button>

                        <p className="text-xs text-gray-500 mt-2">
                            Note: Photo verification for Over 18 will be added in the next step.
                        </p>
                    </div>
                )}

                {/* Stage 2: Under 18 Consent */}
                {stage === "UNDER18" && (
                    <div className="space-y-4">
                        {/* Guardian details */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Guardian Full Name *
                            </label>
                            <input
                                type="text"
                                value={guardianName}
                                onChange={(e) => setGuardianName(e.target.value)}
                                className="mt-1 w-full px-3 py-2 border rounded-md border-gray-300"
                                placeholder="Enter guardian full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Guardian Email *
                            </label>
                            <input
                                type="email"
                                value={guardianEmail}
                                onChange={(e) => setGuardianEmail(e.target.value)}
                                className="mt-1 w-full px-3 py-2 border rounded-md border-gray-300"
                                placeholder="Enter guardian email"
                            />
                            {guardianEmail && !emailOk && (
                                <p className="text-xs text-red-500 mt-1">Invalid email format.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Relationship *
                            </label>
                            <select
                                value={guardianRelationship}
                                onChange={(e) => setGuardianRelationship(e.target.value)}
                                className="mt-1 w-full px-3 py-2 border rounded-md border-gray-300 bg-white"
                            >
                                <option value="Parent">Parent</option>
                                <option value="Guardian">Guardian</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Consent checks */}
                        <div className="space-y-2 bg-gray-50 p-3 rounded-md border">
                            <label className="flex items-start gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={agreeGuardian}
                                    onChange={(e) => setAgreeGuardian(e.target.checked)}
                                    className="mt-1 h-4 w-4"
                                />
                                <span>
                                    I confirm I am the parent/guardian and I consent to creating this account.
                                </span>
                            </label>

                            <label className="flex items-start gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={agreeTerms}
                                    onChange={(e) => setAgreeTerms(e.target.checked)}
                                    className="mt-1 h-4 w-4"
                                />
                                <span>
                                    I agree to the platform Terms & Privacy Policy.
                                </span>
                            </label>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    resetError();
                                    setStage("AGE");
                                    setAgeCategory("");
                                }}
                                className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                Back
                            </button>

                            <button
                                type="button"
                                onClick={handleUnder18Continue}
                                className="w-full py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* hidden info */}
                <input type="hidden" value={ageCategory} readOnly />
            </div>
        </div>
    );
};

export default UserAgeGateConsentModal;