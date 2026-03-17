package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.TourismCreateDto;
import com.northwollo.tourism.dto.request.TourismImageCreateDto;
import com.northwollo.tourism.dto.request.TourismUpdateDto;
import com.northwollo.tourism.dto.response.*;
import com.northwollo.tourism.entity.Hotel;
import com.northwollo.tourism.entity.HotelBooking;
import com.northwollo.tourism.entity.RoadInfo;
import com.northwollo.tourism.entity.TourismImage;
import com.northwollo.tourism.entity.TourismPlace;
import com.northwollo.tourism.entity.TourismRating;
import com.northwollo.tourism.enums.PlaceStatus;
import com.northwollo.tourism.enums.TourismCategory;
import com.northwollo.tourism.exception.ResourceNotFoundException;
import com.northwollo.tourism.repository.*;
import com.northwollo.tourism.service.TourismService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TourismServiceImpl implements TourismService {

    private final TourismPlaceRepository tourismRepository;
    private final TourismRatingRepository ratingRepository;
    private final TourismImageRepository tourismImageRepository;
    private final HotelRepository hotelRepository;
    private final HotelBookingRepository hotelBookingRepository;
    private final HotelRatingRepository hotelRatingRepository;
    private final BookingMessageRepository bookingMessageRepository;
    private final LanguageGuiderRepository languageGuiderRepository;
    private final RoadInfoRepository roadInfoRepository;
    private final HorseServiceRepository horseServiceRepository;
    private final MapPointRepository mapPointRepository;

    @Override
    @Transactional
    public Long create(TourismCreateDto dto) {
        TourismPlace place = new TourismPlace();
        place.setName(dto.getName());
        place.setCategory(dto.getCategory());
        place.setDescription(dto.getDescription());
        place.setWereda(dto.getWereda());
        place.setKebele(dto.getKebele());
        place.setBestTime(dto.getBestTime());
        place.setPeaceInfo(dto.getPeaceInfo());
        place.setStatus(PlaceStatus.ACTIVE);
        place.setViewersCount(0);

        // ✅ Languages - now accepts List<String> directly
        if (dto.getLanguages() != null && !dto.getLanguages().isEmpty()) {
            place.setLanguages(dto.getLanguages());
        }

        // ✅ Visit time parsing - try ISO-8601 format, or convert human-readable to duration
        if (dto.getVisitTime() != null && !dto.getVisitTime().isBlank()) {
            place.setVisitTime(parseVisitTime(dto.getVisitTime()));
        }

        // ✅ Main image - store in both imageUrl field AND images list
        if (dto.getImageUrl() != null && !dto.getImageUrl().isBlank()) {
            // Set the main image URL on the place itself
            place.setImageUrl(dto.getImageUrl());
            
            // Also add to images list for gallery
            TourismImage mainImage = new TourismImage();
            mainImage.setImageUrl(dto.getImageUrl());
            mainImage.setMain(true);
            mainImage.setDisplayOrder(0);
            mainImage.setTourismPlace(place);
            place.getImages().add(mainImage);
        }

        return tourismRepository.save(place).getId();
    }

    @Override
    @Transactional
    public void update(Long id, TourismUpdateDto dto) {
        TourismPlace place = tourismRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tourism place not found: " + id));

        // ✅ Safe null checks for all fields
        if (dto.getName() != null) place.setName(dto.getName());
        if (dto.getCategory() != null) place.setCategory(dto.getCategory());
        if (dto.getDescription() != null) place.setDescription(dto.getDescription());
        if (dto.getWereda() != null) place.setWereda(dto.getWereda());
        if (dto.getKebele() != null) place.setKebele(dto.getKebele());
        if (dto.getBestTime() != null) place.setBestTime(dto.getBestTime());
        if (dto.getPeaceInfo() != null) place.setPeaceInfo(dto.getPeaceInfo());

        if (dto.getLanguages() != null) place.setLanguages(dto.getLanguages());
        if (dto.getStatus() != null) place.setStatus(dto.getStatus());

        // ✅ Update main image URL
        if (dto.getImageUrl() != null && !dto.getImageUrl().isBlank()) {
            place.setImageUrl(dto.getImageUrl());
        }

        // ✅ Visit time parsing - try ISO-8601 format, or convert human-readable to duration
        if (dto.getVisitTime() != null && !dto.getVisitTime().isBlank()) {
            place.setVisitTime(parseVisitTime(dto.getVisitTime()));
        }
    }

    /**
     * Parse visit time from various formats:
     * - ISO-8601: "PT2H30M" -> 2 hours 30 minutes
     * - Human readable: "2 hours", "2-3 hours", "30 minutes" -> approximate Duration
     */
    private Duration parseVisitTime(String visitTime) {
        if (visitTime == null || visitTime.isBlank()) {
            return null;
        }
        
        // Try ISO-8601 format first
        try {
            return Duration.parse(visitTime);
        } catch (Exception e) {
            // Parse human-readable format
        }
        
        String lower = visitTime.toLowerCase().trim();
        
        // Extract numbers from the string
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(\\d+)").matcher(lower);
        int firstNumber = 0;
        if (matcher.find()) {
            firstNumber = Integer.parseInt(matcher.group(1));
        }
        
        if (firstNumber == 0) {
            return Duration.ofHours(2); // Default 2 hours
        }
        
        // Determine unit
        if (lower.contains("hour")) {
            return Duration.ofHours(firstNumber);
        } else if (lower.contains("minute") || lower.contains("min")) {
            return Duration.ofMinutes(firstNumber);
        } else if (lower.contains("day")) {
            return Duration.ofDays(firstNumber);
        } else {
            // Assume hours if no unit specified
            return Duration.ofHours(firstNumber);
        }
    }

    /**
     * Format Duration to human-readable string
     */
    private String formatDuration(Duration duration) {
        if (duration == null) {
            return null;
        }
        
        long hours = duration.toHours();
        long minutes = duration.toMinutesPart();
        
        if (hours > 0 && minutes > 0) {
            return hours + " hours " + minutes + " minutes";
        } else if (hours > 0) {
            return hours + (hours == 1 ? " hour" : " hours");
        } else if (minutes > 0) {
            return minutes + (minutes == 1 ? " minute" : " minutes");
        } else {
            return "Less than a minute";
        }
    }

    @Override
    @Transactional
    public void delete(Long id) {
        TourismPlace place = tourismRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tourism place not found: " + id));
        
        // 1. Delete hotel-related data first
        List<Hotel> hotels = hotelRepository.findByTourismPlaceId(id);
        for (Hotel hotel : hotels) {
            // Delete booking messages for all bookings
            List<HotelBooking> bookings = hotelBookingRepository.findByHotelId(hotel.getId());
            for (HotelBooking booking : bookings) {
                bookingMessageRepository.deleteAll(bookingMessageRepository.findByBookingIdOrderByCreatedAtAsc(booking.getId()));
            }
            // Delete hotel bookings
            hotelBookingRepository.deleteAll(bookings);
            // Delete hotel ratings
            hotelRatingRepository.deleteAll(hotelRatingRepository.findByHotelId(hotel.getId()));
            // Hotel images are cascade deleted with hotel
        }
        hotelRepository.deleteAll(hotels);
        
        // 2. Delete road info and horse services
        List<RoadInfo> roads = roadInfoRepository.findByTourismPlaceId(id);
        for (RoadInfo road : roads) {
            horseServiceRepository.deleteAll(horseServiceRepository.findByRoadInfoId(road.getId()));
        }
        roadInfoRepository.deleteAll(roads);
        
        // 3. Delete language guiders
        languageGuiderRepository.deleteAll(languageGuiderRepository.findByTourismPlaceId(id));
        
        // 4. Delete map points
        mapPointRepository.deleteAll(mapPointRepository.findByTourismPlaceId(id));
        
        // 5. Delete tourism ratings
        ratingRepository.deleteAll(ratingRepository.findByTourismPlaceId(id));
        
        // 6. Finally delete the tourism place (images cascade deleted)
        tourismRepository.delete(place);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TourismListItemDto> getAllTourismPlaces() {
        return tourismRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream()
                .map(TourismListItemDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TourismAdminDto> getAllTourismPlacesForAdmin() {
        return tourismRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream()
                .map(TourismAdminDto::fromEntity)
                .collect(Collectors.toList());
    }


    @Override
    @Transactional
    public TourismFullDetailDto getFullDetail(Long placeId) {
        TourismPlace place = tourismRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Tourism place not found: " + placeId));

        // ✅ Atomic viewer increment
        tourismRepository.incrementViewersCount(placeId);

        // ✅ Build full DTO (same as before...)
        TourismFullDetailDto dto = new TourismFullDetailDto();
        dto.setId(place.getId());
        dto.setName(place.getName());
        dto.setDescription(place.getDescription());
        dto.setWereda(place.getWereda());
        dto.setKebele(place.getKebele());
        dto.setBestTime(place.getBestTime());
        dto.setPeaceInfo(place.getPeaceInfo());
        dto.setVisitTime(formatDuration(place.getVisitTime()));
        dto.setLanguages(place.getLanguages());
        dto.setViewersCount(place.getViewersCount());


        // ✅ Images - now returns full TourismImageDto with title/description
        dto.setImages(place.getImages().stream()
                .map(TourismImageDto::fromEntity)
                .collect(Collectors.toList()));

        // ✅ FIXED: Use new nearby method + limit 5 in service
        dto.setNearbyPlaces(tourismRepository.findNearbyByKebeleAndIdNotAndStatus(
                        place.getKebele(), place.getId(), PlaceStatus.ACTIVE)
                .stream()
                .limit(5)  // ✅ Service layer limit
                .map(NearbyTourismDto::fromEntity)
                .collect(Collectors.toList()));

        // ✅ Ratings (same)
        List<TourismRating> ratings = ratingRepository.findByTourismPlaceId(placeId);
        List<TourismRatingResponseDto> ratingDtos = ratings.stream()
                .map(TourismRatingResponseDto::fromEntity)
                .collect(Collectors.toList());
        dto.setRatings(ratingDtos);

        double avgRating = ratings.isEmpty() ? 0.0 :
                ratings.stream().mapToInt(TourismRating::getRating).average().orElse(0.0);
        dto.setRatingSummary(new RatingSummaryResponseDto(avgRating, (long) ratings.size()));

        return dto;
    }

    // ==============================
    // Image Management Methods
    // ==============================

    @Override
    @Transactional(readOnly = true)
    public List<TourismImageDto> getImages(Long tourismId) {
        if (!tourismRepository.existsById(tourismId)) {
            throw new ResourceNotFoundException("Tourism place not found: " + tourismId);
        }
        return tourismImageRepository.findByTourismPlaceIdOrderByDisplayOrderAsc(tourismId)
                .stream()
                .map(TourismImageDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TourismImageDto addImage(Long tourismId, TourismImageCreateDto dto) {
        TourismPlace place = tourismRepository.findById(tourismId)
                .orElseThrow(() -> new ResourceNotFoundException("Tourism place not found: " + tourismId));

        TourismImage image = new TourismImage();
        image.setImageUrl(dto.getImageUrl());
        image.setTitle(dto.getTitle());
        image.setDescription(dto.getDescription());
        image.setTourismPlace(place);

        // If this is set as main, clear other main images
        if (dto.isMain()) {
            tourismImageRepository.clearMainImage(tourismId);
            image.setMain(true);
        }

        // Set display order
        if (dto.getDisplayOrder() > 0) {
            image.setDisplayOrder(dto.getDisplayOrder());
        } else {
            image.setDisplayOrder(tourismImageRepository.getMaxDisplayOrder(tourismId) + 1);
        }

        TourismImage saved = tourismImageRepository.save(image);
        return TourismImageDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public TourismImageDto updateImage(Long tourismId, Long imageId, TourismImageCreateDto dto) {
        TourismImage image = tourismImageRepository.findByIdAndTourismPlaceId(imageId, tourismId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found: " + imageId));

        if (dto.getImageUrl() != null && !dto.getImageUrl().isBlank()) {
            image.setImageUrl(dto.getImageUrl());
        }
        if (dto.getTitle() != null) {
            image.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            image.setDescription(dto.getDescription());
        }
        if (dto.getDisplayOrder() > 0) {
            image.setDisplayOrder(dto.getDisplayOrder());
        }

        // Handle main image change
        if (dto.isMain() && !image.isMain()) {
            tourismImageRepository.clearMainImage(tourismId);
            image.setMain(true);
        }

        TourismImage saved = tourismImageRepository.save(image);
        return TourismImageDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deleteImage(Long tourismId, Long imageId) {
        TourismImage image = tourismImageRepository.findByIdAndTourismPlaceId(imageId, tourismId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found: " + imageId));

        tourismImageRepository.delete(image);
    }

    @Override
    @Transactional
    public void setMainImage(Long tourismId, Long imageId) {
        TourismImage image = tourismImageRepository.findByIdAndTourismPlaceId(imageId, tourismId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found: " + imageId));

        tourismImageRepository.clearMainImage(tourismId);
        image.setMain(true);
        tourismImageRepository.save(image);
    }

    @Override
    @Transactional
    public void reorderImages(Long tourismId, List<Long> imageIds) {
        if (!tourismRepository.existsById(tourismId)) {
            throw new ResourceNotFoundException("Tourism place not found: " + tourismId);
        }

        for (int i = 0; i < imageIds.size(); i++) {
            TourismImage image = tourismImageRepository.findByIdAndTourismPlaceId(imageIds.get(i), tourismId)
                    .orElseThrow(() -> new ResourceNotFoundException("Image not found"));
            image.setDisplayOrder(i + 1);
            tourismImageRepository.save(image);
        }
    }








}
