import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AdminComponent } from './components/admin/admin.component';
import { HomeComponent } from './components/home/home.component';
import { BlogComponent } from './components/blog/blog.component';
import { FeedComponent } from './components/feed/feed.component';
import { TourComponent } from './components/tours/tour.component';
import { KeypointComponent } from './components/keypoint/keypoint.component';
import { ReviewComponent } from './components/review/review.component';
import { PositionSimulatorComponent } from './components/position-simulator/position-simulator.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'feed', component: FeedComponent },
  { path: 'tours', component: TourComponent },
  { path: 'tours/:id/keypoints', component: KeypointComponent },
  { path: 'tours/:id/reviews', component: ReviewComponent },
  { path: 'position-simulator', component: PositionSimulatorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }