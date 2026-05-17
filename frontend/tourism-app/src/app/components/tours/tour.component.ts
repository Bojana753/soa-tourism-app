import { Component, OnInit } from '@angular/core';
import { Tour, TourDifficulty, TourStatus, TourCreateDto } from './tour.model';
import { TourService } from '../../services/tour.service';

@Component({
  selector: 'app-tour',
  templateUrl: './tour.component.html',
  styleUrls: ['./tour.component.css']
})
export class TourComponent implements OnInit {
  tours: Tour[] = [];
  showCreateForm = false;
  selectedTour: Tour | null = null;
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  TourDifficulty = TourDifficulty;
  TourStatus = TourStatus;

  newTour: TourCreateDto = {
    name: '',
    description: '',
    difficulty: TourDifficulty.Easy,
    tags: []
  };

  tagInput = '';

  constructor(private tourService: TourService) {}

  ngOnInit(): void {
    this.loadMyTours();
  }

loadMyTours(): void {
  this.isLoading = true;
  this.tourService.getMyTours().subscribe({
    next: (tours) => {
      this.tours = tours;
      this.isLoading = false;
    },
    error: () => {
      this.errorMessage = 'Failed to load tours.';
      this.isLoading = false;
    }
  });
}

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.resetForm();
  }

  addTag(): void {
    const tag = this.tagInput.trim();
    if (tag && !this.newTour.tags.includes(tag)) {
      this.newTour.tags.push(tag);
    }
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    this.newTour.tags = this.newTour.tags.filter(t => t !== tag);
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }

  createTour(): void {
    if (!this.newTour.name || !this.newTour.description) {
      this.errorMessage = 'Name and description are required.';
      return;
    }
    this.isLoading = true;
    this.tourService.createTour(this.newTour).subscribe({
      next: (tour) => {
        this.tours.unshift(tour);
        this.showCreateForm = false;
        this.successMessage = 'Tour created successfully!';
        this.resetForm();
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => {
        this.errorMessage = 'Failed to create tour.';
        this.isLoading = false;
      }
    });
  }

  resetForm(): void {
    this.newTour = { name: '', description: '', difficulty: TourDifficulty.Easy, tags: [] };
    this.tagInput = '';
    this.errorMessage = '';
  }

  selectTour(tour: Tour): void {
    this.selectedTour = tour;
  }

  closeDetail(): void {
    this.selectedTour = null;
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
}