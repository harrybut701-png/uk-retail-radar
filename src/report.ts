import { DiffResult } from './diff';
import fs from 'fs-extra';
import path from 'path';

export async function generateReport(diffs: DiffResult[], outDir: string) {
    await fs.ensureDir(outDir);

    // JSON Report
    await fs.writeJson(path.join(outDir, 'weekly-report.json'), diffs, { spaces: 2 });

    // Markdown Report
    let md = '# UK Retail New-In Weekly Report\n\n';
    md += `Generated at: ${new Date().toLocaleString()}\n\n`;

    for (const diff of diffs) {
        if (diff.added.length === 0 && diff.changed.length === 0) continue;

        md += `## ${diff.retailer}\n`;

        if (diff.added.length > 0) {
            md += `### 🆕 New Items (${diff.added.length})\n`;
            md += `| Product | Price | Brand | Link |\n`;
            md += `| --- | --- | --- | --- |\n`;
            for (const p of diff.added) {
                md += `| ${p.name} | ${p.price || 'N/A'} | ${p.brand || '-'} | [Link](${p.productUrl}) |\n`;
            }
            md += `\n`;
        }

        if (diff.changed.length > 0) {
            md += `### 📉 Price/Promo Changes (${diff.changed.length})\n`;
            for (const c of diff.changed) {
                md += `- **${c.product.name}**: ${c.changes.join(', ')}\n`;
            }
            md += `\n`;
        }
    }

    if (diffs.every(d => d.added.length === 0 && d.changed.length === 0)) {
        md += "No significant changes detected this week.\n";
    }

    await fs.writeFile(path.join(outDir, 'weekly-report.md'), md);
}
