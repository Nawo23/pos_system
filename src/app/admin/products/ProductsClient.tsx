'use client';
import { useState, useRef } from 'react';
import { createProduct, updateProduct, deleteProduct, regenerateBarcode, createCategory, toggleStockStatus } from '@/app/actions/products';
import { uploadProductImage } from '@/lib/supabase/uploadImage';
import BarcodeLabel from '@/components/BarcodeLabel';
import { Pencil, Trash2, Barcode, Plus, ImagePlus, X } from 'lucide-react';

type Category = { id: string; name: string };
type Product = {
    id: string; sku: string; barcode: string | null; name: string; brand: string | null; categoryId: string;
    unit: string; costPrice: number; sellPrice: number; stockQty: number; lowStockAt: number;
    imageUrl: string | null; inStock: boolean;
    category: Category;
};

const emptyForm = {
    sku: '', barcode: '', name: '', brand: '', categoryId: '',
    unit: 'pcs', costPrice: 0, sellPrice: 0, stockQty: 0, lowStockAt: 5, imageUrl: '',
};

export default function ProductsClient({ initialProducts, categories: initialCategories }: { initialProducts: Product[]; categories: Category[] }) {
    const [products, setProducts] = useState(initialProducts);
    const [categories, setCategories] = useState(initialCategories);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...emptyForm, categoryId: initialCategories[0]?.id ?? '' });
    const [barcodeView, setBarcodeView] = useState<Product | null>(null);
    const [search, setSearch] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filtered = products.filter(
        (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    );

    function openAdd() {
        setEditingId(null);
        setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' });
        setShowForm(true);
    }

    function openEdit(p: Product) {
        setEditingId(p.id);
        setForm({
            sku: p.sku, barcode: p.barcode ?? '', name: p.name, brand: p.brand ?? '', categoryId: p.categoryId,
            unit: p.unit, costPrice: p.costPrice, sellPrice: p.sellPrice, stockQty: p.stockQty, lowStockAt: p.lowStockAt,
            imageUrl: p.imageUrl ?? '',
        });
        setShowForm(true);
    }

    async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadProductImage(file);
            setForm((f) => ({ ...f, imageUrl: url }));
        } catch (err) {
            alert('Image upload failed. Check your Supabase storage bucket is public.');
        } finally {
            setUploading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim() || !form.sku.trim() || !form.categoryId) {
            alert('Name, SKU and Category are required.');
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                await updateProduct(editingId, form);
            } else {
                await createProduct(form);
            }
            window.location.reload();
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this product? This cannot be undone.')) return;
        await deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
    }

    async function handleRegenerateBarcode(id: string) {
        const barcode = await regenerateBarcode(id);
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, barcode } : p)));
    }

    async function handleToggleStock(id: string, current: boolean) {
        await toggleStockStatus(id, !current);
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, inStock: !current } : p)));
    }

    async function handleAddCategory() {
        if (!newCategory.trim()) return;
        const cat = await createCategory(newCategory.trim());
        setCategories((prev) => [...prev, cat]);
        setForm((f) => ({ ...f, categoryId: cat.id }));
        setNewCategory('');
    }

    return (
        <div className="p-6 text-white">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">Products</h1>
                <button onClick={openAdd} className="flex items-center gap-2 rounded bg-yellow-500 px-4 py-2 text-black font-medium">
                    <Plus size={16} /> Add Product
                </button>
            </div>

            <input
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4 w-full max-w-md rounded bg-neutral-800 px-3 py-2 text-sm outline-none"
            />

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setShowForm(false)}>
                    <form
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-neutral-900 p-6"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">{editingId ? 'Edit Product' : 'Add Product'}</h2>
                            <button type="button" onClick={() => setShowForm(false)} className="text-neutral-500 hover:text-white"><X size={20} /></button>
                        </div>

                        {/* Image */}
                        <div className="mb-5">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Product Image</label>
                            <div className="flex items-center gap-4">
                                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded bg-neutral-800">
                                    {form.imageUrl ? (
                                        <img src={form.imageUrl} alt="Product" className="h-full w-full object-cover" />
                                    ) : (
                                        <ImagePlus size={24} className="text-neutral-600" />
                                    )}
                                </div>
                                <div>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded bg-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-600 disabled:opacity-50">
                                        {uploading ? 'Uploading...' : 'Choose Image'}
                                    </button>
                                    {form.imageUrl && (
                                        <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))} className="ml-2 text-sm text-red-400">
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="mb-5">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Basic Info</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Product Name *</label>
                                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded bg-neutral-800 px-3 py-2 text-sm" required />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Brand</label>
                                    <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full rounded bg-neutral-800 px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">SKU *</label>
                                    <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded bg-neutral-800 px-3 py-2 text-sm" required />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Barcode (blank = auto)</label>
                                    <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="w-full rounded bg-neutral-800 px-3 py-2 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="mb-1 block text-xs text-neutral-500">Category *</label>
                                    <div className="flex gap-2">
                                        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="flex-1 rounded bg-neutral-800 px-3 py-2 text-sm">
                                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <input placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-36 rounded bg-neutral-800 px-2 py-2 text-sm" />
                                        <button type="button" onClick={handleAddCategory} className="rounded bg-neutral-700 px-3 text-sm">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pricing & Stock */}
                        <div className="mb-5">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Pricing & Stock</label>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Unit</label>
                                    <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs / meter / box" className="w-full rounded bg-neutral-800 px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Cost Price (Rs)</label>
                                    <input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} className="w-full rounded bg-neutral-800 px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Sell Price (Rs)</label>
                                    <input type="number" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: Number(e.target.value) })} className="w-full rounded bg-neutral-800 px-3 py-2 text-sm" />
                                </div>
                                {!editingId && (
                                    <div>
                                        <label className="mb-1 block text-xs text-neutral-500">Initial Stock Qty</label>
                                        <input type="number" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: Number(e.target.value) })} className="w-full rounded bg-neutral-800 px-3 py-2 text-sm" />
                                    </div>
                                )}
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Low Stock Alert At</label>
                                    <input type="number" value={form.lowStockAt} onChange={(e) => setForm({ ...form, lowStockAt: Number(e.target.value) })} className="w-full rounded bg-neutral-800 px-3 py-2 text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 border-t border-neutral-800 pt-4">
                            <button type="submit" disabled={saving || uploading} className="flex-1 rounded bg-green-600 py-2.5 font-medium hover:bg-green-500 disabled:opacity-50">
                                {saving ? 'Saving...' : editingId ? 'Update Product' : 'Save Product'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="rounded bg-neutral-700 px-6 py-2.5">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <table className="w-full text-sm">
                <thead className="text-left text-neutral-400">
                    <tr>
                        <th className="pb-2">Image</th><th>SKU</th><th>Name</th><th>Category</th><th>Stock</th><th>Cost</th><th>Sell</th><th>Status</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((p) => (
                        <tr key={p.id} className="border-t border-neutral-800">
                            <td className="py-2">
                                <div className="h-10 w-10 overflow-hidden rounded bg-neutral-800">
                                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" /> : null}
                                </div>
                            </td>
                            <td>{p.sku}</td>
                            <td>{p.name}{p.brand ? <span className="text-neutral-500"> · {p.brand}</span> : ''}</td>
                            <td>{p.category.name}</td>
                            <td className={p.stockQty <= p.lowStockAt ? 'text-red-500' : ''}>{p.stockQty}</td>
                            <td>Rs {p.costPrice.toFixed(2)}</td>
                            <td>Rs {p.sellPrice.toFixed(2)}</td>
                            <td>
                                <button
                                    onClick={() => handleToggleStock(p.id, p.inStock)}
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${p.inStock ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}
                                >
                                    {p.inStock ? 'In Stock' : 'Out of Stock'}
                                </button>
                            </td>
                            <td className="space-x-3">
                                <button onClick={() => setBarcodeView(p)} className="inline-flex items-center gap-1 text-yellow-500"><Barcode size={14} /></button>
                                <button onClick={() => openEdit(p)} className="inline-flex items-center gap-1 text-blue-400"><Pencil size={14} /></button>
                                <button onClick={() => handleDelete(p.id)} className="inline-flex items-center gap-1 text-red-500"><Trash2 size={14} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {barcodeView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setBarcodeView(null)}>
                    <div onClick={(e) => e.stopPropagation()} className="rounded bg-white p-6">
                        <BarcodeLabel value={barcodeView.barcode ?? ''} productName={barcodeView.name} price={barcodeView.sellPrice} />
                        <div className="mt-3 flex justify-between gap-2">
                            <button onClick={() => handleRegenerateBarcode(barcodeView.id)} className="text-xs text-blue-600 underline">Regenerate</button>
                            <button onClick={() => setBarcodeView(null)} className="text-xs text-neutral-600 underline">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}