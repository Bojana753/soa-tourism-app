import { Component, OnInit, HostListener, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit {

  isScrolled = false;
  activeDestination = 'Japan';
  isLoggedIn = false;
  activeImage: string = '';
  activeIndex = 0;

  destinations = [
    { name: 'Japan', tagline: 'Technology, vibrant nightlife & traditions', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=80' },
    { name: 'Switzerland', tagline: 'Pristine alpine lakes and dramatic peaks', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80' },
    { name: 'Paris', tagline: 'Romance, art, and world-class cuisine', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80' },
    { name: 'New York', tagline: 'The city that never sleeps', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80' },
  ];

  packages = [
    { slug: 'morocco', title: 'Morocco Desert Journey', duration: '8 Days / 7 Nights', price: '$1,600', image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=600&q=80' },
    { slug: 'italy', title: 'Italy Classic', duration: '7 Days / 6 Nights', price: '$1,400', image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600&q=80' },
    { slug: 'africa', title: 'Africa Experience', duration: '8 Days / 7 Nights', price: '$2,200', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80' },
    { slug: 'japan', title: 'Japan Spring', duration: '7 Days / 6 Nights', price: '$1,200', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80' },
  ];

  whyUs = [
    { icon: '✦', title: 'Authentic Experiences', desc: 'Trips tailored to your style and your budget.', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80' },
    { icon: '◈', title: 'Culinary Adventures', desc: 'Savor local cuisines with guided food tours.', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80' },
    { icon: '◉', title: 'Trusted Partnerships', desc: 'Handpicked hotels, guides, and local experiences.', image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80' },
    { icon: '◎', title: 'Cultural Immersion', desc: 'Engage with local traditions and communities.', image: 'https://images.unsplash.com/photo-1533050487297-09b450131914?w=800&q=80' },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.activeImage = this.whyUs[0].image;
  }

  setActive(i: number) {
    this.activeIndex = i;
    this.activeImage = this.whyUs[i].image;
  }

  signOut(): void {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

  @HostListener('window:scroll', [])
  onScroll() {
    this.isScrolled = window.scrollY > 60;
  }
}