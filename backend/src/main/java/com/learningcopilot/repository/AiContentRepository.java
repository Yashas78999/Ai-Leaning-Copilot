package com.learningcopilot.repository;

import com.learningcopilot.entity.AiContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiContentRepository extends JpaRepository<AiContent, Long> {
    void deleteByPdfId(Long pdfId);
}
