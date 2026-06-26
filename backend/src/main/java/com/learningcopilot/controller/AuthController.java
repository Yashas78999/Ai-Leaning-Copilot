package com.learningcopilot.controller;

import com.learningcopilot.dto.LoginRequestDto;
import com.learningcopilot.dto.LoginResponseDto;
import com.learningcopilot.dto.UserCreateDto;
import com.learningcopilot.entity.User;
import com.learningcopilot.repository.UserRepository;
import com.learningcopilot.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody UserCreateDto registerDto) {
        if (userRepository.findByEmail(registerDto.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("detail", "Email already registered"));
        }

        User user = User.builder()
                .name(registerDto.getName())
                .email(registerDto.getEmail())
                .hashedPassword(passwordEncoder.encode(registerDto.getPassword()))
                .build();

        User savedUser = userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "User registered successfully",
                        "user_id", savedUser.getId()
                ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto loginDto) {
        User user = userRepository.findByEmail(loginDto.getEmail()).orElse(null);

        if (user == null || !passwordEncoder.matches(loginDto.getPassword(), user.getHashedPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("detail", "Invalid credentials"));
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return ResponseEntity.ok(LoginResponseDto.builder()
                .accessToken(token)
                .tokenType("bearer")
                .build());
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("detail", "Unauthorized"));
        }

        return ResponseEntity.ok(Map.of(
                "id", currentUser.getId(),
                "name", currentUser.getName(),
                "email", currentUser.getEmail()
        ));
    }
}
