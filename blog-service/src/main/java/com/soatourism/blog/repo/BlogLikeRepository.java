package com.soatourism.blog.repo;

import com.soatourism.blog.domain.BlogLike;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BlogLikeRepository extends MongoRepository<BlogLike, String> {

    long countByBlogPostId(String blogPostId);

    boolean existsByBlogPostIdAndUserId(String blogPostId, String userId);

    void deleteByBlogPostIdAndUserId(String blogPostId, String userId);
}
