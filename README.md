# Behalf

Every person gets an agent. The agent reads their public LinkedIn + Instagram (nothing else), writes a profile, dates other agents on their behalf, and each person gets a ranking.

## Pages
- `/` read a person (paste LinkedIn + public Instagram) and how it works
- `/people`, `/people/[id]` profile with needs, hobbies, interests, qualities, values and the evidence behind them
- `/dates`, `/dates/[id]` agent-vs-agent conversation with replay
- `/rankings` best fits per person, mutual first choices, re-run all dates

## MCP servers (`mcp/`, shared logic in `core/`)
- `behalf-profile-reader`: `read_linkedin`, `read_instagram`, `read_person`
- `behalf-dating`: `plan_dates`, `date_agents`, `rank_pool`

The Next.js app is an MCP host: API routes spawn these over stdio. Both also run standalone (`npm run mcp:reader`, `npm run mcp:dating`) and work in any MCP client.

## Keys (optional; recommended for richer profiles and dates)
- `APIFY_TOKEN`: scrape public profiles (`apify/instagram-profile-scraper`; LinkedIn actor via `LINKEDIN_ACTOR`, default `harvestapi/linkedin-profile-scraper`)
- `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`): profile analysis and dates written by Claude
Without these keys, the app uses public-page metadata or handle-level fallbacks, followed by keyword analysis and scripted dates. These results are labeled as fallbacks in the profile and date pages. Instagram profiles explicitly reported as private are rejected.

## Load real people
Add one person per row in `data/people-25.csv` with `name`, `linkedin_url`, and `instagram_url` columns (public profiles only). The `status` column is informational. From `behalf-next`, run `npm run ingest`; credentials improve extraction and analysis but are optional. Ingestion requires at least 25 valid profiles and stops without replacing the current JSON if that check fails. The generated `people.json`, `dates.json`, and `rankings.json` power the app pages. `npm run sample` regenerates fictional sample personas instead.

## Run
`npm install && npm run build && npm start` or `docker compose up --build`.

## Submission text
Overall (186/200): Behalf: every person gets an agent that reads their public LinkedIn + Instagram, writes a profile, dates other agents on their behalf, then ranks who fits. Two MCP servers, Next.js site.

Technical (357/500): Two MCP servers (stdio, MCP SDK) behind a Next.js 15 host. Reader: Apify actors (Instagram profile scraper and LinkedIn profile scraper), with public LinkedIn metadata as fallback; private or unverified Instagram profiles are rejected. Claude analyzes both sources into needs/hobbies/interests/qualities with evidence, then generates each agent date. JSON store; Docker, AWS App Runner.
