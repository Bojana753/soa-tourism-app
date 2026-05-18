import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Review, Tour } from '../tours/tour.model';
import { TourService } from '../../services/tour.service';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css']
})
export class ReviewComponent implements OnInit {
  tourId!: number;
  tour: Tour | null = null;
  reviews: Review[] = [];
  isLoading = false;
  showForm = false;
  successMessage = '';
  errorMessage = '';
  today = new Date().toISOString().split('T')[0];

  newReview: Omit<Review, 'id' | 'tourId' | 'createdAt'> = {
    rating: 0,
    comment: '',
    visitDate: '',
    images: []
  };

  hoveredStar = 0;
  imageUrlInput = '';

  // ── Navbar ──────────────────────────────────────────────
  isScrolled = false;
  isLoggedIn = false;

  @HostListener('window:scroll')
  onScroll(): void { this.isScrolled = window.scrollY > 60; }

  signOut(): void {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
  // ────────────────────────────────────────────────────────

  constructor(private route: ActivatedRoute, private tourService: TourService, private router: Router) {}

  ngOnInit(): void {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.tourId = Number(this.route.snapshot.paramMap.get('id') || 1);
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.tourService.getTourById(this.tourId).subscribe({
      next: (tour) => { this.tour = tour; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
    this.tourService.getReviews(this.tourId).subscribe({
      next: (reviews: any[]) => {
        this.reviews = reviews.map(r => ({
          ...r,
          touristName: r.touristUsername || 'Anonymous Tourist',
          images: r.images || []
        }));
      },
      error: () => {}
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  setRating(star: number): void { this.newReview.rating = star; }
  setHover(star: number): void { this.hoveredStar = star; }
  clearHover(): void { this.hoveredStar = 0; }

  addImage(): void {
    const url = this.imageUrlInput.trim();
    if (url) { this.newReview.images = [...(this.newReview.images || []), url]; this.imageUrlInput = ''; }
  }

  removeImage(index: number): void {
    this.newReview.images = this.newReview.images?.filter((_, i) => i !== index);
  }

  onImgError(event: any): void {
    event.target.style.display = 'none';
  }

  submitReview(): void {
    if (!this.newReview.rating) { this.errorMessage = 'Please select a rating.'; return; }
    if (!this.newReview.comment.trim()) { this.errorMessage = 'Comment is required.'; return; }
    if (!this.newReview.visitDate) { this.errorMessage = 'Please enter the visit date.'; return; }

    this.isLoading = true;
    this.tourService.addReview(this.tourId, this.newReview).subscribe({
      next: (review: any) => {
        this.reviews.unshift({
          ...review,
          touristName: review.touristUsername || 'Anonymous Tourist',
          images: review.images || []
        });
        this.showForm = false;
        this.successMessage = 'Review submitted!';
        this.resetForm();
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => { this.errorMessage = 'Failed to submit review.'; this.isLoading = false; }
    });
  }

  resetForm(): void {
    this.newReview = { rating: 0, comment: '', visitDate: '', images: [] };
    this.hoveredStar = 0;
    this.imageUrlInput = '';
    this.errorMessage = '';
  }

  get averageRating(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
  }

  getStarsArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  getDisplayStar(star: number): string {
    const active = this.hoveredStar > 0 ? this.hoveredStar : this.newReview.rating;
    return star <= active ? '★' : '☆';
  }

  getStarClass(star: number): string {
    const active = this.hoveredStar > 0 ? this.hoveredStar : this.newReview.rating;
    return star <= active ? 'star-active' : 'star-empty';
  }
}