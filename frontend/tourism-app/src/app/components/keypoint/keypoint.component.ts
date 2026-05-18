import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KeyPoint, Tour } from '../tours/tour.model';
import { TourService } from '../../services/tour.service';

declare const L: any;

@Component({
  selector: 'app-keypoint',
  templateUrl: './keypoint.component.html',
  styleUrls: ['./keypoint.component.css']
})
export class KeypointComponent implements OnInit, AfterViewInit, OnDestroy {
  tourId!: number;
  tour: Tour | null = null;
  keyPoints: KeyPoint[] = [];
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  private map: any;
  private markers: any[] = [];
  private routePolyline: any;
  private tempMarker: any;

  showForm = false;
  editingKeyPoint: KeyPoint | null = null;
  isSelectingOnMap = false;

  formData: Partial<KeyPoint> = {
    name: '',
    description: '',
    latitude: undefined,
    longitude: undefined,
    imageUrl: ''
  };

  constructor(private route: ActivatedRoute, private tourService: TourService) {}

  ngOnInit(): void {
    this.tourId = Number(this.route.snapshot.paramMap.get('id') || 1);
    this.loadTourData();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    this.map = L.map('keypoint-map').setView([44.8176, 20.4633], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: any) => {
      if (this.isSelectingOnMap) {
        this.formData.latitude = e.latlng.lat;
        this.formData.longitude = e.latlng.lng;
        this.isSelectingOnMap = false;
        document.body.style.cursor = 'default';

        if (this.tempMarker) this.map.removeLayer(this.tempMarker);
        this.tempMarker = L.circleMarker([e.latlng.lat, e.latlng.lng], {
          radius: 10, fillColor: '#4a7c59', color: 'white', weight: 2, fillOpacity: 1
        }).addTo(this.map).bindPopup('New key point location').openPopup();
      }
    });
  }

  loadTourData(): void {
    this.isLoading = true;
    this.tourService.getTourById(this.tourId).subscribe({
      next: (tour) => {
        this.tour = tour;
        this.keyPoints = tour.keyPoints || [];
        this.isLoading = false;
        setTimeout(() => this.renderMapMarkers(), 100);
      },
      error: () => {
        this.tourService.getKeyPoints(this.tourId).subscribe({
          next: (kps) => { this.keyPoints = kps; this.isLoading = false; setTimeout(() => this.renderMapMarkers(), 100); },
          error: () => { this.isLoading = false; this.errorMessage = 'Failed to load data.'; }
        });
      }
    });
  }

  private renderMapMarkers(): void {
    if (!this.map) return;
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];
    if (this.routePolyline) this.map.removeLayer(this.routePolyline);
    if (this.keyPoints.length === 0) return;

    const latlngs: [number, number][] = [];

    this.keyPoints.forEach((kp, index) => {
      const markerIcon = L.divIcon({
        className: '',
        html: `<div class="kp-marker">${index + 1}</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16]
      });
      const marker = L.marker([kp.latitude, kp.longitude], { icon: markerIcon })
        .addTo(this.map)
        .bindPopup(`<strong>${kp.name}</strong><br>${kp.description || ''}`);
      this.markers.push(marker);
      latlngs.push([kp.latitude, kp.longitude]);
    });

    if (latlngs.length > 1) {
      this.routePolyline = L.polyline(latlngs, {
        color: '#4a7c59', weight: 3, opacity: 0.8, dashArray: '8, 6'
      }).addTo(this.map);
    }

    const group = L.featureGroup(this.markers);
    this.map.fitBounds(group.getBounds().pad(0.2));
  }

  startSelectingOnMap(): void {
    this.isSelectingOnMap = true;
    document.body.style.cursor = 'crosshair';
    this.showForm = true;
  }

  openCreateForm(): void {
    this.editingKeyPoint = null;
    this.formData = { name: '', description: '', latitude: undefined, longitude: undefined, imageUrl: '' };
    if (this.tempMarker) { this.map.removeLayer(this.tempMarker); this.tempMarker = null; }
    this.showForm = true;
  }

  openEditForm(kp: KeyPoint): void {
    this.editingKeyPoint = kp;
    this.formData = { ...kp };
    this.showForm = true;
    this.map.setView([kp.latitude, kp.longitude], 15);
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingKeyPoint = null;
    this.isSelectingOnMap = false;
    document.body.style.cursor = 'default';
    if (this.tempMarker) { this.map.removeLayer(this.tempMarker); this.tempMarker = null; }
    this.formData = { name: '', description: '', latitude: undefined, longitude: undefined, imageUrl: '' };
  }

  saveKeyPoint(): void {
    if (!this.formData.name || this.formData.latitude === undefined || this.formData.longitude === undefined) {
      this.errorMessage = 'Name and location are required.';
      return;
    }
    this.isLoading = true;
    const payload = {
      name: this.formData.name!,
      description: this.formData.description || '',
      latitude: this.formData.latitude!,
      longitude: this.formData.longitude!,
      imageUrl: this.formData.imageUrl || '',
      order: this.keyPoints.length + 1
    };

    if (this.editingKeyPoint?.id) {
      this.tourService.updateKeyPoint(this.tourId, this.editingKeyPoint.id, payload).subscribe({
        next: (updated) => {
          const idx = this.keyPoints.findIndex(k => k.id === updated.id);
          if (idx !== -1) this.keyPoints[idx] = updated;
          this.successMessage = 'Key point updated!';
          this.isLoading = false;
          this.cancelForm();
          this.renderMapMarkers();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => { this.errorMessage = 'Failed to update key point.'; this.isLoading = false; }
      });
    } else {
      this.tourService.addKeyPoint(this.tourId, payload).subscribe({
        next: (created) => {
          this.keyPoints.push(created);
          this.successMessage = 'Key point added!';
          this.isLoading = false;
          this.cancelForm();
          this.renderMapMarkers();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => { this.errorMessage = 'Failed to add key point.'; this.isLoading = false; }
      });
    }
  }

  deleteKeyPoint(kp: KeyPoint): void {
    if (!confirm(`Delete key point "${kp.name}"?`)) return;
    this.tourService.deleteKeyPoint(this.tourId, kp.id!).subscribe({
      next: () => {
        this.keyPoints = this.keyPoints.filter(k => k.id !== kp.id);
        this.renderMapMarkers();
        this.successMessage = 'Key point deleted.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => { this.errorMessage = 'Failed to delete key point.'; }
    });
  }

  get hasLocation(): boolean {
    return this.formData.latitude !== undefined && this.formData.longitude !== undefined;
  }
}