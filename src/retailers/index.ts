import { BaseRetailerScraper } from './base';
import { SainsburysScraper } from './sainsburys';
import { RetailerConfig } from '../types';
import { Page } from 'playwright';
import { generateHash } from '../utils';

class GenericScraper extends BaseRetailerScraper {
    async scrape(page: Page): Promise<any[]> {
        console.log(`[Generic] Scraper not fully implemented for ${this.config.name}`);
        return [];
    }
}

export function getScraper(config: RetailerConfig): BaseRetailerScraper {
    switch (config.type) {
        case 'sainsburys':
            return new SainsburysScraper(config);
        // Add others here
        default:
            return new GenericScraper(config);
    }
}
