import { Component, OnInit } from '@angular/core';
import { FollowerService } from '../../services/follower.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {
  feedBlogs: any[] = [];
  recommendations: any[] = [];
  loading = false;
  loadingRecommendations = false;
  error = '';
  isLoggedIn = false;
  activeTab: 'feed' | 'recommendations' = 'feed';

  constructor(
    private followerService: FollowerService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.auth.isLoggedIn();
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadFeed();
    this.loadRecommendations();
  }

  loadFeed(): void {
    this.loading = true;
    this.error = '';
    this.followerService.getFeed().subscribe({
      next: (data) => {
        this.feedBlogs = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load feed';
        this.loading = false;
      }
    });
  }

  loadRecommendations(): void {
    this.loadingRecommendations = true;
    this.followerService.getRecommendations().subscribe({
      next: (data) => {
        this.recommendations = Array.isArray(data) ? data : [];
        this.loadingRecommendations = false;
      },
      error: () => {
        this.error = 'Failed to load recommendations';
        this.loadingRecommendations = false;
      }
    });
  }

  followUser(userId: string): void {
    this.followerService.followUser(userId).subscribe({
      next: () => {
        const rec = this.recommendations.find(r => r.userId === userId);
        if (rec) rec.followed = true;
        this.loadFeed();
      },
      error: () => {
        this.error = 'Failed to follow user';
      }
    });
  }

  unfollowUser(userId: string): void {
    this.followerService.unfollowUser(userId).subscribe({
      next: () => {
        const rec = this.recommendations.find(r => r.userId === userId);
        if (rec) rec.followed = false;
        this.loadFeed();
      },
      error: () => {
        this.error = 'Failed to unfollow user';
      }
    });
  }

  setActiveTab(tab: 'feed' | 'recommendations'): void {
    this.activeTab = tab;
  }

  signOut(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}