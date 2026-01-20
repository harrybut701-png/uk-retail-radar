
import * as fs from 'fs-extra';
import { LinkedInCsvExporter } from './csv-exporter';
import { ExtractionResultSchema } from './types';

/**
 * MOCK PROCESSOR FOR DEMONSTRATION
 * In a real scenario, this calls Gemini. 
 * For this test, it simulates the extraction from the messy text.
 */
async function main() {
    const filePath = process.argv[2];
    console.log(`Processing raw sweep data from ${filePath}... (Mock Mode)`);

    const mockResult = {
        retailer: "Tesco",
        products: [
            {
                product_name: "Beyond Meat Steak Tips",
                brand: "Beyond Meat",
                is_new_claim: true,
                confidence: "High",
                evidence: "Just landed in stores today: The new Beyond Meat Steak Tips",
                date_posted: "Jan 20, 2026",
                post_url: "https://www.linkedin.com/posts/beyondmeat_steak-tips-launching-activity-111"
            },
            {
                product_name: "Wicked Kitchen Mega Burger",
                brand: "Wicked Kitchen",
                is_new_claim: true,
                confidence: "High",
                evidence: "EXCLUSIVE TO TESCO: Check out the new Wicked Kitchen 'Mega Burger' launching Monday",
                date_posted: "Jan 19, 2026",
                post_url: "https://www.linkedin.com/posts/tesco_wicked-kitchen-exclusive-activity-222"
            },
            {
                product_name: "The Ultimate Biscoff Cheesecake",
                brand: "Biscoff / Unknown",
                is_new_claim: true,
                confidence: "Medium",
                evidence: "Now available in store - The Ultimate Biscoff Cheesecake",
                date_posted: "Jan 20, 2026",
                post_url: "https://www.linkedin.com/posts/biscoff_new-cheesecake-tesco-activity-333"
            },
            {
                product_name: "Holy Moly Extra Spicy Guacamole",
                brand: "Holy Moly",
                is_new_claim: true,
                confidence: "High",
                evidence: "Listed with Tesco from next week: 'Holy Moly' Guacamole... new 'Extra Spicy' version",
                date_posted: "Jan 20, 2026",
                post_url: "https://www.linkedin.com/posts/holymoly_spicy-guac-tesco-activity-444"
            }
        ]
    };

    try {
        const validated = ExtractionResultSchema.parse(mockResult);
        const exporter = new LinkedInCsvExporter('./data', 'linkedin_launches.csv');
        await exporter.appendExtraction(validated, `Sweep Test: ${filePath}`);
        console.log(`✅ Extracted and saved ${validated.products.length} products from messy text!`);
    } catch (e) {
        console.error(e);
    }
}

main().catch(console.error);
