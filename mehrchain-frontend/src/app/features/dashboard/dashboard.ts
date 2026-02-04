import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CommitmentService } from '../../core/services/commitment.service';
import { MeroService } from '../../core/services/mero.service';
import { CommitmentCardComponent } from '../../shared/components/commitment-card/commitment-card';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CommitmentCardComponent, LucideAngularModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  commitmentService = inject(CommitmentService);
  meroService = inject(MeroService);
  router = inject(Router);

  openNewCommitment() {
    this.router.navigate(['/']);
  }

  constructor() {
    effect(() => {
      console.log('Dashboard Commitments:', this.commitmentService.commitments());
    });
  }

  handleComplete(id: number) {
    this.commitmentService.completeCommitment(id);
    this.meroService.setState('happy');

    if (navigator.vibrate) navigator.vibrate(50);
  }
}