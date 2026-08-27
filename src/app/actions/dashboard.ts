'use server';
import { prisma } from '@/lib/prisma';

import { serializePrisma } from '@/lib/serializePrisma';

export async function getDashboardReport(fromIso: string, toIso: string) {
    const from = new Date(fromIso);
    const to = new Date(toIso);

    const sales = await prisma.sale.findMany({
        where: { createdAt: { gte: from, lte: to } },
        include: { items: { include: { product: { include: { category: true } } } } },
        orderBy: { createdAt: 'asc' },
    });

    // previous period of equal length, for % change
    const durationMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - durationMs - 1);
    const prevTo = new Date(from.getTime() - 1);
    const prevAgg = await prisma.sale.aggregate({
        where: { createdAt: { gte: prevFrom, lte: prevTo } },
        _sum: { total: true },
        _count: true,
    });

    let revenue = 0;
    let cost = 0;
    let discountTotal = 0;
    const categoryMap = new Map<string, { name: string; revenue: number; orders: Set<string> }>();
    const dayMap = new Map<string, { revenue: number; profit: number }>();

    for (const sale of sales) {
        revenue += Number(sale.total);
        discountTotal += Number(sale.discount);

        const dayKey = sale.createdAt.toISOString().slice(0, 10);
        const dayEntry = dayMap.get(dayKey) ?? { revenue: 0, profit: 0 };
        dayEntry.revenue += Number(sale.total);

        for (const item of sale.items) {
            const lineRevenue = Number(item.lineTotal);
            const lineCost = Number(item.product.costPrice) * item.qty;
            cost += lineCost;
            dayEntry.profit += lineRevenue - lineCost;

            const catName = item.product.category.name;
            const catEntry = categoryMap.get(catName) ?? { name: catName, revenue: 0, orders: new Set<string>() };
            catEntry.revenue += lineRevenue;
            catEntry.orders.add(sale.id);
            categoryMap.set(catName, catEntry);
        }
        dayMap.set(dayKey, dayEntry);
    }

    const profit = revenue - cost;
    const prevRevenue = Number(prevAgg._sum.total ?? 0);
    const prevOrders = prevAgg._count;

    const revenueChangePct = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : revenue > 0 ? 100 : 0;
    const ordersChangePct = prevOrders > 0 ? ((sales.length - prevOrders) / prevOrders) * 100 : sales.length > 0 ? 100 : 0;

    const revenueByCategory = Array.from(categoryMap.values())
        .map((c) => ({ name: c.name, revenue: c.revenue, orders: c.orders.size }))
        .sort((a, b) => b.revenue - a.revenue);

    const trend = Array.from(dayMap.entries())
        .map(([date, v]) => ({ date, revenue: Number(v.revenue.toFixed(2)), profit: Number(v.profit.toFixed(2)) }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return serializePrisma({
        from: from.toISOString(),
        to: to.toISOString(),
        revenue,
        orderCount: sales.length,
        cost,
        profit,
        discountTotal,
        revenueChangePct,
        ordersChangePct,
        revenueByCategory,
        trend,
    });
}