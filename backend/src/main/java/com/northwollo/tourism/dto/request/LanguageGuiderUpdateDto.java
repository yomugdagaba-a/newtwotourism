package com.northwollo.tourism.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LanguageGuiderUpdateDto {

    private String fullName;
    private String contactInfo;
    private List<String> languages;
    private Boolean active;
}
