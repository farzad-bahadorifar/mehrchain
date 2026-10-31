import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createMascot, MascotDetail, MascotMood } from './mero-model';

/** One offscreen WebGL context and one model for all Mero canvases on the page. */
export function createMeroScene(detail: MascotDetail, onContextLost: () => void) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    // Geometry detail can drop on small devices without jagged silhouette edges.
    antialias: true,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  let environment: THREE.WebGLRenderTarget | undefined;
  if (detail !== 'low') {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 64 });
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.32;
    room.dispose();
    pmrem.dispose();
  }
  scene.add(new THREE.HemisphereLight('#eafff7', '#48675e', 0.8));
  for (const [color, intensity, x, y, z] of [
    // A broad frontal key keeps the face teal instead of almost black.
    ['#f3fff9', 2.4, -3, 5, 5],
    ['#d5f5ef', 0.8, 3, 1, 4],
    ['#bceae7', 1.2, 3, 1, -2],
    ['#eaffdc', 1.2, -2, 0, -3],
    ['#ffe4b0', 0.25, 0, -2, 3],
  ] as const) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(x, y, z);
    scene.add(light);
  }
  // Frame the character itself, without the source icon's large empty margins.
  const camera = new THREE.OrthographicCamera(-1.4, 1.4, 1.4, -1.4, 0.1, 20);
  camera.position.set(0, 0, 7.6);
  const mascot = createMascot({ detail });
  scene.add(mascot.model);
  const lost = (event: Event) => {
    event.preventDefault();
    onContextLost();
  };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  let pixels = 0;

  return {
    mascot,
    camera,
    draw(
      target: CanvasRenderingContext2D,
      size: number,
      mood: MascotMood,
      glow: number,
      seconds: number,
      animated: boolean,
      glowColor: string | null = null,
    ) {
      if (pixels !== size) {
        renderer.setSize(size, size, false);
        pixels = size;
      }
      mascot.setMood(mood);
      mascot.setGlow(glow);
      mascot.setGlowColor(glowColor);
      mascot.update(seconds, animated, animated);
      renderer.render(scene, camera);
      if (target.canvas.width !== size || target.canvas.height !== size) {
        target.canvas.width = size;
        target.canvas.height = size;
      }
      target.clearRect(0, 0, size, size);
      // Copy immediately, before the browser clears the WebGL drawing buffer.
      target.drawImage(renderer.domElement, 0, 0);
    },
    dispose() {
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      mascot.dispose();
      environment?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
