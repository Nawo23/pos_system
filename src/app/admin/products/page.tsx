import { getProducts, getCategories } from '@/app/actions/products';
import ProductsClient from './ProductsClient';

export default async function ProductsPage() {
    const [products, categories] = await Promise.all([getProducts(), getCategories()]);
    return (
        <ProductsClient
            initialProducts={products.map((p: any) => ({
                ...p, costPrice: Number(p.costPrice), sellPrice: Number(p.sellPrice),
            }))}
            categories={categories}
        />
    );
}