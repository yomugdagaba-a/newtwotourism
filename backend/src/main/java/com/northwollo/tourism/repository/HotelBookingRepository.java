package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.HotelBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HotelBookingRepository extends JpaRepository<HotelBooking, Long> {

    List<HotelBooking> findByUserId(Long userId);

    Optional<HotelBooking> findByIdAndUserId(Long id, Long userId);

    List<HotelBooking> findByHotelId(Long hotelId);

    @Query("SELECT b FROM HotelBooking b WHERE b.hotel.owner.id = :ownerId")
    List<HotelBooking> findByHotelOwnerId(@Param("ownerId") Long ownerId);

    List<HotelBooking> findByProblemReportedTrue();

    @Query("SELECT b FROM HotelBooking b WHERE b.hotel.id = :hotelId AND b.status.name = :status")
    List<HotelBooking> findByHotelIdAndStatusName(@Param("hotelId") Long hotelId, @Param("status") String status);
}
