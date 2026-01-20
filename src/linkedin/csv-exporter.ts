
import * as fs from 'fs-extra';
import * as path from 'path';
import { ExtractionResult } from './types';

export class LinkedInCsvExporter {
    private filePath: string;

    constructor(outputDir: string, filename: string = 'linkedin_extractions.csv') {
        this.filePath = path.join(outputDir, filename);
    }

    async appendExtraction(result: ExtractionResult, sourceUrlOrId?: string) {
        if (!result.retailer || result.products.length === 0) {
            console.log('No valid retailer or products found in extraction.');
            return;
        }

        const header = 'Timestamp,Source,Retailer,Product Name,Brand,Category,Confidence,Evidence,Is New Claim,Date Posted,Post URL\n';
        const exists = await fs.pathExists(this.filePath);

        let existingKeys = new Set<string>();
        if (exists) {
            const content = await fs.readFile(this.filePath, 'utf-8');
            const lines = content.split('\n');
            // Simple CSV parsing to find existing (Retailer + Product Name)
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Very basic split (not perfect for all CSVs but works for our quoted format)
                const parts = line.split('","');
                if (parts.length > 4) {
                    const retailer = parts[2].replace(/^"/, '');
                    const productName = parts[3];
                    existingKeys.add(`${retailer}|${productName}`.toLowerCase());
                }
            }
        } else {
            await fs.ensureDir(path.dirname(this.filePath));
            await fs.writeFile(this.filePath, header);
        }

        const newRows = result.products.filter(p => {
            const key = `${result.retailer}|${p.product_name}`.toLowerCase();
            if (existingKeys.has(key)) {
                console.log(`Skipping duplicate: ${result.retailer} - ${p.product_name}`);
                return false;
            }
            return true;
        });

        if (newRows.length === 0) {
            console.log('No new (unique) products to append.');
            return;
        }

        const csvLines = newRows.map(p => {
            const clean = (val: any) => {
                const s = String(val).replace(/"/g, '""');
                return `"${s}"`;
            };
            return [
                clean(new Date().toISOString()),
                clean(sourceUrlOrId || 'N/A'),
                clean(result.retailer),
                clean(p.product_name),
                clean(p.brand || ''),
                clean(p.category || 'General'),
                clean(p.confidence),
                clean(p.evidence),
                clean(p.is_new_claim),
                clean(p.date_posted || 'Unknown'),
                clean(p.post_url || 'N/A')
            ].join(',');
        }).join('\n');

        await fs.appendFile(this.filePath, csvLines + '\n');
        console.log(`Appended ${newRows.length} unique rows to ${this.filePath}`);
    }
}
