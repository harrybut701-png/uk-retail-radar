# UK Retail New-In Radar

This project automatically scrapes "New In" sections of major UK supermarkets weekly, snapshots the data, diffs it against previous weeks, and generates a digest report.

## Supported Retailers

- Tesco
- Sainsbury's
- ASDA
- Ocado
- M&S Food
- Boots
- Holland & Barrett
- Waitrose

*Note: Currently, Sainsbury's includes a concrete scraper implementation. Others use a generic placeholder that requires implementing specific selectors.*

## Prerequisites

- Node.js 18+
- npm

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

## Usage

Run the weekly scrape and report generation:

```bash
npm run weekly
```

This will:
1. Scrape all configured retailers.
2. Save raw data to `data/{retailer}/{week}.json`.
3. Update `data/latest/{retailer}.json`.
4. Generate a report in `out/weekly-report.md` (and JSON).

## Configuration

Retailers are configured in `config/retailers.json`.

## Extending

To add a new retailer or improve an existing one:

1. Create a new scraper class in `src/retailers/` extending `BaseRetailerScraper`.
2. Implement the `scrape(page)` method.
3. Register it in `src/retailers/index.ts`.
4. Add the configuration entry to `config/retailers.json`.

## GitHub Actions

The workflow is defined in `.github/workflows/weekly.yml`. It runs every Monday at 06:00 UTC (07:00 BST).

### Artifacts

The `out/` directory containing the report is uploaded as a workflow artifact named `weekly-report`.

## DST Considerations

The schedule is set to `0 6 * * 1` (UTC).
- Winter (GMT): Runs at 06:00 Local.
- Summer (BST): Runs at 07:00 Local.

If exact local time is critical, consider using two cron schedules or an external scheduler.

## Slack Integration (Optional)

To enable Slack notifications:
1. Create a Webhook URL in Slack.
2. Add a step in `src/index.ts` to POST the contents of `out/weekly-report.md` to the webhook URL.

---

## LinkedIn Retail Radar (Social Listening)

This module monitors social media (LinkedIn via Google Search) for new product launch claims using a 12-phrase trigger list.

### Workflow

1. **Sweep Query Generation**: Every Monday at 07:00 UTC, a GitHub Action runs `npm run sweep-generate` which updates `sweep_queries.txt` with a rolling 12-week search filter.
2. **Manual Loop**:
   - Paste the queries into Google or LinkedIn.
   - Capture the raw text results into a file (e.g., `raw_data.txt`).
3. **AI Extraction**:
   - Run `npm run sweep-process raw_data.txt`.
   - This uses Gemini AI to extract structured product rows and append them to `data/linkedin_launches.csv`.

### CSV Schema
- **Timestamp**: Processing date.
- **Source**: The file or URL used.
- **Retailer**: One of the 8 supported retailers.
- **Product Name**: As mentioned in the post.
- **Brand**: Brand name (if identified).
- **Confidence**: High/Medium/Low.
- **Evidence**: Exact quote from the text.
- **Is New Claim**: Boolean indicating if the post claims it's new.
