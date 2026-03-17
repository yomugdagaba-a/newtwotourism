package com.northwollo.tourism.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public class PaginationUtils {

    public static Pageable create(
            int page,
            int size,
            String sortBy,
            Sort.Direction direction) {

        return PageRequest.of(page, size, Sort.by(direction, sortBy));
    }
}
