package com.northwollo.tourism.util;

public class SlugGenerator {

    public static String generate(String input) {
        return input.toLowerCase()
                .trim()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }
}
