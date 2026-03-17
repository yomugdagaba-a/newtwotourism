package com.northwollo.tourism.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LanguageGuiderDto {

    private Long id;
    private String fullName;
    private String contactInfo;
    private List<String> languages;
    private boolean active;
    private Long tourismPlaceId;
    private String tourismPlaceName;
}
