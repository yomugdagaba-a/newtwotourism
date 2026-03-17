package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.dto.request.HotelCreateDto;
import com.northwollo.tourism.dto.request.HotelUpdateDto;
import com.northwollo.tourism.dto.response.HotelDetailInfoDto;
import com.northwollo.tourism.dto.response.HotelRatingResponseDto;
import com.northwollo.tourism.dto.response.HotelSummaryDto;
import com.northwollo.tourism.entity.Hotel;
import com.northwollo.tourism.entity.HotelBooking;
import com.northwollo.tourism.entity.HotelImage;
import com.northwollo.tourism.entity.HotelRating;
import com.northwollo.tourism.entity.TourismPlace;
import com.northwollo.tourism.exception.ResourceNotFoundException;
import com.northwollo.tourism.repository.BookingMessageRepository;
import com.northwollo.tourism.repository.HotelBookingRepository;
import com.northwollo.tourism.repository.HotelRatingRepository;
import com.northwollo.tourism.repository.HotelRepository;
import com.northwollo.tourism.repository.TourismPlaceRepository;
import com.northwollo.tourism.service.HotelService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HotelServiceImpl implements HotelService {

    private final HotelRepository hotelRepository;
    private final TourismPlaceRepository tourismRepository;
    private final HotelRatingRepository hotelRatingRepository;
    private final HotelBookingRepository hotelBookingRepository;
    private final BookingMessageRepository bookingMessageRepository;

    @Override
    @Transactional
    public Long create(HotelCreateDto dto) {
        TourismPlace place = tourismRepository.findById(dto.getTourismPlaceId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tourism place not found with ID: " + dto.getTourismPlaceId()));

        Hotel hotel = new Hotel();
        hotel.setTourismPlace(place);
        hotel.setName(dto.getName());
        hotel.setStarRating(dto.getStarRating());
        hotel.setContactInfo(dto.getContactInfo());
        hotel.setPolicies(dto.getPolicies());
        hotel.setDescription(dto.getDescription());

        createHotelImages(hotel, dto.getImages(), dto.getMainImageUrl());

        return hotelRepository.save(hotel).getId();
    }

    @Override
    @Transactional
    public void update(Long id, HotelUpdateDto dto) {
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: " + id));

        if (dto.getName() != null && !dto.getName().isBlank()) hotel.setName(dto.getName());
        if (dto.getStarRating() != null) hotel.setStarRating(dto.getStarRating());
        if (dto.getContactInfo() != null && !dto.getContactInfo().isBlank()) hotel.setContactInfo(dto.getContactInfo());
        if (dto.getPolicies() != null) hotel.setPolicies(dto.getPolicies());
        if (dto.getDescription() != null) hotel.setDescription(dto.getDescription());

        if (dto.getImages() != null || dto.getMainImageUrl() != null) {
            createHotelImages(hotel, dto.getImages(), dto.getMainImageUrl());
        }

        hotelRepository.save(hotel);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: " + id));
        
        // 1. Delete booking messages for all bookings of this hotel
        List<HotelBooking> bookings = hotelBookingRepository.findByHotelId(id);
        for (HotelBooking booking : bookings) {
            bookingMessageRepository.deleteAll(bookingMessageRepository.findByBookingIdOrderByCreatedAtAsc(booking.getId()));
        }
        
        // 2. Delete hotel bookings
        hotelBookingRepository.deleteAll(bookings);
        
        // 3. Delete hotel ratings
        hotelRatingRepository.deleteAll(hotelRatingRepository.findByHotelId(id));
        
        // 4. Delete hotel (images cascade deleted)
        hotelRepository.delete(hotel);
    }
    @Override
    @Transactional(readOnly = true)
    public Hotel detail(Long id) {
        return hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public HotelDetailInfoDto getHotelDetailInfo(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: " + hotelId));

        return mapToDetailDto(hotel);
    }

    // 🔹 New method for booking page (fetch images eagerly)
    @Override
    @Transactional(readOnly = true)
    public HotelDetailInfoDto getHotelForBooking(Long hotelId) {
        Hotel hotel = hotelRepository.findByIdWithImages(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: " + hotelId));

        return mapToDetailDto(hotel);
    }

    // 🔹 Map Hotel entity to DTO
    private HotelDetailInfoDto mapToDetailDto(Hotel hotel) {
        List<HotelRating> ratings = hotelRatingRepository.findByHotelId(hotel.getId());

        HotelDetailInfoDto dto = new HotelDetailInfoDto();
        dto.setId(hotel.getId());
        dto.setName(hotel.getName());
        dto.setDescription(hotel.getDescription());
        dto.setStars(hotel.getStarRating());
        dto.setContactInfo(hotel.getContactInfo());
        dto.setPolicies(hotel.getPolicies());
        dto.setActive(hotel.isActive());

        // Owner information
        if (hotel.getOwner() != null) {
            dto.setOwnerId(hotel.getOwner().getId());
            dto.setOwnerName(hotel.getOwner().getFullName());
        }

        // Tourism place info
        if (hotel.getTourismPlace() != null) {
            dto.setTourismPlaceId(hotel.getTourismPlace().getId());
            dto.setTourismPlaceName(hotel.getTourismPlace().getName());
        }

        List<String> images = List.of();
        if (hotel.getImages() != null && !hotel.getImages().isEmpty()) {
            images = hotel.getImages().stream()
                    .map(HotelImage::getImageUrl)
                    .collect(Collectors.toList());
        }
        dto.setImages(images);

        dto.setRatings(ratings.stream()
                .map(HotelRatingResponseDto::fromEntity)
                .collect(Collectors.toList()));

        double averageRating = ratings.isEmpty() ? 0.0 :
                ratings.stream().mapToInt(HotelRating::getRating).average().orElse(0.0);
        dto.setAverageRating(averageRating);

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HotelSummaryDto> getHotels(Long tourismPlaceId) {
        return hotelRepository.findByTourismPlaceId(tourismPlaceId)
                .stream()
                .limit(3)
                .map(this::toHotelSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<HotelDetailInfoDto> getAllHotelsForAdmin() {
        return hotelRepository.findAllWithImages()
                .stream()
                .map(this::mapToDetailDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<HotelDetailInfoDto> getHotelsByOwner(Long ownerId) {
        return hotelRepository.findByOwnerIdWithImages(ownerId)
                .stream()
                .map(this::mapToDetailDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addHotelImages(Long hotelId, List<String> images, String mainImageUrl) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found: " + hotelId));

        if (hotel.getImages() != null) hotel.getImages().clear();

        createHotelImages(hotel, images, mainImageUrl);
        hotelRepository.save(hotel);
    }

    @Override
    @Transactional
    public void deleteHotelImage(Long hotelId, Long imageId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found: " + hotelId));

        if (hotel.getImages() == null || hotel.getImages().isEmpty())
            throw new ResourceNotFoundException("No images found for hotel: " + hotelId);

        boolean removed = hotel.getImages().removeIf(img -> img.getId().equals(imageId));
        if (!removed) throw new ResourceNotFoundException("Hotel image not found: " + imageId);

        hotelRepository.save(hotel);
    }

    // ✅ Private helper for creating/updating images
    private void createHotelImages(Hotel hotel, List<String> imageUrls, String mainImageUrl) {
        if (hotel.getImages() == null) hotel.setImages(new ArrayList<>());
        hotel.getImages().clear();

        if (mainImageUrl != null && !mainImageUrl.trim().isBlank()) {
            HotelImage mainImage = new HotelImage();
            mainImage.setImageUrl(mainImageUrl.trim());
            mainImage.setHotel(hotel);
            hotel.getImages().add(mainImage);
        }

        if (imageUrls != null) {
            for (String url : imageUrls) {
                if (url != null && !url.trim().isBlank()) {
                    HotelImage img = new HotelImage();
                    img.setImageUrl(url.trim());
                    img.setHotel(hotel);
                    hotel.getImages().add(img);
                }
            }
        }
    }

    private HotelSummaryDto toHotelSummary(Hotel hotel) {
        HotelSummaryDto summary = new HotelSummaryDto();
        summary.setId(hotel.getId());
        summary.setName(hotel.getName());
        summary.setStars(hotel.getStarRating());

        String imageUrl = null;
        if (hotel.getImages() != null && !hotel.getImages().isEmpty())
            imageUrl = hotel.getImages().get(0).getImageUrl();

        summary.setImageUrl(imageUrl);
        return summary;
    }
}
