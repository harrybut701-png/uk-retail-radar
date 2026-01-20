
import { chromium } from 'playwright';

export async function scrapeLinkedInPost(url: string): Promise<string> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // LinkedIn often shows a "Join to view full post" overlay or redirects to login.
        // We'll try to find the post body.
        // For public posts, the content is often in .feed-shared-update-v2__description or similar.
        // On the share-post page, it might be different.

        // Wait for either the post content or the login wall
        await page.waitForSelector('article, .main-content, .login-form', { timeout: 10000 });

        if (await page.locator('.login-form').isVisible()) {
            throw new Error("LinkedIn login wall detected. Cannot scrape public text directly.");
        }

        // Attempt to extract text from common containers
        const text = await page.evaluate(() => {
            // Try various selectors used by LinkedIn
            const selectors = [
                '.feed-shared-update-v2__description',
                '.update-components-text',
                'article',
                '.main-content'
            ];

            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el && el.textContent) return el.textContent.trim();
            }

            return document.body.innerText; // Fallback
        });

        return text;
    } finally {
        await browser.close();
    }
}
