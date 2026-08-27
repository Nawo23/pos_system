import { getProducts, getCategories } from '@/app/actions/products';
import InventoryClient from './InventoryClient';

export default async function InventoryPage() {
    const [products, categories] = await Promise.all([getProducts(), getCategories()]);
    return (
        <InventoryClient
            initialProducts={products.map((p: any) => ({
                ...p, costPrice: Number(p.costPrice), sellPrice: Number(p.sellPrice),
            }))}
            categories={categories}
        />
    );
}
