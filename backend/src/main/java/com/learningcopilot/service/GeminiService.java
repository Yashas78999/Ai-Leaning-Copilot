package com.learningcopilot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningcopilot.dto.MessageDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private boolean isApiKeyConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    private String generateContent(String prompt, String fallbackContent) {
        if (!isApiKeyConfigured()) {
            log.warn("Gemini API key is not configured. Using fallback generator.");
            return fallbackContent;
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Construct payload: { "contents": [{ "parts": [{ "text": prompt }] }] }
            Map<String, Object> textPart = Map.of("text", prompt);
            Map<String, Object> contentPart = Map.of("parts", List.of(textPart));
            Map<String, Object> payload = Map.of("contents", List.of(contentPart));

            String jsonPayload = objectMapper.writeValueAsString(payload);
            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);

            String responseStr = restTemplate.postForObject(url, entity, String.class);
            JsonNode root = objectMapper.readTree(responseStr);
            
            // Extract response text: root.candidates[0].content.parts[0].text
            JsonNode textNode = root.path("candidates").get(0)
                    .path("content").path("parts").get(0).path("text");
            
            if (!textNode.isMissingNode()) {
                return textNode.asText();
            }
        } catch (Exception e) {
            log.error("Error calling Gemini API: {}. Falling back.", e.getMessage());
        }
        return fallbackContent;
    }

    public List<Double> getEmbedding(String text) {
        if (!isApiKeyConfigured()) {
            log.warn("Gemini API key is not configured. Returning dummy embedding.");
            // Return a mock embedding of size 768 (same size as text-embedding-004)
            List<Double> mockEmbedding = new ArrayList<>();
            Random r = new Random(text.hashCode());
            for (int i = 0; i < 768; i++) {
                mockEmbedding.add(r.nextGaussian() * 0.1);
            }
            return mockEmbedding;
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=" + apiKey;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Construct payload: { "model": "models/text-embedding-004", "content": { "parts": [{ "text": text }] } }
            Map<String, Object> textPart = Map.of("text", text);
            Map<String, Object> contentPart = Map.of("parts", List.of(textPart));
            Map<String, Object> payload = Map.of(
                    "model", "models/text-embedding-004",
                    "content", contentPart
            );

            String jsonPayload = objectMapper.writeValueAsString(payload);
            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);

            String responseStr = restTemplate.postForObject(url, entity, String.class);
            JsonNode root = objectMapper.readTree(responseStr);

            // Extract values: root.embedding.values
            JsonNode valuesNode = root.path("embedding").path("values");
            if (valuesNode.isArray()) {
                List<Double> embedding = new ArrayList<>();
                for (JsonNode val : valuesNode) {
                    embedding.add(val.asDouble());
                }
                return embedding;
            }
        } catch (Exception e) {
            log.error("Error generating embedding: {}", e.getMessage());
        }
        
        // Final fallback to dummy embedding
        List<Double> mockEmbedding = new ArrayList<>();
        Random r = new Random(text.hashCode());
        for (int i = 0; i < 768; i++) {
            mockEmbedding.add(r.nextGaussian() * 0.1);
        }
        return mockEmbedding;
    }

    public String generateNotes(String text) {
        String prompt = "You are an expert AI study tutor.\n" +
                "Create well-structured, professional, and comprehensive study notes from the following content.\n" +
                "Make sure you summarize the content clearly, identify all core concepts with definitions, outline key takeaways in bullet points, and provide exam revision tips.\n" +
                "Answer ONLY using the provided content. If certain sections are not covered in the source text, do not invent information or hallucinate.\n" +
                "Format the output beautifully using markdown headings, bold text, bullet points, and tables where applicable to organize the details.\n\n" +
                "Content:\n" +
                text.substring(0, Math.min(text.length(), 15000));
        
        return generateContent(prompt, fallbackGenerateNotes(text));
    }

    public String generateFlashcards(String text) {
        String prompt = "You are an expert AI study tutor.\n" +
                "Create exactly 15 high-quality study flashcards from the content below.\n" +
                "Each flashcard must focus on key terms, definitions, and core concepts to help with active recall.\n" +
                "Format each flashcard exactly like:\n\n" +
                "Q: Question\n" +
                "A: Answer\n\n" +
                "Ensure the answers are concise, exam-focused, and based ONLY on the provided content. Do not hallucinate or invent information.\n\n" +
                "Content:\n" +
                text.substring(0, Math.min(text.length(), 15000));

        return generateContent(prompt, fallbackGenerateFlashcards(text));
    }

    public String generateQuiz(String text) {
        String prompt = "You are an expert AI study tutor.\n" +
                "Create exactly 10 high-quality multiple-choice questions from the content below.\n" +
                "Each question must test conceptual understanding or details in the text.\n" +
                "Format each question exactly like:\n\n" +
                "Question: Question Text\n\n" +
                "A) Option A\n" +
                "B) Option B\n" +
                "C) Option C\n" +
                "D) Option D\n\n" +
                "Answer: Correct Option Letter\n\n" +
                "Ensure there is only one correct answer per question, and all choices are realistic but clearly distinguishable. Answer options and questions must be derived ONLY from the provided content. Do not invent details.\n\n" +
                "Content:\n" +
                text.substring(0, Math.min(text.length(), 15000));

        return generateContent(prompt, fallbackGenerateQuiz(text));
    }

    public String generateStudyPlan(String text, int days) {
        String prompt = "You are an expert AI study tutor.\n" +
                "Create a detailed, day-by-day " + days + "-day study plan based on the content below.\n" +
                "For each day, structure it with:\n" +
                "- Day Number (formatted as 'Day X')\n" +
                "- Topics to Study (specifically matching sections from the text)\n" +
                "- Revision Tasks (active recall actions, flashcard review, or practice quiz recommendations)\n\n" +
                "Ensure the timeline is realistic, structured, and covers the material progressively. Use ONLY details present in the provided content. Do not invent information.\n\n" +
                "Content:\n" +
                text.substring(0, Math.min(text.length(), 15000));

        return generateContent(prompt, fallbackGenerateStudyPlan(text, days));
    }

    public String askTutor(String pdfContent, String question, List<MessageDto> history) {
        String historyStr = formatHistory(history);
        String prompt = "You are an expert AI study tutor.\n" +
                "Answer the student's question ONLY using the provided study material.\n" +
                "If the answer is not present in the study material, say:\n" +
                "'I could not find that information in the document.'\n\n" +
                "Explain concepts clearly and simply. Maintain a supportive, instructional tone.\n\n" +
                "Study Material:\n" +
                pdfContent.substring(0, Math.min(pdfContent.length(), 15000)) + "\n" +
                historyStr + "\n" +
                "Student Question:\n" +
                question;

        return generateContent(prompt, fallbackAskTutor(pdfContent, question));
    }

    public String askTutorRag(String context, String question, List<MessageDto> history) {
        String historyStr = formatHistory(history);
        String prompt = "You are an expert AI study tutor.\n" +
                "Answer the student's question ONLY using the provided context.\n" +
                "If the answer is not present in the context, say:\n" +
                "'I could not find that information in the document.'\n\n" +
                "Explain concepts clearly and simply. Maintain a supportive, instructional tone.\n\n" +
                "Context:\n" +
                context + "\n" +
                historyStr + "\n" +
                "Student Question:\n" +
                question;

        return generateContent(prompt, fallbackAskTutor(context, question));
    }

    private String formatHistory(List<MessageDto> history) {
        if (history == null || history.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder("\nConversation History:\n");
        for (MessageDto msg : history) {
            String roleLabel = "user".equalsIgnoreCase(msg.getRole()) ? "Student" : "Tutor";
            if (msg.getContent() != null && !msg.getContent().trim().isEmpty()) {
                sb.append(roleLabel).append(": ").append(msg.getContent()).append("\n");
            }
        }
        return sb.toString();
    }

    // --- FALLBACK MOCKS ---

    private String fallbackGenerateNotes(String text) {
        String[] lines = text.split("\n");
        List<String> validLines = new ArrayList<>();
        for (String l : lines) {
            if (l.trim().length() > 20) validLines.add(l.trim());
        }

        List<String> paragraphs = new ArrayList<>();
        StringBuilder currentPara = new StringBuilder();
        for (String line : validLines) {
            if (line.length() > 50) {
                currentPara.append(line).append(" ");
            } else if (line.endsWith(".") && currentPara.length() > 0) {
                currentPara.append(line);
                paragraphs.add(currentPara.toString());
                currentPara = new StringBuilder();
                if (paragraphs.size() >= 5) break;
            }
        }
        if (currentPara.length() > 0 && paragraphs.size() < 5) {
            paragraphs.add(currentPara.toString());
        }

        String summary = !paragraphs.isEmpty() ? paragraphs.get(0) : 
                "This study guide provides a detailed review of the key concepts and topics covered in the uploaded document.";

        StringBuilder notes = new StringBuilder("# Study Notes: Course Overview & Summary\n\n" + summary + "\n\n## Important Concepts & Terminology\n");
        if (paragraphs.size() > 1) {
            for (int i = 1; i < Math.min(paragraphs.size(), 4); i++) {
                notes.append("\n### Concept ").append(i).append("\n").append(paragraphs.get(i)).append("\n");
            }
        } else {
            notes.append("\n### Active Recall & Spaced Repetition\n" +
                    "Reviewing material actively through self-testing (active recall) and spreading reviews out over time (spaced repetition) are proven cognitive science strategies for long-term knowledge retention.\n");
        }

        notes.append("\n## Key Points & Takeaways\n");
        int count = 0;
        for (String line : validLines) {
            if (line.length() > 30 && line.length() < 120) {
                notes.append("* ").append(line.replace("*", "").replace("-", "").trim()).append("\n");
                count++;
                if (count >= 6) break;
            }
        }
        if (count == 0) {
            notes.append("* Analyze primary documents and source literature systematically.\n" +
                    "* Engage in active learning through testing and practice quizzes.\n" +
                    "* Implement structured daily schedules to stay aligned with course goals.\n");
        }

        notes.append("\n## Exam Revision Guidelines\n" +
                "* Focus on core definitions and conceptual links.\n" +
                "* Test your recall using the practice flashcard decks.\n" +
                "* Re-evaluate your subject mastery with custom quiz evaluation sets.\n");

        return notes.toString();
    }

    private String fallbackGenerateFlashcards(String text) {
        String[] rawLines = text.split("\n");
        List<String> lines = new ArrayList<>();
        for (String l : rawLines) {
            if (l.trim().length() > 35) lines.add(l.trim());
        }

        if (lines.isEmpty()) {
            lines = Arrays.asList(
                    "Active recall is a highly effective learning technique that improves long-term memory.",
                    "Spaced repetition involves reviewing information at increasing intervals to combat the forgetting curve.",
                    "FastAPI is a modern web framework for building APIs with Python based on standard type hints.",
                    "SQLAlchemy is an open-source SQL toolkit and object-relational mapper for Python."
            );
        }

        StringBuilder fc = new StringBuilder();
        for (int i = 0; i < Math.min(lines.size(), 12); i++) {
            String line = lines.get(i);
            String[] words = line.split("\\s+");
            String q, a;
            if (words.length > 6) {
                q = "Explain the key concept related to: " + String.join(" ", Arrays.copyOfRange(words, 0, 4)) + "...";
                a = line;
            } else {
                q = "What is the significance of the term: '" + line + "'?";
                a = "It represents a critical component discussed in the study material.";
            }
            fc.append("Q: ").append(q).append("\nA: ").append(a).append("\n\n");
        }
        return fc.toString();
    }

    private String fallbackGenerateQuiz(String text) {
        String[] rawLines = text.split("\n");
        List<String> lines = new ArrayList<>();
        for (String l : rawLines) {
            if (l.trim().length() > 35) lines.add(l.trim());
        }

        if (lines.isEmpty()) {
            lines = Arrays.asList(
                    "FastAPI is a Python web framework designed for high performance.",
                    "PostgreSQL is a powerful, open-source object-relational database system.",
                    "The Gemini API provides access to Google's generative models.",
                    "RAG stands for Retrieval-Augmented Generation, enhancing LLM inputs with exact text."
            );
        }

        StringBuilder quiz = new StringBuilder();
        for (int i = 0; i < Math.min(lines.size(), 5); i++) {
            String line = lines.get(i);
            String[] words = line.split("\\s+");
            String keyword = words.length > 0 ? words[0] : "Concept";
            quiz.append("Question: According to the document, which statement is true about ").append(keyword).append("?\n\n")
                    .append("A) ").append(line).append("\n")
                    .append("B) It has no practical relevance to the syllabus.\n")
                    .append("C) It represents a deprecated framework.\n")
                    .append("D) None of the above.\n\n")
                    .append("Answer: A\n\n");
        }
        return quiz.toString();
    }

    private String fallbackGenerateStudyPlan(String text, int days) {
        String[] rawLines = text.split("\n");
        List<String> lines = new ArrayList<>();
        for (String l : rawLines) {
            if (l.trim().length() > 25) lines.add(l.trim());
        }
        if (lines.isEmpty()) {
            lines = Arrays.asList("Review core principles.", "Conduct practical exercises.", "Test memory with practice questions.");
        }

        StringBuilder plan = new StringBuilder("# Study Schedule: " + days + " Days Course Mapping\n\n");
        for (int day = 1; day <= days; day++) {
            String task1 = lines.get((day * 2) % lines.size());
            String task2 = lines.get((day * 3) % lines.size());
            plan.append("Day ").append(day).append(": Conceptual Foundations & Practice\n")
                    .append("- Study task: ").append(task1).append("\n")
                    .append("- Practical task: ").append(task2).append("\n")
                    .append("- Revision task: Review flashcard decks for today's topics.\n\n");
        }
        return plan.toString();
    }

    private String fallbackAskTutor(String content, String question) {
        String[] words = question.toLowerCase().split("\\s+");
        List<String> relevantLines = new ArrayList<>();
        for (String line : content.split("\n")) {
            for (String word : words) {
                if (word.length() > 3 && line.toLowerCase().contains(word)) {
                    relevantLines.add(line.trim());
                    break;
                }
            }
            if (relevantLines.size() >= 3) break;
        }

        if (!relevantLines.isEmpty()) {
            StringBuilder sb = new StringBuilder("Based on your question and the study material, here is what I found:\n\n");
            for (String line : relevantLines) {
                sb.append("- ").append(line).append("\n");
            }
            sb.append("\nHope this helps your understanding!");
            return sb.toString();
        } else {
            return "I analyzed the document regarding your question: '" + question + "'. While the document does not explicitly define this in a single sentence, it covers related subjects throughout the text. Try asking a question using keywords present in the document.";
        }
    }
}
