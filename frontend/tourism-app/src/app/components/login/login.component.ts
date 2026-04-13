import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']  
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.auth.saveToken(res.token);
        const role = this.auth.getRole();
        if (role === 'admin') this.router.navigate(['/admin']);
        else this.router.navigate(['/profile']);
      },
      error: () => this.error = 'Wrong username or password'
    });
  }
}