import React, { useState, useEffect, useRef } from "react";
import {
  FaTimes,
  FaVolumeUp,
  FaVolumeMute,
  FaPlay,
  FaMagic,
  FaPaperPlane,
  FaQuestionCircle,
  FaGraduationCap,
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";
import avatarImg from "../assets-webapp/ai_avatar_presenter.jpg";
import axios from "../api/axiosInstance";

const STUDENT_PRESET_QUESTIONS = [
  "How do I apply for internships?",
  "How do I build my CV using Skillnaav?",
  "What are Skillnaav Smart Credentials?",
  "How do I complete my student profile?",
  "How do skill assessments work?",
];

// Canvas Component that renders synchronized viseme lip-sync & facial movement
function VisemeLipSyncCanvas({ isSpeaking, visemeState, eyeBlink }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const open = visemeState?.open || 0;
      const widthFactor = visemeState?.width || 0.8;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw dynamic mouth viseme when speaking
      if (isSpeaking && open > 0.05) {
        const lipW = 20 * widthFactor;
        const lipH = 3 + 14 * open;

        // Upper lip curve
        ctx.beginPath();
        ctx.moveTo(centerX - lipW, centerY);
        ctx.quadraticCurveTo(centerX, centerY - lipH * 0.55, centerX + lipW, centerY);
        ctx.quadraticCurveTo(centerX, centerY + lipH * 0.35, centerX - lipW, centerY);
        ctx.fillStyle = "#8a0c2e";
        ctx.fill();

        // Inner mouth cavity gap
        if (open > 0.15) {
          ctx.beginPath();
          ctx.ellipse(centerX, centerY + 0.5, lipW * 0.68, lipH * 0.42, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#2d020a";
          ctx.fill();

          // Upper teeth row
          if (open > 0.25) {
            ctx.beginPath();
            ctx.rect(centerX - lipW * 0.45, centerY - 1.5, lipW * 0.9, 2.5);
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.fill();
          }
        }

        // Lower lip curve
        ctx.beginPath();
        ctx.moveTo(centerX - lipW, centerY);
        ctx.quadraticCurveTo(centerX, centerY + lipH * 0.8, centerX + lipW, centerY);
        ctx.quadraticCurveTo(centerX, centerY + lipH * 0.25, centerX - lipW, centerY);
        ctx.fillStyle = "#b51c41";
        ctx.fill();
      }

      // Natural eye blink overlay if active
      if (eyeBlink) {
        ctx.fillStyle = "#d1a88b";
        // Left eye cover
        ctx.beginPath();
        ctx.ellipse(centerX - 24, centerY - 38, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Right eye cover
        ctx.beginPath();
        ctx.ellipse(centerX + 24, centerY - 38, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isSpeaking, visemeState, eyeBlink]);

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={120}
      className="absolute top-[60%] left-[50%] -translate-x-[50%] -translate-y-[50%] pointer-events-none z-20 mix-blend-multiply opacity-90 transition-opacity duration-150"
    />
  );
}

export default function StudentAIAvatar({
  studentInfo = {},
  isDesktopSidebarOpen = true,
  isMobile = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [visemeState, setVisemeState] = useState({ open: 0, width: 0.8 });
  const [eyeBlink, setEyeBlink] = useState(false);

  const speechUtteranceRef = useRef(null);
  const recognitionRef = useRef(null);
  const lipSyncTimerRef = useRef(null);

  // Periodic natural eye blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), 140);
    }, 4200);
    return () => clearInterval(blinkInterval);
  }, []);

  // Continuous speech viseme lip-sync animation frame loop
  const startLipSyncAnimation = () => {
    stopLipSyncAnimation();
    lipSyncTimerRef.current = setInterval(() => {
      // Dynamic mouth morphing oscillation mimicking human speech cadence
      const open = 0.2 + Math.sin(Date.now() / 70) * 0.35 + Math.random() * 0.3;
      const width = 0.75 + Math.cos(Date.now() / 90) * 0.25;
      setVisemeState({ open: Math.max(0.1, Math.min(open, 0.95)), width });
    }, 60);
  };

  const stopLipSyncAnimation = () => {
    if (lipSyncTimerRef.current) {
      clearInterval(lipSyncTimerRef.current);
      lipSyncTimerRef.current = null;
    }
    setVisemeState({ open: 0, width: 0.8 });
  };

  // Process question from Student
  const askStudentQuestion = async (questionText) => {
    if (!questionText || !questionText.trim()) return;
    const q = questionText.trim();
    setCurrentQuestion(q);
    setLoading(true);
    setAnswerText("");

    try {
      const res = await axios.post("http://localhost:8000/api/ai/student-ask", {
        question: q,
        studentName: studentInfo?.name || "Student",
      });

      if (res.data && res.data.answer) {
        const reply = res.data.answer;
        setAnswerText(reply);
        setConversationHistory((prev) => [...prev, { role: "user", text: q }, { role: "ai", text: reply }]);
        speakText(reply);
      }
    } catch (err) {
      console.warn("Using local student FAQ fallback:", err?.message);
      let fallback = "On Skillnaav, you can discover internships, build your ATS resume, take skill assessments, and earn verified smart credentials!";
      const lower = q.toLowerCase();
      if (lower.includes("internship")) {
        fallback = "To apply for internships, click on the Internships tab in your dashboard, browse opportunities in tech or business, and click Apply. Track applications in the Applications tab!";
      } else if (lower.includes("cv") || lower.includes("resume")) {
        fallback = "You can build your professional ATS-friendly resume using Skillnaav's built-in CV Builder tab. Simply enter your education, projects, and skills, then click Generate CV!";
      } else if (lower.includes("credential") || lower.includes("certificate")) {
        fallback = "Skillnaav Smart Credentials are verified digital certificates and badges earned upon passing skill assessments or finishing internships!";
      } else if (lower.includes("profile")) {
        fallback = "To complete your student profile, go to the Profile section and fill out your education, skills, and bio. Completed profiles get 5x more views from recruiters!";
      } else if (lower.includes("assessment")) {
        fallback = "Skillnaav assessments evaluate your practical skills in programming, data, or domain knowledge. Select Student Assessment, take the quiz, and earn verified badges!";
      }

      setAnswerText(fallback);
      setConversationHistory((prev) => [...prev, { role: "user", text: q }, { role: "ai", text: fallback }]);
      speakText(fallback);
    } finally {
      setLoading(false);
      setCustomQuestion("");
      setLiveTranscript("");
    }
  };

  // Text-to-Speech Output with Lip-Sync viseme mapping
  const speakText = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.includes("en") &&
        (v.name.includes("Female") || v.name.includes("Samantha") || v.name.includes("Google") || v.name.includes("Natural"))
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    // Word boundary event for exact syllable lip movement
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const char = text.charAt(event.charIndex).toLowerCase();
        let open = 0.5;
        let width = 0.8;
        if (["a", "o"].includes(char)) {
          open = 0.85;
          width = 0.7;
        } else if (["e", "i"].includes(char)) {
          open = 0.5;
          width = 1.0;
        } else if (["m", "b", "p"].includes(char)) {
          open = 0.05;
          width = 0.8;
        }
        setVisemeState({ open, width });
      }
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      startLipSyncAnimation();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      stopLipSyncAnimation();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      stopLipSyncAnimation();
    };

    speechUtteranceRef.current = utterance;
    if (!isMuted) {
      window.speechSynthesis.speak(utterance);
    }
  };

  // Web Speech API Microphone Voice Input
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please type your question.");
      return;
    }

    try {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        stopLipSyncAnimation();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setLiveTranscript("Listening... Speak your question now!");
      };

      recognition.onresult = (event) => {
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setLiveTranscript(text);
        setCustomQuestion(text);
      };

      recognition.onerror = (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      stopLipSyncAnimation();
    } else if (answerText) {
      speakText(answerText);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!answerText) {
      askStudentQuestion("How do I get started on Skillnaav?");
    } else {
      speakText(answerText);
    }
  };

  const handleClose = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    stopListening();
    setIsSpeaking(false);
    stopLipSyncAnimation();
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      stopLipSyncAnimation();
      stopListening();
    };
  }, []);

  return (
    <div
      className={`fixed z-[9990] font-poppins transition-all duration-300 ${
        isMobile
          ? "bottom-4 left-4"
          : `bottom-5 ${isDesktopSidebarOpen ? "left-[272px]" : "left-20"}`
      }`}
    >
      {!isOpen ? (
        <button
          onClick={handleOpen}
          className="group relative flex items-center gap-2 sm:gap-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-2xl hover:shadow-purple-500/30 hover:scale-105 transition duration-300 cursor-pointer border border-white/20"
        >
          <div className="relative">
            <img
              src={avatarImg}
              alt="Student AI Tutor"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
          </div>
          <div className="text-left pr-1">
            <div className="text-[11px] sm:text-xs font-bold leading-tight flex items-center gap-1">
              AI Tutor <FaMagic className="text-amber-300 w-2.5 h-2.5" />
            </div>
            <div className="text-[9px] sm:text-[10px] text-purple-100 opacity-90 hidden min-[360px]:block">Talk to Sarah</div>
          </div>
        </button>
      ) : (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-100 p-4 w-[340px] sm:w-[390px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto transition-all animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={avatarImg}
                  alt="AI Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-purple-500 shadow-md"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 leading-tight flex items-center gap-1.5">
                  Sarah <FaGraduationCap className="text-purple-600 w-4 h-4" />
                </h4>
                <p className="text-[11px] text-purple-600 font-medium">
                  Skillnaav Interactive Voice AI Tutor
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

          {/* Avatar Video & Lip Sync Display Box */}
          <div className="my-3 relative rounded-xl overflow-hidden bg-gradient-to-b from-purple-900 to-slate-900 h-44 border border-purple-200/50 flex flex-col justify-between p-3">
            <img
              src={avatarImg}
              alt="Avatar Video"
              className={`absolute inset-0 w-full h-full object-cover transition duration-300 ${
                isSpeaking
                  ? "scale-105 brightness-105 animate-pulse"
                  : isListening
                  ? "brightness-110 scale-102"
                  : "brightness-95"
              }`}
            />

            {/* Dynamic Viseme Canvas for Real-time Lip Sync */}
            <VisemeLipSyncCanvas isSpeaking={isSpeaking} visemeState={visemeState} eyeBlink={eyeBlink} />

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

            {/* Speaking / Listening Status Pill */}
            <div className="relative z-10 flex justify-between items-center">
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isListening
                      ? "bg-amber-400 animate-ping"
                      : isSpeaking
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-purple-300"
                  }`}
                />
                {isListening ? "Listening to Voice..." : isSpeaking ? "Speaking (Live Lip-Sync)" : "Ready to Talk"}
              </span>

              <button
                onClick={() => setIsMuted((prev) => !prev)}
                className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/70 transition"
              >
                {isMuted ? <FaVolumeMute className="w-3 h-3 text-red-400" /> : <FaVolumeUp className="w-3 h-3 text-emerald-400" />}
              </button>
            </div>

            {/* Audio Waveform Animation when Speaking */}
            {isSpeaking && (
              <div className="relative z-10 flex items-center justify-center gap-1 my-auto h-7">
                {[40, 75, 100, 65, 95, 45, 85, 55].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-gradient-to-t from-purple-400 via-pink-400 to-amber-300 rounded-full animate-bounce"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="relative z-10 text-white text-[11px] font-medium truncate">
              {isListening
                ? liveTranscript || "Listening... Speak now!"
                : currentQuestion
                ? `Q: "${currentQuestion}"`
                : "Ask Sarah anything by voice or text"}
            </div>
          </div>

          {/* Subtitles & Response Box */}
          <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 text-xs text-gray-700 min-h-[55px] max-h-28 overflow-y-auto leading-relaxed">
            {loading ? (
              <div className="flex items-center gap-2 text-purple-600 font-medium">
                <span className="animate-spin text-sm">🌀</span> Sarah is thinking of the best answer...
              </div>
            ) : isListening ? (
              <div className="text-amber-700 font-medium animate-pulse flex items-center gap-1.5">
                <FaMicrophone className="text-amber-500" /> {liveTranscript || "Listening to your voice..."}
              </div>
            ) : (
              answerText || "Tap the microphone to speak or pick a quick question below!"
            )}
          </div>

          {/* Conversation History Collapsible */}
          {conversationHistory.length > 0 && (
            <div className="mt-2 text-[11px]">
              <button
                onClick={() => setShowHistory((prev) => !prev)}
                className="text-purple-600 font-semibold hover:underline flex items-center gap-1"
              >
                {showHistory ? "Hide Conversation History" : `View Chat History (${conversationHistory.length / 2})`}
              </button>
              {showHistory && (
                <div className="mt-1 max-h-24 overflow-y-auto space-y-1 bg-gray-50 border border-gray-100 rounded-lg p-2 text-[10px]">
                  {conversationHistory.map((item, i) => (
                    <div key={i} className={item.role === "user" ? "text-purple-900 font-semibold" : "text-gray-700 pl-2"}>
                      <span className="font-bold">{item.role === "user" ? "You: " : "Sarah: "}</span>
                      {item.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preset Student Questions */}
          <div className="mt-2.5">
            <p className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
              <FaQuestionCircle className="text-purple-500" /> Quick Questions:
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
              {STUDENT_PRESET_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => askStudentQuestion(q)}
                  className="text-[10px] font-medium bg-purple-100/70 hover:bg-purple-200 text-purple-800 px-2.5 py-1 rounded-md transition text-left truncate max-w-full"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Human-to-Human Conversational Voice & Text Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              askStudentQuestion(customQuestion);
            }}
            className="mt-3 flex items-center gap-1.5"
          >
            <input
              type="text"
              placeholder="Ask anything or talk to Sarah..."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition"
            />

            {/* Microphone Button for Voice Conversation */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-lg text-white transition ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
              title={isListening ? "Stop Listening" : "Speak to Sarah (Voice Input)"}
            >
              {isListening ? <FaMicrophoneSlash className="w-3.5 h-3.5" /> : <FaMicrophone className="w-3.5 h-3.5" />}
            </button>

            <button
              type="submit"
              disabled={loading || !customQuestion.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2 rounded-lg transition"
            >
              <FaPaperPlane className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Voice Controls */}
          {answerText && (
            <button
              onClick={toggleSpeak}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-semibold transition"
            >
              {isSpeaking ? <FaVolumeMute /> : <FaPlay className="text-[9px]" />}
              {isSpeaking ? "Stop Speaking" : "Replay Voice & Lip-Sync"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
