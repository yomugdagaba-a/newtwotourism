package com.northwollo.tourism.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LanguageGuiderCreateDto {

    @NotBlank
    private String fullName;

    @NotBlank
    private String contactInfo;

    @NotNull
    private List<String> languages;

    @NotNull
    private Long tourismPlaceId;

    private boolean active = true;
}
