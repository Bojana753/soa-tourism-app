import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private apiUrl = 'http://localhost:8080/api/purchase';

  constructor(private http: HttpClient) {}

  private getUserId(): number {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || 0;
    } catch { return 0; }
  }

  getCart(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cart/${this.getUserId()}`);
  }

  addToCart(tourId: number, tourName: string, price: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/cart/add`, {
      touristId: this.getUserId(),
      tourId,
      tourName,
      price
    });
  }

  removeFromCart(tourId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cart/${this.getUserId()}/items/${tourId}`);
  }

  checkout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/checkout/${this.getUserId()}`, {});
  }

  getMyTokens(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tokens/${this.getUserId()}`);
  }

  checkPurchased(tourId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/check?touristId=${this.getUserId()}&tourId=${tourId}`);
  }
}