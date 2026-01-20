
import { chromium, devices } from 'playwright';
import fs from 'fs-extra';

async function debug() {
    console.log('Launching browser (attempt 2)...');

    // Use a desktop device descriptor
    const device = devices['Desktop Chrome'];

    const browser = await chromium.launch({
        headless: true, // Try headless false locally if we could, but here we can't see it.
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });

    try {
        const context = await browser.newContext({
            ...device,
            locale: 'en-GB',
            timezoneId: 'Europe/London',
            permissions: ['geolocation'],
            geolocation: { longitude: -0.118092, latitude: 51.509865 }, // London
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        // Add init script to mask webdriver
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });

        const page = await context.newPage();

        // Go to homepage first to build trust/cookies
        console.log('Navigating to homepage...');
        await page.goto('https://www.sainsburys.co.uk/', { timeout: 30000 });
        console.log(`Homepage title: ${await page.title()}`);
        await page.waitForTimeout(3000);

        const url = 'https://www.sainsburys.co.uk/gol-ui/features/new-in';
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        console.log('Waiting for content...');
        await page.waitForTimeout(5000);

        console.log('Dumping HTML...');
        const content = await page.content();
        await fs.writeFile('debug-sainsburys-2.html', content);

        const title = await page.title();
        console.log(`Page title: ${title}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

debug();
