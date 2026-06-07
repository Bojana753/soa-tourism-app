import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { ExecutionService, ProximityResponse, TourExecution } from '../../services/execution.service';
import { Position, PositionService } from '../../services/position.service';

@Component({
  selector: 'app-tour-execution',
  templateUrl: './tour-execution.component.html',
  styleUrls: ['./tour-execution.component.css']
})
export class TourExecutionComponent implements OnInit, OnDestroy {
  execution: TourExecution | null = null;
  currentPosition: Position | null = null;
  lastProximity: ProximityResponse | null = null;
  message = '';
  errorMessage = '';
  isChecking = false;

  private executionId!: number;
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private executionService: ExecutionService,
    private positionService: PositionService
  ) {}

  ngOnInit(): void {
    this.executionId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadExecution();

    this.subscriptions.add(
      this.positionService.position$.subscribe(position => {
        this.currentPosition = position;
      })
    );

    this.subscriptions.add(
      interval(10000).subscribe(() => this.checkProximity())
    );

    setTimeout(() => this.checkProximity(), 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  checkProximity(): void {
    if (!this.currentPosition || !this.execution || this.execution.status === 'COMPLETED' || this.isChecking) {
      return;
    }

    this.isChecking = true;
    this.executionService.checkProximity(
      this.executionId,
      this.currentPosition.lat,
      this.currentPosition.lng
    ).subscribe({
      next: response => {
        this.lastProximity = response;
        this.execution!.completedKeyPoints = response.completedKeyPoints;
        this.execution!.totalKeyPoints = response.totalKeyPoints;
        if (response.tourCompleted) {
          this.execution!.status = 'COMPLETED';
          this.message = 'Tour completed successfully.';
        } else if (response.keyPointCompleted) {
          this.message = `Reached key point: ${response.keyPointName}`;
        } else {
          this.message = `Next key point is ${response.distanceMeters.toFixed(0)} meters away.`;
        }
        this.errorMessage = '';
        this.isChecking = false;
      },
      error: () => {
        this.errorMessage = 'Could not check proximity through the gateway.';
        this.isChecking = false;
      }
    });
  }

  private loadExecution(): void {
    this.executionService.getExecution(this.executionId).subscribe({
      next: execution => {
        this.execution = execution;
        this.checkProximity();
      },
      error: () => {
        this.errorMessage = 'Could not load the tour execution session.';
      }
    });
  }
}
