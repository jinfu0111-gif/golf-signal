# Validation

## Repeat check — 2026-10-06

The existing standalone source was recovered intact from the original
workspace. Its build and seven offline behavioral test cases passed again.
The prior archive did not need to be reconstructed. No live RSS refresh or
interactive browser check was repeated in this check.

The results below describe the earlier 2026-09-30 prototype check.

## Automated

Build passed on Node.js 24.19.0. Seven offline behavioral tests passed:

- RSS / Atom parsing, provenance, dates and unsafe-link handling.
- Empty first installation and explicit disabled-source health status.
- Manual refresh, concurrent source writes, URL deduplication, filtering and RSS output.
- Refresh cooldown, failed-source preservation and origin rejection.
- Explicit missing-database error.
- SQLite persistence and transaction rollback.
- Reddit refusing collection without network access; browser inline-script parsing.

Some of these checks are grouped within individual test cases. Run `npm test`
from the repository root to reproduce the seven cases. No external requests are
made by these tests.

## Local HTTP and live RSS smoke check

`npm start` served the root page and JSON endpoints at `http://127.0.0.1:3000`.
A manual refresh in the execution environment returned:

| Source | Result | Relevant records |
| --- | --- | --- |
| GOLF.com | Success | 5 |
| Sun Mountain | Success | 28 |
| Titleist | Success | 8 |
| MyGolfSpy | Fetch failed | 0 |

The database contained 41 real source items after that check, including 17
classified as bags. These counts are a test observation, not guaranteed future
results. MyGolfSpy remains configured and its failed run is visible; no access
restriction was bypassed. The test database is excluded from the deliverable,
so a fresh installation still starts empty.

Health confirmed Reddit disabled, Sorftime unconnected, model calls disabled
and scheduled collection disabled. No Reddit application was submitted.

## Limits

The inline browser script was syntax-checked and the HTTP page was retrieved.
No interactive browser or mobile visual acceptance check was performed in this
session. The standalone MVP does not run or validate AIHOT's full PostgreSQL
pipeline. The public source repository is
https://github.com/jinfu0111-gif/golf-signal; it does not constitute a public
deployment of the application or a Reddit API approval.
