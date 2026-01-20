
# LinkedIn Product Extractor

This module extracts new product launch information from LinkedIn posts and saves it to a CSV.

## Components

- `types.ts`: Zod schemas for the extraction.
- `csv-exporter.ts`: Logic to append extracted data to a CSV file.
- `prompt.ts`: The system prompt for the LLM.

## Usage

### 1. Extract Data (LLM Step)
Use the prompt in `prompt.ts` with your LLM of choice (e.g. ChatGPT, API).
Input the LinkedIn post text.
Ensure the output is valid JSON matching the schema.

### 2. Process JSON
Save the LLM output to a file (e.g. `extraction.json`).
Run the processing script (to be implemented) to append it to the master CSV.

## Workflow
1. Fetch LinkedIn Post Text.
2. Run generic LLM extraction using `LINKEDIN_EXTRACTION_SYSTEM_PROMPT`.
3. Feed resulting JSON into `LinkedInCsvExporter`.
