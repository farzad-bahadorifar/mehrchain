# Historical roadmap — English reference for the pre-V2-implementation registry

Captured 2026-10-29, Asia/Tehran, before the owner's later V2 implementation
approval and atomic-task migration. **This is history, not the current queue.**
Start with [the active roadmap](development_roadmap.md),
[decision memory](roadmap/context.md) and [legacy disposition](roadmap/legacy.md).

This English reference summarizes the previous registry. Its exact original text
is preserved as `docs/development_roadmap_history_v2_2026-10-29.md` in the
[source archive and manifest](archives/README.md). The full earlier English
[implementation/release history](development_roadmap_history_2026-10-29.md) retains
task/issue mappings, commits, detailed product rules and operational evidence.

## State at capture

- Profile A was the direction for continued review, not yet full V2 implementation approval.
- The owner had rejected V1's muted palettes and unfamiliar components. V2 visual
  details were still recorded as awaiting review at that moment.
- Immediate design work was T20/T22 with T21 account UI and linked T23/T24 examples.
- Live username diagnosis was deferred during the owner's structure-first review.
- T25 was a P2 optional experiment, not a release blocker. T12–T19 operational/device
  acceptance remained independent of a successful HTML preview.
- No new live GitHub/Render/database/device verification or GitHub synchronization
  was performed by that documentation cleanup.

## Design stages used by that superseded registry

D0 registered → D1 analysis → D2 initial wireframe → D3 review/revision → D4 approved
version/scope. Implementation and acceptance were separate. The later atomic
workflow superseded these stage labels; it did not rewrite their earlier decisions.

| Task | Stage at capture | Explicit work remaining at that point |
| --- | --- | --- |
| T20 / #79 | D3 | Review V2 palette, audit/map tokens and select direction |
| T21 / #80 | UX D2; live diagnosis deferred | Complete account states; diagnose actual route/build failure separately |
| T22 / #81 | D3, A preferred | Finish A in the existing system and record final visual/scroll/device decision |
| T23 / #82 | D2 | Complete linked badge route/data/states without inventing earning rules |
| T24 / #83 | D2 | Complete milestone/slot/save states and choose a collection design |
| T25 / #84 | D0, P2 | First bounded 2D belly experiment; later 3D only after separate review |

V2 specimens mapped palette/components to T20, account-edit mock to T21 UI,
Profile structure to T22, badge destination to T23 and color studio to T24.
Home/Chain/Journey/Welcome/habit-form views were context specimens, not new business
logic. Displaying the real Mero was not a T25 interaction experiment.

## Existing implementation and release evidence

T00–T04/T10/T11 retained their recorded implementation/repair status. T05/T06 code
and historical T12 migrations existed with field acceptance still open. T07's old
long-help direction had been superseded by T16. T08/T15 still needed measured
network/PWA acceptance. T09's initial pilot was not final candidate acceptance.
T12 had repaired the dated backend/schema mismatch; T13 had backend CI evidence
but not a fresh accepted APK. T14 lacked domain/sender credentials. T16/T17 had
local implementation and T17 rehearsal, not full production delivery acceptance.
T18/T19 were merged but signing/upgrade/real-device checks remained open.

The old release sequence was: inspect actual matching revisions/schema, run
standard checks/APK path, enable real mail when prerequisites exist, measure access,
accept owner corrections/account access/updates/mobile behavior, then validate two
accounts and a fresh signed Android candidate before any public tag. Applied
migrations were not to be replayed merely because an older checklist mentioned them.

## Subsequent disposition

The owner later approved V2. Exact design results closed as T20/T22/T23/T24;
local implementation closed as T26/T27/T28. T29 owns live username diagnosis, T30
the bounded phone matrix, T31 the bounded Mero study, and T32 the atomic workflow.
Consult current cards for evidence rather than treating this historical summary
as authority to reopen broad tasks. Product invariants remain in [policies](roadmap/policies.md).
