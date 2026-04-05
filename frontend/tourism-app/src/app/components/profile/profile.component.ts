import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  user: any = {};
  editing = false;
  message = '';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getProfile().subscribe(data => this.user = data);
  }

  save() {
  this.userService.updateProfile({
    firstName: this.user.firstName,
    lastName: this.user.lastName,
    bio: this.user.bio,
    motto: this.user.motto,
    imageUrl: this.user.imageUrl
  }).subscribe({
    next: () => {
      this.editing = false;
      this.message = 'Profile updated!';
      setTimeout(() => this.message = '', 3000);
    },
    error: () => {
      this.message = 'Error updating profile';
      setTimeout(() => this.message = '', 3000);
    }
  });
}
}