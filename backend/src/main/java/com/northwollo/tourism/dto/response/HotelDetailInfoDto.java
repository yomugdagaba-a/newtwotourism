package com.northwollo.tourism.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class HotelDetailInfoDto {
    private Long id;
    private String name;
    private String description;
    private Integer stars;
    private String contactInfo;
    private String policies;
    private List<String> images;
    private Double averageRating;
    private List<HotelRatingResponseDto> ratings;
    
    // Owner information
    private Long ownerId;
    private String ownerName;
    private boolean active;
    
    // Tourism place info
    private Long tourismPlaceId;
    private String tourismPlaceName;
}
