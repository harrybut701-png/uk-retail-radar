
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LINKEDIN_EXTRACTION_SYSTEM_PROMPT } from "./prompt";
import { ExtractionResultSchema, ExtractionResult } from "./types";

export class LinkedInExtractorService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
    }

    async extractFromText(postText: string): Promise<ExtractionResult> {
        const prompt = `${LINKEDIN_EXTRACTION_SYSTEM_PROMPT}\n\nPost text:\n"""${postText}"""`;

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
