package com.learningcopilot.config;

import com.learningcopilot.entity.User;
import com.learningcopilot.repository.UserRepository;
import com.learningcopilot.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        log.info("JwtFilter: Request URI: {}, Method: {}, Authorization: {}", request.getRequestURI(), request.getMethod(), authHeader);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.info("JwtFilter: No Bearer token found in header.");
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        log.info("JwtFilter: Extracted token: {}", token);

        try {
            if (jwtUtil.validateToken(token)) {
                String email = jwtUtil.getEmailFromToken(token);
                log.info("JwtFilter: Token is valid. Email from token: {}", email);
                
                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    log.info("JwtFilter: User found in DB: {}", user.getEmail());
                    if (SecurityContextHolder.getContext().getAuthentication() == null) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                user, null, Collections.emptyList());
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        
                        SecurityContext context = SecurityContextHolder.createEmptyContext();
                        context.setAuthentication(authToken);
                        SecurityContextHolder.setContext(context);
                        
                        log.info("JwtFilter: Authentication set in SecurityContext for user: {}", user.getEmail());
                    } else {
                        log.info("JwtFilter: SecurityContext already had authentication: {}", SecurityContextHolder.getContext().getAuthentication().getName());
                    }
                } else {
                    log.warn("JwtFilter: No user found in database for email: {}", email);
                }
            } else {
                log.warn("JwtFilter: Token validation failed in JwtUtil.");
            }
        } catch (Exception e) {
            log.error("JwtFilter: Exception during filter execution: {}", e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }
}

