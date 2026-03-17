package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.UserUpdateDto;
import com.northwollo.tourism.dto.response.UserDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {

    Page<UserDto> getAllUsers(Pageable pageable);

    Page<UserDto> searchUsers(String search, Pageable pageable);

    UserDto getUserById(Long userId);

    List<UserDto> getUsersByRole(String roleName);

    UserDto updateUser(Long userId, UserUpdateDto dto);

    void activateUser(Long userId);

    void deactivateUser(Long userId);

    void deleteUser(Long userId);

    void grantRole(Long userId, String roleName);

    void revokeRole(Long userId, String roleName);

    void resetUserPassword(Long userId, String newPassword);
}
