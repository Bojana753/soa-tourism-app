package com.soatourism.blog.web;

import com.soatourism.blog.service.BlogService;
import com.soatourism.blog.web.dto.BlogDetailResponse;
import com.soatourism.blog.web.dto.BlogResponse;
import com.soatourism.blog.web.dto.CommentResponse;
import com.soatourism.blog.web.dto.CreateBlogRequest;
import com.soatourism.blog.web.dto.CreateCommentRequest;
import com.soatourism.blog.web.dto.UpdateCommentRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/blogs")
public class BlogController {

    private final BlogService blogService;

    public BlogController(BlogService blogService) {
        this.blogService = blogService;
    }

    @PostMapping
    public ResponseEntity<BlogResponse> createPost(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateBlogRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(blogService.createPost(userId.trim(), body));
    }

    @GetMapping
    public Page<BlogResponse> listPosts(@PageableDefault(size = 20) Pageable pageable) {
        return blogService.listPosts(pageable);
    }

    @GetMapping("/{blogId}")
    public BlogDetailResponse getPost(@PathVariable String blogId) {
        return blogService.getPostDetail(blogId);
    }

    @PostMapping("/{blogId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable String blogId,
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateCommentRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(blogService.addComment(blogId, userId.trim(), body));
    }

    @PatchMapping("/{blogId}/comments/{commentId}")
    public CommentResponse updateComment(
            @PathVariable String blogId,
            @PathVariable String commentId,
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody UpdateCommentRequest body) {
        return blogService.updateComment(blogId, commentId, userId.trim(), body);
    }

    @PostMapping("/{blogId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addLike(
            @PathVariable String blogId,
            @RequestHeader("X-User-Id") String userId) {
        blogService.addLike(blogId, userId.trim());
    }

    @DeleteMapping("/{blogId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeLike(
            @PathVariable String blogId,
            @RequestHeader("X-User-Id") String userId) {
        blogService.removeLike(blogId, userId.trim());
    }
}
