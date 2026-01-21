
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

    const debugLogPath = './debug_log.txt';
    await fs.writeFile(debugLogPath, `DEBUG LOG START: ${new Date().toISOString()}\n\n`);

    for (const retailer of RETAILERS) {
        console.log(`\n--- Researching ${retailer} ---`);
        let isFirstBatch = true; // Flag to log only the first batch per retailer to avoid huge files

        for (const scope of SEARCH_SCOPES) {
            console.log(`\n[Scanning ${scope.type}]`);

            const chunkSize = 4;
            for (let i = 0; i < phrasesToUse.length; i += chunkSize) {
                const chunk = phrasesToUse.slice(i, i + chunkSize);
                // Construct query with OR operators for the batch
                const groupedPhrases = chunk.join('" OR "');

                // The site filter is handled by the search service, just provide the content query
                const query = `"${retailer}" ("${groupedPhrases}")`;
                console.log(`Searching: ${query}...`);

                // Search WITHOUT date restriction first to ensure we get results
                // We rely on the LLM to filter out truly old stuff
                const searchResults = await searchService.searchLinkedIn(
                    query,
                    20,         // Increase results per page
                    undefined,  // REMOVED TIME FILTER (was 'qdr:m') - Let Google return best matches
                    scope.filter // Toggle between posts and articles
                );

                if (searchResults.length === 0) {
                    console.log(`No results found for batch.`);
                    continue;
                }

                console.log(`✅ Search Hit: Found ${searchResults.length} results. Processing with LLM...`);

                // Combine snippets for batch extraction to save on LLM calls
                const combinedText = searchResults.map(r =>
                    `SOURCE: ${r.link}\nDATE: ${r.date || 'unknown'}\nSNIPPET: ${r.snippet}\n---`
                ).join('\n');

                try {
                    // DEBUG: Log the input being sent to the LLM
                    console.log(`[DEBUG] Sending ${combinedText.length} chars to LLM. Preview: ${combinedText.substring(0, 200)}...`);

                    const extraction = await extractor.extractFromText(combinedText, retailer);

                    // LOGGING RAW INTERACTION
                    if (isFirstBatch) {
                        const logEntry = `\n\n--- RETAILER: ${retailer} ---\nINPUT TEXT:\n${combinedText}\n\nLLM OUTPUT:\n${JSON.stringify(extraction, null, 2)}\n--------------------------\n`;
                        await fs.appendFile(debugLogPath, logEntry);
                        isFirstBatch = false;
                    }

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
                } catch (error: any) {
                    console.error(`❌ CRITICAL FAILURE for query "${query}":`);
                    console.error(error);

                    await fs.appendFile(debugLogPath, `\nERROR for ${query}: ${error.message}\n`);

                    // If it's an API key or Model issue, we should stop everything, not just continue
                    if (error.status === 403 || error.status === 404 || error.message?.includes("API key")) {
                        throw new Error(`Stopping Radar: Critical API Error - ${error.message}`);
                    }
                }

                // Long delay to respect API rate limits (10s)
                await new Promise(resolve => setTimeout(resolve, 10000));
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
    } else {
        console.log('\n⚠️ No new products found. No summary report generated.');
    }

    console.log(`\n📄 Debug Log saved to ${debugLogPath}`);
    console.log('\n✅ Automated Radar Sweep Complete!');
}

runAutomatedRadar().catch(console.error);
