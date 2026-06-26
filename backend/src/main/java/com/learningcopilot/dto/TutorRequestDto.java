package com.learningcopilot.dto;

import java.util.List;

public class TutorRequestDto {
    private String question;
    private List<MessageDto> history;

    public TutorRequestDto() {}

    public TutorRequestDto(String question, List<MessageDto> history) {
        this.question = question;
        this.history = history;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public List<MessageDto> getHistory() {
        return history;
    }

    public void setHistory(List<MessageDto> history) {
        this.history = history;
    }

    public static TutorRequestDtoBuilder builder() {
        return new TutorRequestDtoBuilder();
    }

    public static class TutorRequestDtoBuilder {
        private String question;
        private List<MessageDto> history;

        TutorRequestDtoBuilder() {}

        public TutorRequestDtoBuilder question(String question) {
            this.question = question;
            return this;
        }

        public TutorRequestDtoBuilder history(List<MessageDto> history) {
            this.history = history;
            return this;
        }

        public TutorRequestDto build() {
            return new TutorRequestDto(question, history);
        }
    }
}
