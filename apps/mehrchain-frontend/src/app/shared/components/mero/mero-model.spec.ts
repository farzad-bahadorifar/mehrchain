import * as THREE from 'three';
import { createMascot } from './mero-model';

describe('Mero procedural geometry', () => {
  it('recolors the actual luminous materials and restores the shipped default palette', () => {
    const mascot = createMascot({ detail: 'low' });
    const luminousMaterials = new Set<THREE.MeshStandardMaterial>();
    mascot.model.traverse((part) => {
      if (!(part instanceof THREE.Mesh)) return;
      const material = part.material;
      // emissiveIntensity defaults to 1 even on non-emitting skin/eye/mouth materials.
      if (material instanceof THREE.MeshStandardMaterial && material.emissive.getHex() !== 0) {
        luminousMaterials.add(material);
      }
    });
    expect(luminousMaterials.size).toBe(2);
    const colors = () => {
      return new Set([...luminousMaterials].map((material) => material.emissive.getHexString()));
    };
    const defaults = colors();
    mascot.setGlowColor('#06b6d4');
    expect(colors()).toEqual(new Set(['06b6d4']));
    mascot.setGlowColor('#000000');
    expect(colors()).toEqual(new Set(['000000']));
    mascot.setGlowColor(null);
    expect(colors()).toEqual(defaults);
    mascot.dispose();
  });
  it('keeps low-detail geometry finite and substantially smaller', () => {
    const count = (detail: 'low' | 'standard') => {
      const mascot = createMascot({ detail });
      let triangles = 0;
      mascot.model.traverse((part) => {
        if (!(part instanceof THREE.Mesh)) return;
        triangles += part.geometry.index.count / 3;
        for (const value of part.geometry.attributes['position'].array) {
          expect(Number.isFinite(value)).toBe(true);
        }
      });
      mascot.dispose();
      return triangles;
    };
    const standard = count('standard');
    expect(standard).toBeLessThan(35000);
    expect(count('low')).toBeLessThan(standard / 2);
  });

  it('shows one expression and waves subtly only when happy and motion is allowed', () => {
    const mascot = createMascot();
    const left = mascot.model.getObjectByName('Left flipper')!;
    for (const mood of ['reference', 'happy', 'sad'] as const) {
      mascot.setMood(mood);
      mascot.update(Math.PI / 4.8, false, true);
      expect(
        mascot.model.children.filter((part) => part.name.endsWith('mouth') && part.visible),
      ).toHaveLength(1);
      expect(Math.abs(left.rotation.z)).toBeLessThanOrEqual(0.024);
      expect(left.rotation.z !== 0).toBe(mood === 'happy');
    }
    mascot.setMood('happy');
    mascot.update(1, false, false);
    expect(left.rotation.z).toBe(0);
    mascot.dispose();
  });
  it('empties the full belly, visibly follows distant light and resets every shared draw', () => {
    const mascot = createMascot({ mood: 'happy', detail: 'low' });
    const belly = mascot.model.getObjectByName('Curved luminous belly') as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.MeshStandardMaterial
    >;
    const leftEye = mascot.model.getObjectByName('Left eye')!;
    const wing = mascot.model.getObjectByName('Left flipper')!;
    const initialEye = leftEye.position.clone();
    const initialColor = belly.material.color.clone();
    mascot.setLightState({ x: 10, y: 8 }, 1);
    mascot.update(1, true, true);
    expect(belly.material.emissiveIntensity).toBe(0);
    expect(belly.material.color.equals(initialColor)).toBe(false);
    expect(leftEye.position.x - initialEye.x).toBeGreaterThan(0.04);
    expect(leftEye.position.y - initialEye.y).toBeGreaterThan(0.03);
    expect(mascot.model.position.y).not.toBe(0);
    expect(wing.rotation.z).not.toBe(0);
    mascot.setLightState({ x: -10, y: -8 }, 1);
    mascot.update(1, true, true);
    expect(leftEye.position.x).toBeLessThan(initialEye.x);
    expect(leftEye.position.y).toBeLessThan(initialEye.y);
    mascot.setLightState(null);
    mascot.update(1, true, true);
    expect(belly.material.emissiveIntensity).toBe(1);
    expect(belly.material.color.equals(initialColor)).toBe(true);
    expect(leftEye.position.equals(initialEye)).toBe(true);
    mascot.dispose();
  });
});
