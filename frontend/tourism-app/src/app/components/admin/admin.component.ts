import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']  

})
export class AdminComponent implements OnInit {
  users: any[] = [];

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getAllUsers().subscribe(data => this.users = data);
  }

  block(id: number) {
    this.userService.blockUser(id).subscribe(() => {
      this.users = this.users.map(u => u.ID === id ? { ...u, isBlocked: true } : u);
    });
  }
}