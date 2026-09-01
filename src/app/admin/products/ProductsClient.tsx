'use client';
import { useState, useRef, useMemo } from 'react';
import { createProduct, updateProduct, deleteProduct, regenerateBarcode, createCategory, toggleStockStatus } from '@/app/actions/products';
import { createVehicleBrand } from '@/app/actions/vehicleBrands';
import { uploadProductImage } from '@/lib/supabase/uploadImage';
import BarcodeLabel from '@/components/BarcodeLabel';
import { Pencil, Trash2, Barcode, Plus, ImagePlus, X } from 'lucide-react';

type Category = { id: string; name: string };
type VehicleBrand = { id: string; name: string; vehicleType: string };
type Product = {
    id: string; sku: string; barcode: string | null; name: string; brand: string | null; categoryId: string;
    vehicleType: string; vehicleBrandId: string | null;
    unit: string; costPrice: number; sellPrice: number; stockQty: number; lowStockAt: number;
    imageUrl: string | null; inStock: boolean;
    category: Category;
};

const VEHICLE_TYPES = [
    { value: 'CAR', label: 'Car' },
    { value: 'BIKE', label: 'Motorcycle / Bike' },
    { value: 'THREE_WHEELER', label: 'Three-Wheeler' },
    { value: 'VAN', label: 'Van' },
    { value: 'TRUCK', label: 'Truck / Lorry' },
    { value: 'BUS', label: 'Bus' },
    { value: 'UNIVERSAL', label: 'Universal (Fits All)' },
];

const emptyForm = {
    sku: '', barcode: '', name: '', brand: '', categoryId: '', vehicleType: 'UNIVERSAL', vehicleBrandId: '',
    unit: 'pcs', costPrice: 0, sellPrice: 0, stockQty: 0, lowStockAt: 5, imageUrl: '',
};

