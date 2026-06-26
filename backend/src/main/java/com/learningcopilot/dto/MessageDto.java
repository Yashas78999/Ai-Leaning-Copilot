package com.learningcopilot.dto;

public class MessageDto {
    private String role;
    private String content;

    public MessageDto() {}

    public MessageDto(String role, String content) {
        this.role = role;
        this.content = content;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public static MessageDtoBuilder builder() {
        return new MessageDtoBuilder();
    }

    public static class MessageDtoBuilder {
        private String role;
        private String content;

        MessageDtoBuilder() {}

        public MessageDtoBuilder role(String role) {
            this.role = role;
            return this;
        }

        public MessageDtoBuilder content(String content) {
            this.content = content;
            return this;
        }

        public MessageDto build() {
            return new MessageDto(role, content);
        }
    }
}
