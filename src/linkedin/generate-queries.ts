
import * as fs from 'fs-extra';
import * as path from 'path';
import { RETAILERS, TRIGGER_PHRASES } from './config';

async function main() {
    console.log('--- Retail Radar Sweep Generator ---');
    console.log('Generating search queries for your manual or automated sweep...\n');

    const queries: string[] = [];

    // Calculate date 12 weeks ago
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - (12 * 7));
    const dateStr = twelveWeeksAgo.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`Searching for posts after: ${dateStr} (12 weeks ago)\n`);

    for (const retailer of RETAILERS) {
        // We group phrases to make search more efficient
        const groupedPhrases = TRIGGER_PHRASES.join('" OR "');
        const query = `site:linkedin.com/posts "${retailer}" ("${groupedPhrases}") after:${dateStr}`;
        queries.push(query);
    }

    const outputPath = path.join(process.cwd(), 'sweep_queries.txt');
    await fs.writeFile(outputPath, queries.join('\n'));

    console.log(`✅ Generated ${RETAILERS.length} optimized search queries.`);
    console.log(`📂 Saved to: ${outputPath}`);
    console.log('\n--- Next Steps ---');
    console.log('1. Run these queries in Google/LinkedIn.');
    console.log('2. Copy the resulting text snippets into a file (e.g., raw_results.txt).');
    console.log('3. Run "npm run sweep-process raw_results.txt" to extract and save to CSV.');
}

main().catch(console.error);
