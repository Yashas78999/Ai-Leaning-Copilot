package com.learningcopilot.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "ai_contents")
public class AiContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pdf_id", nullable = false)
    private Long pdfId;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    public AiContent() {}

    public AiContent(Long id, Long pdfId, String contentType, String content) {
        this.id = id;
        this.pdfId = pdfId;
        this.contentType = contentType;
        this.content = content;
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

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public static AiContentBuilder builder() {
        return new AiContentBuilder();
    }

    public static class AiContentBuilder {
        private Long id;
        private Long pdfId;
        private String contentType;
        private String content;

        AiContentBuilder() {}

        public AiContentBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public AiContentBuilder pdfId(Long pdfId) {
            this.pdfId = pdfId;
            return this;
        }

        public AiContentBuilder contentType(String contentType) {
            this.contentType = contentType;
            return this;
        }

        public AiContentBuilder content(String content) {
            this.content = content;
            return this;
        }

        public AiContent build() {
            return new AiContent(id, pdfId, contentType, content);
        }
    }
}
