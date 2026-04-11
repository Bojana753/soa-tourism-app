package com.soatourism.blog.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @NotBlank @Size(max = 10_000) String text,
        @Size(max = 200) String authorDisplayName
) {
}
