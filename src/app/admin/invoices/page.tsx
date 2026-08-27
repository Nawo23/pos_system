import { getInvoices } from '@/app/actions/invoices';
import Link from 'next/link';

export default async function InvoicesPage() {
    const invoices = await getInvoices();

    return (
        <div className="p-6 text-white">
            <h1 className="mb-6 text-xl font-semibold">Invoices</h1>
            <table className="w-full text-sm">
                <thead className="text-left text-neutral-400">
                    <tr><th className="pb-2">Invoice #</th><th>Customer</th><th>Cashier</th><th>Items</th><th>Total</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                    {invoices.map((sale) => (
                        <tr key={sale.id} className="border-t border-neutral-800">
                            <td className="py-2">{sale.invoiceNo}</td>
                            <td>{sale.customer?.name ?? 'Walk-in'}</td>
                            <td>{sale.user.name}</td>
                            <td>{sale.items.length}</td>
                            <td>Rs {Number(sale.total).toFixed(2)}</td>
                            <td>{new Date(sale.createdAt).toLocaleString()}</td>
                            <td>
                                <Link href={`/receipt/${sale.id}`} target="_blank" className="text-blue-400 underline">
                                    View / Print
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}