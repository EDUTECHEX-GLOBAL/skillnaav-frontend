// src/components/ConfirmCloseSchedule.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

const ConfirmCloseSchedule = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white pt-12 px-6 pb-6 rounded-lg shadow-xl w-[500px] min-h-[200px] text-center relative">

                {/* 🔹 Cross button at top-right */}
                <button
                    onClick={onCancel}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>

                {/* 🔹 Content (pushed down via pt on card) */}
                <h2 className="text-lg font-medium mb-6 leading-relaxed">
                    Are you sure that you want to close the current internship schedule?
                </h2>

                <div className="flex justify-center gap-4">
                    <button
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={onConfirm}
                    >
                        Yes
                    </button>
                    <button
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        onClick={onCancel}
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmCloseSchedule;
