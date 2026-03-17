package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, Long> {

    List<Hotel> findByTourismPlaceId(Long tourismPlaceId);

    // 🔹 Only for booking page to fetch hotel images eagerly
    @Query("SELECT h FROM Hotel h LEFT JOIN FETCH h.images WHERE h.id = :hotelId")
    Optional<Hotel> findByIdWithImages(@Param("hotelId") Long hotelId);

    // 🔹 Find hotels by owner ID
    List<Hotel> findByOwnerId(Long ownerId);

    // 🔹 Find hotels by owner ID with images
    @Query("SELECT DISTINCT h FROM Hotel h LEFT JOIN FETCH h.images WHERE h.owner.id = :ownerId")
    List<Hotel> findByOwnerIdWithImages(@Param("ownerId") Long ownerId);

    // 🔹 Find all hotels with images (for admin page)
    @Query("SELECT DISTINCT h FROM Hotel h LEFT JOIN FETCH h.images")
    List<Hotel> findAllWithImages();

}
