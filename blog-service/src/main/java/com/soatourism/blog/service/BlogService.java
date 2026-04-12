package com.soatourism.blog.service;

import com.soatourism.blog.domain.BlogLike;
import com.soatourism.blog.domain.BlogPost;
import com.soatourism.blog.domain.Comment;
import com.soatourism.blog.exception.DuplicateLikeException;
import com.soatourism.blog.exception.ForbiddenException;
import com.soatourism.blog.exception.NotFoundException;
import com.soatourism.blog.repo.BlogLikeRepository;
import com.soatourism.blog.repo.BlogPostRepository;
import com.soatourism.blog.repo.CommentRepository;
import com.soatourism.blog.web.dto.BlogDetailResponse;
import com.soatourism.blog.web.dto.BlogResponse;
import com.soatourism.blog.web.dto.CommentResponse;
import com.soatourism.blog.web.dto.CreateBlogRequest;
import com.soatourism.blog.web.dto.CreateCommentRequest;
import com.soatourism.blog.web.dto.UpdateCommentRequest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class BlogService {

    private final BlogPostRepository blogPostRepository;
    private final CommentRepository commentRepository;
    private final BlogLikeRepository blogLikeRepository;

    public BlogService(
            BlogPostRepository blogPostRepository,
            CommentRepository commentRepository,
            BlogLikeRepository blogLikeRepository) {
        this.blogPostRepository = blogPostRepository;
        this.commentRepository = commentRepository;
        this.blogLikeRepository = blogLikeRepository;
    }

    public BlogResponse createPost(String authorUserId, CreateBlogRequest req) {
        BlogPost post = new BlogPost();
        post.setAuthorUserId(authorUserId);
        post.setTitle(req.title().trim());
        post.setDescription(req.description() != null ? req.description() : "");
        post.setImageUrls(req.imageUrls() != null ? new ArrayList<>(req.imageUrls()) : new ArrayList<>());
        post.setCreatedAt(Instant.now());
        BlogPost saved = blogPostRepository.save(post);
        return toBlogResponse(saved);
    }

    public Page<BlogResponse> listPosts(Pageable pageable) {
        return blogPostRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toBlogResponse);
    }

    public BlogDetailResponse getPostDetail(String blogId) {
        BlogPost post = blogPostRepository.findById(blogId)
                .orElseThrow(() -> new NotFoundException("Blog not found."));
        List<CommentResponse> comments = commentRepository.findByBlogPostIdOrderByCreatedAtAsc(blogId).stream()
                .map(this::toCommentResponse)
                .toList();
        return toDetail(post, comments);
    }

    public CommentResponse addComment(String blogId, String authorUserId, CreateCommentRequest req) {
        requireBlog(blogId);
        Instant now = Instant.now();
        Comment c = new Comment();
        c.setBlogPostId(blogId);
        c.setAuthorUserId(authorUserId);
        c.setAuthorDisplayName(req.authorDisplayName() != null ? req.authorDisplayName().trim() : null);
        c.setText(req.text().trim());
        c.setCreatedAt(now);
        c.setUpdatedAt(now);
        Comment saved = commentRepository.save(c);
        return toCommentResponse(saved);
    }

    public CommentResponse updateComment(String blogId, String commentId, String userId, UpdateCommentRequest req) {
        requireBlog(blogId);
        Comment c = commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found."));
        if (!blogId.equals(c.getBlogPostId())) {
            throw new NotFoundException("Comment not found.");
        }
        if (!userId.equals(c.getAuthorUserId())) {
            throw new ForbiddenException("You can only edit your own comments.");
        }
        c.setText(req.text().trim());
        c.setUpdatedAt(Instant.now());
        return toCommentResponse(commentRepository.save(c));
    }

    public void addLike(String blogId, String userId) {
        requireBlog(blogId);
        if (blogLikeRepository.existsByBlogPostIdAndUserId(blogId, userId)) {
            throw new DuplicateLikeException();
        }
        BlogLike like = new BlogLike();
        like.setBlogPostId(blogId);
        like.setUserId(userId);
        try {
            blogLikeRepository.save(like);
        } catch (DuplicateKeyException e) {
            throw new DuplicateLikeException();
        }
    }

    public void removeLike(String blogId, String userId) {
        requireBlog(blogId);
        blogLikeRepository.deleteByBlogPostIdAndUserId(blogId, userId);
    }

    private void requireBlog(String blogId) {
        if (!blogPostRepository.existsById(blogId)) {
            throw new NotFoundException("Blog not found.");
        }
    }

    private BlogResponse toBlogResponse(BlogPost p) {
        long likes = blogLikeRepository.countByBlogPostId(p.getId());
        return new BlogResponse(
                p.getId(),
                p.getAuthorUserId(),
                p.getTitle(),
                p.getDescription(),
                p.getImageUrls() != null ? List.copyOf(p.getImageUrls()) : List.of(),
                p.getCreatedAt(),
                likes);
    }

    private BlogDetailResponse toDetail(BlogPost p, List<CommentResponse> comments) {
        BlogResponse base = toBlogResponse(p);
        return new BlogDetailResponse(
                base.id(),
                base.authorUserId(),
                base.title(),
                base.description(),
                base.imageUrls(),
                base.createdAt(),
                base.likeCount(),
                comments);
    }

    private CommentResponse toCommentResponse(Comment c) {
        return new CommentResponse(
                c.getId(),
                c.getAuthorUserId(),
                c.getAuthorDisplayName(),
                c.getText(),
                c.getCreatedAt(),
                c.getUpdatedAt());
    }
}
