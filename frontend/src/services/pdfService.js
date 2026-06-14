import api from "../api/axios";

export const uploadPdf = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/pdf/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const getAllPdfs = async () => {
  const response = await api.get("/pdf");
  return response.data;
};

export const getPdfDetails = async (pdfId) => {
  const response = await api.get(`/pdf/${pdfId}`);
  return response.data;
};

export const generateNotes = async (pdfId) => {
  const response = await api.get(`/pdf/notes/${pdfId}`);
  return response.data;
};

export const generateFlashcards = async (pdfId) => {
  const response = await api.get(`/pdf/flashcards/${pdfId}`);
  return response.data;
};

export const generateQuiz = async (pdfId) => {
  const response = await api.get(`/pdf/quiz/${pdfId}`);
  return response.data;
};

export const generateStudyPlan = async (pdfId, days) => {
  const response = await api.get(`/pdf/study-plan/${pdfId}`, {
    params: { days }
  });
  return response.data;
};

export const chatWithPdf = async (pdfId, question, history = []) => {
  const response = await api.post(`/pdf/chat/${pdfId}`, { question, history });
  return response.data;
};

export const ragChatWithPdf = async (pdfId, question, history = []) => {
  const response = await api.post(`/pdf/rag-chat/${pdfId}`, { question, history });
  return response.data;
};