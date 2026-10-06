# Proposed Reddit integration (disabled)

## Intended use

Read-only research on public r/golf discussions to understand equipment
questions, golf-bag pain points and usage scenarios for a golf-products
business. This is an intended business/product-research use, not a claim of
non-commercial status. The project will disclose this when seeking approval.

## Proposed scope

- Initial community: r/golf only, subject to approval.
- Minimal post metadata: title, original permalink, publication time, score and
  comment count. No usernames, account histories or user profiles are planned.
- Limited discussion text is a proposed future scope; no comment collection or
  content analysis is implemented in v0.1.
- Link users to the original discussion. No reposting complete discussions.
- No posting, voting, messaging, moderation, advertising targeting or model
  training/fine-tuning. No Reddit scraping fallback.

## Current implementation

`src/collectors/reddit.ts` always throws before any network access. The RSS
refresh path cannot invoke it. The environment example contains empty reserved
fields only. There is no OAuth client, token acquisition, Reddit scheduler or
stored Reddit content. No Reddit data is sent to an AI service.

## Before enabling

Obtain explicit API approval and any required commercial-use agreement. Confirm
permitted fields, processing, storage, display, rates and retention in writing.
Implement OAuth, minimal approved access, throttling, deletion reconciliation,
retention limits and removal of derived records when required. Do not enable
collection until these conditions are satisfied. No fixed retention interval is
claimed before approval conditions are known.

The relevant official policies are:

- [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy)
- [Data API Terms](https://redditinc.com/policies/data-api-terms)
- [Developer Terms](https://redditinc.com/policies/developer-terms)

Obtaining API credentials is not the same as obtaining permission for the
intended use. The approval status must be updated truthfully after a decision.
