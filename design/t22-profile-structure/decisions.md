# Decision log

| Date (Tehran) | Version | Decision | Status |
| --- | --- | --- | --- |
| 2026-10-25 | 0.1 | Two Profile structures and three palette directions prepared for review. A is the assistant's recommendation only. | Awaiting owner review |
| 2026-10-25 | 0.1 review | Owner prefers A, rejects the proposed palettes as dull, and requests comparison using the existing design system because too many elements differed. | A selected for revision; visuals not approved |
| 2026-10-25 | 0.2 | Retain A; reuse Poppins, Lucide geometry and the production Mero model/scene; reconstruct existing card/button/navigation dimensions; compare current colors against brighter teal with restrained coral/violet/amber accents across 11 specimens. | Awaiting owner visual review |
| 2026-10-29 | Roadmap/contract | Owner requests a clear per-task mapping and a cleaned roadmap before supplying more analysis topics. Every future UI wireframe must use the existing design system and familiar product context, with comparable current/proposed states. | Mandatory delivery requirement; no new color or implementation approval |
| 2026-10-29 | V0.2 approval | Owner explicitly approves V2 and requests its implementation with exact task ownership. Approved design deliverables T20/T22/T23/T24 close at this version; local code owners are T26/T27/T28. Actual deployed username investigation belongs only to T29. | Approved for scoped implementation |

The latest approval supersedes the earlier pending-review wording. Exact original
V2/V1 artifacts are preserved in the [source archive](../../../docs/archives/README.md).
Original approved V2 SHA-256:
`0fe5e8d4def6a5254de500160a8cd8e06268c013f09a39b917b55916c04dca2a`.
Mock Home/Chain/Journey data and future synthetic badges are not approved product
logic. No earning rules, migration or production deployment is authorized merely
by approving the visual artifact. Current code/check status is in the task cards.

Current per-task coverage/stages are tracked in the [active roadmap](../../../docs/development_roadmap.md)
and the [UI analysis contract](../../../docs/ui_ux_discovery_plan.md).

## English reference migration — 2026-10-29

At the owner's request, active review labels and developer references were
translated to English. `index.html` and `approved-v0.2.html` are now the English
presentation of the approved V2 design; product components and interaction scope
were not redesigned by this translation. Their current SHA-256 is
`9a532e3f6b5174971d9e5bbe482d64a3b0d5b52e03959f8a3cc331aa41ac77a2`.
The original-language approval bytes and original hash remain recoverable in the
archive, not silently overwritten as new approval evidence. `v0.1.html` is an
English historical summary linking its exact archived original.
