# T46 Decision Record

Date: 2026-11-13, Asia/Tehran.
Artifact: `design/ux/t46-home-single-line-title/index.html` (v0.1).

## Scope & Decision

Decision: **Approved based on modern UI principles and user authorization**.
1. Primary title row uses `truncate` (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;`).
2. Native `[title]="commitment().title"` preserves desktop hover tooltip and accessible screen reader reading.
3. Details button and section retain access to the full unabridged title.
4. Preserves all existing commitment data, backend fields, streaks, and completion actions without regression.
