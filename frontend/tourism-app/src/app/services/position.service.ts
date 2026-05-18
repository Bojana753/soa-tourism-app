import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface Position {
  lat: number;
  lng: number;
}

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private apiUrl = 'http://localhost:8080/api/position';
  private positionKey = 'tourist_position';
  private positionSubject = new BehaviorSubject<Position | null>(this.loadPosition());

  position$ = this.positionSubject.asObservable();

  constructor(private http: HttpClient) {}

  private loadPosition(): Position | null {
    const saved = localStorage.getItem(this.positionKey);
    return saved ? JSON.parse(saved) : null;
  }

  private getTouristId(): number {
    const user = localStorage.getItem('user');
    if (user) {
      try { return JSON.parse(user).id; } catch {}
    }
    return 1; // fallback za testiranje
  }

  setPosition(lat: number, lng: number): void {
    const pos: Position = { lat, lng };
    localStorage.setItem(this.positionKey, JSON.stringify(pos));
    this.positionSubject.next(pos);

    const touristId = this.getTouristId();
    this.http.put(`${this.apiUrl}/${touristId}`, { latitude: lat, longitude: lng })
      .subscribe({ error: (e) => console.error('Failed to save position to backend', e) });
  }

  getPosition(): Position | null {
    return this.positionSubject.value;
  }

  loadPositionFromBackend(): void {
    const touristId = this.getTouristId();
    this.http.get<{ latitude: number, longitude: number }>(`${this.apiUrl}/${touristId}`)
      .subscribe({
        next: (res) => {
          if (res?.latitude && res?.longitude) {
            const pos = { lat: res.latitude, lng: res.longitude };
            localStorage.setItem(this.positionKey, JSON.stringify(pos));
            this.positionSubject.next(pos);
          }
        },
        error: () => {} // tiho — korisnik možda nema sačuvanu poziciju
      });
  }

  clearPosition(): void {
    localStorage.removeItem(this.positionKey);
    this.positionSubject.next(null);
  }
}