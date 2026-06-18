import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  userId = 0;
  notifications: any[] = [];
  isLoading = false;
  errorMessage = '';

  isScrolled = false;
  isLoggedIn = false;

  constructor(private notificationService: NotificationService, private router: Router) {}

  ngOnInit(): void {
    this.userId = this.getUserIdFromToken();
    this.isLoggedIn = this.userId > 0;
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.load();
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.isScrolled = window.scrollY > 60;
  }

  private getUserIdFromToken(): number {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || 0;
    } catch {
      return 0;
    }
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.notificationService.getNotifications(this.userId).subscribe({
      next: (data) => {
        this.notifications = (data || []).slice().reverse();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load notifications.';
        this.isLoading = false;
      }
    });
  }

  markRead(note: any): void {
    if (note.read) return;
    this.notificationService.markRead(this.userId, note.id).subscribe({
      next: () => {
        note.read = true;
      },
      error: () => {}
    });
  }

  signOut(): void {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
}