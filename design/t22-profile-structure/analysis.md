# Profile structural review — analysis history

Current state, 2026-10-29: V2 was approved and implemented locally. Historical
analysis below does not reopen that decision. The [active roadmap](../../../docs/development_roadmap.md)
owns current work. Designs T20/T22/T23/T24 and local code T26/T27/T28 are closed;
T29 alone owns actual deployed username diagnosis.

## Owner feedback and V2 revision

The owner preferred structure A, found the original palettes dull and requested
comparison in the existing product design system because too many components
differed. V2 therefore reused the actual Mero model/scene, Lucide geometry and
Poppins, with cards/controls/navigation/spacing reconstructed from existing sources.
The proposed teal/coral/violet/amber roles were compared against the existing
palette on Profile, Home, Chain, Journey, account, badges, color studio, appearance,
welcome, habit form and component specimens. These were local design examples,
not live product acceptance. V2 was subsequently approved; the current English
review presentation translates labels without changing that product design.

## Initial October 25 findings

The Profile template mixed identity/companion viewing, access editing, color
management and the complete badge list. Occasional forms appeared before Mero;
growing collections pushed ordinary settings down. This was a structural inference
from source, not measured user-task time or a live scroll study.

| Initial sequence | Work | Intended output |
| --- | --- | --- |
| 1 | T20 | Compare palette/component direction, then choose tokens |
| 2 | T21 UI and T22 | Account-edit flow and Profile architecture |
| 3 | T23/T24 | Badge and color destinations consistent with Profile |
| 4 | T25 | Separate P2 Mero interaction exploration |

The owner requested structure before logical/live service diagnosis. The prototype
did not repair username saving, certify release gates or imply that mock counts
were real account data.

## Alternatives reviewed

**A — direct entries:** identity → compact Mero summary → badge entry → color entry
→ account/security → appearance/app. Move forms and long lists into destinations.
This keeps primary paths visible without selecting a settings tab. V1 deliberately
showed duplicate studio access for discussion; V2 retained one collection entry.

**B — companion/settings sections:** identity → My companion / Settings section
selection. This reduces visible items but adds a selection before account/theme
access. The owner selected A; B is historical, not a current open decision.

The Home/Chain/Journey/Profile navigation remains. Badges and Colors belong under
Profile; username/password under Account & security. Sign-out/account deletion are
separate from normal edits; removing a username is not deleting an account.

## Initial visual study and verification limits

V1 compared the current teal family, a warm-green family and quiet lilac. Color
was deliberately evaluated on a common structure. Mero was an abstract structural
placeholder in that first draft, not proposed replacement artwork; V2 corrected
fidelity by using the real model.

V1 JavaScript syntax/HTTP rendering and Profile-to-account navigation were observed.
A collision with `window.top` was fixed by scoping the script. Full form automation,
actual phone/keyboard/deep-link/scroll evidence were not established in that first
review. Subsequent local-code results are in the [implementation report](../../../docs/roadmap/evidence/v2-implementation.md).

The exact original-language analysis and review artifacts remain in the
[source archive](../../../docs/archives/README.md). This English document preserves
the reasoning and distinguishes the initial review from later approval/execution.
