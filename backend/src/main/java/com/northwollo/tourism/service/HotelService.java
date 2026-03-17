package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.HotelCreateDto;
import com.northwollo.tourism.dto.request.HotelUpdateDto;
import com.northwollo.tourism.dto.response.HotelDetailInfoDto;
import com.northwollo.tourism.dto.response.HotelSummaryDto;
import com.northwollo.tourism.entity.Hotel;

import java.util.List;

public interface HotelService {
    // CRUD
    Long create(HotelCreateDto dto);
    void update(Long id, HotelUpdateDto dto);
    void delete(Long id);

    // Basic detail fetch
    Hotel detail(Long id);
    HotelDetailInfoDto getHotelDetailInfo(Long hotelId);
    List<HotelSummaryDto> getHotels(Long tourismPlaceId);
    
    // Admin: Get all hotels
    List<HotelDetailInfoDto> getAllHotelsForAdmin();

    // Owner: Get hotels by owner
    List<HotelDetailInfoDto> getHotelsByOwner(Long ownerId);

    // Image management
    void addHotelImages(Long hotelId, List<String> images, String mainImageUrl);
    void deleteHotelImage(Long hotelId, Long imageId);

    // ✅ Booking page-specific method (eager fetch of images)
    HotelDetailInfoDto getHotelForBooking(Long hotelId);
}
