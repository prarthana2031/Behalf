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
Add one person per row in `data/people-25.csv` with `name`, `linkedin_url`, and `instagram_url` columns (public profiles only). The `status` column is informational. `npm run build` automatically runs ingestion before building the site, so Vercel includes the generated roster in its deployment. For local development, run `npm run ingest` after changing the CSV. Credentials improve extraction and analysis but are optional. Ingestion requires at least 25 valid profiles and stops without replacing the current JSON if that check fails. The generated `people.json`, `dates.json`, and `rankings.json` power the app pages. `npm run sample` regenerates fictional sample personas instead.

## Run
`npm install && npm run build && npm start` or `docker compose up --build`.

## Run with Ollama
Install Ollama and pull a local model such as `qwen2.5:3b`, then set `LLM_PROVIDER=ollama`, `OLLAMA_BASE_URL=http://127.0.0.1:11434`, and `OLLAMA_MODEL=qwen2.5:3b` before starting the app. In Docker Compose, the app uses the private `ollama:11434` service address; Ollama's port is not published to the host. Pull the model once with `docker compose exec ollama ollama pull qwen2.5:3b`.

For a quick AWS demo without a hosted model API:

1. Launch one Ubuntu EC2 instance with at least 8 GiB RAM and 30 GiB encrypted EBS. A small 3B model is appropriate for CPU-only inference; larger models need substantially more RAM or a GPU. Avoid burstable T instances for sustained inference because CPU-credit charges/throttling can surprise you.
2. Install Docker Engine and the Compose plugin, clone this repository, then `cd behalf-next`.
3. Create a private `.env` file on the instance (never commit it) with `OLLAMA_MODEL=qwen2.5:3b` and, optionally, `APIFY_TOKEN=...` for richer public-profile extraction.
4. Run `docker compose up -d --build`, then `docker compose exec ollama ollama pull qwen2.5:3b`.
5. Securely copy `data/people-25.csv` onto the instance, then run `docker compose cp data/people-25.csv web:/app/data/people-25.csv` and `docker compose exec web node scripts/ingest.mjs`.
6. Open TCP 3000 only to the demo audience's IP while testing. Do not open 11434. For a public production URL, put HTTPS/auth in front of the web container and create a budget alert first.

The web and Ollama containers communicate on a private Compose network; model weights and runtime data use persistent Docker volumes. Ollama requires no Anthropic API key. Do not use the App Runner config for new deployments: AWS App Runner closed to new customers in April 2026. AWS credits may not cover every charge; check eligibility, region pricing and credit expiry in Billing.

## Submission text
Overall (186/200): Behalf: every person gets an agent that reads their public LinkedIn + Instagram, writes a profile, dates other agents on their behalf, then ranks who fits. Two MCP servers, Next.js site.

Technical (357/500): Next.js 15 app with two standalone MCP servers. Apify can read the supplied public LinkedIn and Instagram profiles; without it, labeled public-page/handle fallbacks are used. Claude or local Ollama analyzes source evidence and generates four-round agent conversations with individual judgments. JSON store; Docker Compose; deployable to a single EC2 host with the Ollama service kept private.
