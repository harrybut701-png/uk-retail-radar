import crypto from 'crypto';

export function generateHash(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
}

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
