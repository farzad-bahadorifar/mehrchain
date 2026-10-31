import * as THREE from 'three';

// Ported from the approved standalone mascot on codex/threejs-mascot.
// Every visible part is geometry; no raster assets are loaded.
export type MascotMood = 'reference' | 'happy' | 'sad';
export type MascotDetail = 'low' | 'standard';
const BODY_DEPTH = 0.66;
const BELLY = { x: 126 / 180, y: 100 / 180, centerY: -61 / 180 };

function bodyProfile() {
  // Smooth Bézier fit to 39 half-width measurements from the source PNG.
  // Mean silhouette error is about one source-image pixel. Shared tangents
  // avoid the lighting bands produced by tracing every noisy raster edge.
  const controls = [
    [
      [0, 347],
      [82.312, 347],
      [120.308, 389.464],
      [137.5, 420],
    ],
    [
      [137.5, 420],
      [171.005, 479.508],
      [180, 592],
      [180, 600],
    ],
    [
      [180, 600],
      [180, 717.929],
      [52.62, 734],
      [0, 734],
    ],
  ];
  const path = new THREE.CurvePath<THREE.Vector3>();
  controls.forEach((control) =>
    path.add(
      new THREE.CubicBezierCurve3(
        ...(control.map(
          ([radius, row]) => new THREE.Vector3(radius / 180, (541 - row) / 180, 0),
        ) as [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]),
      ),
    ),
  );
  const points = path.getSpacedPoints(480);
  return points.reverse().map(({ x, y }) => new THREE.Vector2(x, y));
}

const PROFILE = bodyProfile();

// Sample the same meridian as the lathed body so the face and belly hug it.
function frontSurface(x: number, y: number) {
  let radius = 0;
  for (let i = 1; i < PROFILE.length; i++) {
    const a = PROFILE[i - 1];
    const b = PROFILE[i];
    if (y >= a.y && y <= b.y) {
      radius = THREE.MathUtils.lerp(a.x, b.x, (y - a.y) / (b.y - a.y));
      break;
    }
  }
  return BODY_DEPTH * Math.sqrt(Math.max(0, radius * radius - x * x));
}

