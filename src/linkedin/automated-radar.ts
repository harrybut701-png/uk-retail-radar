
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

    // FULL SEARCH MODE: Use all available phrases for maximum coverage
    const phrasesToUse = TRIGGER_PHRASES;

    // Define search scopes to catch both short posts and long-form articles
    const SEARCH_SCOPES = [
        { type: 'Posts', filter: 'site:linkedin.com/posts' },
        { type: 'Articles', filter: 'site:linkedin.com/pulse' }
    ];

    let allNewProducts: any[] = [];

    for (const retailer of RETAILERS) {
        console.log(`\n--- Researching ${retailer} ---`);

        for (const scope of SEARCH_SCOPES) {
            console.log(`\n[Scanning ${scope.type}]`);

            const chunkSize = 6;
            for (let i = 0; i < phrasesToUse.length; i += chunkSize) {
                const chunk = phrasesToUse.slice(i, i + chunkSize);
                // Construct query with OR operators for the batch
                const groupedPhrases = chunk.join('" OR "');

                // The site filter is handled by the search service, just provide the content query
                const query = `"${retailer}" ("${groupedPhrases}")`;
                console.log(`Searching: ${query}...`);

                // Search deeper (20 results) and further back (1 month)
                const searchResults = await searchService.searchLinkedIn(
                    query,
                    20,         // Increase results per page
                    'qdr:m',    // Look back 1 month (compatible with Serper)
                    scope.filter // Toggle between posts and articles
                );

                if (searchResults.length === 0) {
                    console.log(`No results found for batch.`);
                    continue;
                }

                // Combine snippets for batch extraction to save on LLM calls
                const combinedText = searchResults.map(r =>
                    `SOURCE: ${r.link}\nDATE: ${r.date || 'unknown'}\nSNIPPET: ${r.snippet}\n---`
                ).join('\n');

                try {
                    // DEBUG: Log the input being sent to the LLM
                    console.log(`[DEBUG] Sending ${combinedText.length} chars to LLM. Preview: ${combinedText.substring(0, 200)}...`);

                    const extraction = await extractor.extractFromText(combinedText);

                    console.log(`[DEBUG] Extraction result for ${retailer}: ${extraction.products.length} products found.`);

                    if (extraction.products.length > 0) {
                        console.log(`✅ Found ${extraction.products.length} new products!`);

                        extraction.products.forEach(p => {
                            allNewProducts.push({ ...p, retailer: extraction.retailer });
                        });

                        await exporter.appendExtraction(extraction, `AutoSearch (${scope.type}): ${query}`);
                    } else {
                        console.log('No new products detected in these results (filtered by LLM).');
                    }
                } catch (error) {
                    console.error(`Extraction failed for ${query}:`, error);
                }

                // Small delay to be polite to APIs
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
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
