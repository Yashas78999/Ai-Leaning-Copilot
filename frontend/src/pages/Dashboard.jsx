import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getAllPdfs, uploadPdf } from "../services/pdfService";
import { Sparkles, MessageSquare, BookOpen, Brain, UploadCloud, FileText, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

function Dashboard() {
  const [pdfs, setPdfs] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPdfs();
  }, []);

  const loadPdfs = async () => {
    try {
      const data = await getAllPdfs();
      setPdfs(data);
    } catch (error) {
      console.error("Failed to load PDFs:", error);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading "${file.name}" and extracting contents...`);
    try {
      setUploading(true);
      const data = await uploadPdf(file);
      toast.success("PDF uploaded and processed successfully!", { id: toastId });
      
      // Save active pdf
      localStorage.setItem("activePdfId", data.pdf_id);
      
      // Refresh list
      loadPdfs();
      
      // Navigate to Workspace directly for high UX!
      navigate(`/workspace/${data.pdf_id}`);
    } catch (err) {
      console.error(err);
      toast.error("File upload failed. Please try again.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const triggerFileUpload = () => {
    document.getElementById("dashboard-file-input").click();
  };

  const handleAskAI = () => {
    const activeId = localStorage.getItem("activePdfId") || (pdfs.length > 0 ? pdfs[0].id : null);
    if (!activeId) {
      toast.error("Please upload a study document first!");
      triggerFileUpload();
      return;
    }
    if (!questionText.trim()) {
      toast.error("Please enter a question!");
      return;
    }
    
    // Store question text in temp local storage to pre-load inside chat page
    localStorage.setItem("tempQuestion", questionText);
    navigate(`/tutor/${activeId}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskAI();
    }
  };

  const handleQuickAction = (actionType) => {
    const activeId = localStorage.getItem("activePdfId") || (pdfs.length > 0 ? pdfs[0].id : null);
    if (!activeId) {
      toast.error("Please upload a PDF document first!");
      triggerFileUpload();
      return;
    }
    navigate(`/workspace/${activeId}?tab=${actionType}`);
  };

  return (
    <div className="h-screen bg-[#0B1020] flex overflow-hidden">
      <Sidebar />

      {/* Hidden file input for uploads */}
      <input
        type="file"
        id="dashboard-file-input"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <main className="relative flex-1 overflow-y-auto px-6 py-12 md:py-20 flex flex-col justify-between">
        
        {/* Glow Element */}
        <div className="absolute float-glow w-[800px] h-[800px] bg-purple-600/15 blur-[200px] rounded-full top-10 left-1/2 -translate-x-1/2" />

        <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col justify-center items-center">
          
          {/* Hero Heading */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent tracking-tight">
              What do you want to learn today?
            </h1>
            <p className="text-slate-400 text-md md:text-lg mt-3 max-w-xl mx-auto">
              Upload your study syllabus, notes, or textbooks and let AI generate study plans, flashcards, and quizzes.
            </p>
          </div>

          {/* Minimal Centered Prompt Box */}
          <div className="w-full bg-[#111827]/60 border border-slate-800 rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-2xl hover:border-purple-500/50 transition-all duration-300 focus-within:border-purple-500/70 focus-within:shadow-[0_0_50px_rgba(168,85,247,0.15)] mb-8">
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask anything about your study guides..."
              className="w-full bg-transparent text-white text-md md:text-lg outline-none resize-none focus:ring-0 max-h-32 placeholder-slate-500 px-2"
            />

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/60">
              <button
                onClick={triggerFileUpload}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-350 hover:text-white transition duration-200 cursor-pointer text-sm font-medium"
              >
                <span>📎 Attach PDF</span>
              </button>

              <button
                onClick={handleAskAI}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white hover:scale-105 transition duration-200 cursor-pointer text-sm font-semibold shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                <Sparkles size={16} />
                <span>Ask AI</span>
              </button>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              {
                icon: <FileText className="text-purple-400" size={20} />,
                title: "Study Notes",
                description: "Summarize complex topics into clean notes",
                tab: "notes",
              },
              {
                icon: <Brain className="text-purple-400" size={20} />,
                title: "Flashcards",
                description: "Review terms using customizable flipping decks",
                tab: "flashcards",
              },
              {
                icon: <BookOpen className="text-purple-400" size={20} />,
                title: "Study Plans",
                description: "Map out custom calendars step by step",
                tab: "study-plan",
              },
            ].map((card) => (
              <div
                key={card.title}
                onClick={() => handleQuickAction(card.tab)}
                className="bg-[#111827]/40 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 backdrop-blur-md transition-all duration-350 hover:-translate-y-1 cursor-pointer flex flex-col items-start"
              >
                <div className="p-3 bg-purple-500/10 rounded-xl mb-4 text-purple-400">
                  {card.icon}
                </div>
                <h3 className="text-white font-semibold text-md mb-1">{card.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>

          {/* Recent Documents Section */}
          {pdfs.length > 0 && (
            <div className="w-full border-t border-slate-800/40 pt-8">
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Recent study files
                </h2>
                <button
                  onClick={() => navigate("/library")}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Library</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pdfs.slice(0, 3).map((pdf) => (
                  <div
                    key={pdf.id}
                    onClick={() => {
                      localStorage.setItem("activePdfId", pdf.id);
                      navigate(`/workspace/${pdf.id}`);
                    }}
                    className="flex items-center gap-3 p-3.5 bg-slate-900/30 border border-slate-800/80 rounded-xl hover:border-purple-500/30 hover:bg-slate-900/50 cursor-pointer transition"
                  >
                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                      <FileText size={16} />
                    </div>
                    <span className="text-white text-sm font-medium truncate flex-1">
                      {pdf.filename}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;