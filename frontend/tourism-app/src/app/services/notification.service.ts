import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = 'http://localhost:8080/api/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${userId}`);
  }

  create(userId: number, message: string): Observable<any> {
    return this.http.post(this.apiUrl, { userId, message });
  }

  markRead(userId: number, noteId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/${noteId}/read`, {});
  }
}