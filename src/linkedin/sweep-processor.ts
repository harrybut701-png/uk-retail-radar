
import * as fs from 'fs-extra';
import * as dotenv from 'dotenv';
import { LinkedInExtractorService } from './extractor-service';
import { LinkedInCsvExporter } from './csv-exporter';
import { RETAILERS } from './config';

dotenv.config();

async function main() {
    const filePath = process.argv[2];
    const apiKey = process.env.GEMINI_API_KEY;

    if (!filePath) {
        console.error('Usage: npm run sweep-process <path-to-raw-results-text>');
        process.exit(1);
    }

    if (!apiKey) {
        console.error('Error: GEMINI_API_KEY not found in .env');
        process.exit(1);
    }

    try {
        const rawText = await fs.readFile(filePath, 'utf-8');
        const extractor = new LinkedInExtractorService(apiKey);
        const exporter = new LinkedInCsvExporter('./data', 'linkedin_launches.csv');

        console.log(`Processing raw sweep data from ${filePath}...`);

        // We process the text in chunks or as a whole depending on size
        // For now, we'll ask the LLM to identify ALL retailers and products in the text
        // We adjust the system prompt slightly for a "bulk" input
        const result = await extractor.extractFromText(rawText);

        if (result.products.length > 0) {
            await exporter.appendExtraction(result, `Sweep: ${filePath}`);
            console.log(`✅ Extracted and saved ${result.products.length} products!`);
        } else {
            console.log('No new products found in this sweep data.');
        }

    } catch (error) {
        console.error('❌ Processing failed:', error);
    }
}

main().catch(console.error);
