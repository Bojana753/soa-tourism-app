import { Component, OnInit } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FollowerService } from '../../services/follower.service';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent implements OnInit {
  blogs: any[] = [];
  followingIds: string[] = [];
  loading = false;
  error = '';
  isLoggedIn = false;
  currentUserId = '';
  newBlogTitle = '';
  newBlogContent = '';
  showNewBlogForm = false;
  editingBlogId: string | null = null;

  constructor(
    private blogService: BlogService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private followerService: FollowerService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUserId = this.getUserIdFromToken();
    this.loadBlogs();

    this.route.queryParams.subscribe(params => {
      if (params['newBlog'] === 'true') {
        this.showNewBlogForm = true;
        setTimeout(() => {
          document.querySelector('.new-blog-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    });
  }

  loadBlogs(): void {
    this.loading = true;
    this.error = '';
    this.blogService.getAllBlogs().subscribe({
      next: (data) => {
        this.blogs = data?.content ?? data ?? [];
        this.loading = false;
        this.followerService.getFollowing().subscribe({
          next: (ids: string[]) => {
            this.followingIds = ids;
            this.blogs.forEach(b => b.following = ids.includes(b.authorUserId));
          }
        });
      },
      error: () => {
        this.error = 'Failed to load blogs';
        this.loading = false;
      }
    });
  }

  createBlog(): void {
    if (!this.newBlogTitle || !this.newBlogContent) {
      this.error = 'Title and content are required';
      return;
    }
    this.blogService.createBlog({
      title: this.newBlogTitle,
      description: this.newBlogContent
    }).subscribe({
      next: (blog) => {
        this.blogs.unshift(blog);
        this.newBlogTitle = '';
        this.newBlogContent = '';
        this.showNewBlogForm = false;
      },
      error: () => {
        this.error = 'Failed to create blog';
      }
    });
  }

  likeBlog(blogId: string): void {
    this.blogService.likeBlog(blogId).subscribe({
      next: () => {
        const blog = this.blogs.find(b => b.id === blogId);
        if (blog) {
          blog.likeCount = (blog.likeCount || 0) + 1;
          blog.liked = true;
        }
      },
      error: () => {
        this.error = 'Failed to like blog';
      }
    });
  }

  unlikeBlog(blogId: string): void {
    this.blogService.unlikeBlog(blogId).subscribe({
      next: () => {
        const blog = this.blogs.find(b => b.id === blogId);
        if (blog) {
          blog.likeCount = Math.max((blog.likeCount || 1) - 1, 0);
          blog.liked = false;
        }
      },
      error: () => {
        this.error = 'Failed to unlike blog';
      }
    });
  }

  deleteBlog(blogId: string): void {
    if (confirm('Are you sure you want to delete this blog?')) {
      this.blogService.deleteBlog(blogId).subscribe({
        next: () => {
          this.blogs = this.blogs.filter(b => b.id !== blogId);
        },
        error: () => {
          this.error = 'Failed to delete blog';
        }
      });
    }
  }

  followUser(userId: string): void {
    this.followerService.followUser(userId).subscribe({
      next: () => {
        this.followingIds.push(userId);
        this.blogs.forEach(b => {
          if (b.authorUserId === userId) b.following = true;
        });
      },
      error: () => {
        this.error = 'Failed to follow user';
      }
    });
  }

  addComment(blog: any): void {
    if (!blog.newComment?.trim()) return;
    this.blogService.addComment(blog.id, { text: blog.newComment }).subscribe({
      next: (comment) => {
        if (!blog.comments) blog.comments = [];
        blog.comments.push(comment);
        blog.newComment = '';
        blog.commentCount = (blog.commentCount || 0) + 1;
      },
      error: () => {
        this.error = 'Failed to add comment';
      }
    });
  }

  loadComments(blog: any): void {
    blog.showComments = !blog.showComments;
    if (blog.showComments && !blog.commentsLoaded) {
      this.blogService.getComments(blog.id).subscribe({
        next: (data) => {
          blog.comments = Array.isArray(data) ? data : [];
          blog.commentsLoaded = true;
        },
        error: () => {
          blog.comments = [];
        }
      });
    }
  }

  scrollToForm(): void {
    setTimeout(() => {
      document.querySelector('.new-blog-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  signOut(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private getUserIdFromToken(): string {
    const token = this.auth.getToken();
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload.sub || payload.userId || '';
    } catch (e) {
      return '';
    }
  }
}