
import axios from 'axios';

export interface SearchResultSnippet {
    title: string;
    link: string;
    snippet: string;
    date?: string;
}

export class GoogleSearchService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Performs a Google search for LinkedIn posts using the Serper.dev API
     * @param query The search query string
     * @param numResults Number of results to return (up to 100)
     */
    async searchLinkedIn(query: string, numResults: number = 50, timeRange: string = 'qdr:m', siteFilter: string = 'site:linkedin.com/posts'): Promise<SearchResultSnippet[]> {
        // Construct query with specific site filter
        const fullQuery = `${siteFilter} ${query}`;

        try {
            const response = await axios.post('https://google.serper.dev/search', {
                q: fullQuery,
                num: numResults,
                tbs: timeRange // Default to last month
            }, {
                headers: {
                    'X-API-KEY': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            const results = response.data.organic || [];
            return results.map((r: any) => ({
                title: r.title,
                link: r.link,
                snippet: r.snippet,
                date: r.date
            }));
        } catch (error: any) {
            console.error(`Search failed for query "${query}":`, error.response?.data || error.message);
            return [];
        }
    }
}
