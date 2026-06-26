package com.learningcopilot.repository;

import com.learningcopilot.entity.Pdf;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PdfRepository extends JpaRepository<Pdf, Long> {
    List<Pdf> findByUserId(Long userId);
}
