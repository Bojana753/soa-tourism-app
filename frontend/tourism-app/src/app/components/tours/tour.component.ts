import { Component, OnInit, OnDestroy, AfterViewChecked, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Tour, TourDifficulty, TourStatus, TourCreateDto, KeyPoint } from './tour.model';
import { TourService } from '../../services/tour.service';

declare const L: any;

@Component({
  selector: 'app-tour',
  templateUrl: './tour.component.html',
  styleUrls: ['./tour.component.css']
})
export class TourComponent implements OnInit, OnDestroy, AfterViewChecked {
  tours: Tour[] = [];
  selectedTour: Tour | null = null;
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  isScrolled = false;
  isLoggedIn = false;

  TourDifficulty = TourDifficulty;
  TourStatus = TourStatus;

  wizardStep: 0 | 1 | 2 = 0; 
  createdTourId: number | null = null;
  createdTour: Tour | null = null;
  private wizardFinished = false;

  newTour: TourCreateDto = {
    name: '',
    description: '',
    difficulty: TourDifficulty.Easy,
    tags: []
  };
  tagInput = '';

  keyPoints: KeyPoint[] = [];
  showKpForm = false;
  editingKeyPoint: KeyPoint | null = null;
  isSelectingOnMap = false;
  mapReady = false;
  mapNeedsInit = false;

  kpFormData: Partial<KeyPoint> = {
    name: '', description: '', latitude: undefined, longitude: undefined, imageUrl: ''
  };

  private map: any;
  private markers: any[] = [];
  private routePolyline: any;
  private tempMarker: any;

  constructor(private tourService: TourService, private router: Router) {}

  ngOnInit(): void {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.loadMyTours();
  }

  ngAfterViewChecked(): void {
    if (this.mapNeedsInit && this.wizardStep === 2) {
      const el = document.getElementById('tour-wizard-map');
      if (el && !this.mapReady) {
        this.mapNeedsInit = false;
        this.mapReady = true;
        setTimeout(() => this.initMap(), 50);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.isScrolled = window.scrollY > 60;
  }

  signOut(): void {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

  loadMyTours(): void {
    this.isLoading = true;
    this.tourService.getMyTours().subscribe({
      next: (tours) => { this.tours = tours; this.isLoading = false; },
      error: () => { this.errorMessage = 'Failed to load tours.'; this.isLoading = false; }
    });
  }


  openWizard(): void {
    this.wizardStep = 1;
    this.resetWizard();
  }

  closeWizard(): void {
    if (this.createdTourId && !this.wizardFinished) {
      this.tourService.deleteTour(this.createdTourId).subscribe({
        next: () => {
          this.tours = this.tours.filter(t => t.id !== this.createdTourId);
        },
        error: () => {}
      });
    }
    this.wizardStep = 0;
    this.errorMessage = '';
    this.wizardFinished = false;
    if (this.map) { this.map.remove(); this.map = null; this.mapReady = false; }
  }


  addTag(): void {
    const tag = this.tagInput.trim();
    if (tag && !this.newTour.tags.includes(tag)) this.newTour.tags.push(tag);
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    this.newTour.tags = this.newTour.tags.filter(t => t !== tag);
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); this.addTag(); }
  }

  createTourAndProceed(): void {
    if (!this.newTour.name || !this.newTour.description) {
      this.errorMessage = 'Name and description are required.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.tourService.createTour(this.newTour).subscribe({
      next: (tour) => {
        this.tours.unshift(tour);
        this.createdTour = tour;
        this.createdTourId = tour.id!;
        this.keyPoints = tour.keyPoints || [];
        this.isLoading = false;
        this.wizardStep = 2;
        this.mapNeedsInit = true;
      },
      error: () => { this.errorMessage = 'Failed to create tour.'; this.isLoading = false; }
    });
  }


