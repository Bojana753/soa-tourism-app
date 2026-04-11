package com.soatourism.blog.web.dto;

import java.time.Instant;
import java.util.List;

public record BlogDetailResponse(
        String id,
        String authorUserId,
        String title,
        String description,
        List<String> imageUrls,
        Instant createdAt,
        long likeCount,
        List<CommentResponse> comments
) {
}
