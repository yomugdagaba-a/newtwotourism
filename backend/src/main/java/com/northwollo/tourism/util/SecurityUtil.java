package com.northwollo.tourism.util;

import com.northwollo.tourism.entity.User;
import com.northwollo.tourism.exception.AccessDeniedException;
import com.northwollo.tourism.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

public class SecurityUtil {

    private static UserRepository userRepository;

    // Set repository instance (call once during startup)
    public static void setUserRepository(UserRepository repository) {
        SecurityUtil.userRepository = repository;
    }

    // Get current authenticated user
    public static User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("No authenticated user found");
        }

        Object principal = authentication.getPrincipal();

        // Case 1: Principal is full User entity
        if (principal instanceof User) {
            return (User) principal;
        }

        // Case 2: Extract username and load User
        String username = extractUsername(principal);
        if (userRepository == null) {
            throw new AccessDeniedException("UserRepository not initialized. Call SecurityUtil.setUserRepository() first.");
        }

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("User not found: " + username));
    }

    private static String extractUsername(Object principal) {
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            return (String) principal;
        } else if (principal instanceof User) {
            return ((User) principal).getUsername();
        }
        throw new AccessDeniedException("Invalid authentication principal: " + principal.getClass().getSimpleName());
    }

    // Get current user ID
    public static Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    // Get current username (no repository needed)
    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("No authenticated user found");
        }
        return extractUsername(authentication.getPrincipal());
    }
}
