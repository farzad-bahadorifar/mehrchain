import * as THREE from 'three';
import { createMeroScene } from './mero-scene';

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  const { vi: mocks } = await import('vitest');
  return Object.assign({}, actual, {
    WebGLRenderer: mocks.fn(
      class {
        domElement = document.createElement('canvas');
        setClearColor = mocks.fn();
        setSize = mocks.fn();
        render = mocks.fn();
        dispose = mocks.fn();
        forceContextLoss = mocks.fn();
      },
    ),
  });
});

describe('Mero scene presentation', () => {
  it('animates the actual rendered body and returns to the reference pose when motion stops', () => {
    const scene = createMeroScene('low', vi.fn());
    const canvas = document.createElement('canvas');
    const target = {
      canvas,
      clearRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    const renderer = vi.mocked(THREE.WebGLRenderer).mock.results.at(-1)!.value;
    expect(vi.mocked(THREE.WebGLRenderer).mock.calls.at(-1)![0]?.antialias).toBe(true);

    scene.draw(target, 256, 'happy', 1, 1, true);
    const renderedScene = renderer.render.mock.calls.at(-1)[0] as THREE.Scene;
    const model = renderedScene.getObjectByName('MehrChain mascot')!;
    const wing = model.getObjectByName('Left flipper')!;
    expect(Math.abs(model.position.y)).toBeGreaterThan(0);
    expect(Math.abs(model.rotation.z)).toBeGreaterThan(0);
    expect(Math.abs(wing.rotation.z)).toBeGreaterThan(0);
    expect(target.drawImage).toHaveBeenCalledWith(renderer.domElement, 0, 0);

    scene.draw(target, 256, 'happy', 1, 1, false);
    expect(model.position.y).toBe(0);
    expect(model.rotation.z).toBe(0);
    expect(wing.rotation.z).toBe(0);
    scene.draw(target, 256, 'happy', 1, 1, true, null, { x: 8, y: 6, amount: 1 });
    const belly = model.getObjectByName('Curved luminous belly') as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.MeshStandardMaterial
    >;
    expect(belly.material.emissiveIntensity).toBe(0);
    scene.draw(target, 80, 'reference', 1, 1, false);
    expect(belly.material.emissiveIntensity).toBe(1);
    scene.dispose();
  });
});
