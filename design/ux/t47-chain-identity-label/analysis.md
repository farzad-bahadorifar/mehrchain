# T47 identity review v0.2

Prepared 2026-11-05, Asia/Tehran. Owner-approved rule with explicit display correction applied.

## Proposed contract

Use the same resolver for partner cards, invitation identity and private ended
receipts: remove every ASCII @ from each candidate for display, then use nonblank
username, otherwise nonblank display name, otherwise **Partner**. Trim the display
candidates and treat an @-only value as missing. The resolver does not rewrite
stored strings. This supersedes v0.1's rule that removed only an app-added prefix:
the owner explicitly requested no @ even inside the displayed name. The avatar
uses the first grapheme of the displayed identity, uppercased; its text is decorative
and the adjacent name supplies the accessible identity. Action labels use the same
resolved name. A generic missing identity uses P. No partner email is requested,
added to API responses, inferred or displayed by this proposal.

## Inspected current source

- `apps/mehrchain-frontend/src/app/features/chain/components/chain-card/chain-card.ts`:
  username defaults to partner; display-name computation prefers name; avatar
  indexes its first UTF-16 code unit. The adjacent template prefers @username.
- `apps/mehrchain-frontend/src/app/features/chain/chain.ts:93`: invitation mapping
  adds @ to username, otherwise uses name or Friend. The success toast at line
  122 adds another @ to the already formatted inviter name; a future resolver
  integration must update that consumer as part of consistent formatting.
- `apps/mehrchain-frontend/src/app/features/chain/chain.html`: private receipt
  prefers @username, otherwise name or Your partner/your partner.
- `apps/mehrchain-backend/src/app/chain/chain.service.ts`: connection partner,
  invite sender and private-receipt partner selections contain username/name,
  without email. Shared `chain.interface.ts` agrees. Email fallback would require
  a separately authorized disclosure/data decision. It is excluded here.

## Artifact and scope

`index.html` compares all three locations on identical fixtures, frame sizes and
themes. Missing, blank, long, Unicode and emoji fixtures expose the fallback and
avatar differences. The three contextual cards appear together to review one
resolver; this is not a proposal to stack three real destinations on one screen.
The four-tab MehrChain shell, Poppins, installed Lucide geometry and approved V2
tokens come from the T34 review resources. Mero is absent because these contexts
do not use it. Source revision is cdebac7 plus local analysis files; product source
was not changed. Current is a template reconstruction, not a deployed screenshot.

60 frame/theme/fixture combinations were executed in installed Chrome through
bundled Playwright; no app horizontal overflow or page errors occurred. Proposal
labels were identical across the three contexts and contained no @, including
embedded-name, embedded-username and @-only synthetic cases. `preview.png`
records the embedded-name light comparison. Native devices and
assistive technology were not tested. No change to stored usernames, validation,
authentication or account pages is proposed. The owner's reply corrected display
formatting and accepted the surrounding review direction; see `decisions.md`.

## Username saving is a distinct, already enforced rule

The owner additionally clarified that a username must not be savable with @ or
unsupported special characters. Inspected current frontend `username-settings.ts`,
backend `auth/username.ts`, RegisterDto and UpdateUsernameDto consistently enforce
3-20 ASCII letters/digits/underscore for new saves, normalized to lowercase.
The existing explicit allowlist is `[a-z0-9_]{3,20}`; underscore is intentionally
allowed by the current account contract. @, dot, hyphen, spaces and ! fail it.
Actual `normalizedUsername` execution accepted `sara_walks` and `Sara123` (lowercase),
and rejected `@sara`, `sa@ra`, `sara.walks`, `sara-walks`, `sara walks`, `sara!`.
Both registration and username updates call this server helper before persistence.
These are local-source/helper checks, not a live account save or database audit.
No new validator or silent cleanup of saved accounts is needed for this request.
The preview's unsupported username fixtures are defensive/legacy stress inputs,
not examples of permitted newly saved usernames. Display names remain distinct
from account usernames. Display-only @ removal does not mutate account data.

Build: `node design/ux/chain-review-support/build.cjs t47-chain-identity-label`.
Shared tooling emits this artifact as a standalone offline file; fonts/licenses
are the existing V2 Poppins sources and Lucide license references documented in
`../t34-chain-connect-show-up/THIRD_PARTY.md`.
