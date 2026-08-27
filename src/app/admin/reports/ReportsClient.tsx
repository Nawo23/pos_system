'use client';
import { useState, useTransition } from 'react';
import { getPeriodReport, Period } from '@/app/actions/reports';
import Link from 'next/link';

type Report = Awaited<ReturnType<typeof getPeriodReport>>;

const TABS: { label: string; value: Period }[] = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
];

export default function ReportsClient({ initialReport }: { initialReport: Report }) {
    const [period, setPeriod] = useState<Period>('daily');
    const [report, setReport] = useState<Report>(initialReport);
    const [isPending, startTransition] = useTransition();

    function switchPeriod(p: Period) {
        setPeriod(p);
        startTransition(async () => {
            const data = await getPeriodReport(p);
            setReport(data);
        });
    }

    const rangeLabel = `${new Date(report.rangeStart).toLocaleDateString()} – ${new Date(report.rangeEnd).toLocaleDateString()}`;

    return (
        <div className="p-6 text-white">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">Reports</h1>
                <div className="flex rounded bg-neutral-900 p-1">
                    {TABS.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => switchPeriod(t.value)}
                            className={`rounded px-4 py-1.5 text-sm ${period === t.value ? 'bg-yellow-500 text-black font-medium' : 'text-neutral-400'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <p className="mb-4 text-sm text-neutral-500">{rangeLabel}{isPending && ' · loading...'}</p>

            <div className="mb-6 grid grid-cols-5 gap-4">
                <StatCard label="Revenue" value={`Rs ${report.revenue.toFixed(2)}`} />
                <StatCard label="Cost" value={`Rs ${report.cost.toFixed(2)}`} />
                <StatCard
                    label={report.profit >= 0 ? 'Profit' : 'Loss'}
                    value={`Rs ${Math.abs(report.profit).toFixed(2)}`}
                    highlight={report.profit >= 0 ? 'text-green-400' : 'text-red-400'}
                />
                <StatCard label="Discounts Given" value={`Rs ${report.discountTotal.toFixed(2)}`} />
                <StatCard label="Orders" value={String(report.orderCount)} />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="rounded bg-neutral-900 p-4">
                    <h2 className="mb-3 font-medium">Product Breakdown</h2>
                    {report.productBreakdown.length === 0 && <p className="text-sm text-neutral-500">No sales in this period.</p>}
                    <table className="w-full text-sm">
                        <thead className="text-left text-neutral-500">
                            <tr><th className="pb-1">Product</th><th>Qty</th><th>Revenue</th><th>Profit</th></tr>
                        </thead>
                        <tbody>
                            {report.productBreakdown.map((p) => (
                                <tr key={p.name} className="border-t border-neutral-800">
                                    <td className="py-1">{p.name}</td>
                                    <td>{p.qty}</td>
                                    <td>Rs {p.revenue.toFixed(2)}</td>
                                    <td className={p.profit >= 0 ? 'text-green-400' : 'text-red-400'}>Rs {p.profit.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="rounded bg-neutral-900 p-4">
                    <h2 className="mb-3 font-medium">Order History</h2>
                    {report.orders.length === 0 && <p className="text-sm text-neutral-500">No orders in this period.</p>}
                    <div className="max-h-96 overflow-y-auto">
                        {report.orders.map((o) => (
                            <Link
                                key={o.id}
                                href={`/receipt/${o.id}`}
                                target="_blank"
                                className="flex items-center justify-between border-t border-neutral-800 py-2 text-sm hover:bg-neutral-800 px-1"
                            >
                                <div>
                                    <p>{o.invoiceNo} · {o.customerName}</p>
                                    <p className="text-xs text-neutral-500">{new Date(o.createdAt).toLocaleString()} · {o.itemCount} items · {o.cashierName}</p>
                                </div>
                                <p className="font-medium">Rs {o.total.toFixed(2)}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
    return (
        <div className="rounded bg-neutral-900 p-4">
            <p className="text-sm text-neutral-400">{label}</p>
            <p className={`text-2xl font-semibold ${highlight ?? ''}`}>{value}</p>
        </div>
    );
}