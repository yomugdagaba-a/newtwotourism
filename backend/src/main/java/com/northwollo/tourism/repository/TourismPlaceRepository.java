package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.TourismPlace;
import com.northwollo.tourism.enums.PlaceStatus;
import com.northwollo.tourism.enums.TourismCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface TourismPlaceRepository extends JpaRepository<TourismPlace, Long> {

    // ✅ ADDED: For listPublic() - SIMPLE category filter
    @Query("""
        SELECT tp FROM TourismPlace tp 
        WHERE tp.status = :status 
        AND (:categories IS NULL OR tp.category IN :categories)
    """)
    Page<TourismPlace> findByCategoriesAndStatus(
            @Param("categories") List<TourismCategory> categories,
            @Param("status") PlaceStatus status,
            Pageable pageable
    );

    // ✅ ALL ACTIVE - Already perfect
    @Query("SELECT tp FROM TourismPlace tp WHERE tp.status = :status")
    Page<TourismPlace> findByStatus(@Param("status") PlaceStatus status, Pageable pageable);

    // ✅ VIEWER INCREMENT - Already perfect
    @Modifying
    @Transactional
    @Query("UPDATE TourismPlace tp SET tp.viewersCount = tp.viewersCount + 1 WHERE tp.id = :id")
    int incrementViewersCount(@Param("id") Long id);

    // ✅ ADDED: For nearby places in getFullDetail()
    @Query("""
        SELECT tp FROM TourismPlace tp 
        WHERE LOWER(tp.kebele) = LOWER(:kebele)
        AND tp.id != :id
        AND tp.status = :status
        ORDER BY tp.createdAt DESC
    """)
    List<TourismPlace> findNearbyByKebeleAndIdNotAndStatus(
            @Param("kebele") String kebele,
            @Param("id") Long id,
            @Param("status") PlaceStatus status
    );

    // ✅ BASIC METHODS - Already perfect
    List<TourismPlace> findAllByStatus(PlaceStatus status);
    boolean existsByIdAndStatus(Long id, PlaceStatus status);
}
