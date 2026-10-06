# Golf Signal — Golf Radar MVP

A working, local prototype for researching golf equipment, golf bags, consumer
use cases and industry developments. The interface is named **Golf Radar**;
`golf-signal` is the source repository.

**Purpose:** support product and market research for a golf-products business.
This is an early prototype with an intended business use; it is not represented
as a non-commercial or academic project. Current outputs are source-linked
news items and rule-based observations, not measured community trends.

## Run locally

Requires **Node.js 24.11 or newer** and npm. No database service or API key is
required. Run these commands from the repository root:

```sh
npm ci
npm start
```

Open **http://127.0.0.1:3000** (use this exact host). The first run has no
articles. Click **刷新订阅源** to fetch real items from four configured RSS / Atom
feeds. Network failures are shown per source and retain previous items. A
successful response can contain old articles; original publication dates are
preserved. There is no automatic background collection.

```sh
npm test                 # Offline behavioral tests; no external collection
```

The server binds only to the local loopback interface. Data persists in
`data/radar.sqlite`. Stop the server before deleting `data/` to reset it.
An optional `.env` can override `PORT`; copy `.env.example` if needed.
The server honors standard HTTP/HTTPS proxy environment settings when present.
This runtime is for local use. Public hosting requires authentication and
deployment configuration; no publicly accessible review website is claimed.

## Current capabilities

| Capability | v0.1 status |
| --- | --- |
| RSS / Atom | Manual refresh: MyGolfSpy, GOLF.com, Sun Mountain, Titleist |
| Browsing | Search, category filter, relevance/date sort, source links |
| Provenance | Publisher, source tier, original date, observation date |
| Storage | Local SQLite; URL deduplication and refresh status |
| Ranking | Keyword rules, priority 1–3; **not AI scoring** |
| Output | Browser UI, `/api/items`, `/api/v1/items`, `/feed.xml` |
| Reddit | Disabled placeholder; API and intended-use approval pending |
| Sorftime MCP | Not connected; coverage, costs and usage permissions unverified |
| Scheduling, clustering, model calls | Not implemented in this runtime |

News and brand material provide market context. They do not by themselves
establish user pain points, demand growth or purchasing intent. UI business
observations are labeled as hypotheses requiring validation.

## Reddit integration — pending approval

The proposed integration is read-only public discussion research in **r/golf**.
Its intended use is business product and market research, including golf-bag
questions, equipment discussions and usage scenarios. We will request explicit
API access and the permissions required for that use before implementation.

The intended minimal post fields are title, permalink, publication time, score
and comment count. Limited discussion content, including comments, is only a
future proposal subject to the approved scope. This version retrieves **no
Reddit posts or comments**, stores no Reddit data and makes no Reddit requests.

`src/collectors/reddit.ts` immediately throws `RedditAccessPendingError`. It is
not wired into RSS collection. Adding credentials or changing environment
variables does not enable it.

The application does not post, comment, vote, message, moderate, build user
profiles, target advertising, or train/fine-tune models on Reddit content.
Future results must link back to the original discussions. Retention, deletion,
scope and rate-limit controls must be implemented under the approval conditions
before collection begins. No application or approval is claimed by this repo.

See [Reddit plan](docs/reddit-integration.md) and
[application wording](docs/reddit-application.md).

## Structure

```text
config/                 Feed configuration and historical verification snapshot
docs/                   Architecture, sources and intended Reddit use
scripts/                Build and loopback HTTP server
src/collectors/reddit.ts Disabled Reddit collector
src/runtime/worker.js   Feed normalization, classification and HTTP endpoints
src/storage/            SQLite schema and adapter
tests/                  Offline fixtures and behavioral tests
web/index.html          Golf Radar interface
```

Read [architecture](docs/architecture.md) and [data sources](docs/data-sources.md).
Never commit `.env`, API secrets, tokens, cookies or local databases. The
repository intentionally contains no cached publisher or community content.

## Attribution and content rights

This MVP grew out of customization of [AIHOT](https://github.com/KKKKhazix/AIHOT).
It uses a lightweight local runtime rather than shipping the full upstream
PostgreSQL / job-worker / model pipeline. The upstream MIT copyright and license
are preserved in [LICENSE](LICENSE) and [NOTICE](NOTICE). Our product uses its own
name and mark.

The code license does not license publishers' articles or grant API access.
Feed entries show titles, short excerpts (at most 160 characters) and original
links; no full-text article crawler is included. Operators must respect source
terms and approved data uses.
