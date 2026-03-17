package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.TourismPlace;
import com.northwollo.tourism.enums.PlaceStatus;
import com.northwollo.tourism.enums.TourismCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomepageTourismRepository extends JpaRepository<TourismPlace, Long> {

    @Query("""
        SELECT tp FROM TourismPlace tp
        WHERE tp.status = :status
        AND tp.category IN :categories
        ORDER BY tp.createdAt DESC
    """)
    List<TourismPlace> findActiveByCategories(
            @Param("status") PlaceStatus status,
            @Param("categories") List<TourismCategory> categories
    );
}
