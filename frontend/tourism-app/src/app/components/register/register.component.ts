import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']  
})
export class RegisterComponent {
  username = '';
  password = '';
  email = '';
  role = 'tourist';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

 register() {
  if (!this.username || !this.email || !this.password) {
    this.error = 'Please fill in all fields.';
    return;
  }

  this.error = '';
  this.auth.register({ username: this.username, password: this.password, email: this.email, role: this.role }).subscribe({
    next: () => this.router.navigate(['/login']),
   error: (err) => {
  if (err.status === 400 || err.status === 409) {
    this.error = 'An account with this username or email already exists.';
  } else {
    this.error = 'Something went wrong. Please try again later.';
  }
}
  });
}
}