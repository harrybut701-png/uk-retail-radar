import { Product } from './types';

export interface DiffResult {
    retailer: string;
    added: Product[];
    removed: Product[];
    changed: {
        product: Product;
        changes: string[];
    }[];
}

export function diffProducts(retailer: string, oldProducts: Product[], newProducts: Product[]): DiffResult {
    const oldMap = new Map(oldProducts.map(p => [p.id, p]));
    const newMap = new Map(newProducts.map(p => [p.id, p]));

    const added: Product[] = [];
    const changed: { product: Product; changes: string[] }[] = [];

    for (const p of newProducts) {
        const old = oldMap.get(p.id);
        if (!old) {
            added.push(p);
        } else {
            const changes: string[] = [];
            if (old.price !== p.price) changes.push(`Price: ${old.price} -> ${p.price}`);
            if (old.promoText !== p.promoText) changes.push(`Promo: ${old.promoText} -> ${p.promoText}`);
            if (changes.length > 0) {
                changed.push({ product: p, changes });
            }
        }
    }

    const removed = oldProducts.filter(p => !newMap.has(p.id));

    return { retailer, added, removed, changed };
}
