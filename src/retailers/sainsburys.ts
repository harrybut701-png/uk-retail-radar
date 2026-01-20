import { Page } from 'playwright';
import { BaseRetailerScraper } from './base';
import { Product } from '../types';
import { generateHash } from '../utils';

export class SainsburysScraper extends BaseRetailerScraper {
    async scrape(page: Page): Promise<Product[]> {
        console.log(`Navigating to ${this.config.startUrl}...`);
        await page.goto(this.config.startUrl, { waitUntil: 'domcontentloaded' });

        // Handle cookies if necessary (simplified)
        try {
            const cookieButton = await page.getByRole('button', { name: /Accept all cookies|I Accept/i });
            if (await cookieButton.isVisible()) {
                await cookieButton.click();
            }
        } catch (e) {
            // ignore
        }

        // Wait for product grid
        try {
            await page.waitForSelector('ul.ln-o-grid', { timeout: 10000 });
        } catch (e) {
            console.log('Could not find standard grid, attempting fallback...');
        }

        // Select product cards. Sainsbury's often uses ul.ln-o-grid > li
        // or specific product components. 
        // We will select all elements that look like a product card.
        const productElements = await page.$$('ul.ln-o-grid > li');

        const products: Product[] = [];

        for (const el of productElements) {
            const text = await el.innerText();
            const lines = text.split('\n');

            // Heuristic extraction
            const priceRaw = lines.find(l => l.includes('£')) || null;
            const name = await el.$eval('h3, h2, a[data-test-id="product-tile-description"]', n => n.textContent?.trim()).catch(() => null)
                || lines.find(l => l.length > 10 && !l.includes('£'))
                || 'Unknown Product';

            const linkEl = await el.$('a');
            const href = await linkEl?.getAttribute('href');
            const productUrl = href ? (href.startsWith('http') ? href : `https://www.sainsburys.co.uk${href}`) : this.config.startUrl;

            const imgEl = await el.$('img');
            const imageUrl = await imgEl?.getAttribute('src') || undefined;

            products.push({
                retailer: this.config.name,
                scrapedAt: new Date().toISOString(),
                id: generateHash(productUrl),
                name: name || 'Unknown',
                brand: undefined, // Hard to extract without specific selector
                price: this.normalizePrice(priceRaw),
                promoText: lines.find(l => l.match(/offer|save/i)) || undefined,
                productUrl,
                imageUrl,
                category: 'New',
                sourceType: 'html'
            });
        }

        return products;
    }
}
