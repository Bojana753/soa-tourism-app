import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tour, KeyPoint, Review, TourCreateDto } from '../components/tours/tour.model';

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private apiUrl = 'http://localhost:8080/api/tours';

  constructor(private http: HttpClient) {}

  private getUserId(): number {
    const user = localStorage.getItem('user');
    if (user) { try { return JSON.parse(user).id; } catch {} }
    return 1;
  }

  private getUsername(): string {
    const user = localStorage.getItem('user');
    if (user) { try { return JSON.parse(user).username; } catch {} }
    return 'Tourist';
  }

  getMyTours(): Observable<Tour[]> {
    return this.http.get<Tour[]>(`${this.apiUrl}/author/${this.getUserId()}`);
  }

  getTourById(id: number): Observable<Tour> {
    return this.http.get<Tour>(`${this.apiUrl}/${id}`);
  }

  getPublishedTours(): Observable<Tour[]> {
    return this.http.get<Tour[]>(`${this.apiUrl}/published`);
  }

  createTour(dto: TourCreateDto): Observable<Tour> {
    return this.http.post<Tour>(this.apiUrl, {
      name: dto.name,
      description: dto.description,
      difficulty: dto.difficulty.toUpperCase(),
      tags: dto.tags,
      authorId: this.getUserId()
    });
  }

  updateTour(id: number, tour: Partial<Tour>): Observable<Tour> {
    return this.http.put<Tour>(`${this.apiUrl}/${id}`, tour);
  }

  deleteTour(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getKeyPoints(tourId: number): Observable<KeyPoint[]> {
    return this.http.get<KeyPoint[]>(`${this.apiUrl}/${tourId}/keypoints`);
  }

  addKeyPoint(tourId: number, keyPoint: Omit<KeyPoint, 'id' | 'tourId'>): Observable<KeyPoint> {
    return this.http.post<KeyPoint>(`${this.apiUrl}/${tourId}/keypoints`, {
      name: keyPoint.name,
      description: keyPoint.description,
      latitude: keyPoint.latitude,
      longitude: keyPoint.longitude,
      imageUrl: keyPoint.imageUrl || '',
      orderIndex: keyPoint.order || 1
    });
  }

  updateKeyPoint(tourId: number, keyPointId: number, keyPoint: Partial<KeyPoint>): Observable<KeyPoint> {
    return this.http.put<KeyPoint>(`${this.apiUrl}/${tourId}/keypoints/${keyPointId}`, {
      name: keyPoint.name,
      description: keyPoint.description,
      latitude: keyPoint.latitude,
      longitude: keyPoint.longitude,
      imageUrl: keyPoint.imageUrl || '',
      orderIndex: keyPoint.order || 1
    });
  }

  deleteKeyPoint(tourId: number, keyPointId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tourId}/keypoints/${keyPointId}`);
  }

  getReviews(tourId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/${tourId}/reviews`);
  }

  addReview(tourId: number, review: Omit<Review, 'id' | 'tourId' | 'createdAt'>): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/${tourId}/reviews`, {
      rating: review.rating,
      comment: review.comment,
      touristId: this.getUserId(),
      touristUsername: this.getUsername(),
      visitDate: review.visitDate,
      images: review.images || []
    });
  }
}