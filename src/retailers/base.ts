import { Page } from 'playwright';
import { Product, RetailerConfig } from '../types';

export abstract class BaseRetailerScraper {
    constructor(protected config: RetailerConfig) { }

    abstract scrape(page: Page): Promise<Product[]>;

    protected normalizePrice(priceStr: string | null | undefined): number | null {
        if (!priceStr) return null;
        const match = priceStr.match(/[\d\.]+/);
        return match ? parseFloat(match[0]) : null;
    }
}
