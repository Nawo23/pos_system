import { getInvoices } from '@/app/actions/invoices';
import Link from 'next/link';

export default async function InvoicesPage() {
    const invoices = await getInvoices();

    return (
        <div className="p-6 text-white">
            <h1 className="mb-6 text-xl font-semibold">Invoices</h1>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-left text-neutral-400 border-b border-neutral-800">
                        <tr>
                            <th className="pb-3">Invoice #</th>
                            <th className="pb-3">Customer</th>
                            <th className="pb-3">Cashier</th>
                            <th className="pb-3">Items</th>
                            <th className="pb-3">Total</th>
                            <th className="pb-3">Payment</th>
                            <th className="pb-3">Paid</th>
                            <th className="pb-3">Change / Balance</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((sale: any) => {
                            const total = Number(sale.total);
                            const paidAmount = sale.paidAmount !== null && sale.paidAmount !== undefined ? Number(sale.paidAmount) : total;
                            const changeAmount = sale.changeAmount !== null && sale.changeAmount !== undefined ? Number(sale.changeAmount) : (paidAmount - total);
                            const pmLabel = sale.paymentMethod === 'CARD' ? 'Card' : sale.paymentMethod === 'BANK_TRANSFER' ? 'Transfer' : 'Cash';

                            return (
                                <tr key={sale.id} className="border-t border-neutral-800/80 hover:bg-neutral-900/50">
                                    <td className="py-3 font-medium text-neutral-200">{sale.invoiceNo}</td>
                                    <td>{sale.customer?.name ?? 'Walk-in'}</td>
                                    <td>{sale.user.name}</td>
                                    <td>{sale.items.length}</td>
                                    <td className="font-semibold text-blue-400">Rs {total.toFixed(2)}</td>
                                    <td>
                                        <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                                            {pmLabel}
                                        </span>
                                    </td>
                                    <td>Rs {paidAmount.toFixed(2)}</td>
                                    <td>
                                        {changeAmount >= 0 ? (
                                            <span className="text-emerald-400">Rs {changeAmount.toFixed(2)} (Change)</span>
                                        ) : (
                                            <span className="text-red-400">Rs {Math.abs(changeAmount).toFixed(2)} (Due)</span>
                                        )}
                                    </td>
                                    <td className="text-neutral-400 text-xs">{new Date(sale.createdAt).toLocaleString()}</td>
                                    <td>
                                        <Link href={`/receipt/${sale.id}`} target="_blank" className="text-blue-400 hover:underline text-xs">
                                            View / Print
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}