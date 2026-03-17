package com.northwollo.tourism.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class SearchResultDto<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
}