function bellyGeometry(detail: MascotDetail) {
  const positions = [];
  const indices = [];
  const rings = detail === 'low' ? 10 : 18;
  const segments = detail === 'low' ? 40 : 64;
  for (let ring = 0; ring <= rings; ring++) {
    const radius = ring / rings;
    for (let segment = 0; segment <= segments; segment++) {
      const angle = (segment / segments) * Math.PI * 2;
      // A softly squared oval, matching the broad, rounded belly in the icon.
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const x = BELLY.x * radius * Math.sign(c) * Math.pow(Math.abs(c), 0.92);
      const y = BELLY.centerY + BELLY.y * radius * Math.sign(s) * Math.pow(Math.abs(s), 0.92);
      positions.push(x, y, frontSurface(x, y) + 0.012 + 0.025 * (1 - radius * radius));
      if (ring < rings && segment < segments) {
        const a = ring * (segments + 1) + segment;
        const b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function wingGeometry(detail: MascotDetail) {
  const outline = new THREE.Shape();
  const px = (x: number) => (x - 523.5) / 180;
  const py = (y: number) => (541 - y) / 180;
  const bezier = (x1: number, y1: number, x2: number, y2: number, x: number, y: number) =>
    outline.bezierCurveTo(px(x1), py(y1), px(x2), py(y2), px(x), py(y));
  outline.moveTo(px(690), py(499));
  bezier(709, 504, 723, 525, 730, 534);
  bezier(746, 553, 753, 565, 755, 574);
  bezier(761, 590, 749, 597, 741, 594);
  bezier(729, 594, 713, 589, 704, 586);
  bezier(699, 583, 690, 579, 687, 568);
  bezier(681, 549, 682, 519, 690, 499);
  const contour = outline.getSpacedPoints(detail === 'low' ? 32 : 48).slice(0, -1);
  const segments = contour.length;
  const rows = detail === 'low' ? 10 : 16;
  const positions = [];
  const indices = [];
  // Wrap a closed, pillowy surface around a curved flipper outline.
  for (let row = 0; row <= rows; row++) {
    const latitude = (row / rows) * Math.PI;
    const radius = Math.sin(latitude);
    for (let j = 0; j < segments; j++) {
      const point = contour[j];
      positions.push(
        1.065 + (point.x - 1.065) * radius,
        -0.085 + (point.y + 0.085) * radius,
        Math.cos(latitude) * 0.075,
      );
      if (row < rows) {
        const a = row * segments + j;
        const b = row * segments + ((j + 1) % segments);
        indices.push(a, b, a + segments, b, b + segments, a + segments);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Reusable, texture-free mascot. Front is +Z; dimensions are about 2.6 × 2.2.
 * add(model) to a scene, call update(elapsedSeconds) for the optional idle pose,
 * and dispose() when removing it. Lighting belongs to the host scene.
 */
export function createMascot({
  glow = 1,
  mood = 'reference',
  detail = 'standard',
}: { glow?: number; mood?: MascotMood; detail?: MascotDetail } = {}) {
  const model = new THREE.Group();
  model.name = 'MehrChain mascot';
  const glowUniform = { value: THREE.MathUtils.clamp(glow, 0, 2) };
  const haloColorUniform = { value: new THREE.Vector3(0.16, 0.14, 0.025) };
  const skin = new THREE.MeshPhysicalMaterial({
    color: '#347f73',
    roughness: 0.9,
    metalness: 0,
    clearcoat: 0,
    envMapIntensity: 0.25,
  });
  // A warm falloff on the skin, around the luminous belly, without a flat sprite.
  skin.onBeforeCompile = (shader) => {
    shader.uniforms['mascotGlow'] = glowUniform;
    shader.uniforms['mascotHaloColor'] = haloColorUniform;
    shader.vertexShader = 'varying vec3 vMascotPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvMascotPosition = position;',
    );
    shader.fragmentShader =
      'varying vec3 vMascotPosition;\nuniform float mascotGlow;\nuniform vec3 mascotHaloColor;\n' +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `
      #include <emissivemap_fragment>
      vec2 bellyPoint = vec2(vMascotPosition.x / ${BELLY.x}, (vMascotPosition.y - ${BELLY.centerY}) / ${BELLY.y});
      float bellyDistance = length(bellyPoint);
      float halo = exp(-pow((bellyDistance - 1.0) / 0.20, 2.0));
      float front = smoothstep(0.05, 0.45, vMascotPosition.z);
      totalEmissiveRadiance += mascotHaloColor * halo * front * mascotGlow;
      float rim = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 1.1);
      totalEmissiveRadiance += vec3(0.22, 0.50, 0.45) * rim * 0.35;
      float crown = exp(-max(1.078 - vMascotPosition.y, 0.0) / 0.065);
      totalEmissiveRadiance += vec3(0.36, 0.39, 0.39) * crown * (0.25 + 0.35 * front);
    `,
    );
  };
  skin.customProgramCacheKey = () => 'mehrchain-belly-halo-v2';
  const cream = new THREE.MeshStandardMaterial({
    color: '#c9bc8e',
    emissive: '#f5e7a3',
    emissiveIntensity: glowUniform.value,
    roughness: 0.88,
    metalness: 0,
    toneMapped: false,
  });
  const wingMaterial = new THREE.MeshStandardMaterial({
    color: '#302916',
    emissive: '#f2e8ac',
    emissiveIntensity: glowUniform.value,
    roughness: 0.72,
    metalness: 0,
    toneMapped: false,
  });
  const black = new THREE.MeshPhysicalMaterial({
    color: '#080c0b',
    roughness: 0.17,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });
  const mouthMaterial = new THREE.MeshStandardMaterial({ color: '#101612', roughness: 0.58 });
  const bodyGeometry = new THREE.LatheGeometry(
    PROFILE.filter((_, i) => i % (detail === 'low' ? 6 : 3) === 0),
    detail === 'low' ? 40 : 64,
  );
  bodyGeometry.scale(1, 1, BODY_DEPTH);
  const body = new THREE.Mesh(bodyGeometry, skin);
  body.name = 'Teal rounded body';
  model.add(body);
  const belly = new THREE.Mesh(bellyGeometry(detail), cream);
  belly.name = 'Curved luminous belly';
  model.add(belly);

  const wings: THREE.Group[] = [];
  const wing = wingGeometry(detail);
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = side < 0 ? 'Left flipper' : 'Right flipper';
    pivot.position.set(side * 0.88, 0.12, -0.015);
    const mesh = new THREE.Mesh(wing, wingMaterial);
    mesh.scale.x = side;
    mesh.position.set(-side * 0.88, -0.12, 0);
    pivot.add(mesh);
    model.add(pivot);
    wings.push(pivot);
  }
  const eyes: THREE.Group[] = [];
  const eyeGeometry = new THREE.SphereGeometry(
    1,
    detail === 'low' ? 12 : 20,
    detail === 'low' ? 10 : 16,
  );
  const glintMaterial = new THREE.MeshBasicMaterial({ color: '#edf7e2' });
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.name = side < 0 ? 'Left eye' : 'Right eye';
    eye.position.set(side * 0.3694, 96 / 180, frontSurface(side * 0.3694, 96 / 180) + 0.018);
    eye.rotation.set(-0.15, side * 0.32, 0);
    const pupil = new THREE.Mesh(eyeGeometry, black);
    pupil.scale.set(0.07, 0.124, 0.042);
    eye.add(pupil);
    const glint = new THREE.Mesh(eyeGeometry, glintMaterial);
    glint.scale.set(0.007, 0.021, 0.004);
    glint.position.set(-0.023, 0.056, 0.036);
    glint.rotation.z = -0.3;
    eye.add(glint);
    model.add(eye);
    eyes.push(eye);
  }
  const mouths = new Map<MascotMood, THREE.Group>();
  for (const expression of ['reference', 'happy', 'sad'] as const) {
    const mouth = new THREE.Group();
    mouth.name = `${expression} mouth`;
    const points = [];
    const direction = expression === 'sad' ? -1 : 1;
    const width = expression === 'happy' ? 0.093 : 0.081;
    const curveDepth = expression === 'happy' ? 0.044 : 0.036;
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = THREE.MathUtils.lerp(-width, width, t);
      const y = 0.46 + direction * (0.018 - curveDepth * Math.sin(Math.PI * t));
      points.push(new THREE.Vector3(x, y, frontSurface(x, y) + 0.012));
    }
    mouth.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.009, 6, false),
        mouthMaterial,
      ),
    );
    for (const point of [points[0], points[points.length - 1]]) {
      const cap = new THREE.Mesh(eyeGeometry, mouthMaterial);
      cap.position.copy(point);
      cap.scale.setScalar(0.009);
      mouth.add(cap);
    }
    model.add(mouth);
    mouths.set(expression, mouth);
  }
  let currentMood: MascotMood = 'reference';
  let currentGlowColor: string | null = null;

  // --- Interactive Draggable Belly Light Orb ---
  const BELLY_ANCHOR = new THREE.Vector3(0, BELLY.centerY, frontSurface(0, BELLY.centerY) + 0.08);

  // Orb group: invisible by default, scales up when extracted
  const orbGroup = new THREE.Group();
  orbGroup.name = 'Belly light orb';
  orbGroup.position.copy(BELLY_ANCHOR);
  orbGroup.visible = false;
  orbGroup.scale.setScalar(0.001);

  // Core sphere
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: '#fffbeb',
    transparent: true,
    opacity: 0,
    depthTest: false,
  });
  const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), coreMaterial);
  coreMesh.renderOrder = 10;
  orbGroup.add(coreMesh);

  // Procedural glow texture for the halo sprite
  const glowCanvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(128, 128)
    : (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 128; return c; })();
  const glowCtx = glowCanvas.getContext('2d');
  let glowTexture: THREE.Texture;
  if (glowCtx && typeof glowCtx.createRadialGradient === 'function') {
    const grad = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 252, 220, 1.0)');
    grad.addColorStop(0.35, 'rgba(254, 240, 138, 0.65)');
    grad.addColorStop(0.68, 'rgba(245, 158, 11, 0.18)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    glowCtx.fillStyle = grad;
    glowCtx.fillRect(0, 0, 128, 128);
    glowTexture = new THREE.CanvasTexture(glowCanvas as HTMLCanvasElement);
  } else {
    // Fallback for headless test environments where 2D canvas context is not implemented
    glowTexture = new THREE.Texture();
  }
  const haloSpriteMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
  });
  const haloSprite = new THREE.Sprite(haloSpriteMaterial);
  haloSprite.scale.set(0.95, 0.95, 1);
  haloSprite.renderOrder = 11;
  orbGroup.add(haloSprite);
  model.add(orbGroup);

  // Interaction state
  let isDraggingLight = false;
  const orbTarget = BELLY_ANCHOR.clone();
  const orbCurrent = BELLY_ANCHOR.clone();
  let extractAmount = 0;

  // Store eye base rotation for smooth tracking
  const eyeBaseRotX = -0.15;

  const mascot = {
    model,
    setLightDragTarget(localPoint: { x: number; y: number; z: number } | null) {
      if (localPoint) {
        isDraggingLight = true;
        const clampedX = THREE.MathUtils.clamp(localPoint.x, -1.15, 1.15);
        const clampedY = THREE.MathUtils.clamp(localPoint.y, -1.05, 1.05);
        const clampedZ = Math.max(localPoint.z, 0.52);
        orbTarget.set(clampedX, clampedY, clampedZ);
      } else {
        isDraggingLight = false;
        orbTarget.copy(BELLY_ANCHOR);
      }
    },
    getExtractAmount(): number {
      return extractAmount;
    },
    setGlowColor(value: string | null) {
      const color = value && /^#[0-9a-f]{6}$/i.test(value) ? value : null;
      if (color === currentGlowColor) return;
      currentGlowColor = color;
      cream.emissive.set(color ?? '#f5e7a3');
      wingMaterial.emissive.set(color ?? '#f2e8ac');
      if (color) {
        const linear = new THREE.Color(color);
        haloColorUniform.value.set(linear.r * 0.16, linear.g * 0.16, linear.b * 0.16);
        // Tint orb to match custom glow color
        coreMaterial.color.set(color);
        haloSpriteMaterial.color.set(color);
      } else {
        haloColorUniform.value.set(0.16, 0.14, 0.025);
        coreMaterial.color.set('#fffbeb');
        haloSpriteMaterial.color.set('#ffffff');
      }
    },
    setGlow(value: number) {
      glowUniform.value = THREE.MathUtils.clamp(value, 0, 2);
      // Wings always stay at full glow; belly is adjusted during update
      wingMaterial.emissiveIntensity = glowUniform.value;
      cream.emissiveIntensity = glowUniform.value;
    },
    setMood(value: MascotMood) {
      if (!mouths.has(value)) throw new RangeError('Mood must be reference, happy or sad');
      currentMood = value;
      mouths.forEach((mouth, name) => {
        mouth.visible = name === value;
      });
      eyes.forEach((eye, i) => {
        eye.rotation.z = value === 'sad' ? (i ? -1 : 1) * 0.12 : 0;
      });
    },
    update(seconds: number, animated = true, emotionMotion = true) {
      model.position.y = animated ? Math.sin(seconds * 1.8) * 0.035 : 0;
      model.rotation.z = animated ? Math.sin(seconds * 0.9) * 0.016 : 0;
      // Happy flippers move only ±1.4 degrees, independently of the idle toggle.
      const happyWave = currentMood === 'happy' && emotionMotion;
      wings.forEach((pivot, i) => {
        pivot.rotation.z = happyWave ? Math.sin(seconds * 2.4) * 0.024 * (i ? 1 : -1) : 0;
      });
      const blinkPhase = seconds % 5.8;
      const blink =
        (animated || happyWave) && blinkPhase > 5.5
          ? Math.max(0.08, Math.abs((blinkPhase - 5.65) / 0.15))
          : 1;
      eyes.forEach((eye) => {
        eye.scale.y = blink;
      });

      // --- Orb smooth damping ---
      const lerpFactor = isDraggingLight ? 0.10 : 0.07;
      orbCurrent.lerp(isDraggingLight ? orbTarget : BELLY_ANCHOR, lerpFactor);

      const dist = orbCurrent.distanceTo(BELLY_ANCHOR);
      const targetExtract = isDraggingLight
        ? Math.min(1, dist / 0.35)
        : dist > 0.04
          ? Math.min(1, dist / 0.35)
          : 0;
      extractAmount += (targetExtract - extractAmount) * 0.12;

      // Update orb visuals
      orbGroup.position.copy(orbCurrent);
      const pulse = 1 + Math.sin(seconds * 3.0) * 0.05;
      const scale = Math.max(0.001, extractAmount * pulse);
      orbGroup.scale.setScalar(scale);
      orbGroup.visible = extractAmount > 0.01;
      coreMaterial.opacity = extractAmount * 0.95;
      haloSpriteMaterial.opacity = extractAmount * 0.90;

      // Dim only the belly glow as the orb leaves (wings stay at full)
      const bellyFactor = 1 - extractAmount * 0.55;
      cream.emissiveIntensity = glowUniform.value * bellyFactor;

      // --- Gentle eye tracking ---
      eyes.forEach((eye, i) => {
        const side = i === 0 ? -1 : 1;
        const baseRotY = side * 0.32;
        if (extractAmount > 0.02) {
          const lookY = THREE.MathUtils.clamp(
            (orbCurrent.x - eye.position.x) * 0.28,
            -0.22,
            0.22,
          ) * extractAmount;
          const lookX = THREE.MathUtils.clamp(
            -(orbCurrent.y - eye.position.y) * 0.25,
            -0.18,
            0.18,
          ) * extractAmount;
          eye.rotation.x = eyeBaseRotX + lookX;
          eye.rotation.y = baseRotY + lookY;
        } else {
          // Smoothly return to base rotation
          eye.rotation.x += (eyeBaseRotX - eye.rotation.x) * 0.08;
          eye.rotation.y += (baseRotY - eye.rotation.y) * 0.08;
        }
      });
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          const list = Array.isArray(object.material) ? object.material : [object.material];
          list.forEach((material: THREE.Material) => materials.add(material));
        }
      });
      // Also dispose orb-specific resources
      glowTexture.dispose();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      model.removeFromParent();
    },
  };
  mascot.setMood(mood);
  return mascot;
}
