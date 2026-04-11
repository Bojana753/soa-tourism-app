package com.soatourism.blog.repo;

import com.soatourism.blog.domain.BlogPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BlogPostRepository extends MongoRepository<BlogPost, String> {

    Page<BlogPost> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
