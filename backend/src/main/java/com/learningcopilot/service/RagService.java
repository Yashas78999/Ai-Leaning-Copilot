package com.learningcopilot.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningcopilot.entity.PdfChunk;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class RagService {

    private static final Logger log = LoggerFactory.getLogger(RagService.class);

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RagService(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    public List<String> chunkText(String text) {
        return chunkText(text, 1000);
    }

    public List<String> chunkText(String text, int chunkSize) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isEmpty()) {
            return chunks;
        }

        for (int i = 0; i < text.length(); i += chunkSize) {
            chunks.add(text.substring(i, Math.min(i + chunkSize, text.length())));
        }
        return chunks;
    }

    public double cosineSimilarity(double[] vec1, double[] vec2) {
        if (vec1.length != vec2.length) {
            throw new IllegalArgumentException("Vectors must have the same dimension: " + vec1.length + " vs " + vec2.length);
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            normA += vec1[i] * vec1[i];
            normB += vec2[i] * vec2[i];
        }

        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public List<ScoredChunk> retrieveRelevantChunks(String question, List<PdfChunk> chunks, int topK) {
        List<Double> questionEmbeddingList = geminiService.getEmbedding(question);
        double[] questionEmbedding = questionEmbeddingList.stream().mapToDouble(Double::doubleValue).toArray();

        List<ScoredChunk> scoredChunks = new ArrayList<>();

        for (int idx = 0; idx < chunks.size(); idx++) {
            PdfChunk chunk = chunks.get(idx);
            try {
                List<Double> chunkEmbeddingList = objectMapper.readValue(chunk.getEmbedding(), new TypeReference<List<Double>>() {});
                double[] chunkEmbedding = chunkEmbeddingList.stream().mapToDouble(Double::doubleValue).toArray();

                double score = cosineSimilarity(questionEmbedding, chunkEmbedding);

                scoredChunks.add(new ScoredChunk(score, chunk.getChunkText(), idx + 1));
            } catch (Exception e) {
                log.error("Failed to parse embedding for chunk {}: {}", chunk.getId(), e.getMessage());
            }
        }

        // Sort descending by score
        scoredChunks.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        // Return topK
        return scoredChunks.subList(0, Math.min(topK, scoredChunks.size()));
    }

    public static class ScoredChunk {
        private final double score;
        private final String chunkText;
        private final int index;

        public ScoredChunk(double score, String chunkText, int index) {
            this.score = score;
            this.chunkText = chunkText;
            this.index = index;
        }

        public double getScore() { return score; }
        public String getChunkText() { return chunkText; }
        public int getIndex() { return index; }
    }
}
