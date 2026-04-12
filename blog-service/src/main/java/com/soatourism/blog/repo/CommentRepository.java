package com.soatourism.blog.repo;

import com.soatourism.blog.domain.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CommentRepository extends MongoRepository<Comment, String> {

    List<Comment> findByBlogPostIdOrderByCreatedAtAsc(String blogPostId);
}
