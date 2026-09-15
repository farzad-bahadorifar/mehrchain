import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex items-center justify-center bg-white p-2 rounded-xl border border-border/60 shadow-xs"
      [style.width.px]="size"
      [style.height.px]="size"
    >
      @if (qrDataUrl()) {
        <img
          [src]="qrDataUrl()"
          alt="QR Code"
          class="w-full h-full object-contain block rounded-md"
        />
      } @else {
        <div class="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
          ...
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrCodeComponent implements OnChanges {
  @Input({ required: true }) value!: string;
  @Input() size = 88;

  readonly qrDataUrl = signal<string>('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['size']) {
      this.generateQR();
    }
  }

  private async generateQR(): Promise<void> {
    if (!this.value) return;

    try {
      const dataUrl = await QRCode.toDataURL(this.value, {
        width: this.size * 2, // 2x for retina crispness
        margin: 1,
        color: {
          dark: '#0f766e', // Deep Teal Brand Color
          light: '#ffffff', // Clean white background for camera readability
        },
        errorCorrectionLevel: 'M',
      });
      this.qrDataUrl.set(dataUrl);
    } catch (err) {
      console.error('Error generating QR code data URL', err);
    }
  }
}
