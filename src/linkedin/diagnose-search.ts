
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function diagnose() {
    console.log("--- STARTING DIAGNOSTICS ---");

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        console.error("❌ CRITICAL: SERPER_API_KEY is missing from environment.");
        process.exit(1);
    } else {
        console.log("✅ SERPER_API_KEY is present (length: " + apiKey.length + ")");
    }

    const headers = {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
    };

    // Test 1: Simple Search
    console.log("\n--- Test 1: Simple Query ---");
    const simpleQuery = 'site:linkedin.com/posts "Tesco" "new in"';
    try {
        const res1 = await axios.post('https://google.serper.dev/search', {
            q: simpleQuery,
            num: 5,
            tbs: 'qdr:m'
        }, { headers });

        const hits1 = res1.data.organic?.length || 0;
        console.log(`Query: ${simpleQuery}`);
        console.log(`Result: ${hits1} hits found.`);
        if (hits1 > 0) console.log(`Sample: ${res1.data.organic[0].title}`);
    } catch (e: any) {
        console.error("❌ Test 1 Failed:", e.response?.data || e.message);
    }

    // Test 2: Complex Batch Query (Simulating the failure)
    console.log("\n--- Test 2: Complex Batched Query ---");
    const complexQuery = 'site:linkedin.com/posts "Tesco" ("new in" OR "now available" OR "just launched" OR "launching today" OR "just landed" OR "now stocked")';
    try {
        const res2 = await axios.post('https://google.serper.dev/search', {
            q: complexQuery,
            num: 10,
            tbs: 'qdr:m'
        }, { headers });

        const hits2 = res2.data.organic?.length || 0;
        console.log(`Query: ${complexQuery}`);
        console.log(`Result: ${hits2} hits found.`);
        if (hits2 === 0) console.warn("⚠️ WARNING: Complex query returned 0 results. This suggests the query might be too long or specific for the API.");
        if (hits2 > 0) console.log(`Sample: ${res2.data.organic[0].title}`);

    } catch (e: any) {
        console.error("❌ Test 2 Failed:", e.response?.data || e.message);
    }

    // Test 3: Site Filter Check
    console.log("\n--- Test 3: Articles Filter Check ---");
    const articleQuery = 'site:linkedin.com/pulse "Tesco" "new in"';
    try {
        const res3 = await axios.post('https://google.serper.dev/search', {
            q: articleQuery,
            num: 5,
            tbs: 'qdr:m'
        }, { headers });

        console.log(`Query: ${articleQuery}`);
        console.log(`Result: ${res3.data.organic?.length || 0} hits found.`);
    } catch (e: any) {
        console.error("❌ Test 3 Failed:", e.response?.data || e.message);
    }

    console.log("\n--- DIAGNOSTICS COMPLETE ---");
}

diagnose();
