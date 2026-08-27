import { getCurrentUser } from '@/lib/getCurrentUser';
import { redirect } from 'next/navigation';
import { getProducts, getCategories } from '@/app/actions/products';
import PosClient from './PosClient';

export default async function PosPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const [products, categories] = await Promise.all([getProducts(), getCategories()]);

    return (
        <PosClient
            initialProducts={products.map((p: any) => ({
                id: p.id, sku: p.sku, barcode: p.barcode, name: p.name,
                sellPrice: Number(p.sellPrice), stockQty: p.stockQty, categoryId: p.categoryId,
                imageUrl: p.imageUrl, inStock: p.inStock,
            }))}
            categories={categories}
        />
    );
}