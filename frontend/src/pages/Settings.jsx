import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import { User, Mail, Shield, Brain, Moon, Volume2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Settings() {
  const [user, setUser] = useState({ name: "Loading...", email: "Loading..." });
  const navigate = useNavigate();

  // AI Preferences state
  const [preferences, setPreferences] = useState({
    studyPlanLength: 7,
    quizDifficulty: "Medium",
    flashcardDifficulty: "Medium",
    learningStyle: "Balanced",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch (err) {
        console.error("Could not fetch settings profile", err);
      }
    };
    fetchUser();

    // Load preferences from local storage
    const studyPlanLength = localStorage.getItem("prefStudyPlanLength") || "7";
    const quizDifficulty = localStorage.getItem("prefQuizDifficulty") || "Medium";
    const flashcardDifficulty = localStorage.getItem("prefFlashcardDifficulty") || "Medium";
    const learningStyle = localStorage.getItem("prefLearningStyle") || "Balanced";

    setPreferences({
      studyPlanLength: Number(studyPlanLength),
      quizDifficulty,
      flashcardDifficulty,
      learningStyle,
    });
  }, []);

  const handlePreferenceChange = (e) => {
    setPreferences({
      ...preferences,
      [e.target.name]: e.target.value,
    });
  };

  const handleSavePreferences = () => {
    localStorage.setItem("prefStudyPlanLength", String(preferences.studyPlanLength));
    localStorage.setItem("prefQuizDifficulty", preferences.quizDifficulty);
    localStorage.setItem("prefFlashcardDifficulty", preferences.flashcardDifficulty);
    localStorage.setItem("prefLearningStyle", preferences.learningStyle);
    toast.success("AI Preferences saved successfully!");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("activePdfId");
    navigate("/login");
  };

  return (
    <div className="h-screen bg-[#0B1020] flex overflow-hidden">
      <Sidebar />

      <main className="relative flex-1 overflow-y-auto px-8 py-16">
        <div className="absolute float-glow w-[600px] h-[600px] bg-purple-600/10 blur-[180px] rounded-full top-20 left-10" />

        <div className="relative z-10 max-w-4xl mx-auto w-full">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-slate-100 to-purple-400 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-slate-400 mb-8">
            Manage your account configurations and system preferences
          </p>

          <div className="space-y-6">
            {/* Profile Section */}
            <div className="bg-[#111827]/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <User size={20} className="text-purple-400" />
                <span>Account Profile</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="flex items-center gap-3 p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl text-white">
                    <User size={16} className="text-slate-500" />
                    <span>{user.name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3 p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl text-white">
                    <Mail size={16} className="text-slate-500" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Preferences Section */}
            <div className="bg-[#111827]/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <Brain size={20} className="text-purple-400" />
                <span>🤖 AI Preferences</span>
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Customize parameters used by the AI tutor when generating custom study material.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Study Plan Length
                  </label>
                  <select
                    name="studyPlanLength"
                    value={preferences.studyPlanLength}
                    onChange={handlePreferenceChange}
                    className="w-full p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl text-white outline-none focus:border-purple-500"
                  >
                    {[3, 5, 7, 10, 14].map((day) => (
                      <option key={day} value={day}>
                        {day} Days Course
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Learning Style
                  </label>
                  <select
                    name="learningStyle"
                    value={preferences.learningStyle}
                    onChange={handlePreferenceChange}
                    className="w-full p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl text-white outline-none focus:border-purple-500"
                  >
                    {["Balanced", "Visual", "Auditory", "Practical"].map((style) => (
                      <option key={style} value={style}>
                        {style} Learner
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Quiz Difficulty
                  </label>
                  <select
                    name="quizDifficulty"
                    value={preferences.quizDifficulty}
                    onChange={handlePreferenceChange}
                    className="w-full p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl text-white outline-none focus:border-purple-500"
                  >
                    {["Easy", "Medium", "Hard"].map((diff) => (
                      <option key={diff} value={diff}>
                        {diff} Level
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Flashcard Difficulty
                  </label>
                  <select
                    name="flashcardDifficulty"
                    value={preferences.flashcardDifficulty}
                    onChange={handlePreferenceChange}
                    className="w-full p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl text-white outline-none focus:border-purple-500"
                  >
                    {["Easy", "Medium", "Hard"].map((diff) => (
                      <option key={diff} value={diff}>
                        {diff} Level
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-800/60 pt-4">
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 transition-all rounded-xl text-white font-semibold cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                >
                  <Sparkles size={16} />
                  <span>Save AI Preferences</span>
                </button>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-[#111827]/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Shield size={20} className="text-purple-400" />
                <span>Preferences</span>
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/20 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Moon size={18} className="text-slate-400" />
                    <div>
                      <h4 className="text-white font-medium text-sm">Theme Mode</h4>
                      <p className="text-xs text-slate-400">Manage dark mode styling options</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                    Dark (Active)
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/20 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Volume2 size={18} className="text-slate-400" />
                    <div>
                      <h4 className="text-white font-medium text-sm">Tutor Audio</h4>
                      <p className="text-xs text-slate-400">Convert AI responses to spoken audio</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full border border-slate-700">
                    Disabled
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleLogout}
                className="px-6 py-3.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 rounded-xl font-semibold transition cursor-pointer"
              >
                Logout Account
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;
