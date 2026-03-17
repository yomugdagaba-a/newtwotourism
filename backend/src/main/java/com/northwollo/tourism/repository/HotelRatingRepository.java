package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.HotelRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface HotelRatingRepository extends JpaRepository<HotelRating, Long> {

    List<HotelRating> findByHotelId(Long hotelId);

    long countByHotelId(Long hotelId);

    @Query("select avg(r.rating) from HotelRating r where r.hotel.id = :id")
    Double averageRating(Long id);

    Optional<HotelRating> findByHotelIdAndUserId(Long hotelId, Long userId);  // Added for duplicate check
}
