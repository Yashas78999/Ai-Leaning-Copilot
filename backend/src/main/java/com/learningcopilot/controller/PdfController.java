package com.learningcopilot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningcopilot.dto.MessageDto;
import com.learningcopilot.dto.TutorRequestDto;
import com.learningcopilot.entity.AiContent;
import com.learningcopilot.entity.Pdf;
import com.learningcopilot.entity.PdfChunk;
import com.learningcopilot.entity.User;
import com.learningcopilot.repository.AiContentRepository;
import com.learningcopilot.repository.PdfChunkRepository;
import com.learningcopilot.repository.PdfRepository;
import com.learningcopilot.service.GeminiService;
import com.learningcopilot.service.PdfParserService;
import com.learningcopilot.service.RagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/pdf")
public class PdfController {

    private static final Logger log = LoggerFactory.getLogger(PdfController.class);

    private final PdfRepository pdfRepository;
    private final PdfChunkRepository pdfChunkRepository;
    private final AiContentRepository aiContentRepository;
    private final PdfParserService pdfParserService;
    private final GeminiService geminiService;
    private final RagService ragService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PdfController(PdfRepository pdfRepository, PdfChunkRepository pdfChunkRepository,
                         AiContentRepository aiContentRepository, PdfParserService pdfParserService,
                         GeminiService geminiService, RagService ragService) {
        this.pdfRepository = pdfRepository;
        this.pdfChunkRepository = pdfChunkRepository;
        this.aiContentRepository = aiContentRepository;
        this.pdfParserService = pdfParserService;
        this.geminiService = geminiService;
        this.ragService = ragService;
    }

    private static final String UPLOAD_DIR = "uploads";

