
import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';
import { RETAILERS, TRIGGER_PHRASES } from './config';
import { GoogleSearchService } from './search-service';
import { LinkedInExtractorService } from './extractor-service';
import { LinkedInCsvExporter } from './csv-exporter';

dotenv.config();

async function runAutomatedRadar() {
    const serperApiKey = process.env.SERPER_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!serperApiKey || !geminiApiKey) {
        console.error('Error: SERPER_API_KEY and GEMINI_API_KEY must be set in .env');
        process.exit(1);
    }

    const searchService = new GoogleSearchService(serperApiKey);
    const extractor = new LinkedInExtractorService(geminiApiKey);
    const exporter = new LinkedInCsvExporter('./data', 'linkedin_launches.csv');

    console.log('🚀 Starting Automated Retail Radar...');

    // Use a larger slice of phrases to ensure we find something new in tests
    const phrasesToUse = TRIGGER_PHRASES.slice(0, 15);

    let allNewProducts: any[] = [];

    for (const retailer of RETAILERS) {
        console.log(`\n--- Researching ${retailer} ---`);

        for (const phrase of phrasesToUse) {
            const query = `"${retailer}" "${phrase}"`;
            console.log(`Searching: ${query}...`);

            const searchResults = await searchService.searchLinkedIn(query, 10);

            if (searchResults.length === 0) {
                console.log(`No results found for "${query}"`);
                continue;
            }

            // Combine snippets for batch extraction to save on LLM calls
            const combinedText = searchResults.map(r =>
                `SOURCE: ${r.link}\nDATE: ${r.date || 'unknown'}\nSNIPPET: ${r.snippet}\n---`
            ).join('\n');

            try {
                const extraction = await extractor.extractFromText(combinedText);

                if (extraction.products.length > 0) {
                    console.log(`✅ Found ${extraction.products.length} new products!`);

                    // Filter out duplicates before capturing for the summary
                    // We need to slightly adjust how we capture these for the summary
                    // For now, let's just collect all found and let the exporter handle CSV dedupe
                    extraction.products.forEach(p => {
                        allNewProducts.push({ ...p, retailer: extraction.retailer });
                    });

                    await exporter.appendExtraction(extraction, `AutoSearch: ${query}`);
                } else {
                    console.log('No new products detected in these results.');
                }
            } catch (error) {
                console.error(`Extraction failed for ${query}:`, error);
            }

            // Small delay to be polite to APIs
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Generate a Markdown summary for GitHub Actions / Email
    if (allNewProducts.length > 0) {
        let summaryMd = `# 🚀 New Retail Launches Found: ${new Date().toLocaleDateString()}\n\n`;
        summaryMd += `| Retailer | Brand | Product | Category | URL |\n`;
        summaryMd += `| :--- | :--- | :--- | :--- | :--- |\n`;

        allNewProducts.forEach(p => {
            summaryMd += `| ${p.retailer} | ${p.brand || 'N/A'} | ${p.product_name} | ${p.category} | [Link](${p.post_url}) |\n`;
        });

        await fs.writeFile('./last-run-summary.md', summaryMd);
        console.log('\n📄 Summary report generated: last-run-summary.md');
    }

    console.log('\n✅ Automated Radar Sweep Complete!');
}

runAutomatedRadar().catch(console.error);
