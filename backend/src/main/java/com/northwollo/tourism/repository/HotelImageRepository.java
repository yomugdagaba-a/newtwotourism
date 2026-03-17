package com.northwollo.tourism.repository;

import com.northwollo.tourism.entity.HotelImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HotelImageRepository extends JpaRepository<HotelImage, Long> {

    List<HotelImage> findByHotelId(Long hotelId);
}
