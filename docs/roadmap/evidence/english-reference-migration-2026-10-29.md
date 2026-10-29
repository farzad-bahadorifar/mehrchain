# English reference migration — 2026-10-29

Owner instruction: keep project material English, except the original Persian poem,
which must remain Persian and unchanged. Developer/AI entry points must direct
readers to the roadmap before work.

## Changes

- Translated active roadmap/context/direction/question/policy material and generated
  headings. Task IDs, statuses, decisions, acceptance evidence and next ID are unchanged.
- Added roadmap-first reading order to README, CONTRIBUTING, AGENTS, GEMINI,
  GitHub Copilot instructions and the PR template. Removed conflicting historical
  automatic issue/Project/push guidance and obsolete contributor feature suggestions.
- Added English references for historical handoffs/analysis and English review labels.
  Their exact original records remain recoverable in a hash-identified source archive.
  Historical summaries explicitly distinguish themselves from the current queue.
- Preserved the exact README poem from the original source and recorded its
  SHA-256 fingerprint/markers in `docs/roadmap/language-policy.json`.
- Preserved the original approved V2 bytes/hash in the archive. Its English
  presentation has a separately recorded hash; translation is not a new design approval.
- Registry validation rejects Persian-script task prose. The project language
  check rejects Persian-script authored text outside the exact README poem, while
  preserving user data, intentional test fixtures and private/raw source evidence.

## Verification

- `node scripts/roadmap.cjs validate`: 11 atomic task records valid; 333 maintained
  text files checked; original README poem fingerprint unchanged.
- `node --test scripts/roadmap.spec.cjs scripts/check-project-language.spec.cjs`:
  9 tests passed, including the poem exception and unwanted mixed-language prose.
- English review bundle's embedded JavaScript parses successfully.
- Maintained documentation links resolve; original archived records retain their hashes.
- No product logic, account/domain/provider state, GitHub issue/Project state,
  deployment or credentials changed in this maintenance update.

The script guard detects the known Persian-script drift; human review still checks
that prose is actually English. It does not claim universal natural-language detection.
