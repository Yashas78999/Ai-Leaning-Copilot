package com.learningcopilot.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "pdf_chunks")
public class PdfChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pdf_id", nullable = false)
    private Long pdfId;

    @Column(name = "chunk_text", nullable = false, columnDefinition = "TEXT")
    private String chunkText;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String embedding; // Stored as a JSON string of the float array

    public PdfChunk() {}

    public PdfChunk(Long id, Long pdfId, String chunkText, String embedding) {
        this.id = id;
        this.pdfId = pdfId;
        this.chunkText = chunkText;
        this.embedding = embedding;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPdfId() {
        return pdfId;
    }

    public void setPdfId(Long pdfId) {
        this.pdfId = pdfId;
    }

    public String getChunkText() {
        return chunkText;
    }

    public void setChunkText(String chunkText) {
        this.chunkText = chunkText;
    }

    public String getEmbedding() {
        return embedding;
    }

    public void setEmbedding(String embedding) {
        this.embedding = embedding;
    }

    public static PdfChunkBuilder builder() {
        return new PdfChunkBuilder();
    }

    public static class PdfChunkBuilder {
        private Long id;
        private Long pdfId;
        private String chunkText;
        private String embedding;

        PdfChunkBuilder() {}

        public PdfChunkBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public PdfChunkBuilder pdfId(Long pdfId) {
            this.pdfId = pdfId;
            return this;
        }

        public PdfChunkBuilder chunkText(String chunkText) {
            this.chunkText = chunkText;
            return this;
        }

        public PdfChunkBuilder embedding(String embedding) {
            this.embedding = embedding;
            return this;
        }

        public PdfChunk build() {
            return new PdfChunk(id, pdfId, chunkText, embedding);
        }
    }
}
