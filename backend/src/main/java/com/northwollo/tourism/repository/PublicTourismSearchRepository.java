package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.TourismPlace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PublicTourismSearchRepository
        extends JpaRepository<TourismPlace, Long>,
        JpaSpecificationExecutor<TourismPlace> {
}

