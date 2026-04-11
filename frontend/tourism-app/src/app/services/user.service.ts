import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private url = 'http://localhost:8081';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers() {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.url}/users/profile`, { headers: this.headers() });
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.url}/users/profile`, data, { headers: this.headers() });
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.url}/users`, { headers: this.headers() });
  }

  blockUser(id: number): Observable<any> {
    return this.http.put(`${this.url}/users/${id}/block`, {}, { headers: this.headers() });
  }
}