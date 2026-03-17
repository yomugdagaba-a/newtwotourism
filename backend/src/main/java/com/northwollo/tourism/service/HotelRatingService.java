package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.HotelRatingRequestDto;
import com.northwollo.tourism.entity.HotelRating;

import java.util.List;

public interface HotelRatingService {

    void addRating(HotelRatingRequestDto dto, String currentUsername);  // Added username param

    List<HotelRating> getRatingsByHotel(Long hotelId);
}
