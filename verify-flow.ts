
import * as dotenv from 'dotenv';
import { RETAILERS, TRIGGER_PHRASES } from './src/linkedin/config';
import { GoogleSearchService } from './src/linkedin/search-service';
import { LinkedInExtractorService } from './src/linkedin/extractor-service';

dotenv.config();

async function reproduce() {
    console.log("--- STARTING REPRODUCTION ---");

    const serperKey = process.env.SERPER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY; // Ensure you have this set locally!

    if (!serperKey || !geminiKey) {
        console.error("Missing keys. Serper:", !!serperKey, "Gemini:", !!geminiKey);
        return;
    }

    const searchService = new GoogleSearchService(serperKey);
    const extractor = new LinkedInExtractorService(geminiKey);

    // Pick one retailer and one chunk of phrases to test "real" conditions
    const retailer = "Tesco";
    const chunk = TRIGGER_PHRASES.slice(0, 4);
    const groupedPhrases = chunk.join('" OR "');
    const query = `"${retailer}" ("${groupedPhrases}")`;
    const siteFilter = 'site:linkedin.com/posts'; // Testing posts

    console.log(`Query: ${siteFilter} ${query}`);

    // 1. SEARCH
    console.log("1. Executing Search...");
    const searchResults = await searchService.searchLinkedIn(query, 10, undefined, siteFilter);
    console.log(`Found ${searchResults.length} results.`);

    if (searchResults.length === 0) {
        console.log("❌ Search returned 0. Stopping.");
        return;
    }

    // 2. COMBINE
    const combinedText = searchResults.map(r =>
        `SOURCE: ${r.link}\nDATE: ${r.date || 'unknown'}\nSNIPPET: ${r.snippet}\n---`
    ).join('\n');

    console.log(`Combined Text Length: ${combinedText.length}`);

    // 3. EXTRACT
    console.log("2. Sending to LLM...");
    try {
        const result = await extractor.extractFromText(combinedText, retailer);
        console.log("LLM Response objects:", JSON.stringify(result, null, 2));

        if (result.products.length > 0) {
            console.log(`✅ SUCCESS! Found ${result.products.length} products.`);
        } else {
            console.log("⚠️ Search found hits, but LLM found 0 products.");
        }
    } catch (e) {
        console.error("❌ LLM Failed:", e);
    }
}

reproduce();
