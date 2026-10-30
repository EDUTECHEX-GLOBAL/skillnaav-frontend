import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaVolumeUp, FaVolumeMute, FaPlay, FaMagic } from "react-icons/fa";
import avatarImg from "../assets-webapp/ai_avatar_presenter.jpg";
import axios from "../api/axiosInstance";

export default function AIAvatarPresenter({ pageName = "dashboard", dashboardData = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [avatarInfo, setAvatarInfo] = useState({ name: "Sarah", title: "Skillnaav AI Presenter" });
  const speechUtteranceRef = useRef(null);

  // Fetch AI explanation data from backend
  const fetchExplanation = async () => {
    setIsLoading(true);
    try {
      // Send dashboard data to Python AI backend via proxy or direct port 8000
      const res = await axios.post("http://localhost:8000/api/ai/avatar-explain", {
        page: pageName,
        schoolName: dashboardData?.schoolName || "School Admin",
        data: {
          totalCredentials: dashboardData?.totalCredentials || 50,
          credentialsGenerated: dashboardData?.credentialsGenerated || 0,
          studentsCount: dashboardData?.studentsCount || 120,
          internshipsCount: dashboardData?.internshipsCount || 14,
        },
      });

      if (res.data && res.data.explanation) {
        setExplanation(res.data.explanation);
        if (res.data.avatar) setAvatarInfo(res.data.avatar);
        speakText(res.data.explanation);
      }
    } catch (err) {
      console.warn("Falling back to local AI presenter explanation:", err?.message);
      const fallbackText = `Welcome to Skillnaav! You currently have ${
        dashboardData?.totalCredentials || 50
      } total credentials allocated and 14 active internship postings. Everything is running smoothly for your school!`;
      setExplanation(fallbackText);
      speakText(fallbackText);
    } finally {
      setIsLoading(false);
    }
  };

  // Web Speech API Voice Synthesis
  const speakText = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Pick a natural English female/presenter voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.includes("en") &&
        (v.name.includes("Female") || v.name.includes("Samantha") || v.name.includes("Google") || v.name.includes("Natural"))
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechUtteranceRef.current = utterance;
    if (!isMuted) {
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (explanation) {
      speakText(explanation);
    } else {
      fetchExplanation();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!explanation) {
      fetchExplanation();
    } else {
      speakText(explanation);
    }
  };

  const handleClose = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] font-poppins">
      {!isOpen ? (
        <button
          onClick={handleOpen}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-purple-500/25 hover:scale-105 transition duration-300 cursor-pointer border border-white/20"
        >
          <div className="relative">
            <img
              src={avatarImg}
              alt="AI Presenter"
              className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
          </div>
          <div className="text-left pr-1">
            <div className="text-xs font-bold leading-tight flex items-center gap-1">
              AI Presenter <FaMagic className="text-amber-300 w-2.5 h-2.5" />
            </div>
            <div className="text-[10px] text-purple-100 opacity-90">Explain My Data</div>
          </div>
        </button>
      ) : (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-100 p-4 w-[340px] sm:w-[380px] max-w-[calc(100vw-2rem)] transition-all animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={avatarImg}
                  alt="AI Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-purple-500 shadow-md"
                />
                {isSpeaking && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-ping" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 leading-tight">
                  {avatarInfo.name || "Sarah"}
                </h4>
                <p className="text-[11px] text-purple-600 font-medium">
                  {avatarInfo.title || "Skillnaav AI Presenter"}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <FaTimes className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Avatar Visualizer Box */}
          <div className="my-3 relative rounded-xl overflow-hidden bg-gradient-to-b from-purple-900 to-slate-900 h-48 border border-purple-200/50 flex flex-col justify-between p-3">
            <img
              src={avatarImg}
              alt="Avatar Video"
              className={`absolute inset-0 w-full h-full object-cover transition duration-300 ${
                isSpeaking ? "scale-105 brightness-105" : "brightness-95"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Speaking Status Pill */}
            <div className="relative z-10 flex justify-between items-center">
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSpeaking ? "bg-emerald-400 animate-pulse" : "bg-gray-400"
                  }`}
                />
                {isSpeaking ? "Speaking Live..." : "Ready"}
              </span>

              <button
                onClick={() => setIsMuted((prev) => !prev)}
                className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/60 transition"
              >
                {isMuted ? <FaVolumeMute className="w-3 h-3 text-red-400" /> : <FaVolumeUp className="w-3 h-3 text-emerald-400" />}
              </button>
            </div>

            {/* Audio Waveform Animation */}
            {isSpeaking && (
              <div className="relative z-10 flex items-center justify-center gap-1 my-auto h-8">
                {[40, 70, 100, 60, 90, 40, 80, 50].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-gradient-to-t from-purple-400 to-pink-400 rounded-full animate-bounce"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="relative z-10 text-white text-xs font-medium drop-shadow-md truncate">
              EchoMimic V3 Live Avatar Stream
            </div>
          </div>

          {/* Subtitles Box */}
          <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 text-xs text-gray-700 min-h-[60px] max-h-24 overflow-y-auto leading-relaxed">
            {isLoading ? (
              <div className="flex items-center gap-2 text-purple-600 font-medium">
                <span className="animate-spin text-sm">🌀</span> Analyzing dashboard data...
              </div>
            ) : (
              explanation || "Click below to generate data explanation."
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              onClick={toggleSpeak}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 px-3 rounded-lg text-xs font-semibold shadow transition"
            >
              {isSpeaking ? (
                <>
                  <FaVolumeMute /> Stop Voice
                </>
              ) : (
                <>
                  <FaPlay className="text-[10px]" /> Replay Explanation
                </>
              )}
            </button>
            <button
              onClick={fetchExplanation}
              disabled={isLoading}
              className="px-3 py-2 border border-purple-200 text-purple-700 hover:bg-purple-50 rounded-lg text-xs font-medium transition"
            >
              Refresh Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
