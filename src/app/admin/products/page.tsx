import { getProducts, getCategories } from '@/app/actions/products';
import { getVehicleBrands } from '@/app/actions/vehicleBrands';
import ProductsClient from './ProductsClient';

export default async function ProductsPage() {
    const [products, categories, vehicleBrands] = await Promise.all([
        getProducts(), getCategories(), getVehicleBrands(),
    ]);
    return (
        <ProductsClient
            initialProducts={products.map((p) => ({
                ...p, costPrice: Number(p.costPrice), sellPrice: Number(p.sellPrice),
            }))}
            categories={categories}
            initialBrands={vehicleBrands}
        />
    );
}