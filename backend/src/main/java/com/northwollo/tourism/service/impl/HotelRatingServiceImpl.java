package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.HotelRatingRequestDto;
import com.northwollo.tourism.entity.Hotel;
import com.northwollo.tourism.entity.HotelRating;
import com.northwollo.tourism.entity.User;
import com.northwollo.tourism.exception.BadRequestException;  // Added
import com.northwollo.tourism.exception.ResourceNotFoundException;
import com.northwollo.tourism.repository.HotelRatingRepository;
import com.northwollo.tourism.repository.HotelRepository;
import com.northwollo.tourism.repository.UserRepository;  // Added
import com.northwollo.tourism.service.HotelRatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class HotelRatingServiceImpl implements HotelRatingService {

    private final HotelRepository hotelRepository;
    private final HotelRatingRepository ratingRepository;
    private final UserRepository userRepository;  // Added

    @Override
    public void addRating(HotelRatingRequestDto dto, String currentUsername) {
        Hotel hotel = hotelRepository.findById(dto.getHotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found"));

        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new BadRequestException("User not found: " + currentUsername));

        // Prevent duplicate rating by the same user
        if (ratingRepository.findByHotelIdAndUserId(hotel.getId(), user.getId()).isPresent()) {
            throw new BadRequestException("You already rated this hotel");
        }

        HotelRating hr = new HotelRating();
        hr.setHotel(hotel);
        hr.setUser(user);
        hr.setRating(dto.getRating());
        hr.setComment(dto.getComment());  // Fixed field name

        ratingRepository.save(hr);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HotelRating> getRatingsByHotel(Long hotelId) {
        return ratingRepository.findByHotelId(hotelId);
    }
}