  private initMap(): void {
    this.map = L.map('tour-wizard-map').setView([44.8176, 20.4633], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.map.on('click', (e: any) => {
      if (!this.isSelectingOnMap) return;
      this.kpFormData.latitude = e.latlng.lat;
      this.kpFormData.longitude = e.latlng.lng;
      this.isSelectingOnMap = false;
      document.body.style.cursor = 'default';
      if (this.tempMarker) this.map.removeLayer(this.tempMarker);
      this.tempMarker = L.circleMarker([e.latlng.lat, e.latlng.lng], {
        radius: 10, fillColor: '#c9a96e', color: 'white', weight: 2, fillOpacity: 1
      }).addTo(this.map).bindPopup('New key point').openPopup();
    });

    this.renderMapMarkers();
  }

  private renderMapMarkers(): void {
    if (!this.map) return;
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];
    if (this.routePolyline) { this.map.removeLayer(this.routePolyline); this.routePolyline = null; }
    if (!this.keyPoints.length) return;

    const latlngs: [number, number][] = [];
    this.keyPoints.forEach((kp, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div class="kp-marker-gold">${i + 1}</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16]
      });
      const m = L.marker([kp.latitude, kp.longitude], { icon })
        .addTo(this.map)
        .bindPopup(`<strong>${kp.name}</strong><br>${kp.description || ''}`);
      this.markers.push(m);
      latlngs.push([kp.latitude, kp.longitude]);
    });

    if (latlngs.length > 1) {
      this.routePolyline = L.polyline(latlngs, {
        color: '#c9a96e', weight: 3, opacity: 0.75, dashArray: '8, 6'
      }).addTo(this.map);
    }

    const group = L.featureGroup(this.markers);
    this.map.fitBounds(group.getBounds().pad(0.25));
  }

  startSelectingOnMap(): void {
    this.isSelectingOnMap = true;
    document.body.style.cursor = 'crosshair';
    this.showKpForm = true;
  }

  openKpCreateForm(): void {
    this.editingKeyPoint = null;
    this.kpFormData = { name: '', description: '', latitude: undefined, longitude: undefined, imageUrl: '' };
    if (this.tempMarker) { this.map.removeLayer(this.tempMarker); this.tempMarker = null; }
    this.showKpForm = true;
  }

  openKpEditForm(kp: KeyPoint): void {
    this.editingKeyPoint = kp;
    this.kpFormData = { ...kp };
    this.showKpForm = true;
    if (this.map) this.map.setView([kp.latitude, kp.longitude], 15);
  }

  cancelKpForm(): void {
    this.showKpForm = false;
    this.editingKeyPoint = null;
    this.isSelectingOnMap = false;
    document.body.style.cursor = 'default';
    if (this.tempMarker) { this.map.removeLayer(this.tempMarker); this.tempMarker = null; }
    this.kpFormData = { name: '', description: '', latitude: undefined, longitude: undefined, imageUrl: '' };
  }

  saveKeyPoint(): void {
    if (!this.kpFormData.name || this.kpFormData.latitude === undefined || this.kpFormData.longitude === undefined) {
      this.errorMessage = 'Name and map location are required.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    const payload = {
      name: this.kpFormData.name!,
      description: this.kpFormData.description || '',
      latitude: this.kpFormData.latitude!,
      longitude: this.kpFormData.longitude!,
      imageUrl: this.kpFormData.imageUrl || '',
      order: this.keyPoints.length + 1
    };

    if (this.editingKeyPoint?.id) {
      this.tourService.updateKeyPoint(this.createdTourId!, this.editingKeyPoint.id, payload).subscribe({
        next: (updated) => {
          const idx = this.keyPoints.findIndex(k => k.id === updated.id);
          if (idx !== -1) this.keyPoints[idx] = updated;
          this.isLoading = false;
          this.cancelKpForm();
          this.renderMapMarkers();
          this.successMessage = 'Key point updated.';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => { this.errorMessage = 'Failed to update key point.'; this.isLoading = false; }
      });
    } else {
      this.tourService.addKeyPoint(this.createdTourId!, payload).subscribe({
        next: (created) => {
          this.keyPoints.push(created);
          const t = this.tours.find(t => t.id === this.createdTourId);
          if (t) t.keyPoints = this.keyPoints;
          this.isLoading = false;
          this.cancelKpForm();
          this.renderMapMarkers();
          this.successMessage = 'Key point added.';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => { this.errorMessage = 'Failed to add key point.'; this.isLoading = false; }
      });
    }
  }

  deleteKeyPoint(kp: KeyPoint): void {
    if (!confirm(`Delete "${kp.name}"?`)) return;
    this.tourService.deleteKeyPoint(this.createdTourId!, kp.id!).subscribe({
      next: () => {
        this.keyPoints = this.keyPoints.filter(k => k.id !== kp.id);
        this.renderMapMarkers();
        this.successMessage = 'Deleted.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => { this.errorMessage = 'Failed to delete.'; }
    });
  }

  finishWizard(): void {
    if (this.keyPoints.length === 0) {
      this.errorMessage = 'Please add at least one key point before finishing.';
      return;
    }
    this.wizardFinished = true;
    this.closeWizard();
    this.successMessage = `Tour "${this.createdTour?.name}" created with ${this.keyPoints.length} key point(s)!`;
    setTimeout(() => this.successMessage = '', 4000);
  }

  get hasKpLocation(): boolean {
    return this.kpFormData.latitude !== undefined && this.kpFormData.longitude !== undefined;
  }


  selectTour(tour: Tour): void { this.selectedTour = tour; }
  closeDetail(): void { this.selectedTour = null; }

  resetWizard(): void {
    this.newTour = { name: '', description: '', difficulty: TourDifficulty.Easy, tags: [] };
    this.tagInput = '';
    this.errorMessage = '';
    this.createdTourId = null;
    this.createdTour = null;
    this.wizardFinished = false;
    this.keyPoints = [];
    this.showKpForm = false;
    this.editingKeyPoint = null;
    this.isSelectingOnMap = false;
    if (this.map) { this.map.remove(); this.map = null; this.mapReady = false; }
  }

  getDifficultyClass(difficulty: TourDifficulty): string {
    switch (difficulty) {
      case TourDifficulty.Easy: return 'badge-easy';
      case TourDifficulty.Medium: return 'badge-medium';
      case TourDifficulty.Hard: return 'badge-hard';
      default: return '';
    }
  }

  getStatusClass(status: TourStatus): string {
    switch (status) {
      case TourStatus.Draft: return 'badge-draft';
      case TourStatus.Published: return 'badge-published';
      case TourStatus.Archived: return 'badge-archived';
      default: return '';
    }
  }

  getUserRole(): string {
    const token = localStorage.getItem('token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || '';
    } catch { return ''; }
  }

  get isGuide(): boolean { return this.getUserRole() === 'guide'; }
}