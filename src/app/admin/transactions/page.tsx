import { getTransactions } from '@/app/actions/transactions';

const TYPE_STYLES: Record<string, string> = {
    STOCK_IN: 'bg-green-900 text-green-300',
    SALE: 'bg-red-900 text-red-300',
    ADJUSTMENT: 'bg-neutral-800 text-neutral-300',
};

export default async function TransactionsPage() {
    const transactions = await getTransactions();

    return (
        <div className="p-6 text-white">
            <h1 className="mb-6 text-xl font-semibold">Transactions</h1>
            <table className="w-full text-sm">
                <thead className="text-left text-neutral-400">
                    <tr>
                        <th className="pb-2">Date</th><th>Product</th><th>Type</th><th>Qty Change</th><th>Supplier</th><th>Note</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((t) => (
                        <tr key={t.id} className="border-t border-neutral-800">
                            <td className="py-2">{new Date(t.createdAt).toLocaleString()}</td>
                            <td>{t.product.name}</td>
                            <td>
                                <span className={`rounded px-2 py-0.5 text-xs ${TYPE_STYLES[t.type] ?? 'bg-neutral-800 text-neutral-300'}`}>
                                    {t.type.replace('_', ' ')}
                                </span>
                            </td>
                            <td className={t.qtyChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {t.qtyChange >= 0 ? '+' : ''}{t.qtyChange}
                            </td>
                            <td>{t.supplier?.name ?? '-'}</td>
                            <td className="text-neutral-500">{t.note ?? '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}