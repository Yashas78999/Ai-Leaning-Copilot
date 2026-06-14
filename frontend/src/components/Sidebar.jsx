import {
  PanelLeft,
  Library,
  Upload,
  Brain,
  CircleHelp,
  BookOpen,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("Yashas");
  const [userEmail, setUserEmail] = useState("AI Learner");

  useEffect(() => {
    // Fetch profile details
    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setUserName(response.data.name);
        setUserEmail(response.data.email);
      } catch (err) {
        console.error("Could not fetch user details", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("activePdfId");
      navigate("/login");
    }
  };

  const activePdfId = localStorage.getItem("activePdfId");

  const menuItems = [
    {
      icon: <Library size={20} />,
      label: "My Library",
      path: "/library",
    },
    {
      icon: <Upload size={20} />,
      label: "Upload PDF",
      path: "/dashboard",
    },
    {
      icon: <Brain size={20} />,
      label: "Flashcards",
      path: activePdfId ? `/workspace/${activePdfId}?tab=flashcards` : "/library",
      alertOnNoPdf: !activePdfId,
    },
    {
      icon: <CircleHelp size={20} />,
      label: "Quizzes",
      path: activePdfId ? `/workspace/${activePdfId}?tab=quiz` : "/library",
      alertOnNoPdf: !activePdfId,
    },
    {
      icon: <BookOpen size={20} />,
      label: "Study Plans",
      path: activePdfId ? `/workspace/${activePdfId}?tab=study-plan` : "/library",
      alertOnNoPdf: !activePdfId,
    },
    {
      icon: <SettingsIcon size={20} />,
      label: "Settings",
      path: "/settings",
    },
  ];

  const handleMenuItemClick = (item) => {
    if (item.alertOnNoPdf) {
      toast.error("Please upload and open a PDF from My Library first to use this feature.");
      return;
    }
    navigate(item.path);
  };

  const isActive = (itemPath) => {
    // Clean path matching
    const currentPath = location.pathname;
    const cleanItemPath = itemPath.split("?")[0];
    return currentPath === cleanItemPath;
  };

  return (
    <div
      className="
      w-72
      h-screen
      bg-[#0F172A]/90
      backdrop-blur-xl
      border-r
      border-slate-800
      flex
      flex-col
      z-20
      "
    >
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <div className="cursor-pointer" onClick={() => navigate("/dashboard")}>
          <h1
            className="
            text-2xl
            font-bold
            bg-gradient-to-r
            from-white
            via-purple-200
            to-purple-500
            bg-clip-text
            text-transparent
            "
          >
            AI Learning
          </h1>
          <p className="text-purple-400">Copilot</p>
        </div>

        <PanelLeft
          size={22}
          className="text-slate-400 cursor-pointer hover:text-white transition"
          onClick={() => navigate("/dashboard")}
        />
      </div>

      {/* New Chat */}
      <div className="px-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="
          w-full
          p-4
          rounded-2xl
          text-left
          text-white
          font-semibold
          bg-gradient-to-r
          from-purple-600
          to-fuchsia-500
          hover:scale-[1.02]
          hover:shadow-[0_0_35px_rgba(168,85,247,0.45)]
          transition-all
          duration-300
          cursor-pointer
          "
        >
          + New Dashboard
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 mt-6 overflow-y-auto">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <div
                key={item.label}
                onClick={() => handleMenuItemClick(item)}
                className={`
                flex
                items-center
                gap-3
                p-4
                rounded-xl
                transition-all
                duration-300
                cursor-pointer
                ${
                  active
                    ? "bg-purple-600/20 text-white border-l-4 border-purple-500 font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white hover:translate-x-2"
                }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-800">
        <div
          className="
          bg-slate-800
          rounded-2xl
          p-4
          flex
          items-center
          justify-between
          hover:bg-slate-700
          transition-all
          "
        >
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/settings")}>
            <div
              className="
              h-10
              w-10
              rounded-full
              bg-gradient-to-r
              from-purple-500
              to-fuchsia-500
              "
            />
            <div className="max-w-[120px]">
              <h3 className="text-white font-medium truncate">
                {userName}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {userEmail}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="text-slate-400 hover:text-red-400 transition cursor-pointer p-1"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;