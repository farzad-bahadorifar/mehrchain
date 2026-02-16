import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CommitmentService } from '../../core/services/commitment.service';
import { MeroService } from '../../core/services/mero.service';
import { CommitmentCardComponent } from '../../shared/components/commitment-card/commitment-card';
import { NewCommitmentModal } from '../../shared/components/new-commitment-modal/new-commitment-modal';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CommitmentCardComponent, LucideAngularModule, NewCommitmentModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  commitmentService = inject(CommitmentService);
  meroService = inject(MeroService);
  router = inject(Router);
  isModalOpen = signal(false);

  constructor() {
    effect(() => {
      console.log('Dashboard Commitments:', this.commitmentService.commitments());
    });
  }

  openNewCommitment() {
    this.isModalOpen.set(true);
  }

  handleNewCommitment(data: any) {
    this.commitmentService.addCommitment(data);
    this.isModalOpen.set(false);
    this.meroService.setState('celebrating');
    setTimeout(() => this.meroService.setState('idle'), 3000);
  }

  handleComplete(id: string) {
    this.commitmentService.completeCommitment(id);
    this.meroService.setState('happy');
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => this.meroService.setState('idle'), 2000);
  }
}
