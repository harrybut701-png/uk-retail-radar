
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LINKEDIN_EXTRACTION_SYSTEM_PROMPT } from "./prompt";
import { ExtractionResultSchema, ExtractionResult } from "./types";

export class LinkedInExtractorService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            generationConfig: { responseMimeType: "application/json" }
        });
    }

    async extractFromText(postText: string, contextRetailer?: string): Promise<ExtractionResult> {
        let specializedPrompt = LINKEDIN_EXTRACTION_SYSTEM_PROMPT;

        if (contextRetailer) {
            specializedPrompt += `\n\nCONTEXT: This text was found in a search specifically for "${contextRetailer}". IF a product is mentioned, ASSUME the retailer is "${contextRetailer}" unless the text explicitly says otherwise (e.g. "Available at Asda" when context is Tesco).`;
        }

        const prompt = `${specializedPrompt}\n\nUSER INSTRUCTION: You must extract EVERY product that even remotely looks like a new listing. Do not filter for "official" launches. If in doubt, extract it with confidence 'Low'.\n\nPost text:\n"""${postText}"""`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            const json = JSON.parse(text);
            return ExtractionResultSchema.parse(json);
        } catch (e) {
            console.error("Failed to parse LLM response:", text);
            throw e;
        }
    }
}
