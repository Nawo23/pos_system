'use client';
import { useState, useTransition } from 'react';
import { getDashboardReport } from '@/app/actions/dashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Printer, Download, Wallet, Receipt, TrendingUp, Landmark } from 'lucide-react';

type Report = Awaited<ReturnType<typeof getDashboardReport>>;

function toDateInputValue(iso: string) {
    return iso.slice(0, 10);
}
function toTimeInputValue(iso: string) {
    return new Date(iso).toTimeString().slice(0, 5);
}

export default function DashboardClient({ initialReport }: { initialReport: Report }) {
    const [report, setReport] = useState(initialReport);
    const [fromDate, setFromDate] = useState(toDateInputValue(initialReport.from));
    const [fromTime, setFromTime] = useState('00:00');
    const [toDate, setToDate] = useState(toDateInputValue(initialReport.to));
    const [toTime, setToTime] = useState('23:59');
    const [isPending, startTransition] = useTransition();

    function refresh() {
        const fromIso = new Date(`${fromDate}T${fromTime}:00`).toISOString();
        const toIso = new Date(`${toDate}T${toTime}:59`).toISOString();
        startTransition(async () => {
            const data = await getDashboardReport(fromIso, toIso);
            setReport(data);
        });
    }

    function handlePrintSummary() {
        window.print();
    }

    function handleExportCsv() {
        const rows = [
            ['Metric', 'Value'],
            ['From', new Date(report.from).toLocaleString()],
            ['To', new Date(report.to).toLocaleString()],
            ['Total Revenue', report.revenue.toFixed(2)],
            ['Total Orders', String(report.orderCount)],
            ['Total Cost', report.cost.toFixed(2)],
            ['Total Profit', report.profit.toFixed(2)],
            ['Discounts Given', report.discountTotal.toFixed(2)],
            [],
            ['Category', 'Revenue', 'Orders'],
            ...report.revenueByCategory.map((c) => [c.name, c.revenue.toFixed(2), String(c.orders)]),
        ];
        const csv = rows.map((r) => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-report-${toDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const catColors = ['#eab308', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#f97316'];

    return (
        <div className="p-6 text-white">
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard Analytics</h1>
                    <p className="text-sm text-neutral-500">Review performance metrics for your shop.</p>
                </div>
                <button onClick={handleExportCsv} className="flex items-center gap-2 rounded bg-yellow-600 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-500">
                    <Download size={16} /> Export Report
                </button>
            </div>

            {/* Day Summary panel */}
            <div className="mb-6 rounded-lg bg-neutral-900 p-5">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-neutral-800">
                        <Receipt size={18} />
                    </div>
                    <div>
                        <p className="font-semibold">Summary Report</p>
                        <p className="text-xs text-neutral-500">Custom range performance report.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="mb-1 block text-xs text-neutral-500">FROM</label>
                        <div className="flex gap-2">
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded bg-neutral-800 px-3 py-2 text-sm" />
                            <input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} className="rounded bg-neutral-800 px-3 py-2 text-sm" />
                        </div>
                    </div>
                    <span className="pb-2 text-neutral-600">→</span>
                    <div>
                        <label className="mb-1 block text-xs text-neutral-500">TO</label>
                        <div className="flex gap-2">
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded bg-neutral-800 px-3 py-2 text-sm" />
                            <input type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} className="rounded bg-neutral-800 px-3 py-2 text-sm" />
                        </div>
                    </div>
                    <button onClick={refresh} disabled={isPending} className="rounded bg-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-600 disabled:opacity-50">
                        {isPending ? 'Loading...' : 'Preview'}
                    </button>
                    <button onClick={handlePrintSummary} className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500">
                        <Printer size={16} /> Print Summary
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-4 gap-4">
                <StatCard
                    icon={<Wallet size={20} className="text-orange-400" />}
                    label="Total Sales Revenue"
                    value={`LKR ${report.revenue.toFixed(2)}`}
                    changePct={report.revenueChangePct}
                />
                <StatCard
                    icon={<Receipt size={20} className="text-purple-400" />}
                    label="Total Orders"
                    value={String(report.orderCount)}
                    changePct={report.ordersChangePct}
                />
                <StatCard
                    icon={<TrendingUp size={20} className="text-green-400" />}
                    label={report.profit >= 0 ? 'Total Profit' : 'Total Loss'}
                    value={`LKR ${Math.abs(report.profit).toFixed(2)}`}
                    valueClass={report.profit >= 0 ? 'text-green-400' : 'text-red-400'}
                />
                <div className="rounded-lg bg-neutral-800 p-5">
                    <div className="mb-8 flex justify-between">
                        <Landmark size={20} className="text-neutral-300" />
                    </div>
                    <p className="text-sm text-neutral-400">Grand Total Revenue</p>
                    <p className="text-2xl font-bold">LKR {report.revenue.toFixed(2)}</p>
                </div>
            </div>

            {/* Trend + category breakdown */}
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 rounded-lg bg-neutral-900 p-5">
                    <h2 className="mb-4 font-semibold">Revenue Trends</h2>
                    {report.trend.length === 0 ? (
                        <p className="text-sm text-neutral-500">No sales in this range.</p>
                    ) : (
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={report.trend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                                    <XAxis dataKey="date" stroke="#a3a3a3" fontSize={12} />
                                    <YAxis stroke="#a3a3a3" fontSize={12} />
                                    <Tooltip contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 6 }} labelStyle={{ color: '#fff' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#eab308" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="rounded-lg bg-neutral-900 p-5">
                    <h2 className="mb-4 font-semibold uppercase tracking-wide text-sm text-neutral-400">Revenue by Category</h2>
                    <div className="space-y-4">
                        {report.revenueByCategory.length === 0 && <p className="text-sm text-neutral-500">No sales in this range.</p>}
                        {report.revenueByCategory.map((c, i) => (
                            <div key={c.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: catColors[i % catColors.length] }} />
                                    <span className="text-sm">{c.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">LKR {c.revenue.toFixed(2)}</p>
                                    <p className="text-xs text-neutral-500">{c.orders} orders</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, changePct, valueClass }: { icon: React.ReactNode; label: string; value: string; changePct?: number; valueClass?: string }) {
    return (
        <div className="rounded-lg bg-neutral-900 p-5">
            <div className="mb-8 flex items-center justify-between">
                {icon}
                {changePct !== undefined && (
                    <span className={`text-xs font-medium ${changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {changePct >= 0 ? '↗' : '↘'} {Math.abs(changePct).toFixed(1)}%
                    </span>
                )}
            </div>
            <p className="text-sm text-neutral-400">{label}</p>
            <p className={`text-2xl font-bold ${valueClass ?? ''}`}>{value}</p>
        </div>
    );
}