import { Component, OnInit, OnDestroy, AfterViewInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { PositionService, Position } from '../../services/position.service';

declare const L: any;

@Component({
  selector: 'app-position-simulator',
  templateUrl: './position-simulator.component.html',
  styleUrls: ['./position-simulator.component.css']
})
export class PositionSimulatorComponent implements OnInit, AfterViewInit, OnDestroy {
  currentPosition: Position | null = null;
  isScrolled = false;
  isLoggedIn = false;
  isSelectingViaGPS = false;
  successMessage = '';
  errorMessage = '';

  private map: any;
  private positionMarker: any;
  private positionCircle: any;

  constructor(
    private positionService: PositionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.positionService.loadPositionFromBackend();
    this.positionService.position$.subscribe(pos => {
      this.currentPosition = pos;
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.isScrolled = window.scrollY > 60;
  }

  private initMap(): void {
    const defaultCenter: [number, number] = this.currentPosition
      ? [this.currentPosition.lat, this.currentPosition.lng]
      : [44.8176, 20.4633];

    this.map = L.map('simulator-map').setView(defaultCenter, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    if (this.currentPosition) {
      this.drawPosition(this.currentPosition.lat, this.currentPosition.lng);
    }

    this.map.on('click', (e: any) => {
      this.setPosition(e.latlng.lat, e.latlng.lng);
    });
  }

  private drawPosition(lat: number, lng: number): void {
    if (this.positionMarker) this.map.removeLayer(this.positionMarker);
    if (this.positionCircle) this.map.removeLayer(this.positionCircle);

    const icon = L.divIcon({
      className: '',
      html: `<div class="pos-marker-gold"><div class="pos-dot-gold"></div><div class="pos-ring-gold"></div></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    this.positionMarker = L.marker([lat, lng], { icon })
      .addTo(this.map)
      .bindPopup(`<strong style="font-family:'Cormorant Garamond',serif;font-size:15px;">Your Position</strong><br><span style="font-size:12px;color:#888;">Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}</span>`)
      .openPopup();

    this.positionCircle = L.circle([lat, lng], {
      radius: 80,
      fillColor: '#c9a96e',
      fillOpacity: 0.1,
      color: '#c9a96e',
      weight: 1.5,
      dashArray: '4 4'
    }).addTo(this.map);
  }

  setPosition(lat: number, lng: number): void {
    this.positionService.setPosition(lat, lng);
    this.currentPosition = { lat, lng };
    this.drawPosition(lat, lng);
    this.successMessage = 'Position updated successfully.';
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 2800);
  }

  clearPosition(): void {
    this.positionService.clearPosition();
    this.currentPosition = null;
    if (this.positionMarker) { this.map.removeLayer(this.positionMarker); this.positionMarker = null; }
    if (this.positionCircle) { this.map.removeLayer(this.positionCircle); this.positionCircle = null; }
  }

  useGPSPosition(): void {
    if (!navigator.geolocation) {
      this.errorMessage = 'Geolocation is not supported by your browser.';
      return;
    }
    this.isSelectingViaGPS = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.isSelectingViaGPS = false;
        this.setPosition(pos.coords.latitude, pos.coords.longitude);
        this.map.setView([pos.coords.latitude, pos.coords.longitude], 16);
      },
      () => {
        this.isSelectingViaGPS = false;
        this.errorMessage = 'Unable to retrieve your location. Please allow location access.';
        setTimeout(() => this.errorMessage = '', 3500);
      }
    );
  }

  signOut(): void {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
}