    @PostMapping("/upload")
    @Transactional
    public ResponseEntity<?> uploadPdf(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("detail", "Unauthorized"));
        }

        try {
            // Ensure uploads directory exists
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // Save physical file
            String filename = file.getOriginalFilename();
            if (filename == null) {
                filename = "uploaded_" + UUID.randomUUID().toString() + ".pdf";
            }
            File destFile = new File(uploadDir, filename);
            try (FileOutputStream fos = new FileOutputStream(destFile)) {
                fos.write(file.getBytes());
            }

            // Parse text
            String extractedText = pdfParserService.extractText(destFile);

            // Save PDF metadata
            Pdf pdf = Pdf.builder()
                    .userId(currentUser.getId())
                    .filename(filename)
                    .filepath(destFile.getPath())
                    .extractedText(extractedText)
                    .build();

            Pdf savedPdf = pdfRepository.save(pdf);

            // Chunk and embed text
            List<String> chunks = ragService.chunkText(extractedText);
            for (String chunk : chunks) {
                List<Double> embedding = geminiService.getEmbedding(chunk);
                String embeddingJson = objectMapper.writeValueAsString(embedding);

                PdfChunk pdfChunk = PdfChunk.builder()
                        .pdfId(savedPdf.getId())
                        .chunkText(chunk)
                        .embedding(embeddingJson)
                        .build();

                pdfChunkRepository.save(pdfChunk);
            }

            return ResponseEntity.ok(Map.of(
                    "message", "PDF uploaded successfully",
                    "pdf_id", savedPdf.getId(),
                    "filename", savedPdf.getFilename(),
                    "characters_extracted", extractedText.length(),
                    "chunks_created", chunks.size()
            ));

        } catch (Exception e) {
            log.error("PDF upload failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "PDF upload and processing failed: " + e.getMessage()));
        }
    }

    @GetMapping("/notes/{pdf_id}")
    @Transactional
    public ResponseEntity<?> generatePdfNotes(
            @PathVariable("pdf_id") Long pdfId) {
        
        Pdf pdf = pdfRepository.findById(pdfId).orElse(null);
        if (pdf == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "PDF not found"));
        }

        try {
            String notes = geminiService.generateNotes(pdf.getExtractedText());

            AiContent aiContent = AiContent.builder()
                    .pdfId(pdf.getId())
                    .contentType("NOTES")
                    .content(notes)
                    .build();

            AiContent savedContent = aiContentRepository.save(aiContent);

            return ResponseEntity.ok(Map.of(
                    "pdf_id", pdf.getId(),
                    "filename", pdf.getFilename(),
                    "content_id", savedContent.getId(),
                    "notes", notes
            ));
        } catch (Exception e) {
            log.error("Error generating notes: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Error generating notes: " + e.getMessage()));
        }
    }

    @GetMapping("/flashcards/{pdf_id}")
    public ResponseEntity<?> generatePdfFlashcards(
            @PathVariable("pdf_id") Long pdfId) {

        Pdf pdf = pdfRepository.findById(pdfId).orElse(null);
        if (pdf == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "PDF not found"));
        }

        try {
            String flashcards = geminiService.generateFlashcards(pdf.getExtractedText());

            return ResponseEntity.ok(Map.of(
                    "pdf_id", pdf.getId(),
                    "filename", pdf.getFilename(),
                    "flashcards", flashcards
            ));
        } catch (Exception e) {
            log.error("Error generating flashcards: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Error generating flashcards: " + e.getMessage()));
        }
    }

    @GetMapping("/quiz/{pdf_id}")
    public ResponseEntity<?> generatePdfQuiz(
            @PathVariable("pdf_id") Long pdfId) {

        Pdf pdf = pdfRepository.findById(pdfId).orElse(null);
        if (pdf == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "PDF not found"));
        }

        try {
            String quiz = geminiService.generateQuiz(pdf.getExtractedText());

            return ResponseEntity.ok(Map.of(
                    "pdf_id", pdf.getId(),
                    "filename", pdf.getFilename(),
                    "quiz", quiz
            ));
        } catch (Exception e) {
            log.error("Error generating quiz: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Error generating quiz: " + e.getMessage()));
        }
    }

    @GetMapping("/study-plan/{pdf_id}")
    public ResponseEntity<?> generatePdfStudyPlan(
            @PathVariable("pdf_id") Long pdfId,
            @RequestParam("days") int days) {

        Pdf pdf = pdfRepository.findById(pdfId).orElse(null);
        if (pdf == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "PDF not found"));
        }

        try {
            String studyPlan = geminiService.generateStudyPlan(pdf.getExtractedText(), days);

            return ResponseEntity.ok(Map.of(
                    "pdf_id", pdf.getId(),
                    "filename", pdf.getFilename(),
                    "days", days,
                    "study_plan", studyPlan
            ));
        } catch (Exception e) {
            log.error("Error generating study plan: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Error generating study plan: " + e.getMessage()));
        }
    }

    @PostMapping("/chat/{pdf_id}")
    public ResponseEntity<?> chatWithPdf(
            @PathVariable("pdf_id") Long pdfId,
            @RequestBody TutorRequestDto request) {

        Pdf pdf = pdfRepository.findById(pdfId).orElse(null);
        if (pdf == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "PDF not found"));
        }

        try {
            String answer = geminiService.askTutor(pdf.getExtractedText(), request.getQuestion(), request.getHistory());

            return ResponseEntity.ok(Map.of(
                    "question", request.getQuestion(),
                    "answer", answer
            ));
        } catch (Exception e) {
            log.error("Error in chat: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Error in chat: " + e.getMessage()));
        }
    }

    @PostMapping("/rag-chat/{pdf_id}")
    public ResponseEntity<?> ragChat(
            @PathVariable("pdf_id") Long pdfId,
            @RequestBody TutorRequestDto request) {

        List<PdfChunk> chunks = pdfChunkRepository.findByPdfIdOrderByIdAsc(pdfId);
        if (chunks.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "No chunks found"));
        }

        try {
            List<RagService.ScoredChunk> relevantChunks = ragService.retrieveRelevantChunks(
                    request.getQuestion(), chunks, 3);

            StringBuilder contextBuilder = new StringBuilder();
            List<Map<String, Object>> sourceChunks = new ArrayList<>();

            for (RagService.ScoredChunk c : relevantChunks) {
                contextBuilder.append(c.getChunkText()).append("\n\n");
                sourceChunks.add(Map.of(
                        "index", c.getIndex(),
                        "text", c.getChunkText()
                ));
            }

            String answer = geminiService.askTutorRag(contextBuilder.toString().trim(), request.getQuestion(), request.getHistory());

            return ResponseEntity.ok(Map.of(
                    "question", request.getQuestion(),
                    "answer", answer,
                    "chunks_used", relevantChunks.size(),
                    "source_chunks", sourceChunks
            ));
        } catch (Exception e) {
            log.error("Error in RAG chat: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Error in RAG chat: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listPdfs(
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("detail", "Unauthorized"));
        }

        List<Pdf> pdfs = pdfRepository.findByUserId(currentUser.getId());
        List<Map<String, Object>> response = new ArrayList<>();
        for (Pdf pdf : pdfs) {
            response.add(Map.of(
                    "id", pdf.getId(),
                    "filename", pdf.getFilename(),
                    "filepath", pdf.getFilepath(),
                    "characters_count", pdf.getExtractedText() != null ? pdf.getExtractedText().length() : 0
            ));
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{pdf_id}")
    public ResponseEntity<?> getPdfDetails(
            @PathVariable("pdf_id") Long pdfId) {
        Pdf pdf = pdfRepository.findById(pdfId).orElse(null);
        if (pdf == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "PDF not found"));
        }

        return ResponseEntity.ok(Map.of(
                "id", pdf.getId(),
                "filename", pdf.getFilename(),
                "filepath", pdf.getFilepath(),
                "characters_count", pdf.getExtractedText() != null ? pdf.getExtractedText().length() : 0
        ));
    }

    @DeleteMapping("/{pdf_id}")
    @Transactional
    public ResponseEntity<?> deletePdf(
            @PathVariable("pdf_id") Long pdfId,
            @AuthenticationPrincipal User currentUser) {
        
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("detail", "Unauthorized"));
        }

        Pdf pdf = pdfRepository.findById(pdfId).orElse(null);
        if (pdf == null || !pdf.getUserId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("detail", "PDF not found"));
        }

        // Delete associated chunks
        pdfChunkRepository.deleteByPdfId(pdfId);

        // Delete associated AI contents
        aiContentRepository.deleteByPdfId(pdfId);

        // Delete physical file if it exists
        if (pdf.getFilepath() != null) {
            File file = new File(pdf.getFilepath());
            if (file.exists()) {
                try {
                    Files.delete(file.toPath());
                } catch (IOException e) {
                    log.error("Failed to delete physical file: {}", e.getMessage());
                }
            }
        }

        // Delete PDF metadata
        pdfRepository.delete(pdf);

        return ResponseEntity.ok(Map.of("message", "PDF deleted successfully"));
    }

    @GetMapping("/test")
    public ResponseEntity<?> testPdf() {
        return ResponseEntity.ok(Map.of("message", "PDF API Working"));
    }

    @GetMapping("/me-test")
    public ResponseEntity<?> meTest(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("detail", "Unauthorized"));
        }
        return ResponseEntity.ok(Map.of(
                "id", currentUser.getId(),
                "email", currentUser.getEmail()
        ));
    }
}
