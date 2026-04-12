package com.soatourism.blog.web.dto;

import java.time.Instant;

public record CommentResponse(
        String id,
        String authorUserId,
        String authorDisplayName,
        String text,
        Instant createdAt,
        Instant updatedAt
) {
}
