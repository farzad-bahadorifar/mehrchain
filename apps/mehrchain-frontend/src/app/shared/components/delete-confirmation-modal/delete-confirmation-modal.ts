import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Commitment } from '@mehrchain/shared-data';
import { McButtonComponent } from '../../ui';

@Component({
  selector: 'app-delete-confirmation-modal',
  imports: [CommonModule, LucideAngularModule, McButtonComponent],
  templateUrl: './delete-confirmation-modal.html',
})
export class DeleteConfirmationModal {
  commitment = input.required<Commitment>();

  confirm = output<void>();
  cancel = output<void>();
}
