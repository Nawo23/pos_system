import { getGrns, getSuppliers } from '@/app/actions/grn';
import { getProducts } from '@/app/actions/products';
import GrnClient from './GrnClient';

export default async function GrnPage() {
    const [grns, suppliers, products] = await Promise.all([getGrns(), getSuppliers(), getProducts()]);
    return (
        <GrnClient
            initialGrns={grns.map((g) => ({
                ...g,
                items: g.items.map((i) => ({ ...i, unitCost: Number(i.unitCost) })),
            }))}
            suppliers={suppliers}
            products={products.map((p) => ({ id: p.id, sku: p.sku, name: p.name }))}
        />
    );
}