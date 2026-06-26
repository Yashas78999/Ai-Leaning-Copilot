package com.learningcopilot.repository;

import com.learningcopilot.entity.PdfChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PdfChunkRepository extends JpaRepository<PdfChunk, Long> {
    List<PdfChunk> findByPdfId(Long pdfId);
    List<PdfChunk> findByPdfIdOrderByIdAsc(Long pdfId);
    void deleteByPdfId(Long pdfId);
}
