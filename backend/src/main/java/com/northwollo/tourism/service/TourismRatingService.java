package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.TourismRatingRequestDto;
import com.northwollo.tourism.entity.TourismRating;

import java.util.List;

public interface TourismRatingService {

    void addRating(TourismRatingRequestDto dto, String currentUsername);  // Added username param

    List<TourismRating> getRatingsByTourism(Long tourismPlaceId);
}
