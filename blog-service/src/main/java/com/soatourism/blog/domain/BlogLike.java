package com.soatourism.blog.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "blog_likes")
@CompoundIndex(name = "uniq_blog_user", def = "{'blogPostId': 1, 'userId': 1}", unique = true)
public class BlogLike {

    @Id
    private String id;
    private String blogPostId;
    private String userId;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBlogPostId() {
        return blogPostId;
    }

    public void setBlogPostId(String blogPostId) {
        this.blogPostId = blogPostId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
