'use client';
import { useState } from 'react';
import { createProduct, stockIn } from '@/app/actions/products';

type Category = { id: string; name: string };
type Product = {
    id: string; sku: string; name: string; brand: string | null; categoryId: string;
    unit: string; costPrice: number; sellPrice: number; stockQty: number; lowStockAt: number;
};

export default function InventoryClient({ initialProducts, categories }: { initialProducts: Product[]; categories: Category[] }) {
    const [products, setProducts] = useState(initialProducts);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        sku: '', name: '', brand: '', categoryId: categories[0]?.id ?? '',
        unit: 'pcs', costPrice: 0, sellPrice: 0, stockQty: 0, lowStockAt: 5,
    });

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        await createProduct(form);
        window.location.reload();
    }

    async function handleStockIn(productId: string) {
        const qty = Number(prompt('Quantity to add:'));
        if (!qty) return;
        await stockIn(productId, qty);
        window.location.reload();
    }

    return (
        <div className="p-6 bg-neutral-950 min-h-screen text-white">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">Inventory</h1>
                <button onClick={() => setShowForm(!showForm)} className="rounded bg-blue-600 px-4 py-2">
                    {showForm ? 'Cancel' : '+ Add Product'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="mb-6 grid grid-cols-4 gap-3 rounded bg-neutral-900 p-4">
                    <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="rounded bg-neutral-800 px-3 py-2" required />
                    <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded bg-neutral-800 px-3 py-2" required />
                    <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="rounded bg-neutral-800 px-3 py-2" />
                    <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="rounded bg-neutral-800 px-3 py-2">
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="rounded bg-neutral-800 px-3 py-2" />
                    <input type="number" placeholder="Cost Price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} className="rounded bg-neutral-800 px-3 py-2" />
                    <input type="number" placeholder="Sell Price" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: Number(e.target.value) })} className="rounded bg-neutral-800 px-3 py-2" />
                    <input type="number" placeholder="Initial Stock" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: Number(e.target.value) })} className="rounded bg-neutral-800 px-3 py-2" />
                    <button type="submit" className="col-span-4 rounded bg-green-600 py-2">Save Product</button>
                </form>
            )}

            <table className="w-full text-sm">
                <thead className="text-left text-neutral-400">
                    <tr>
                        <th className="pb-2">SKU</th><th>Name</th><th>Stock</th><th>Cost</th><th>Sell</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((p) => (
                        <tr key={p.id} className="border-t border-neutral-800">
                            <td className="py-2">{p.sku}</td>
                            <td>{p.name}</td>
                            <td className={p.stockQty <= p.lowStockAt ? 'text-red-500' : ''}>{p.stockQty}</td>
                            <td>Rs {p.costPrice.toFixed(2)}</td>
                            <td>Rs {p.sellPrice.toFixed(2)}</td>
                            <td><button onClick={() => handleStockIn(p.id)} className="text-blue-400">+ Stock</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}