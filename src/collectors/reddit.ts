/**
 * Reserved for Reddit's approved Data API. No scraping or network access.
 * Credentials alone do not authorize collection or a commercial use case.
 * Integration remains disabled until approval and its conditions are verified.
 */
export interface RedditSignal {
  title: string;
  permalink: string;
  publishedAt: string;
  score: number;
  commentCount: number;
}

export class RedditAccessPendingError extends Error {
  constructor() {
    super('Reddit API integration disabled: access and intended-use approval pending');
    this.name = 'RedditAccessPendingError';
  }
}

export async function fetchGolfSignals(): Promise<RedditSignal[]> {
  throw new RedditAccessPendingError();
}
