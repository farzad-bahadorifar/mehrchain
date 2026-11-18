## ADDED Requirements

### Requirement: Support acknowledges a real partner completion

Show Up SHALL expose support cards only for real completion events of an
available linked habit. The authenticated write SHALL verify the event and
preserve the existing recipient-day cap and anonymous incoming support.

#### Scenario: No linked completion to acknowledge
- **WHEN** no matching completion exists, including a reached goal without an eligible event
- **THEN** no support action appears and a requested write does not consume an allowance

#### Scenario: Acknowledge a previous-day completion
- **WHEN** a partner completed a linked habit the previous evening and the event is still eligible
- **THEN** the sender may acknowledge it using today's recipient-account allowance
- **AND** repeating that acknowledgement returns its original confirmation without another write

#### Scenario: An allowance is already used by a different event
- **WHEN** the sender spent today's allowance for this recipient habit on a different completion
- **THEN** the second completion is not confirmed or credited that day

### Requirement: Manage relationships in Connect

Connect SHALL contain invitations, active relationships and their private
disconnect controls. Show Up SHALL not expose relationship management actions.

#### Scenario: Manage a partner without a completion
- **WHEN** the partner has not completed a linked step
- **THEN** the relationship and its details remain available in Connect only

## MODIFIED Requirements

### Requirement: Idempotent recipient-day heart allowance

The system SHALL permit at most one heart per authenticated sender, recipient
habit and recipient account calendar date, independent of connection count,
and at most one acknowledgement per actual partner completion. The system MUST
validate ownership and reconcile both habit lifecycles before accepting or replaying
a send, and reject unavailable, disconnected, private or archived endpoints.

#### Scenario: Duplicate links and simultaneous retries
- **WHEN** the sender retries the same event through multiple eligible links
- **THEN** at most one allowance and one visible received heart are persisted
- **AND** successful retries report the original acknowledgement timestamp

#### Scenario: Recipient midnight differs from sender midnight
- **WHEN** the recipient's date advances while the sender's date stays the same
- **THEN** a fresh allowance is available for a different eligible event
- **AND** yesterday's received support no longer contributes to the count

#### Scenario: Archive, private edit or disconnect wins the race
- **WHEN** an endpoint becomes unavailable before a waiting send obtains the ordered habit locks
- **THEN** the send fails without restoring the relationship or persisting a heart

#### Scenario: Reconnect on the same recipient date
- **WHEN** a sent link is disconnected and a new invitation is accepted on the same recipient date
- **THEN** cleared support is not restored and the consumed allowance remains consumed

### Requirement: Quiet Chain cards

Show Up SHALL present actual completion cards with a single support action.
Connect SHALL retain invitations, partner and habit identification, and accessible
secondary details and disconnect controls. Archived habits remain in Journey.
Neither view SHALL add reminders, a separate congratulations action, named support
messages, or unfinished feature placeholders.

#### Scenario: Pending send and failure
- **WHEN** a support request is pending or confirmation fails
- **THEN** duplicate controls stay unavailable while pending
- **AND** an ambiguous failure requires refresh before retry and does not claim success

#### Scenario: Goal completion and keyboard options
- **WHEN** a partner reaches a finite goal
- **THEN** only a real eligible completion can receive a heart, not goal status alone
- **AND** relationship details and disconnect remain reachable with Escape returning focus
