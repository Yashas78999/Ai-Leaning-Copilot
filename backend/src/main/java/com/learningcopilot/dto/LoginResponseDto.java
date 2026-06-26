package com.learningcopilot.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class LoginResponseDto {
    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("token_type")
    private String tokenType;

    public LoginResponseDto() {}

    public LoginResponseDto(String accessToken, String tokenType) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
    }

    @JsonProperty("access_token")
    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    @JsonProperty("token_type")
    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public static LoginResponseDtoBuilder builder() {
        return new LoginResponseDtoBuilder();
    }

    public static class LoginResponseDtoBuilder {
        private String accessToken;
        private String tokenType;

        LoginResponseDtoBuilder() {}

        public LoginResponseDtoBuilder accessToken(String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        public LoginResponseDtoBuilder tokenType(String tokenType) {
            this.tokenType = tokenType;
            return this;
        }

        public LoginResponseDto build() {
            return new LoginResponseDto(accessToken, tokenType);
        }
    }
}
