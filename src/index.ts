import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs-extra';
import { getScraper } from './retailers';
import { RetailerConfig } from './types';
import { Storage } from './storage';
import { diffProducts, DiffResult } from './diff';
import { generateReport } from './report';
import { Product } from './types';

async function main() {
    const configPath = path.resolve('config/retailers.json');
    const configs: RetailerConfig[] = await fs.readJson(configPath);

    const storage = new Storage();
    await storage.init();

    const diffs: DiffResult[] = [];

    // Launch browser once or per retailer? 
    // Per retailer is safer for isolation but slower. Prompt asks for isolation.
    // We will sequential for now.

    for (const config of configs) {
        console.log(`Starting ${config.name}...`);
        let browser = null;
        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();

            const scraper = getScraper(config);

            // Retry logic could go here
            const products = await scraper.scrape(page);
            console.log(`Scraped ${products.length} items from ${config.name}`);

            const oldProducts = await storage.getLatest(config.name);
            const diff = diffProducts(config.name, oldProducts, products);
            diffs.push(diff);

            await storage.saveSnapshot(config.name, products);

        } catch (error) {
            console.error(`Failed to process ${config.name}:`, error);
        } finally {
            if (browser) await browser.close();
        }
    }

    console.log('Generating report...');
    await generateReport(diffs, 'out');
    console.log('Done!');
}

main().catch(console.error);