export default function ProductsClient({
    initialProducts,
    categories: initialCategories,
    initialBrands,
}: {
    initialProducts: Product[];
    categories: Category[];
    initialBrands: VehicleBrand[];
}) {
    const [products, setProducts] = useState(initialProducts);
    const [categories, setCategories] = useState(initialCategories);
    const [brands, setBrands] = useState(initialBrands);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...emptyForm, categoryId: initialCategories[0]?.id ?? '' });
    const [barcodeView, setBarcodeView] = useState<Product | null>(null);
    const [search, setSearch] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newBrandName, setNewBrandName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [filterCategory, setFilterCategory] = useState('ALL');
    const [filterVehicleType, setFilterVehicleType] = useState('ALL');

    const filtered = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = filterCategory === 'ALL' || p.categoryId === filterCategory;
            const matchesVehicle = filterVehicleType === 'ALL' || p.vehicleType === filterVehicleType;
            return matchesSearch && matchesCategory && matchesVehicle;
        });
    }, [products, search, filterCategory, filterVehicleType]);

    const brandsForType = useMemo(
        () => brands.filter((b) => b.vehicleType === form.vehicleType),
        [brands, form.vehicleType]
    );

    function vehicleLabel(value: string) {
        return VEHICLE_TYPES.find((v) => v.value === value)?.label ?? value;
    }

    function brandName(id: string | null) {
        if (!id) return '-';
        return brands.find((b) => b.id === id)?.name ?? '-';
    }

    function openAdd() {
        setEditingId(null);
        setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' });
        setShowForm(true);
    }

    function openEdit(p: Product) {
        setEditingId(p.id);
        setForm({
            sku: p.sku, barcode: p.barcode ?? '', name: p.name, brand: p.brand ?? '', categoryId: p.categoryId,
            vehicleType: p.vehicleType, vehicleBrandId: p.vehicleBrandId ?? '',
            unit: p.unit, costPrice: p.costPrice, sellPrice: p.sellPrice,
            stockQty: p.stockQty, lowStockAt: p.lowStockAt, imageUrl: p.imageUrl ?? '',
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
            console.error('Image upload failed:', err);
            alert(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
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
            const payload = { ...form, vehicleBrandId: form.vehicleBrandId || undefined };
            if (editingId) {
                await updateProduct(editingId, payload);
            } else {
                await createProduct(payload);
            }
            window.location.reload();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save product');
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

    async function handleAddBrand() {
        if (!newBrandName.trim()) return;
        const brand = await createVehicleBrand(newBrandName.trim(), form.vehicleType);
        setBrands((prev) => [...prev, brand]);
        setForm((f) => ({ ...f, vehicleBrandId: brand.id }));
        setNewBrandName('');
    }

    return (
        <div className="p-6 text-white">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">Products</h1>
                <button onClick={openAdd} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb)', boxShadow: '0 0 14px 0 rgba(59,130,246,0.35)' }}>
                    <Plus size={16} /> Add Product
                </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-3">
                <input
                    placeholder="Search by name or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 rounded-lg bg-[#16171a] border border-[#22242a] px-3 py-2 text-sm outline-none"
                />
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-lg bg-[#16171a] border border-[#22242a] px-3 py-2 text-sm outline-none">
                    <option value="ALL">All Categories</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={filterVehicleType} onChange={(e) => setFilterVehicleType(e.target.value)} className="rounded-lg bg-[#16171a] border border-[#22242a] px-3 py-2 text-sm outline-none">
                    <option value="ALL">All Vehicle Types</option>
                    {VEHICLE_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
                {(filterCategory !== 'ALL' || filterVehicleType !== 'ALL' || search) && (
                    <button onClick={() => { setFilterCategory('ALL'); setFilterVehicleType('ALL'); setSearch(''); }} className="rounded-lg bg-[#22242a] px-3 py-2 text-sm text-neutral-400 hover:text-white">
                        Clear Filters
                    </button>
                )}
                <span className="ml-auto self-center text-xs text-neutral-500">{filtered.length} of {products.length} products</span>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setShowForm(false)}>
                    <form
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-[#16171a] border border-[#22242a] p-6"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">{editingId ? 'Edit Product' : 'Add Product'}</h2>
                            <button type="button" onClick={() => setShowForm(false)} className="text-neutral-500 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="mb-5">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Product Image</label>
                            <div className="flex items-start gap-4">
                                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded bg-[#0d0e10] border border-[#22242a]">
                                    {form.imageUrl ? <img src={form.imageUrl} alt="Product preview" className="h-full w-full object-cover" /> : <ImagePlus size={24} className="text-neutral-600" />}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="rounded bg-[#22242a] px-3 py-1.5 text-sm hover:bg-[#2a2c33] disabled:opacity-50">
                                            {uploading ? 'Processing Image...' : 'Choose Image File'}
                                        </button>
                                        {form.imageUrl && (
                                            <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))} className="text-sm text-red-400 hover:underline">Remove</button>
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Or paste image URL (https://...)"
                                            value={form.imageUrl}
                                            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                                            className="w-full rounded bg-[#0d0e10] border border-[#22242a] px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-600 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Basic Info</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Product Name *</label>
                                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded bg-[#0d0e10] border border-[#22242a] px-3 py-2 text-sm" required />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Brand (manufacturer of the part)</label>
                                    <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Bosch, Denso" className="w-full rounded bg-[#0d0e10] border border-[#22242a] px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">SKU *</label>
                                    <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded bg-[#0d0e10] border border-[#22242a] px-3 py-2 text-sm" required />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Barcode (blank = auto)</label>
                                    <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="w-full rounded bg-[#0d0e10] border border-[#22242a] px-3 py-2 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="mb-1 block text-xs text-neutral-500">Category *</label>
                                    <div className="flex gap-2">
                                        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="flex-1 rounded bg-[#0d0e10] border border-[#22242a] px-3 py-2 text-sm">
                                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <input placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-36 rounded bg-[#0d0e10] border border-[#22242a] px-2 py-2 text-sm" />
                                        <button type="button" onClick={handleAddCategory} className="rounded bg-[#22242a] px-3 text-sm">+</button>
                                    </div>
                                </div>

                                {/* Vehicle Type */}
                                <div className="col-span-2">
                                    <label className="mb-1 block text-xs text-neutral-500">Vehicle Type *</label>
                                    <select
                                        value={form.vehicleType}
                                        onChange={(e) => setForm({ ...form, vehicleType: e.target.value, vehicleBrandId: '' })}
                                        className="w-full rounded bg-[#0d0e10] border border-[#22242a] px-3 py-2 text-sm"
                                    >
                                        {VEHICLE_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                                    </select>
                                </div>

                                {/* Vehicle Brand / Model — only for actual vehicle types */}
                                {form.vehicleType !== 'UNIVERSAL' && (
                                    <div className="col-span-2">
                                        <label className="mb-1 block text-xs text-neutral-500">Vehicle Brand / Model</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={form.vehicleBrandId}
                                                onChange={(e) => setForm({ ...form, vehicleBrandId: e.target.value })}
                                                className="flex-1 rounded bg-[#0d0e10] border border-[#22242a] px-3 py-2 text-sm"
                                            >
                                                <option value="">No specific brand (fits all {form.vehicleType.toLowerCase().replace('_', ' ')}s)</option>
                                                {brandsForType.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                            <input
                                                placeholder="New brand e.g. BMW"
                                                value={newBrandName}
                                                onChange={(e) => setNewBrandName(e.target.value)}
                                                className="w-36 rounded bg-[#0d0e10] border border-[#22242a] px-2 py-2 text-sm"
                                            />
                                            <button type="button" onClick={handleAddBrand} className="rounded bg-[#22242a] px-3 text-sm">+</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Pricing & Stock</label>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Unit</label>
                                    <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs / meter / box" className="w-full rounded bg-[#0d0e10] border border-[#22242a] px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Cost Price (Rs)</label>
                                    <input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} className="w-full rounded bg-[#0d0e10] border border-[#22242a] px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Sell Price (Rs)</label>
                                    <input type="number" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: Number(e.target.value) })} className="w-full rounded bg-[#0d0e10] border border-[#22242a] px-3 py-2 text-sm" />
                                </div>
                                {!editingId && (
                                    <div>
                                        <label className="mb-1 block text-xs text-neutral-500">Initial Stock Qty</label>
                                        <input type="number" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: Number(e.target.value) })} className="w-full rounded bg-[#0d0e10] border border-[#22242a] px-3 py-2 text-sm" />
                                    </div>
                                )}
                                <div>
                                    <label className="mb-1 block text-xs text-neutral-500">Low Stock Alert At</label>
                                    <input type="number" value={form.lowStockAt} onChange={(e) => setForm({ ...form, lowStockAt: Number(e.target.value) })} className="w-full rounded bg-[#0d0e10] border border-[#22242a] px-3 py-2 text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 border-t border-[#22242a] pt-4">
                            <button type="submit" disabled={saving || uploading} className="flex-1 rounded-lg py-2.5 font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb)', boxShadow: '0 0 14px 0 rgba(59,130,246,0.35)' }}>
                                {saving ? 'Saving...' : editingId ? 'Update Product' : 'Save Product'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-[#22242a] px-6 py-2.5">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <table className="w-full text-sm">
                <thead className="text-left text-neutral-400">
                    <tr>
                        <th className="pb-2">Image</th><th>SKU</th><th>Name</th><th>Category</th><th>Vehicle Type</th><th>Brand/Model</th><th>Stock</th><th>Cost</th><th>Sell</th><th>Status</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((p) => (
                        <tr key={p.id} className="border-t border-[#22242a]">
                            <td className="py-2">
                                <div className="h-10 w-10 overflow-hidden rounded bg-[#0d0e10]">
                                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" /> : null}
                                </div>
                            </td>
                            <td>{p.sku}</td>
                            <td>{p.name}{p.brand ? <span className="text-neutral-500"> · {p.brand}</span> : ''}</td>
                            <td>{p.category.name}</td>
                            <td className="text-neutral-400">{vehicleLabel(p.vehicleType)}</td>
                            <td className="text-neutral-400">{brandName(p.vehicleBrandId)}</td>
                            <td className={p.stockQty <= p.lowStockAt ? 'text-red-400' : ''}>{p.stockQty}</td>
                            <td>Rs {p.costPrice.toFixed(2)}</td>
                            <td>Rs {p.sellPrice.toFixed(2)}</td>
                            <td>
                                <button
                                    onClick={() => handleToggleStock(p.id, p.inStock)}
                                    className="rounded-full px-3 py-1 text-xs font-medium"
                                    style={{ background: p.inStock ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', color: p.inStock ? '#4ade80' : '#f87171' }}
                                >
                                    {p.inStock ? 'In Stock' : 'Out of Stock'}
                                </button>
                            </td>
                            <td className="space-x-3">
                                <button onClick={() => setBarcodeView(p)} className="inline-flex items-center gap-1" style={{ color: '#60a5fa' }}><Barcode size={14} /></button>
                                <button onClick={() => openEdit(p)} className="inline-flex items-center gap-1 text-blue-400"><Pencil size={14} /></button>
                                <button onClick={() => handleDelete(p.id)} className="inline-flex items-center gap-1 text-red-400"><Trash2 size={14} /></button>
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