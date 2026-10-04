import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  input,
  effect,
  NgZone,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeroComponent } from '../../../shared/components/mero/mero';
import { MeroMood } from '../../../core/services/mero-mood.service';
import { MeroState } from '../../../core/services/mero.service';
import * as THREE from 'three';

@Component({
  selector: 'app-profile-mero',
  standalone: true,
  imports: [CommonModule, MeroComponent],
  template: `
    <div class="relative inline-flex items-center justify-center">
      <app-mero
        size="hero"
        [showGlow]="true"
        [floating]="true"
        [interactive]="false"
        [state]="moodToState()"
      />
      <canvas
        #particleCanvas
        class="absolute inset-0 w-full h-full pointer-events-none z-20"
      ></canvas>
      @if (mood() === 'sad') {
        <div class="absolute inset-0 bg-background/20 rounded-full z-15 pointer-events-none"></div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }
  `],
})
export class ProfileMeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('particleCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ngZone = inject(NgZone);

  mood = input<MeroMood>('sad');

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private particles!: THREE.Points;
  private animationId = 0;
  private clock = new THREE.Clock();

  moodToState(): MeroState {
    switch (this.mood()) {
      case 'kind': return 'celebrating';
      case 'happy': return 'happy';
      case 'sad': return 'sleepy';
      default: return 'idle';
    }
  }

  constructor() {
    effect(() => {
      const currentMood = this.mood();
      if (this.particles) {
        this.updateParticles(currentMood);
      }
    });
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initThreeJS();
      this.animate();
    });
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer?.dispose();
  }

  private initThreeJS(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth || 256;
    const height = canvas.clientHeight || 256;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    this.camera.position.z = 5;

    this.createParticles(this.mood());
  }

  private createParticles(mood: MeroMood): void {
    const count = mood === 'kind' ? 40 : mood === 'happy' ? 20 : 0;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

      if (mood === 'kind') {
        // Teal + golden mix
        const isTeal = Math.random() > 0.5;
        colors[i * 3] = isTeal ? 0.08 : 0.96;
        colors[i * 3 + 1] = isTeal ? 0.72 : 0.82;
        colors[i * 3 + 2] = isTeal ? 0.75 : 0.27;
      } else {
        // Warm amber/yellow
        colors[i * 3] = 0.96 + Math.random() * 0.04;
        colors[i * 3 + 1] = 0.75 + Math.random() * 0.15;
        colors[i * 3 + 2] = 0.15 + Math.random() * 0.2;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: mood === 'kind' ? 0.12 : 0.08,
      vertexColors: true,
      transparent: true,
      opacity: mood === 'kind' ? 0.85 : 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private updateParticles(mood: MeroMood): void {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      (this.particles.material as THREE.PointsMaterial).dispose();
    }
    this.createParticles(mood);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (!this.particles || this.mood() === 'sad') {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const elapsed = this.clock.getElapsedTime();
    const positions = this.particles.geometry.attributes['position'].array as Float32Array;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      const speed = this.mood() === 'kind' ? 0.4 : 0.2;
      positions[i * 3 + 1] += Math.sin(elapsed * speed + i * 0.5) * 0.003;
      positions[i * 3] += Math.cos(elapsed * speed * 0.7 + i * 0.3) * 0.002;
    }

    this.particles.geometry.attributes['position'].needsUpdate = true;
    this.particles.rotation.y = elapsed * 0.05;

    this.renderer.render(this.scene, this.camera);
  }
}
