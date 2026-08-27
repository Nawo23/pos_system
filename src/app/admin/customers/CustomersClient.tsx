'use client';
import { useState } from 'react';
import { createCustomer, updateCustomer, deleteCustomer, getCustomerHistory } from '@/app/actions/customers';

type Customer = {
    id: string;
    name: string;
    phone: string | null;
    isRegular: boolean;
    discountRate: number;
    _count: { sales: number };
};

type SaleHistory = {
    id: string;
    invoiceNo: string;
    total: any;
    createdAt: Date;
    items: { id: string; qty: number; product: { name: string } }[];
};

export default function CustomersClient({ initialCustomers }: { initialCustomers: Customer[] }) {
    const [customers, setCustomers] = useState(initialCustomers);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', phone: '', isRegular: false, discountRate: 0 });
    const [historyFor, setHistoryFor] = useState<Customer | null>(null);
    const [history, setHistory] = useState<SaleHistory[]>([]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingId) {
            await updateCustomer(editingId, form);
        } else {
            await createCustomer(form);
        }
        window.location.reload();
    }

    function startEdit(c: Customer) {
        setEditingId(c.id);
        setForm({ name: c.name, phone: c.phone ?? '', isRegular: c.isRegular, discountRate: c.discountRate });
        setShowForm(true);
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this customer?')) return;
        await deleteCustomer(id);
        setCustomers((prev) => prev.filter((c) => c.id !== id));
    }

    async function viewHistory(c: Customer) {
        setHistoryFor(c);
        const h = await getCustomerHistory(c.id);
        setHistory(h);
    }

    return (
        <div className="p-6 bg-neutral-950 min-h-screen text-white">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">Customers</h1>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                        setForm({ name: '', phone: '', isRegular: false, discountRate: 0 });
                    }}
                    className="rounded bg-blue-600 px-4 py-2"
                >
                    {showForm ? 'Cancel' : '+ Add Customer'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-4 gap-3 rounded bg-neutral-900 p-4">
                    <input
                        placeholder="Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="rounded bg-neutral-800 px-3 py-2"
                        required
                    />
                    <input
                        placeholder="Phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="rounded bg-neutral-800 px-3 py-2"
                    />
                    <input
                        type="number"
                        placeholder="Discount %"
                        value={form.discountRate}
                        onChange={(e) => setForm({ ...form, discountRate: Number(e.target.value) })}
                        className="rounded bg-neutral-800 px-3 py-2"
                    />
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.isRegular}
                            onChange={(e) => setForm({ ...form, isRegular: e.target.checked })}
                        />
                        Daily Customer
                    </label>
                    <button type="submit" className="col-span-4 rounded bg-green-600 py-2">
                        {editingId ? 'Update' : 'Save'} Customer
                    </button>
                </form>
            )}

            <div className="grid grid-cols-2 gap-6">
                <table className="w-full text-sm">
                    <thead className="text-left text-neutral-400">
                        <tr>
                            <th className="pb-2">Name</th>
                            <th>Phone</th>
                            <th>Daily?</th>
                            <th>Discount</th>
                            <th>Orders</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((c) => (
                            <tr key={c.id} className="border-t border-neutral-800">
                                <td className="py-2">
                                    <button onClick={() => viewHistory(c)} className="hover:underline">
                                        {c.name}
                                    </button>
                                </td>
                                <td>{c.phone || '-'}</td>
                                <td>{c.isRegular ? '⭐ Yes' : 'No'}</td>
                                <td>{c.discountRate}%</td>
                                <td>{c._count.sales}</td>
                                <td className="space-x-2">
                                    <button onClick={() => startEdit(c)} className="text-blue-400">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(c.id)} className="text-red-500">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {historyFor && (
                    <div className="rounded bg-neutral-900 p-4">
                        <h2 className="mb-3 font-medium">{historyFor.name}'s Purchase History</h2>
                        {history.length === 0 && <p className="text-sm text-neutral-500">No orders yet.</p>}
                        {history.map((sale) => (
                            <div key={sale.id} className="border-t border-neutral-800 py-2 text-sm">
                                <div className="flex justify-between">
                                    <span>{sale.invoiceNo}</span>
                                    <span>Rs {Number(sale.total).toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-neutral-500">{new Date(sale.createdAt).toLocaleDateString()}</p>
                                {sale.items.map((i) => (
                                    <p key={i.id} className="text-xs text-neutral-400 ml-2">
                                        - {i.product.name} x{i.qty}
                                    </p>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
