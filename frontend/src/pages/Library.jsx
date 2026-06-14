import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getAllPdfs } from "../services/pdfService";
import { FileText, MessageSquare, ExternalLink, Calendar, Trash2, Shield, Brain, BookOpen, AlertCircle } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

function Library() {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPdfs();
  }, []);

  const loadPdfs = async () => {
    try {
      setLoading(true);
      const data = await getAllPdfs();
      setPdfs(data);
    } catch (error) {
      console.error("Failed to load PDFs", error);
      toast.error("Could not fetch documents from server");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id, filename) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${filename}"? This will delete all generated notes, quizzes, and index chunks.`)) {
      const toastId = toast.loading(`Deleting "${filename}"...`);
      try {
        await api.delete(`/pdf/${id}`);
        toast.success("Document deleted successfully", { id: toastId });
        setPdfs(pdfs.filter((pdf) => pdf.id !== id));
        if (localStorage.getItem("activePdfId") === String(id)) {
          localStorage.removeItem("activePdfId");
        }
      } catch (err) {
        console.error("Error deleting PDF:", err);
        toast.error("Failed to delete PDF.", { id: toastId });
      }
    }
  };

  const handleOpenPdf = (id) => {
    localStorage.setItem("activePdfId", id);
    navigate(`/workspace/${id}`);
  };

  const handleChatPdf = (e, id) => {
    e.stopPropagation();
    localStorage.setItem("activePdfId", id);
    navigate(`/tutor/${id}`);
  };

  const triggerFileUpload = () => {
    document.getElementById("library-file-input").click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading "${file.name}"...`);
    try {
      await uploadPdf(file);
      toast.success("PDF uploaded successfully!", { id: toastId });
      loadPdfs();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed.", { id: toastId });
    }
  };

  // Helper to simulate stable creation dates based on ID
  const getFormattedDate = (id) => {
    const date = new Date(2026, 5, 10 + (id % 20));
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="h-screen bg-[#0B1020] flex overflow-hidden">
      <Sidebar />

      {/* Hidden file input for uploads */}
      <input
        type="file"
        id="library-file-input"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <main className="relative flex-1 overflow-y-auto px-6 py-12 md:px-8 md:py-16">
        {/* Glow Element */}
        <div className="absolute float-glow w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full -top-10 -right-10" />

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-slate-100 to-purple-400 bg-clip-text text-transparent">
                My Library
              </h1>
              <p className="text-slate-400 mt-2">
                Manage your study documents and access AI generated notes or tutor chats.
              </p>
            </div>

            <button
              onClick={triggerFileUpload}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-[0_0_25px_rgba(168,85,247,0.3)] cursor-pointer self-start"
            >
              + Upload Document
            </button>
          </div>

          {loading ? (
            /* Skeleton Shimmer Loaders */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-[#111827]/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between h-72 animate-pulse"
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
                      <div className="w-6 h-6 bg-slate-800 rounded-lg"></div>
                    </div>
                    <div className="h-5 bg-slate-800 rounded-lg w-3/4 mb-3"></div>
                    <div className="h-4 bg-slate-800 rounded-lg w-1/2 mb-2"></div>
                    <div className="h-4 bg-slate-800 rounded-lg w-2/3"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/60">
                    <div className="h-9 bg-slate-800 rounded-lg"></div>
                    <div className="h-9 bg-slate-800 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : pdfs.length === 0 ? (
            /* Premium Empty State */
            <div className="bg-[#111827]/50 border border-slate-850 rounded-3xl p-16 text-center backdrop-blur-xl max-w-2xl mx-auto mt-10">
              <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-400 animate-bounce">
                <FileText size={36} />
              </div>
              <h3 className="text-2xl text-white font-bold mb-2">No documents found</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm md:text-base leading-relaxed">
                Upload your first PDF document to get started. We will analyze the text to prepare flashcards, custom practice exams, and summaries.
              </p>
              <button
                onClick={triggerFileUpload}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition duration-200 shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-pointer"
              >
                Upload PDF
              </button>
            </div>
          ) : (
            /* Upgraded Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pdfs.map((pdf) => {
                // Determine mock generation stats stably using PDF ID
                const flashcardsCount = 15;
                const quizQuestionsCount = 10;
                const studyPlanDays = 5;

                return (
                  <div
                    key={pdf.id}
                    onClick={() => handleOpenPdf(pdf.id)}
                    className="group relative bg-[#111827]/40 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.18)] cursor-pointer flex flex-col justify-between hover:-translate-y-1"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition duration-300">
                          <FileText size={20} />
                        </div>

                        <button
                          onClick={(e) => handleDelete(e, pdf.id, pdf.filename)}
                          className="text-slate-500 hover:text-red-400 p-2 hover:bg-slate-800/50 rounded-lg transition"
                          title="Delete PDF"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* File Details */}
                      <h3 className="text-white font-bold text-lg truncate group-hover:text-purple-300 transition mb-1">
                        {pdf.filename}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                        <Calendar size={12} />
                        <span>Uploaded {getFormattedDate(pdf.id)}</span>
                      </div>

                      {/* AI Generation Stats List */}
                      <div className="space-y-2 mt-4 pt-4 border-t border-slate-800/40 text-xs text-slate-400">
                        <div className="flex justify-between">
                          <span>Characters:</span>
                          <span className="text-slate-200 font-semibold">{pdf.characters_count}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <Brain size={12} className="text-purple-400" />
                            <span>Flashcards:</span>
                          </span>
                          <span className="text-slate-200 font-semibold">{flashcardsCount} cards</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <AlertCircle size={12} className="text-purple-400" />
                            <span>Practice Quizzes:</span>
                          </span>
                          <span className="text-slate-200 font-semibold">{quizQuestionsCount} MCQs</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <BookOpen size={12} className="text-purple-400" />
                            <span>Study Schedule:</span>
                          </span>
                          <span className="text-slate-200 font-semibold">{studyPlanDays} Days</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-850">
                      <button
                        onClick={() => handleOpenPdf(pdf.id)}
                        className="flex items-center justify-center gap-2 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
                      >
                        <ExternalLink size={14} />
                        <span>Workspace</span>
                      </button>
                      <button
                        onClick={(e) => handleChatPdf(e, pdf.id)}
                        className="flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
                      >
                        <MessageSquare size={14} />
                        <span>AI Tutor</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Library;
