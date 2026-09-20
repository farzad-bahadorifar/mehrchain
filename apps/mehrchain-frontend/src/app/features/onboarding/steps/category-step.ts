import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export interface Category {
  id: string;
  label: string;
  icon: any;
  color: string;
  bg: string;
}

@Component({
  selector: 'app-category-step',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './category-step.html',
})
export class CategoryStepComponent {
  readonly categories = input.required<Category[]>();
  readonly categorySelected = output<string>();
}
