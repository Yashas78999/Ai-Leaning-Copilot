import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getPdfDetails, chatWithPdf, ragChatWithPdf } from "../services/pdfService";
import { ArrowLeft, MessageSquare, Send, Sparkles, User, Brain, Copy } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function AiTutor() {
  const { pdfId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [pdf, setPdf] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(true);

  // Chat parameters
  const [mode, setMode] = useState("rag"); // "rag" or "standard"
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your AI Study Tutor. Ask me any questions about the document, or toggle between standard chat and RAG mode (which retrieves exact text chunks for citations)!"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [tutorLoadingStage, setTutorLoadingStage] = useState("Thinking...");
  
  // Quick suggestion prompts
  const suggestions = [
    "What are the important definitions?",
    "Summarize this chapter.",
    "Generate exam questions.",
    "Explain difficult concepts.",
    "What topics are most important?"
  ];

  // Dynamic typing loading stage timer
  useEffect(() => {
    let interval;
    if (sending) {
      const stages = ["Thinking...", "Searching document...", "Generating answer..."];
      let currentStage = 0;
      setTutorLoadingStage(stages[0]);
      interval = setInterval(() => {
        currentStage = (currentStage + 1) % stages.length;
        setTutorLoadingStage(stages[currentStage]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [sending]);

  useEffect(() => {
    if (pdfId) {
      localStorage.setItem("activePdfId", pdfId);
      loadPdfDetails();
    }
  }, [pdfId]);

  // Scroll to bottom whenever messages list grows
  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const loadPdfDetails = async () => {
    try {
      setLoadingPdf(true);
      const data = await getPdfDetails(pdfId);
      setPdf(data);
      
      // Grab temp question from dashboard and query immediately
      const tempQ = localStorage.getItem("tempQuestion");
      if (tempQ) {
        localStorage.removeItem("tempQuestion");
        setTimeout(() => {
          handleSendMessage(tempQ);
        }, 300);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load PDF details");
      navigate("/library");
    } finally {
      setLoadingPdf(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || sending) return;

    if (!textToSend) {
      setInputText("");
    }

    // Append user message
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setSending(true);

    // Build chat history logs (skip greeting message at index 0)
    const historyPayload = messages
      .filter((_, idx) => idx > 0)
      .map(m => ({
        role: m.role,
        content: m.content
      }));

    try {
      let response;
      if (mode === "rag") {
        response = await ragChatWithPdf(pdfId, text, historyPayload);
      } else {
        response = await chatWithPdf(pdfId, text, historyPayload);
      }

      const answer = response.answer || response;
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: answer,
          chunksUsed: response.chunks_used,
          sourceChunks: response.source_chunks
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an issue retrieving responses. Please verify the API configurations and try again."
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loadingPdf) {
    return (
      <div className="h-screen bg-[#0B1020] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading AI Tutor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0B1020] flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#0F172A]/80 border-b border-slate-800 p-4 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/workspace/${pdfId}`)}
              className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-white font-bold truncate max-w-md text-lg">
                AI Tutor: {pdf?.filename}
              </h1>
              <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mt-0.5">
                Active Session / {mode === "rag" ? "RAG Vector Chat" : "Standard Chat"}
              </p>
            </div>
          </div>

          {/* Mode Selector Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setMode("rag")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mode === "rag"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles size={12} />
              <span>RAG Mode</span>
            </button>
            <button
              onClick={() => setMode("standard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mode === "standard"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquare size={12} />
              <span>Standard Mode</span>
            </button>
          </div>
        </header>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role !== "user" && (
                  <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                    <Brain size={20} />
                  </div>
                )}

                <div
                  className={`relative group max-w-[80%] rounded-2xl p-4 md:p-5 text-sm md:text-md select-text leading-relaxed transition-all duration-300 hover:border-purple-500/30 ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-600/10"
                      : "bg-[#111827]/60 border border-slate-800 text-slate-200 rounded-tl-none backdrop-blur-md"
                  } animate-fade-in-up`}
                >
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content);
                        toast.success("Response copied to clipboard!");
                      }}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-500 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
                      title="Copy response"
                    >
                      <Copy size={14} />
                    </button>
                  )}

                  <div className="markdown-content select-text">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {msg.role === "assistant" && msg.sourceChunks && msg.sourceChunks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/85">
                      <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles size={12} />
                        <span>📄 Sources Used</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sourceChunks.map((chunk, idx) => (
                          <div 
                            key={idx}
                            className="group relative cursor-pointer"
                          >
                            <span className="px-2.5 py-1 bg-purple-900/20 border border-purple-500/20 text-purple-300 hover:bg-purple-600 hover:text-white rounded-lg text-xs font-semibold transition duration-200">
                              Chunk {chunk.index}
                            </span>
                            {/* Hover tooltip with preview of chunk text */}
                            <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 leading-relaxed max-h-32 overflow-y-auto">
                              <p className="font-semibold text-purple-400 mb-1">Source Text Preview:</p>
                              {chunk.text.length > 150 ? `${chunk.text.substring(0, 150)}...` : chunk.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-350 shrink-0">
                    <User size={20} />
                  </div>
                )}
              </div>
            ))}

            {/* AI Typing Indicator */}
            {sending && (
              <div className="flex gap-4 justify-start animate-fade-in-up">
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                  <Brain size={20} className="animate-pulse animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="bg-[#111827]/60 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-3 backdrop-blur-md">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider">{tutorLoadingStage}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggestion & Input Panel */}
        <div className="p-4 md:p-6 border-t border-slate-800 bg-[#0F172A]/40 backdrop-blur-md">
          <div className="max-w-4xl mx-auto">
            {/* Quick Suggestions (Only show if no messages have been sent by user) */}
            {messages.length === 1 && !sending && (
              <div className="flex flex-wrap gap-2.5 mb-4 justify-center md:justify-start">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sug)}
                    className="px-4 py-2 bg-slate-800/40 hover:bg-purple-600/15 border border-slate-750 hover:border-purple-500/30 text-slate-300 hover:text-purple-200 text-xs font-medium rounded-xl transition-all cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Input form */}
            <div className="relative flex items-center bg-[#111827]/75 border border-slate-700/80 rounded-2xl p-2.5 hover:border-purple-500/70 focus-within:border-purple-500 transition shadow-lg">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your study tutor anything about the document..."
                rows={1}
                className="flex-1 bg-transparent border-0 text-white placeholder-slate-500 outline-none text-sm md:text-md resize-none py-2 px-3 focus:ring-0 max-h-24 overflow-y-auto"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || sending}
                className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition cursor-pointer disabled:opacity-40 disabled:hover:scale-100 active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AiTutor;
