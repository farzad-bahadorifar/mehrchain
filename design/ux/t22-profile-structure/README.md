# MehrChain design review — v0.2

Status: V2 approved by owner on October 29, 2026 (Asia/Tehran). English review
presentation: approved-v0.2.html / index.html. Exact original approval bytes/hashes
remain in the [source archive](../../../docs/archives/README.md). Translation of
review labels does not change the approved product design. Previous V1 reasoning
is summarized in v0.1.html; its original interactive file is archived.

Tracking clarified October 29: approved scoped designs T20/T22/T23/T24 are complete.
Implementation owners are T26 (palette), T27 (whole Profile navigation V2), T28
(username UI). T29 alone owns deployed-route diagnosis. Home/Chain/Journey specimens
provide palette comparison context, not independent logic redesigns. See the
[active task registry](../../../docs/development_roadmap.md) and
[mandatory same-system wireframe contract](../../../docs/ui_ux_discovery_plan.md).

Open index.html directly in a browser. Fonts, icons, JavaScript, the actual Mero model/scene and static image fallback are embedded. No runtime dependencies, remote assets, API calls, analytics or build requirements for viewing. For HTTP preview run `node preview.cjs` in this folder; stop with Ctrl+C. Regenerate source edits with `node build.cjs` using existing repository dependencies.

## Owner direction

Retain structure A and the approved V2 brighter teal plus role-based coral (support), violet (badges) and amber (rewards). The owner rejected V1's muted palettes and component differences. Light/dark/system and 320/390/544px maximum widths are available.

## Reuse and fidelity

- Bundled unchanged: production mero-model.ts and mero-scene.ts. Still happy pose with the existing camera, geometry, materials, lights and environment. One reused offscreen renderer, no animation or T25 interaction. No production performance acceptance claimed.
- Reused: installed Lucide icon geometry, existing public/assets/mero.png fallback, Poppins regular/semibold from upstream Google Fonts. OFL notice retained in source/Poppins-OFL.txt. Third-party licensing notices are listed in THIRD_PARTY.md.
- Reconstructed standalone CSS: 24px elevated cards, 16px entry cards, 12px buttons/inputs, 4px spacing scale, 44px targets, four-tab navigation and 34rem maximum shell. References: styles.css, app.css, shared/ui/card/card.ts, shared/ui/button/button.ts and route templates. Angular components themselves are not mounted; this is not a pixel-identical running production app.
- New proposals: Profile A grouping, separate badge/color flows, semantic accent roles and their arrangements.

## Screens and simulation

Profile A, Home, Chain, Journey, Account & security, Badges, Color studio, Appearance & app, Welcome, New habit and Design system (components/tokens).

All account/activity/state data are synthetic. Initial badge names/descriptions reference source; the optional 32-badge test labels future badges as placeholders. No new earning rules. Existing daily, color-unlock and support rules are preserved in specimens.

Clicks navigate locally. Saves/completion/support simulate delayed confirmation and failure. No actual account, habit, invitation or color is created or modified. Color draft and applied state are separate: Profile Mero changes only after simulated save. Cancel discards preview. All state resets on reload. Password/deletion/sign-out stop before real operations. Existing onboarding introduction remains product scope; the welcome specimen does not replace all onboarding cards.

## Verification and limits

Embedded JavaScript syntax, HTTP response and browser rendering checked. Actual Mero visible. Account save failure and retry re-enablement observed. Home/Chain and 320px dark Journey/Badges/Colors/component views inspected without horizontal viewport overflow. Proposed text-color contrast pairs are recorded in validation.md; this is not a full accessibility certification.

The preceding verification paragraph describes the original prototype only.
Approved designs T20/T22/T23/T24 and local implementation T26/T27/T28 now have
their own completed cards and [implementation evidence](../../../docs/roadmap/evidence/v2-implementation.md).
Actual phone acceptance (T30), live username diagnosis (T29), and the bounded
future Mero analysis (T31) remain separate precise tasks. No production deployment
is claimed. The old mixed discovery scopes are superseded by
[legacy disposition](../../../docs/roadmap/legacy.md), not left partially active.
