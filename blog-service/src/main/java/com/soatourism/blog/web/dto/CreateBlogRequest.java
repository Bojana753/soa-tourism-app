package com.soatourism.blog.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateBlogRequest(
        @NotBlank @Size(max = 500) String title,
        @Size(max = 100_000) String description,
        List<@Size(max = 2048) String> imageUrls
) {
}
