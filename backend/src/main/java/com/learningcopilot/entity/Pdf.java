package com.learningcopilot.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "pdfs")
public class Pdf {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String filepath;

    @Column(name = "extracted_text", columnDefinition = "TEXT")
    private String extractedText;

    public Pdf() {}

    public Pdf(Long id, Long userId, String filename, String filepath, String extractedText) {
        this.id = id;
        this.userId = userId;
        this.filename = filename;
        this.filepath = filepath;
        this.extractedText = extractedText;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getFilepath() {
        return filepath;
    }

    public void setFilepath(String filepath) {
        this.filepath = filepath;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }

    public static PdfBuilder builder() {
        return new PdfBuilder();
    }

    public static class PdfBuilder {
        private Long id;
        private Long userId;
        private String filename;
        private String filepath;
        private String extractedText;

        PdfBuilder() {}

        public PdfBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public PdfBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public PdfBuilder filename(String filename) {
            this.filename = filename;
            return this;
        }

        public PdfBuilder filepath(String filepath) {
            this.filepath = filepath;
            return this;
        }

        public PdfBuilder extractedText(String extractedText) {
            this.extractedText = extractedText;
            return this;
        }

        public Pdf build() {
            return new Pdf(id, userId, filename, filepath, extractedText);
        }
    }
}
