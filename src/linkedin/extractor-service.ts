
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

    async extractFromText(postText: string): Promise<ExtractionResult> {
        const prompt = `${LINKEDIN_EXTRACTION_SYSTEM_PROMPT}\n\nUSER INSTRUCTION: You must extract EVERY product that even remotely looks like a new listing. Do not filter for "official" launches. If in doubt, extract it with confidence 'Low'.\n\nPost text:\n"""${postText}"""`;

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
