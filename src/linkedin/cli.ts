
import * as fs from 'fs-extra';
import { LinkedInCsvExporter } from './csv-exporter';
import { ExtractionResultSchema } from './types';

async function main() {
    const jsonFilePath = process.argv[2];
    if (!jsonFilePath) {
        console.error('Usage: ts-node src/linkedin/cli.ts <path-to-json-result>');
        process.exit(1);
    }

    try {
        const rawData = await fs.readJson(jsonFilePath);
        // Validate with Zod
        const result = ExtractionResultSchema.parse(rawData);

        const exporter = new LinkedInCsvExporter('./data', 'linkedin_launches.csv');
        await exporter.appendExtraction(result, jsonFilePath); // Using filename as source for now

        console.log('Successfully processed extraction.');
    } catch (error) {
        console.error('Error processing JSON:', error);
        process.exit(1);
    }
}

main().catch(console.error);
