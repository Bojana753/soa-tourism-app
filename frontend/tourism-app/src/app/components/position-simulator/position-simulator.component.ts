import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { PositionService, Position } from '../../services/position.service';

declare const L: any;

@Component({
  selector: 'app-position-simulator',
  templateUrl: './position-simulator.component.html',
  styleUrls: ['./position-simulator.component.css']
})
export class PositionSimulatorComponent implements OnInit, AfterViewInit, OnDestroy {
  currentPosition: Position | null = null;
  private map: any;
  private positionMarker: any;
  private positionCircle: any;
  successMessage = '';

  constructor(private positionService: PositionService) {}

ngOnInit(): void {
  this.positionService.loadPositionFromBackend(); // učitaj sa servera
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
      html: `<div class="pos-marker-wrap"><div class="pos-dot"></div><div class="pos-pulse"></div></div>`,
      iconSize: [40, 40], iconAnchor: [20, 20]
    });

    this.positionMarker = L.marker([lat, lng], { icon })
      .addTo(this.map)
      .bindPopup(`<strong>Your Position</strong><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`)
      .openPopup();

    this.positionCircle = L.circle([lat, lng], {
      radius: 50, fillColor: '#4a7c59', fillOpacity: 0.15, color: '#4a7c59', weight: 1
    }).addTo(this.map);
  }

  setPosition(lat: number, lng: number): void {
    this.positionService.setPosition(lat, lng);
    this.currentPosition = { lat, lng };
    this.drawPosition(lat, lng);
    this.successMessage = 'Position updated!';
    setTimeout(() => this.successMessage = '', 2500);
  }

  clearPosition(): void {
    this.positionService.clearPosition();
    this.currentPosition = null;
    if (this.positionMarker) { this.map.removeLayer(this.positionMarker); this.positionMarker = null; }
    if (this.positionCircle) { this.map.removeLayer(this.positionCircle); this.positionCircle = null; }
  }

  useGPSPosition(): void {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.setPosition(pos.coords.latitude, pos.coords.longitude);
        this.map.setView([pos.coords.latitude, pos.coords.longitude], 16);
      },
      () => alert('Unable to retrieve your location.')
    );
  }
}