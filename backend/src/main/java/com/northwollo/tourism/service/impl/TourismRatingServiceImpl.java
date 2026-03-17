package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.TourismRatingRequestDto;
import com.northwollo.tourism.entity.TourismPlace;
import com.northwollo.tourism.entity.TourismRating;
import com.northwollo.tourism.entity.User;
import com.northwollo.tourism.exception.BadRequestException;
import com.northwollo.tourism.exception.ResourceNotFoundException;
import com.northwollo.tourism.repository.TourismPlaceRepository;
import com.northwollo.tourism.repository.TourismRatingRepository;
import com.northwollo.tourism.repository.UserRepository;
import com.northwollo.tourism.service.TourismRatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TourismRatingServiceImpl implements TourismRatingService {

    private final TourismRatingRepository ratingRepository;
    private final TourismPlaceRepository tourismRepository;
    private final UserRepository userRepository;

    @Override
    public void addRating(TourismRatingRequestDto dto, String currentUsername) {
        TourismPlace place = tourismRepository.findById(dto.getTourismPlaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Tourism place not found"));

        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new BadRequestException("User not found: " + currentUsername));

        // Prevent duplicate rating by the same user
        if (ratingRepository.findByTourismPlaceIdAndUserId(place.getId(), user.getId()).isPresent()) {
            throw new BadRequestException("You already rated this tourism place");
        }

        TourismRating rating = new TourismRating();
        rating.setTourismPlace(place);
        rating.setUser(user);
        rating.setRating(dto.getRating());
        rating.setComment(dto.getComment());

        ratingRepository.save(rating);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TourismRating> getRatingsByTourism(Long tourismPlaceId) {
        if (!tourismRepository.existsById(tourismPlaceId)) {
            throw new ResourceNotFoundException("Tourism place not found");
        }
        return ratingRepository.findByTourismPlaceId(tourismPlaceId);
    }
}
