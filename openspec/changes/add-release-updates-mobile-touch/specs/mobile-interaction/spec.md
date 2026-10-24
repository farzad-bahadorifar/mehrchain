## ADDED Requirements

### Requirement: Stable mobile page scale

Mobile touch surfaces SHALL disable page pinch and double-tap scaling where the
browser honors touch policy, retain scrolling/selection and prevent small-form
focus zoom. Desktop browser zoom and OS accessibility controls SHALL remain usable.

#### Scenario: Mobile forms and gestures

- **WHEN** a user focuses a form, scrolls an overlay or uses an onboarding swipe
- **THEN** controls use at least 16 CSS px, scrolling remains available and pinch
  or cancelled gestures cannot navigate or submit
- **AND** viewport safe areas and keyboard resizing are preserved

#### Scenario: Responsive mobile layout and desktop PWA

- **WHEN** a mobile viewport changes size or the desktop PWA is maximized
- **THEN** content fits the available width inside a centered mobile-width shell
- **AND** onboarding adds no avoidable overflow from toolbars or duplicate viewport heights
- **AND** no Text size control or persisted app-specific font override is present
- **AND** long content and keyboard-constrained forms remain reachable by scrolling

#### Scenario: Browser override

- **WHEN** browser policy overrides scale restrictions
- **THEN** the exact tab/PWA/device outcome is documented as an acceptance limit
- **AND** successful automated checks do not claim physical-device acceptance
