import { prisma } from '@/lib/prisma';
import { Product } from '@prisma/client';
import Link from 'next/link';

export default async function AlertsPage() {
    const lowStockProducts = await prisma.$queryRaw<Product[]>`
        SELECT * FROM "Product" WHERE "stockQty" <= "lowStockAt" ORDER BY "stockQty" ASC
    `;

    return (
        <div className="p-6 text-white bg-neutral-950 min-h-screen">
            <h1 className="mb-6 text-xl font-semibold">Low Stock & Inventory Alerts</h1>
            {lowStockProducts.length === 0 ? (
                <div className="rounded bg-neutral-900 p-6 text-neutral-400">
                    All inventory levels are healthy! No alerts right now.
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded bg-red-950/30 border border-red-800 p-4 text-red-300 flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{lowStockProducts.length} Items Below Low Stock Threshold</p>
                            <p className="text-xs text-red-400">Restock these items to prevent stockouts.</p>
                        </div>
                        <Link href="/admin/grn" className="rounded bg-red-600 hover:bg-red-500 px-3 py-1.5 text-xs text-white">
                            Create GRN / Restock
                        </Link>
                    </div>

                    <div className="rounded bg-neutral-900 p-4">
                        <table className="w-full text-sm">
                            <thead className="text-left text-neutral-400 border-b border-neutral-800">
                                <tr>
                                    <th className="pb-2">SKU</th>
                                    <th>Product Name</th>
                                    <th>Current Stock</th>
                                    <th>Low Stock Threshold</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStockProducts.map((p) => (
                                    <tr key={p.id} className="border-t border-neutral-800">
                                        <td className="py-3">{p.sku}</td>
                                        <td className="font-medium">{p.name}</td>
                                        <td className="text-red-400 font-bold">{p.stockQty} {p.unit}</td>
                                        <td className="text-neutral-400">{p.lowStockAt} {p.unit}</td>
                                        <td>
                                            <span className="inline-block rounded bg-red-900/60 px-2 py-0.5 text-xs text-red-300">
                                                Low Stock
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
