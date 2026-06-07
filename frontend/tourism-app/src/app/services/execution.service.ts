import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ExecutionStatus = 'ACTIVE' | 'COMPLETED';

export interface TourExecution {
  id: number;
  tourId: number;
  touristId: number;
  status: ExecutionStatus;
  completedKeyPoints: number;
  totalKeyPoints: number;
  lastLatitude?: number;
  lastLongitude?: number;
  startedAt: string;
  lastActivityAt?: string;
  completedAt?: string;
}

export interface ProximityResponse {
  withinRange: boolean;
  distanceMeters: number;
  keyPointId: number;
  keyPointName: string;
  keyPointCompleted: boolean;
  completedKeyPoints: number;
  totalKeyPoints: number;
  tourCompleted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ExecutionService {
  private apiUrl = 'http://localhost:8080/api/executions';

  constructor(private http: HttpClient) {}

  startTour(tourId: number): Observable<TourExecution> {
    return this.http.post<TourExecution>(`${this.apiUrl}/start`, {
      tourId,
      touristId: this.getTouristId()
    });
  }

  getExecution(id: number): Observable<TourExecution> {
    return this.http.get<TourExecution>(`${this.apiUrl}/${id}`);
  }

  checkProximity(id: number, latitude: number, longitude: number): Observable<ProximityResponse> {
    return this.http.post<ProximityResponse>(`${this.apiUrl}/${id}/proximity`, {
      touristId: this.getTouristId(),
      latitude,
      longitude
    });
  }

  private getTouristId(): number {
    const user = localStorage.getItem('user');
    if (user) {
      try { return JSON.parse(user).id; } catch {}
    }

    const token = localStorage.getItem('token');
    if (token) {
      try { return JSON.parse(atob(token.split('.')[1])).id; } catch {}
    }
    return 1;
  }
}
