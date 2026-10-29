## ADDED Requirements

### Requirement: Compact Profile overview and direct destinations
The frontend SHALL display identity and the existing Mero on Profile, with direct
links to account/security, badges, colors and appearance. Expanded forms and the
full badge/color lists SHALL appear only on their dedicated authenticated routes.

#### Scenario: Open a destination and return
- **WHEN** a signed-in user opens any Profile entry, including its direct URL
- **THEN** the corresponding real service-backed page is displayed
- **AND** a visible Profile return link and the shared navigation remain available.

### Requirement: Color preview does not persist before save
The frontend SHALL preview the color draft on Mero without updating saved selection.
It SHALL retain failed input and report success only after service confirmation.

#### Scenario: Cancel or failed save
- **WHEN** a color draft is cancelled or its request fails
- **THEN** saved selection and earned capacity remain unchanged
- **AND** a failed draft remains editable for retry.

### Requirement: Explicit username removal and actionable errors
The frontend SHALL separate username removal from account deletion, request a
deliberate removal confirmation, offer edit cancellation and keep failed drafts.

#### Scenario: Serving revision lacks username route
- **WHEN** the username save endpoint responds with 404 or 405
- **THEN** the user sees a short unavailable/retry message without raw framework text
- **AND** the input is retained; no backend repair or success is implied.
