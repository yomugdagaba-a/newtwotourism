package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.TourismRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TourismRatingRepository extends JpaRepository<TourismRating, Long> {

    List<TourismRating> findByTourismPlaceId(Long tourismPlaceId);

    Optional<TourismRating> findByTourismPlaceIdAndUserId(Long tourismPlaceId, Long userId);
}
