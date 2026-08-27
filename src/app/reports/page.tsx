import { getDashboardStats } from '@/app/actions/reports';

export default async function ReportsPage() {
    const stats = await getDashboardStats();

    return (
        <div className="p-6 bg-neutral-950 min-h-screen text-white">
            <h1 className="mb-6 text-xl font-semibold">Reports</h1>

            <div className="mb-6 grid grid-cols-4 gap-4">
                <StatCard label="Today's Sales" value={`Rs ${stats.todayTotal.toFixed(2)}`} sub={`${stats.todayCount} orders`} />
                <StatCard label="This Month" value={`Rs ${stats.monthTotal.toFixed(2)}`} sub={`${stats.monthCount} orders`} />
                <StatCard label="Month Profit" value={`Rs ${stats.monthProfit.toFixed(2)}`} />
                <StatCard label="Low Stock Items" value={String(stats.lowStock.length)} />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="rounded bg-neutral-900 p-4">
                    <h2 className="mb-3 font-medium">Top Products (This Month)</h2>
                    {stats.topProducts.map((t) => (
                        <div key={t.product?.id} className="flex justify-between border-t border-neutral-800 py-2 text-sm">
                            <span>{t.product?.name}</span>
                            <span>{t.qty} sold · Rs {t.revenue.toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="rounded bg-neutral-900 p-4">
                    <h2 className="mb-3 font-medium text-red-400">Low Stock</h2>
                    {stats.lowStock.map((p) => (
                        <div key={p.id} className="flex justify-between border-t border-neutral-800 py-2 text-sm">
                            <span>{p.name}</span>
                            <span className="text-red-500">{p.stockQty} left</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded bg-neutral-900 p-4">
            <p className="text-sm text-neutral-400">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
            {sub && <p className="text-xs text-neutral-500">{sub}</p>}
        </div>
    );
}