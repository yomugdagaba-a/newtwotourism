package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.LanguageGuider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LanguageGuiderRepository extends JpaRepository<LanguageGuider, Long> {

    List<LanguageGuider> findByTourismPlaceIdAndActiveTrue(Long tourismPlaceId);
    
    List<LanguageGuider> findByTourismPlaceId(Long tourismPlaceId);
}
