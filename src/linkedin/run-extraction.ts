
import * as dotenv from 'dotenv';
import { scrapeLinkedInPost } from './scraper';
import { LinkedInExtractorService } from './extractor-service';
import { LinkedInCsvExporter } from './csv-exporter';

dotenv.config();

async function main() {
    const url = process.argv[2];
    const apiKey = process.env.GEMINI_API_KEY;

    if (!url) {
        console.error('Usage: ts-node src/linkedin/run-extraction.ts <linkedin-post-url>');
        process.exit(1);
    }

    if (!apiKey) {
        console.error('Error: GEMINI_API_KEY not found in .env file');
        process.exit(1);
    }

    try {
        console.log(`Starting extraction for: ${url}`);

        // 1. Scrape
        const postText = await scrapeLinkedInPost(url);
        if (!postText || postText.length < 20) {
            throw new Error("Could not extract meaningful text from the post.");
        }
        console.log("Extracted post text (first 100 chars):", postText.substring(0, 100) + "...");

        // 2. Extract with LLM
        const extractor = new LinkedInExtractorService(apiKey);
        const result = await extractor.extractFromText(postText);

        // 3. Export to CSV
        const exporter = new LinkedInCsvExporter('./data', 'linkedin_launches.csv');
        await exporter.appendExtraction(result, url);

        console.log('✅ Successfully processed LinkedIn post and updated CSV.');
    } catch (error) {
        console.error('❌ Extraction failed:', error);
        process.exit(1);
    }
}

main().catch(console.error);
