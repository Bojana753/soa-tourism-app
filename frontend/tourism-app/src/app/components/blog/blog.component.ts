import { Component, OnInit, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FollowerService } from '../../services/follower.service';

// Minimal markdown parser (no external dependency needed)
function parseMarkdown(text: string): string {
  if (!text) return '';
  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^(?!<[h|p|u|o|l|b|i|c|a])(.+)/gm, '<p>$1</p>');
}

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css'],
})
export class BlogComponent implements OnInit {
  blogs: any[] = [];
  followingIds: string[] = [];
  loading = false;
  error = '';
  isLoggedIn = false;
  currentUserId = '';

  // New blog form
  newBlogTitle = '';
  newBlogContent = '';
  newBlogImageFile: File | null = null;
  newBlogImagePreview: string | null = null;
  showNewBlogForm = false;

  // Feed filter removed - handled by separate Feed tab

  // Markdown preview toggle in form
  showMarkdownPreview = false;

  tickerDestinations = [
    'Kyoto', 'Sahara', 'Lofoten', 'Atacama', 'Tuscany',
    'Socotra', 'Hokkaido', 'Patagonia', 'Zanzibar', 'Faroe Islands',
    'Cappadocia', 'Svalbard', 'Maldives', 'Machu Picchu', 'Amalfi'
  ];

  private cardImages = [
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600&q=80',
    'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=600&q=80',
    'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600&q=80',
  ];

  getCardImage(blog: any, index: number): string {
    // If blog has an uploaded image, use it
    if (blog.imageUrl) return blog.imageUrl;
    return this.cardImages[index % this.cardImages.length];
  }

  constructor(
    private blogService: BlogService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private followerService: FollowerService,
    private sanitizer: DomSanitizer
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
      }
    });
  }

  loadBlogs(): void {
    this.loading = true;
    this.error = '';
    this.blogService.getAllBlogs().subscribe({
      next: (data) => {
        this.blogs = (data?.content ?? data ?? []).map((b: any) => ({
          ...b,
          liked: b.likedByCurrentUser ?? false
        }));
        this.loading = false;
        this.followerService.getFollowing().subscribe({
          next: (ids: string[]) => {
            this.followingIds = ids;
            this.blogs.forEach(b => {
              b.following = ids.includes(b.authorUserId);
              this.blogService.getUserById(b.authorUserId).subscribe({
                next: (user) => { b.authorName = user.username || b.authorUserId; },
                error: () => { b.authorName = b.authorUserId; }
              });
            });
          }
        });
      },
      error: () => {
        this.error = 'Failed to load blogs';
        this.loading = false;
      }
    });
  }

  // ── Image upload ──
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.newBlogImageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.newBlogImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  removeSelectedImage(): void {
    this.newBlogImageFile = null;
    this.newBlogImagePreview = null;
  }

  // ── Markdown ──
  renderMarkdown(text: string): SafeHtml {
    const html = parseMarkdown(text || '');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  get markdownPreviewHtml(): SafeHtml {
    return this.renderMarkdown(this.newBlogContent);
  }

  // ── Create blog ──
  createBlog(): void {
    if (!this.newBlogTitle.trim() || !this.newBlogContent.trim()) {
      this.error = 'Naslov i opis su obavezni';
      return;
    }

    const blogData: any = {
      title: this.newBlogTitle,
      description: this.newBlogContent,
      createdAt: new Date().toISOString(),
    };

    // If image selected, convert to base64 and attach
    if (this.newBlogImageFile && this.newBlogImagePreview) {
      blogData.imageUrl = this.newBlogImagePreview;
    }

    this.blogService.createBlog(blogData).subscribe({
      next: (blog) => {
        const newBlog = {
          ...blog,
          liked: false,
          following: false,
          imageUrl: blogData.imageUrl || null,
        };
        this.blogs.unshift(newBlog);
        this.newBlogTitle = '';
        this.newBlogContent = '';
        this.newBlogImageFile = null;
        this.newBlogImagePreview = null;
        this.showNewBlogForm = false;
        this.showMarkdownPreview = false;
        this.error = '';
      },
      error: () => {
        this.error = 'Greška pri kreiranju bloga';
      }
    });
  }

  // ── Like / Unlike ──
  likeBlog(blogId: string): void {
    this.blogService.likeBlog(blogId).subscribe({
      next: () => {
        const blog = this.blogs.find(b => b.id === blogId);
        if (blog) { blog.likeCount = (blog.likeCount || 0) + 1; blog.liked = true; }
      },
      error: () => { this.error = 'Failed to like blog'; }
    });
  }

  unlikeBlog(blogId: string): void {
    this.blogService.unlikeBlog(blogId).subscribe({
      next: () => {
        const blog = this.blogs.find(b => b.id === blogId);
        if (blog) { blog.likeCount = Math.max((blog.likeCount || 1) - 1, 0); blog.liked = false; }
      },
      error: () => { this.error = 'Failed to unlike blog'; }
    });
  }

  // ── Delete ──
  deleteBlog(blogId: string): void {
    if (confirm('Da li ste sigurni da želite da obrišete ovaj blog?')) {
      this.blogService.deleteBlog(blogId).subscribe({
        next: () => { this.blogs = this.blogs.filter(b => b.id !== blogId); },
        error: () => { this.error = 'Failed to delete blog'; }
      });
    }
  }

  // ── Follow ──
  followUser(userId: string): void {
    this.followerService.followUser(userId).subscribe({
      next: () => {
        this.followingIds.push(userId);
        this.blogs.forEach(b => { if (b.authorUserId === userId) b.following = true; });
      },
      error: () => { this.error = 'Failed to follow user'; }
    });
  }

  // ── Comments ──
  // Only users who follow the author can comment (per spec)
  canComment(blog: any): boolean {
    if (blog.authorUserId?.toString() === this.currentUserId?.toString()) return true;
    return blog.following;
  }

  addComment(blog: any): void {
    if (!blog.newComment?.trim()) return;
    if (!this.canComment(blog)) {
      this.error = 'Morate pratiti korisnika da biste ostavili komentar';
      return;
    }
    this.blogService.addComment(blog.id, { text: blog.newComment }).subscribe({
      next: (comment) => {
        if (!blog.comments) blog.comments = [];
        comment.createdAt = new Date().toISOString();
        comment.updatedAt = new Date().toISOString();
        this.blogService.getUserById(comment.authorUserId).subscribe({
          next: (user) => { comment.authorName = user.username || comment.authorUserId; },
          error: () => { comment.authorName = comment.authorUserId; }
        });
        blog.comments.push(comment);
        blog.newComment = '';
        blog.commentCount = (blog.commentCount || 0) + 1;
      },
      error: () => { this.error = 'Failed to add comment'; }
    });
  }

  loadComments(blog: any): void {
    blog.showComments = !blog.showComments;
    if (blog.showComments && !blog.commentsLoaded) {
      this.blogService.getComments(blog.id).subscribe({
        next: (data) => {
          blog.comments = Array.isArray(data) ? data : [];
          blog.comments.forEach((comment: any) => {
            this.blogService.getUserById(comment.authorUserId).subscribe({
              next: (user) => { comment.authorName = user.username || comment.authorUserId; },
              error: () => { comment.authorName = comment.authorUserId; }
            });
          });
          blog.commentsLoaded = true;
        },
        error: () => { blog.comments = []; }
      });
    }
  }

  closeForm(): void {
    this.showNewBlogForm = false;
    this.newBlogTitle = '';
    this.newBlogContent = '';
    this.newBlogImageFile = null;
    this.newBlogImagePreview = null;
    this.showMarkdownPreview = false;
    this.error = '';
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