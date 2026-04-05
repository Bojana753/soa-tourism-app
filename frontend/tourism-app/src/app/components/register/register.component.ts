import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  username = '';
  password = '';
  email = '';
  role = 'tourist';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  register() {
    this.auth.register({ username: this.username, password: this.password, email: this.email, role: this.role }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.error = 'Registration error'
    });
  }
}