'use client';
import { useState } from 'react';
import { createGrn, createSupplier } from '@/app/actions/grn';
import { Plus, Trash2 } from 'lucide-react';

type Supplier = { id: string; name: string; phone: string | null; address: string | null };
type ProductOption = { id: string; sku: string; name: string };
type GrnLine = { productId: string; qty: number; unitCost: number };

type Grn = {
    id: string; grnNo: string; note: string | null; createdAt: Date;
    supplier: Supplier;
    items: { id: string; qty: number; unitCost: number; product: { name: string; sku: string } }[];
};

export default function GrnClient({ initialGrns, suppliers: initialSuppliers, products }: { initialGrns: Grn[]; suppliers: Supplier[]; products: ProductOption[] }) {
    const [grns, setGrns] = useState(initialGrns);
    const [suppliers, setSuppliers] = useState(initialSuppliers);
    const [showForm, setShowForm] = useState(false);
    const [supplierId, setSupplierId] = useState(initialSuppliers[0]?.id ?? '');
    const [note, setNote] = useState('');
    const [lines, setLines] = useState<GrnLine[]>([{ productId: products[0]?.id ?? '', qty: 1, unitCost: 0 }]);
    const [processing, setProcessing] = useState(false);

    const [showSupplierForm, setShowSupplierForm] = useState(false);
    const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', address: '' });

    function addLine() {
        setLines((prev) => [...prev, { productId: products[0]?.id ?? '', qty: 1, unitCost: 0 }]);
    }

    function updateLine(index: number, patch: Partial<GrnLine>) {
        setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
    }

    function removeLine(index: number) {
        setLines((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!supplierId || lines.length === 0) return;
        setProcessing(true);
        try {
            await createGrn(supplierId, lines, note);
            window.location.reload();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save GRN');
        } finally {
            setProcessing(false);
        }
    }

    async function handleAddSupplier() {
        if (!supplierForm.name.trim()) return;
        const supplier = await createSupplier(supplierForm);
        setSuppliers((prev) => [...prev, supplier]);
        setSupplierId(supplier.id);
        setSupplierForm({ name: '', phone: '', address: '' });
        setShowSupplierForm(false);
    }

    const total = lines.reduce((s, l) => s + l.qty * l.unitCost, 0);

    return (
        <div className="p-6 text-white">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">Goods Received Notes</h1>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded bg-yellow-500 px-4 py-2 text-black font-medium">
                    <Plus size={16} /> New GRN
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 rounded bg-neutral-900 p-4">
                    <div className="mb-3 flex gap-2">
                        <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="flex-1 rounded bg-neutral-800 px-3 py-2">
                            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <button type="button" onClick={() => setShowSupplierForm(!showSupplierForm)} className="rounded bg-neutral-700 px-3 text-sm">
                            + New Supplier
                        </button>
                    </div>

                    {showSupplierForm && (
                        <div className="mb-3 grid grid-cols-3 gap-2 rounded bg-neutral-800 p-3">
                            <input placeholder="Supplier name" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} className="rounded bg-neutral-900 px-2 py-1 text-sm" />
                            <input placeholder="Phone" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} className="rounded bg-neutral-900 px-2 py-1 text-sm" />
                            <button type="button" onClick={handleAddSupplier} className="rounded bg-green-600 px-2 text-sm">Save Supplier</button>
                        </div>
                    )}

                    <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="mb-3 w-full rounded bg-neutral-800 px-3 py-2 text-sm" />

                    <table className="mb-3 w-full text-sm">
                        <thead className="text-left text-neutral-400">
                            <tr><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Line Total</th><th></th></tr>
                        </thead>
                        <tbody>
                            {lines.map((line, i) => (
                                <tr key={i}>
                                    <td className="py-1">
                                        <select value={line.productId} onChange={(e) => updateLine(i, { productId: e.target.value })} className="w-full rounded bg-neutral-800 px-2 py-1">
                                            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <input type="number" value={line.qty} onChange={(e) => updateLine(i, { qty: Number(e.target.value) })} className="w-20 rounded bg-neutral-800 px-2 py-1" />
                                    </td>
                                    <td>
                                        <input type="number" value={line.unitCost} onChange={(e) => updateLine(i, { unitCost: Number(e.target.value) })} className="w-24 rounded bg-neutral-800 px-2 py-1" />
                                    </td>
                                    <td>Rs {(line.qty * line.unitCost).toFixed(2)}</td>
                                    <td><button type="button" onClick={() => removeLine(i)} className="text-red-500"><Trash2 size={14} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <button type="button" onClick={addLine} className="mb-3 text-sm text-blue-400">+ Add line</button>

                    <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                        <p className="font-semibold">Total: Rs {total.toFixed(2)}</p>
                        <button type="submit" disabled={processing} className="rounded bg-green-600 px-6 py-2 disabled:opacity-50">
                            {processing ? 'Saving...' : 'Save GRN & Update Stock'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {grns.map((g) => (
                    <div key={g.id} className="rounded bg-neutral-900 p-4">
                        <div className="mb-2 flex justify-between">
                            <p className="font-medium">{g.grnNo} — {g.supplier.name}</p>
                            <p className="text-sm text-neutral-500">{new Date(g.createdAt).toLocaleDateString()}</p>
                        </div>
                        {g.items.map((i) => (
                            <div key={i.id} className="flex justify-between text-sm text-neutral-400">
                                <span>{i.product.name} x{i.qty}</span>
                                <span>Rs {(i.qty * i.unitCost).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}