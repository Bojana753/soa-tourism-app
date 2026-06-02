import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { PurchaseService } from '../../services/purchase.service';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css']
})
export class ShoppingCartComponent implements OnInit {
  cart: any = null;
  tokens: any[] = [];
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  showTokens = false;

  isScrolled = false;
  isLoggedIn = false;

  constructor(private purchaseService: PurchaseService, private router: Router) {}


  ngOnInit(): void {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.loadCart();
    this.loadTokens();
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

  loadCart(): void {
    this.isLoading = true;
    this.purchaseService.getCart().subscribe({
      next: (cart) => { this.cart = cart; this.isLoading = false; },
      error: () => { this.errorMessage = 'Failed to load cart.'; this.isLoading = false; }
    });
  }

  loadTokens(): void {
    this.purchaseService.getMyTokens().subscribe({
      next: (tokens) => { this.tokens = tokens; },
      error: () => {}
    });
  }

  removeItem(tourId: number): void {
    this.purchaseService.removeFromCart(tourId).subscribe({
      next: (cart) => { this.cart = cart; },
      error: () => { this.errorMessage = 'Failed to remove item.'; }
    });
  }

checkout(): void {
  if (!this.cart?.items?.length) return;
  this.isLoading = true;
  this.purchaseService.checkout().subscribe({
    next: (res) => {
      this.successMessage = res.message || 'Checkout successful!';
      this.isLoading = false;
      this.cart = { ...this.cart, items: [], totalPrice: 0 };
      this.loadTokens();
      setTimeout(() => this.successMessage = '', 4000);
    },
    error: () => { this.errorMessage = 'Checkout failed.'; this.isLoading = false; }
  });
}
}