import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getPdfDetails,
  generateNotes,
  generateFlashcards,
  generateQuiz,
  generateStudyPlan
} from "../services/pdfService";
import {
  FileText,
  Brain,
  CircleHelp,
  BookOpen,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Copy,
  Download,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  CheckCircle,
  Award,
  AlertTriangle,
  Check,
  X,
  Square,
  CheckSquare
} from "lucide-react";
import toast from "react-hot-toast";

function Workspace() {
  const { pdfId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active tab state
  const activeTab = searchParams.get("tab") || "notes";

  // PDF info
  const [pdf, setPdf] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(true);

  // Notes state
  const [notes, setNotes] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Flashcards state
  const [flashcards, setFlashcards] = useState([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Quiz state
  const [quiz, setQuiz] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Study plan state
  const [studyPlanDays, setStudyPlanDays] = useState([]);
  const [loadingStudyPlan, setLoadingStudyPlan] = useState(false);
  const [prefDays, setPrefDays] = useState(5);
  const [completedTasks, setCompletedTasks] = useState({});

  useEffect(() => {
    if (pdfId) {
      localStorage.setItem("activePdfId", pdfId);
      loadPdfDetails();
      
      // Load preference defaults
      const savedDays = localStorage.getItem("prefStudyPlanLength") || "5";
      setPrefDays(Number(savedDays));
      
      // Load completed study plan items
      const savedTasks = localStorage.getItem(`pdf-${pdfId}-study-tasks`);
      if (savedTasks) {
        setCompletedTasks(JSON.parse(savedTasks));
      }
    }
  }, [pdfId]);

  // Load content automatically when tab changes
  useEffect(() => {
    if (!pdf) return;
    if (activeTab === "notes" && !notes) handleGenerateNotes();
    if (activeTab === "flashcards" && flashcards.length === 0) handleGenerateFlashcards();
    if (activeTab === "quiz" && quiz.length === 0) handleGenerateQuiz();
    if (activeTab === "study-plan" && studyPlanDays.length === 0) handleGenerateStudyPlan();
  }, [activeTab, pdf]);

  const loadPdfDetails = async () => {
    try {
      setLoadingPdf(true);
      const data = await getPdfDetails(pdfId);
      setPdf(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch PDF details");
      navigate("/library");
    } finally {
      setLoadingPdf(false);
    }
  };

  // 1. NOTES METHODS & TOOLBAR
  const handleGenerateNotes = async () => {
    try {
      setLoadingNotes(true);
      const data = await generateNotes(pdfId);
      setNotes(data.notes || data);
      toast.success("Study notes ready!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate notes");
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleCopyNotes = () => {
    if (!notes) return;
    navigator.clipboard.writeText(notes);
    toast.success("Notes copied to clipboard!");
  };

  const handleDownloadNotes = () => {
    if (!notes) return;
    const blob = new Blob([notes], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pdf?.filename || "study"}-notes.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Notes downloaded as Markdown!");
  };

  // 2. FLASHCARDS METHODS & PAGE VIEW
  const parseFlashcards = (rawText) => {
    if (!rawText) return [];
    const cards = [];
    const parts = rawText.split(/(?:Q|Question|QUESTION)\s*\d*[:：]|\*\*Q\*\*[:：]|\*\*Question\*\*[:：]/gi);
    
    for (const part of parts) {
      if (!part.trim()) continue;
      const qMatch = part.match(/^([\s\S]*?)(?=(?:A|Answer|ANSWER|Explanation)[:：]|\*\*A\*\*[:：]|\*\*Answer\*\*[:：]|$)/i);
      const aMatch = part.match(/(?:A|Answer|ANSWER)[:：]\s*([\s\S]*)$/i) || part.match(/\*\*A\*\*[:：]\s*([\s\S]*)$/i) || part.match(/\*\*Answer\*\*[:：]\s*([\s\S]*)$/i);
      
      if (qMatch && aMatch) {
        cards.push({
          question: qMatch[1].replace(/^\*\*|\*\*$/g, "").trim(),
          answer: aMatch[1].replace(/^\*\*|\*\*$/g, "").trim()
        });
      }
    }

    if (cards.length === 0) {
      const lines = rawText.split("\n");
      let currentQ = "";
      for (let line of lines) {
        const cleanLine = line.replace(/\*\*/g, "").trim();
        if (cleanLine.toUpperCase().startsWith("Q:") || cleanLine.toUpperCase().startsWith("QUESTION:")) {
          currentQ = cleanLine.replace(/^(?:Q|QUESTION):\s*/i, "").trim();
        } else if ((cleanLine.toUpperCase().startsWith("A:") || cleanLine.toUpperCase().startsWith("ANSWER:")) && currentQ) {
          const ans = cleanLine.replace(/^(?:A|ANSWER):\s*/i, "").trim();
          cards.push({ question: currentQ, answer: ans });
          currentQ = "";
        }
      }
    }
    return cards;
  };

  const handleGenerateFlashcards = async () => {
    try {
      setLoadingFlashcards(true);
      const data = await generateFlashcards(pdfId);
      const rawText = data.flashcards || data;
      setFlashcards(parseFlashcards(rawText));
      setCardIndex(0);
      setIsCardFlipped(false);
      toast.success("Flashcards generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate flashcards");
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const shuffleFlashcards = () => {
    if (flashcards.length === 0) return;
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCardIndex(0);
    setIsCardFlipped(false);
    toast.success("Shuffled flashcards!");
  };

  // 3. QUIZ METHODS & PAGES VIEW
  const parseQuiz = (rawText) => {
    if (!rawText) return [];
    const blocks = rawText.split(/(?=Question|Q\d+[:：]|\bQ:)/i);
    const parsed = [];
    for (const block of blocks) {
      if (!block.trim()) continue;
      
      const qMatch = block.match(/(?:Question|Q\d*[:：]|\bQ)\s*\d*[:：]?\s*([\s\S]*?)(?=\b[A-D][\s.）)]|Answer:|$)/i);
      if (!qMatch) continue;
      
      const questionText = qMatch[1].replace(/^\*\*|\*\*$/g, "").trim();
      
      const aMatch = block.match(/\bA[\s.）)]\s*([\s\S]*?)(?=\bB[\s.）)]|Answer:|$)/i);
      const bMatch = block.match(/\bB[\s.）)]\s*([\s\S]*?)(?=\bC[\s.）)]|Answer:|$)/i);
      const cMatch = block.match(/\bC[\s.）)]\s*([\s\S]*?)(?=\bD[\s.）)]|Answer:|$)/i);
      const dMatch = block.match(/\bD[\s.）)]\s*([\s\S]*?)(?=Answer:|$)/i);
      const ansMatch = block.match(/(?:Answer|Correct Answer)[:：]\s*([A-D])/i) || block.match(/\*\*Answer\*\*[:：]\s*([A-D])/i);
      
      if (questionText) {
        parsed.push({
          question: questionText,
          options: {
            A: aMatch ? aMatch[1].replace(/^\*\*|\*\*$/g, "").trim() : "",
            B: bMatch ? bMatch[1].replace(/^\*\*|\*\*$/g, "").trim() : "",
            C: cMatch ? cMatch[1].replace(/^\*\*|\*\*$/g, "").trim() : "",
            D: dMatch ? dMatch[1].replace(/^\*\*|\*\*$/g, "").trim() : "",
          },
          correctAnswer: ansMatch ? ansMatch[1].trim().toUpperCase() : "A"
        });
      }
    }
    return parsed;
  };

  const handleGenerateQuiz = async () => {
    try {
      setLoadingQuiz(true);
      setQuizSubmitted(false);
      setUserAnswers({});
      setQuizIndex(0);
      const data = await generateQuiz(pdfId);
      const rawText = data.quiz || data;
      setQuiz(parseQuiz(rawText));
      toast.success("Practice evaluation generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate quiz");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    toast.success("Evaluation submitted successfully!");
  };

  const getQuizScore = () => {
    let score = 0;
    quiz.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  const getIncorrectCount = () => {
    return quiz.length - getQuizScore();
  };

  const getPercentageScore = () => {
    if (quiz.length === 0) return 0;
    return Math.round((getQuizScore() / quiz.length) * 100);
  };

  // 4. STUDY PLAN METHODS & PROGRESS CHECKS
  const parseStudyPlan = (rawText) => {
    if (!rawText) return [];
    
    // Split by Day boundaries
    const dayBlocks = rawText.split(/(?=Day \d+|Day Number \d+|\bDay\s+[A-Za-z0-9]+)/i);
    const plans = [];
    
    for (const block of dayBlocks) {
      if (!block.trim()) continue;
      const lines = block.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) continue;
      
      const title = lines[0].replace(/^\s*[#*-\s]+/, "").trim();
      const tasks = lines
        .slice(1)
        .map((l) => l.replace(/^\s*[-*•\d+.)\s]+/, "").trim())
        .filter((l) => l.length > 0);

      if (title && tasks.length > 0) {
        plans.push({ title, tasks });
      }
    }
    
    // Fallback: if no day blocks found, split the entire text into 5 logical days
    if (plans.length === 0) {
      const allLines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 2);
      if (allLines.length > 0) {
        const chunkSize = Math.max(1, Math.ceil(allLines.length / 5));
        for (let i = 0; i < 5; i++) {
          const start = i * chunkSize;
          const end = Math.min(allLines.length, start + chunkSize);
          const tasks = allLines.slice(start, end);
          if (tasks.length > 0) {
            plans.push({
              title: `Study Phase ${i + 1}`,
              tasks
            });
          }
        }
      }
    }
    
    return plans;
  };

  const handleGenerateStudyPlan = async () => {
    try {
      setLoadingStudyPlan(true);
      const data = await generateStudyPlan(pdfId, prefDays);
      const rawText = data.study_plan || data;
      setStudyPlanDays(parseStudyPlan(rawText));
      toast.success("Timeline calendar created!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate study plan");
    } finally {
      setLoadingStudyPlan(false);
    }
  };

  const toggleTaskCompletion = (dayIndex, taskIndex) => {
    const key = `${dayIndex}-${taskIndex}`;
    const updated = {
      ...completedTasks,
      [key]: !completedTasks[key]
    };
    setCompletedTasks(updated);
    localStorage.setItem(`pdf-${pdfId}-study-tasks`, JSON.stringify(updated));
  };

  const getStudyProgress = () => {
    let totalTasks = 0;
    let finishedTasks = 0;
    studyPlanDays.forEach((day, dIdx) => {
      day.tasks.forEach((_, tIdx) => {
        totalTasks++;
        if (completedTasks[`${dIdx}-${tIdx}`]) finishedTasks++;
      });
    });
    if (totalTasks === 0) return 0;
    return Math.round((finishedTasks / totalTasks) * 100);
  };

  const changeTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // SHIMMER SKELETON COMPONENTS
  const NotesSkeleton = () => (
    <div className="flex flex-col items-center justify-center py-20 bg-[#111827]/40 border border-slate-850 rounded-2xl p-8 backdrop-blur-xl shadow-2xl animate-pulse">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h3 className="text-xl font-bold text-white mb-2">Generating Notes...</h3>
      <p className="text-slate-400 text-sm max-w-sm text-center">
        Our AI Tutor is reading through the document content to summarize key details.
      </p>
    </div>
  );

  const FlashcardSkeleton = () => (
    <div className="flex flex-col items-center justify-center py-20 bg-[#111827]/40 border border-slate-850 rounded-2xl p-8 backdrop-blur-xl shadow-2xl animate-pulse">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h3 className="text-xl font-bold text-white mb-2">Generating Flashcards...</h3>
      <p className="text-slate-400 text-sm max-w-sm text-center">
        Creating core definitions and active recall question-answer decks.
      </p>
    </div>
  );

  const QuizSkeleton = () => (
    <div className="flex flex-col items-center justify-center py-20 bg-[#111827]/40 border border-slate-850 rounded-2xl p-8 backdrop-blur-xl shadow-2xl animate-pulse">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h3 className="text-xl font-bold text-white mb-2">Creating Quiz...</h3>
      <p className="text-slate-400 text-sm max-w-sm text-center">
        Formulating evaluation multiple choice questions from the syllabus.
      </p>
    </div>
  );

  const StudyPlanSkeleton = () => (
    <div className="flex flex-col items-center justify-center py-20 bg-[#111827]/40 border border-slate-850 rounded-2xl p-8 backdrop-blur-xl shadow-2xl animate-pulse">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h3 className="text-xl font-bold text-white mb-2">Creating Study Plan...</h3>
      <p className="text-slate-400 text-sm max-w-sm text-center">
        Mapping daily lessons and active revision milestones.
      </p>
    </div>
  );

  return (
    <div className="h-screen bg-[#0B1020] flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#0F172A]/80 border-b border-slate-800 p-4 flex items-center justify-between backdrop-blur-md z-10 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/library")}
              className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="max-w-[200px] md:max-w-md">
              <h1 className="text-white font-bold truncate text-base md:text-lg">
                {pdf?.filename}
              </h1>
              <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mt-0.5">
                Workspace / {activeTab}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/tutor/${pdfId}`)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:scale-105"
          >
            <MessageSquare size={16} />
            <span>Chat with AI</span>
          </button>
        </header>

        {/* Tab Selection */}
        <div className="bg-[#0F172A]/30 px-6 py-2.5 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: "notes", label: "Study Notes", icon: <FileText size={16} /> },
            { id: "flashcards", label: "Flashcards", icon: <Brain size={16} /> },
            { id: "quiz", label: "Practice Quiz", icon: <CircleHelp size={16} /> },
            { id: "study-plan", label: "Study Plan", icon: <BookOpen size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer shrink-0
              ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0B1020]">
          
          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 border-b border-slate-800/40 pb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="text-purple-400" />
                  <span>AI Generated Notes</span>
                </h2>
                
                {/* Notes Toolbar */}
                {notes && !loadingNotes && (
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleCopyNotes}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-350 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                      title="Copy notes"
                    >
                      <Copy size={14} />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={handleDownloadNotes}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-350 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                      title="Download markdown file"
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={handleGenerateNotes}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20 text-purple-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      <span>Regenerate</span>
                    </button>
                  </div>
                )}
              </div>

              {loadingNotes ? (
                <NotesSkeleton />
              ) : notes ? (
                <div className="bg-[#111827]/40 border border-slate-850 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
                  <div className="markdown-content select-text">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {notes}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-[#111827]/20 rounded-2xl border border-dashed border-slate-800 max-w-xl mx-auto">
                  <FileText size={32} className="text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-semibold mb-6">Create summaries for study review</p>
                  <button
                    onClick={handleGenerateNotes}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  >
                    Generate Study Notes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Flashcards Tab */}
          {activeTab === "flashcards" && (
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Brain className="text-purple-400" />
                    <span>Active Flashcards</span>
                  </h2>
                </div>
                
                {flashcards.length > 0 && !loadingFlashcards && (
                  <div className="flex gap-2.5">
                    <button
                      onClick={shuffleFlashcards}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-350 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      <Shuffle size={14} />
                      <span>Shuffle</span>
                    </button>
                    <button
                      onClick={handleGenerateFlashcards}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20 text-purple-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      <span>Regenerate</span>
                    </button>
                  </div>
                )}
              </div>

              {loadingFlashcards ? (
                <FlashcardSkeleton />
              ) : flashcards.length > 0 ? (
                <div className="flex flex-col items-center space-y-6">
                  {/* Progress Indicator */}
                  <div className="text-slate-400 text-sm font-medium tracking-wide">
                    Card <span className="text-purple-400 font-bold">{cardIndex + 1}</span> of {flashcards.length}
                  </div>

                  {/* 3D Flip Card Container */}
                  <div
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    className="w-full max-w-lg h-72 cursor-pointer perspective"
                  >
                    <div
                      className="relative w-full h-full duration-500 preserve-3d"
                      style={{
                        transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                      }}
                    >
                      {/* Front Card Face */}
                      <div className="absolute w-full h-full bg-[#111827]/80 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between backface-hidden shadow-2xl backdrop-blur-xl">
                        <span className="text-xs text-purple-400 font-bold tracking-widest uppercase">
                          Question Prompt
                        </span>
                        <p className="text-white text-lg md:text-xl font-semibold text-center flex-1 flex items-center justify-center select-text">
                          {flashcards[cardIndex].question}
                        </p>
                        <span className="text-xs text-slate-500 text-center uppercase tracking-wider font-semibold">
                          Click card to flip
                        </span>
                      </div>

                      {/* Back Card Face (Fixed mirroring with rotateY inline style) */}
                      <div
                        className="absolute w-full h-full bg-purple-900/10 border border-purple-500/30 rounded-3xl p-8 flex flex-col justify-between backface-hidden shadow-2xl backdrop-blur-xl"
                        style={{
                          transform: "rotateY(180deg)"
                        }}
                      >
                        <span className="text-xs text-purple-400 font-bold tracking-widest uppercase">
                          Answer Card
                        </span>
                        <p className="text-purple-100 text-md md:text-lg text-center flex-1 flex items-center justify-center select-text leading-relaxed">
                          {flashcards[cardIndex].answer}
                        </p>
                        <span className="text-xs text-purple-400/80 text-center uppercase tracking-wider font-semibold">
                          Click card to flip
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Carousel Controls */}
                  <div className="flex items-center gap-6 pt-4">
                    <button
                      onClick={() => {
                        setCardIndex((prev) => Math.max(0, prev - 1));
                        setIsCardFlipped(false);
                      }}
                      disabled={cardIndex === 0}
                      className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl transition cursor-pointer"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <button
                      onClick={() => {
                        setCardIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
                        setIsCardFlipped(false);
                      }}
                      disabled={cardIndex === flashcards.length - 1}
                      className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl transition cursor-pointer"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-[#111827]/20 rounded-2xl border border-dashed border-slate-800 max-w-xl mx-auto">
                  <Brain size={32} className="text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-semibold mb-6">Review key definitions</p>
                  <button
                    onClick={handleGenerateFlashcards}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  >
                    Generate Flashcards
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === "quiz" && (
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CircleHelp className="text-purple-400" />
                    <span>Practice Evaluation</span>
                  </h2>
                </div>
                {quiz.length > 0 && !loadingQuiz && (
                  <button
                    onClick={handleGenerateQuiz}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20 text-purple-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>Regenerate</span>
                  </button>
                )}
              </div>

              {loadingQuiz ? (
                <QuizSkeleton />
              ) : quiz.length > 0 ? (
                /* Quiz Content View */
                !quizSubmitted ? (
                  <div className="space-y-6">
                    {/* Header Progress and Score Indicator */}
                    <div className="bg-[#111827]/40 border border-slate-850 rounded-2xl p-4 md:p-6 backdrop-blur-xl">
                      <div className="flex justify-between text-sm text-slate-400 font-semibold mb-3">
                        <span>Question {quizIndex + 1} of {quiz.length}</span>
                        <span>Answered: {Object.keys(userAnswers).length} / {quiz.length}</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                        <div
                          className="bg-purple-600 h-full transition-all duration-300"
                          style={{
                            width: `${((quizIndex) / quiz.length) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Active Question card */}
                    <div className="bg-[#111827]/40 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl">
                      <h3 className="text-white font-bold mb-6 text-md md:text-lg flex items-start gap-3">
                        <span className="text-purple-400 font-mono">Q{quizIndex + 1}.</span>
                        <span>{quiz[quizIndex].question}</span>
                      </h3>

                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(quiz[quizIndex].options).map(([optKey, optVal]) => {
                          if (!optVal) return null;
                          const isSelected = userAnswers[quizIndex] === optKey;
                          
                          return (
                            <button
                              key={optKey}
                              onClick={() => {
                                setUserAnswers({
                                  ...userAnswers,
                                  [quizIndex]: optKey
                                });
                              }}
                              className={`
                              w-full text-left p-4 rounded-xl text-sm transition-all duration-200 cursor-pointer flex items-center justify-between border
                              ${
                                isSelected
                                  ? "bg-purple-600/20 border-purple-500 text-white font-semibold shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                  : "bg-slate-800/30 border-slate-800 text-slate-350 hover:bg-slate-800/60 hover:text-white"
                              }
                              `}
                            >
                              <span>
                                <strong className="font-mono text-purple-400 mr-2">{optKey})</strong>
                                {optVal}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quiz Index Controls */}
                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => setQuizIndex((prev) => Math.max(0, prev - 1))}
                        disabled={quizIndex === 0}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-40"
                      >
                        Previous
                      </button>

                      {quizIndex < quiz.length - 1 ? (
                        <button
                          onClick={() => setQuizIndex((prev) => prev + 1)}
                          disabled={!userAnswers[quizIndex]}
                          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
                        >
                          Next Question
                        </button>
                      ) : (
                        <button
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(userAnswers).length < quiz.length}
                          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50"
                        >
                          Submit Quiz
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* GORGEOUS COMPLETION SUMMARY PAGE */
                  <div className="space-y-6">
                    <div className="bg-[#111827]/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center flex flex-col items-center">
                      <div className="p-4 bg-purple-500/10 rounded-full text-purple-400 mb-6">
                        <Award size={48} className="animate-bounce" />
                      </div>
                      
                      <h3 className="text-3xl font-extrabold text-white mb-2">Practice Complete!</h3>
                      <p className="text-slate-400 text-md max-w-md mb-8">
                        Great work evaluating your mastery over the document text. Let's see your results details below:
                      </p>

                      {/* Evaluation Statistics grid */}
                      <div className="grid grid-cols-3 gap-6 w-full max-w-lg mb-8">
                        <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl">
                          <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Accuracy
                          </span>
                          <strong className={`text-2xl font-bold ${getPercentageScore() >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                            {getPercentageScore()}%
                          </strong>
                        </div>

                        <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl">
                          <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Correct
                          </span>
                          <strong className="text-2xl font-bold text-emerald-400">
                            {getQuizScore()} / {quiz.length}
                          </strong>
                        </div>

                        <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl">
                          <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Incorrect
                          </span>
                          <strong className="text-2xl font-bold text-red-400">
                            {getIncorrectCount()}
                          </strong>
                        </div>
                      </div>

                      {/* Performance Bar */}
                      <div className="w-full max-w-lg bg-slate-800 h-3.5 rounded-full overflow-hidden mb-10">
                        <div
                          className={`h-full transition-all duration-500 ${
                            getPercentageScore() >= 80
                              ? "bg-emerald-500"
                              : getPercentageScore() >= 50
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${getPercentageScore()}%` }}
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            setQuizSubmitted(false);
                            setUserAnswers({});
                            setQuizIndex(0);
                          }}
                          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition cursor-pointer flex items-center gap-2"
                        >
                          <RotateCcw size={16} />
                          <span>Restart Quiz</span>
                        </button>
                        <button
                          onClick={handleGenerateQuiz}
                          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                        >
                          <RefreshCw size={16} />
                          <span>Try New Questions</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-20 bg-[#111827]/20 rounded-2xl border border-dashed border-slate-800 max-w-xl mx-auto">
                  <CircleHelp size={32} className="text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 font-semibold mb-6">Evaluate your document mastery</p>
                  <button
                    onClick={handleGenerateQuiz}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  >
                    Generate Practice Quiz
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Study Plan Tab */}
          {activeTab === "study-plan" && (
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="text-purple-400" />
                    <span>Timeline Study Schedule</span>
                  </h2>
                </div>
                {studyPlanDays.length > 0 && !loadingStudyPlan && (
                  <button
                    onClick={handleGenerateStudyPlan}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20 text-purple-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>Regenerate</span>
                  </button>
                )}
              </div>

              {loadingStudyPlan ? (
                <StudyPlanSkeleton />
              ) : studyPlanDays.length > 0 && studyPlanDays[0].tasks.length > 0 ? (
                <div className="space-y-6">
                  {/* Progress Tracker Card */}
                  <div className="bg-[#111827]/40 border border-slate-850 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex justify-between text-sm text-slate-400 font-semibold mb-3">
                      <span>Course Completion Progress</span>
                      <span className="text-purple-400 font-bold">{getStudyProgress()}% Completed</span>
                    </div>

                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-600 h-full transition-all duration-500"
                        style={{ width: `${getStudyProgress()}%` }}
                      />
                    </div>
                  </div>

                  {/* Day-by-Day Cards */}
                  <div className="space-y-4">
                    {studyPlanDays.map((day, dIdx) => (
                      <div
                        key={dIdx}
                        className="bg-[#111827]/40 border border-slate-800 rounded-2xl p-5 md:p-6 backdrop-blur-md shadow-lg"
                      >
                        <h3 className="text-white font-bold text-md mb-4 flex items-center gap-2">
                          <CheckCircle size={18} className="text-purple-500" />
                          <span>{day.title}</span>
                        </h3>

                        {/* Task Checklist Items */}
                        <div className="space-y-3">
                          {day.tasks.map((task, tIdx) => {
                            const isFinished = completedTasks[`${dIdx}-${tIdx}`];
                            return (
                              <div
                                key={tIdx}
                                onClick={() => toggleTaskCompletion(dIdx, tIdx)}
                                className={`
                                flex items-start gap-3 p-3.5 rounded-xl text-sm transition-all duration-200 cursor-pointer border select-none
                                ${
                                  isFinished
                                    ? "bg-purple-600/5 border-purple-500/20 text-slate-400"
                                    : "bg-slate-900/40 border-slate-800/60 text-slate-200 hover:border-slate-700"
                                }
                                `}
                              >
                                <button className="pt-0.5 text-purple-400">
                                  {isFinished ? (
                                    <CheckSquare size={16} className="text-purple-500" />
                                  ) : (
                                    <Square size={16} className="text-slate-600" />
                                  )}
                                </button>
                                <span className={isFinished ? "line-through text-slate-500" : ""}>
                                  {task}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Plan Selector Settings State */
                <div className="bg-[#111827]/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-lg max-w-xl mx-auto">
                  <h3 className="text-xl font-bold text-white mb-2">Generate Calendar Timeline</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Map out daily tasks with ticking checklists. Set plan duration:
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <select
                      value={prefDays}
                      onChange={(e) => setPrefDays(Number(e.target.value))}
                      className="flex-1 p-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none"
                    >
                      {[3, 5, 7, 10, 14].map((d) => (
                        <option key={d} value={d}>
                          {d} Days Course
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleGenerateStudyPlan}
                      className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition duration-200 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                    >
                      Create Study Plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Workspace;
