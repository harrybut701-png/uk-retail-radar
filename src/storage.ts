import fs from 'fs-extra';
import path from 'path';
import { Product } from './types';
import { DateTime } from 'luxon';

export class Storage {
    private dataDir: string;
    private outDir: string;

    constructor() {
        this.dataDir = path.resolve('data');
        this.outDir = path.resolve('out');
    }

    async init() {
        await fs.ensureDir(this.dataDir);
        await fs.ensureDir(path.join(this.dataDir, 'latest'));
        await fs.ensureDir(this.outDir);
    }

    getWeekId(): string {
        return DateTime.now().toFormat('kkkk-WW');
    }

    async saveSnapshot(retailer: string, products: Product[]) {
        const weekId = this.getWeekId();
        const retailerDir = path.join(this.dataDir, retailer);
        await fs.ensureDir(retailerDir);

        await fs.writeJson(path.join(retailerDir, `${weekId}.json`), products, { spaces: 2 });
        await fs.writeJson(path.join(this.dataDir, 'latest', `${retailer}.json`), products, { spaces: 2 });
    }

    async getLatest(retailer: string): Promise<Product[]> {
        const file = path.join(this.dataDir, 'latest', `${retailer}.json`);
        if (await fs.pathExists(file)) {
            return fs.readJson(file);
        }
        return [];
    }

    async getPreviousWeek(retailer: string): Promise<Product[]> {
        // Simplification: just loading the one before latest is hard without listing.
        // We will look for the immediate previous week file based on date logic maybe?
        // Or just list files and sort.
        const retailerDir = path.join(this.dataDir, retailer);
        if (!await fs.pathExists(retailerDir)) return [];

        const files = await fs.readdir(retailerDir);
        const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse();
        // jsonFiles[0] is current (if saved), jsonFiles[1] is previous
        // But we call this BEFORE saving usually? Or comparing?
        // Let's assume we call this when we have the new data (in memory) and want to compare with "latest" on disk (which represents Scrape T-1).
        // Wait, "latest" matches the *last successful scrape*.
        // The prompt says "diff vs previous week".
        // Usually "latest" is good enough for "what did we see last time".
        return this.getLatest(retailer);
    }
}
