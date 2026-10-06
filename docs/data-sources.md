# Data sources

The configured feeds were observed as readable on **2026-09-30** in a prior
prototype check. That snapshot is not a guarantee of continued access or a
refresh result for a new installation. Current results appear in the UI and
`GET /api/sources` after manual refresh.

| Source | Feed | Type | v0.1 |
| --- | --- | --- | --- |
| MyGolfSpy | https://mygolfspy.com/feed/ | Industry media | Manual RSS |
| GOLF.com | https://golf.com/feed/ | Industry media | Manual RSS |
| Sun Mountain | https://www.sunmountain.com/blogs/blog.atom | Brand official | Manual Atom |
| Titleist | https://www.titleist.com/teamtitleist/b/tourblog/rss | Brand official | Manual RSS |
| GolfWRX | https://www.golfwrx.com/feed/ | Industry media | Excluded: historical HTTP 403 |
| National Golf Foundation | https://www.ngf.org/feed/ | Industry research | Excluded: historical empty feed |
| USGA / R&A | https://www.usga.org/equipment-standards.html / https://www.randa.org/ | Rules bodies | Manual reference only |
| Reddit r/golf | https://www.reddit.com/r/golf/ | Community | Disabled, approval pending |
| Sorftime MCP | https://www.sorftime.com/en-US/mcp | Third-party data service | Not connected |

Brand feeds show brand claims and publishing activity; they are not independent
consumer demand evidence. Media may include affiliate and promotional material.
Historical feed counts in `config/source-status.json` describe the verification
response, not the number of current stored or relevant articles.

RSS records retain titles, links and short excerpts. Full articles are not
crawled. Source content belongs to its publisher; the MIT code license does not
grant reuse rights over that content. Failed or restricted feeds are not bypassed.

The public Sorftime description lists Amazon and TikTok-related tools. No Reddit
capability or Reddit authorization has been verified. Connecting an MCP in a
chat client does not automatically integrate it into this runtime.
