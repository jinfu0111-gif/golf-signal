# Application wording draft

Source/platform link: https://github.com/jinfu0111-gif/golf-signal

This document is a draft, not a submitted application or approval. The public
repository provides reviewable source code; a private prototype website is
not a public review link.

## Project description

Golf Signal (interface name: Golf Radar) is an early-stage prototype for golf
equipment and market research supporting a golf-products business. The current
working application reads public RSS/Atom feeds and displays source-linked
equipment, brand and industry news. We intend to add a read-only Reddit
community signal source, initially limited to public discussions in r/golf,
only after receiving explicit API access and the permissions required for this
business use.

## Requested Reddit use

We intend to identify recurring equipment questions, golf-bag pain points and
usage scenarios for product and market research. The initial proposed fields
are post title, permalink, publication time, score and comment count. Any
limited discussion-text or comment access will be separately confirmed within
the approved scope. Relevant results will link back to the original discussion.
We do not intend to post, comment, vote, message, moderate, build user profiles,
use Reddit data for targeted advertising, or train/fine-tune AI/ML models with
Reddit content.

## Present implementation and controls

The Reddit collector is disabled and throws an explicit pending-approval error
without making a network request. No Reddit data has been collected by this
application. Credentials alone cannot enable the integration. Before enabling
it, we will implement the approved OAuth access, rate limits, data minimization,
retention and deletion requirements. We will not scrape Reddit or bypass API
restrictions if permission is not granted.

Reviewers can inspect `src/collectors/reddit.ts` and run the RSS prototype using
the instructions in the repository README. The project is a business-research
prototype; the application should not describe it as non-commercial.
