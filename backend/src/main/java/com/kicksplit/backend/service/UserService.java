package com.kicksplit.backend.service;

import org.springframework.stereotype.Service;

import com.kicksplit.backend.repository.UserRepository;
import com.kicksplit.backend.entity.User;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUser(Long id, User updatedUser) {
        User existingUser = getUserById(id);

        existingUser.setName(updatedUser.getName());
        existingUser.setUsername(updatedUser.getUsername());
        existingUser.setImageUrl(updatedUser.getImageUrl());
        existingUser.setEmail(updatedUser.getEmail());

        return userRepository.save(existingUser);
    }
}