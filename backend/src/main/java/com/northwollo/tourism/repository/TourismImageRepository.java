package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.TourismImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TourismImageRepository extends JpaRepository<TourismImage, Long> {

    List<TourismImage> findByTourismPlaceIdOrderByDisplayOrderAsc(Long tourismPlaceId);

    List<TourismImage> findByTourismPlaceId(Long tourismPlaceId);

    Optional<TourismImage> findByIdAndTourismPlaceId(Long id, Long tourismPlaceId);

    Optional<TourismImage> findByTourismPlaceIdAndIsMainTrue(Long tourismPlaceId);

    @Modifying
    @Query("UPDATE TourismImage i SET i.isMain = false WHERE i.tourismPlace.id = :tourismPlaceId")
    void clearMainImage(@Param("tourismPlaceId") Long tourismPlaceId);

    @Query("SELECT COALESCE(MAX(i.displayOrder), 0) FROM TourismImage i WHERE i.tourismPlace.id = :tourismPlaceId")
    int getMaxDisplayOrder(@Param("tourismPlaceId") Long tourismPlaceId);
}
