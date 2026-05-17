import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FollowerService {
  private url = 'http://localhost:8080';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers() {
    const headers: any = {};
    const token = this.auth.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const userId = this.getUserIdFromToken();
    if (userId) {
      headers['X-User-Id'] = userId;
    }
    return new HttpHeaders(headers);
  }

  private getUserIdFromToken(): string | null {
    const token = this.auth.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || payload.sub || payload.userId || null;
    } catch (e) {
      return null;
    }
  }

  followUser(userId: string): Observable<any> {
    return this.http.post(`${this.url}/follow/${userId}`, {}, { headers: this.headers() });
  }

  unfollowUser(userId: string): Observable<any> {
    return this.http.delete(`${this.url}/follow/${userId}`, { headers: this.headers() });
  }

  getFeed(): Observable<any> {
    return this.http.get(`${this.url}/feed`, { headers: this.headers() });
  }

  getRecommendations(): Observable<any> {
    return this.http.get(`${this.url}/recommendations`, { headers: this.headers() });
  }

  getFollowing(): Observable<any> {
    return this.http.get(`${this.url}/following`, { headers: this.headers() });
  }
}