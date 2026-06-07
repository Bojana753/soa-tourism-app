import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isScrolled = false;
  isLoggedIn = false;
  hasHero = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.hasHero = this.isHeroRoute(this.router.url);

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isLoggedIn = !!localStorage.getItem('token'); // ← osvežava pri svakoj navigaciji
        this.hasHero = this.isHeroRoute(event.urlAfterRedirects);
        this.isScrolled = false;
      }
    });
  }

  private isHeroRoute(url: string): boolean {
    return url === '/' || url === '' || url.startsWith('/tours');
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
}