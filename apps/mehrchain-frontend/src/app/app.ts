import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { filter } from 'rxjs';
import { ChainService } from './core/services/chain.service';
import { VersionService } from './core/services/version.service';
import { CommitmentService } from './core/services/commitment.service';
import { ColdStartBannerComponent } from './shared/components/cold-start-banner/cold-start-banner';
import { MobileInteractionService } from './core/services/mobile-interaction.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    ColdStartBannerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly mobileInteraction = inject(MobileInteractionService);
  private router = inject(Router);
  public chainService = inject(ChainService);
  public versionService = inject(VersionService);
  public commitmentService = inject(CommitmentService);
  showNavbar = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showNavbar.set(event.urlAfterRedirects.split(/[?#]/, 1)[0] !== '/');
      });
  }
}
