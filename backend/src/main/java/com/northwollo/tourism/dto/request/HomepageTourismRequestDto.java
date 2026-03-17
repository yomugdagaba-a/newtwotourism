package com.northwollo.tourism.dto.request;

import com.northwollo.tourism.enums.TourismCategory;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class HomepageTourismRequestDto {

    private Set<TourismCategory> categories; // only filter by categories
}
