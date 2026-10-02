import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ColdStartService } from '../../../core/services/cold-start.service';
import { MeroComponent } from '../mero/mero';

@Component({
  selector: 'app-cold-start-banner',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MeroComponent],
  templateUrl: './cold-start-banner.html',
  styleUrls: ['./cold-start-banner.css'],
})
export class ColdStartBannerComponent {
  public coldStartService = inject(ColdStartService);

  dismiss(): void {
    this.coldStartService.finishRequest();
  }
}
