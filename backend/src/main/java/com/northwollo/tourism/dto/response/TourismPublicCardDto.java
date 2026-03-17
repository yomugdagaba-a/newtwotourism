package com.northwollo.tourism.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class TourismPublicCardDto<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
}
