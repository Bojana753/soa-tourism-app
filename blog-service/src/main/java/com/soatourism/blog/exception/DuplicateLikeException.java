package com.soatourism.blog.exception;

public class DuplicateLikeException extends RuntimeException {

    public DuplicateLikeException() {
        super("User already liked this post.");
    }
}
