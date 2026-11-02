# T54 — Whole-belly light correction

Date: 2026-11-02, Asia/Tehran. Local implementation and checks only.
Baseline repository: `4e08e0d`; interaction introduced by `da81981`.
Local repair commit: `432db7c`.

## Request and task disposition

The owner requested correction of the shipped interaction: start only on the
Welcome hero or Profile overview belly, move its entire light over the viewport,
empty its glow, visibly follow with the eyes, and restore on release. The four
owner images are input observations, not proof of a particular serving revision.
No real account images were copied into the repository.

T31 defined an unexecuted 2D study, explicitly excluding production Three.js.
It is superseded and Dropped, not retroactively approved or completed. D-012 and
T54 record this direct implementation request. The independent startup-style
failure is T55, with physical installed-PWA acceptance in T56.

## Confirmed code causes and repair

- The shared renderer registered drag behavior on every mascot. The component
  now defaults `interactive` to false; only the Welcome hero and Profile overview
  opt in. Home, Chain, small onboarding/auth mascots and Colors previews stay passive.
- The small orb was rendered inside the square mascot canvas and its local target
  was clamped. A body-level fixed light layer now follows viewport coordinates
  without canvas/card/shell clipping. Its luminous core matches the belly's scale;
  it does not intercept page controls. The original grasp offset is preserved.
- The old belly retained 45% emission, its cream surface and both halos. Extraction
  now removes all belly emission, blends the surface to dark teal and fades the
  shader and CSS halos. Wings retain their own glow and saved color selection.
- Rotation of glossy black eyes was difficult to see. The actual eye geometry
  now also shifts slightly toward the unbounded light position. Each shared scene
  draw receives its own light state, explicitly resetting passive instances.
- One primary pointer owns a gesture. Capture plus document listeners retain
  movement beyond the canvas; other pointer IDs cannot move or end it. Release,
  cancellation and lost capture settle back using elapsed-time damping. Hidden
  views/tabs, window blur, opt-out, destruction and context loss clear the layer.
- Only the belly handle disables native touch scrolling; passive canvases allow
  normal page gestures. The handle prevents onboarding's separate touch-swipe
  recognizer from interpreting a light drag as navigation. Reduced motion keeps
  direct manipulation, suppresses idle motion, and restores immediately on release.
- Interactive frames never enter the reusable static snapshot cache. Body idle,
  blink, flipper motion, lazy loading and device policies remain in their own paths.

Starting files are the shared `mero.ts`, template, CSS, renderer, model and scene,
plus the two existing route templates. No dependency, API or schema change.
This restores explicitly requested behavior, so the OpenSpec bug-fix exception
applies; it does not introduce a new design proposal or claim T31 approval.

## Executed checks

```sh
npx nx test mehrchain-frontend --watch=false --include=**/mero*.spec.ts --include=**/onboarding.spec.ts --include=**/profile.spec.ts
npm run build:frontend
```

Result: 8 test files / 69 tests passed; production build passed. Regressions cover
belly-only/opt-in starts, a pointer moved to (850, 700) outside a 200px canvas,
whole-sized viewport light, both halo restoration and full material extraction,
distant eye movement in both directions, independent passive rendering, return,
wrong pointer IDs, cancellation, lost capture, all cleanup paths, reduced motion,
existing reward/color rules and both affected route components.

Browser inspection used the actual renderer/service/model in a local synthetic
rendering fixture at a 390 x 844 viewport. Holding the light near (345, 714)
showed the empty belly and light far below/right of the mascot; the separate
small passive mascot stayed luminous. Release restored the belly. This fixture
is rendering evidence, not a Profile design approval or real-account acceptance.

## Limits and device follow-through

No deployment, physical Android touch session or APK test was performed. Local
pointer regressions include cancellation and ownership but cannot certify native
touch dispatch on every phone. After pushing/deploying, check Welcome and Profile
on the installed PWA: drag from the belly toward all four corners, release and
interrupt the gesture; confirm Home/Chain/Colors stay passive and outside scrolling
works. T30 retains its existing Profile device scope. T56 owns cold-start styling;
T52's independent service-worker update/Reload investigation remains open.
