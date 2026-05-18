import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private url = 'http://localhost:8080/api/v1/blogs';

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

  getAllBlogs(): Observable<any> {
    return this.http.get(this.url, { headers: this.headers() });
  }

  getBlogById(id: string): Observable<any> {
    return this.http.get(`${this.url}/${id}`, { headers: this.headers() });
  }

  createBlog(data: any): Observable<any> {
    return this.http.post(this.url, data, { headers: this.headers() });
  }

  updateBlog(id: string, data: any): Observable<any> {
    return this.http.put(`${this.url}/${id}`, data, { headers: this.headers() });
  }

  deleteBlog(id: string): Observable<any> {
    return this.http.delete(`${this.url}/${id}`, { headers: this.headers() });
  }

  likeBlog(id: string): Observable<any> {
    return this.http.post(`${this.url}/${id}/likes`, {}, { headers: this.headers() });
  }

  unlikeBlog(id: string): Observable<any> {
    return this.http.delete(`${this.url}/${id}/likes`, { headers: this.headers() });
  }

  getComments(blogId: string): Observable<any> {
    return this.http.get(`${this.url}/${blogId}/comments`, { headers: this.headers() });
  }

  addComment(blogId: string, data: any): Observable<any> {
    return this.http.post(`${this.url}/${blogId}/comments`, data, { headers: this.headers() });
  }

  getUserById(id: string): Observable<any> {
  return this.http.get(`http://localhost:8080/users/${id}`, { headers: this.headers() });
}
}
