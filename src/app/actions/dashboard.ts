'use server';
import { prisma } from '@/lib/prisma';

export async function getDashboardFilterOptions() {
    const [categories, brands, products] = await Promise.all([
        prisma.category.findMany({ orderBy: { name: 'asc' } }),
        prisma.vehicleBrand.findMany({ orderBy: { name: 'asc' } }),
        prisma.product.findMany({
            select: { id: true, name: true, categoryId: true, vehicleType: true, vehicleBrandId: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    const vehicleTypes = Array.from(new Set(products.map((p) => p.vehicleType)));

    return { categories, brands, products, vehicleTypes };
}

export async function getDashboardReport(
    fromIso: string,
    toIso: string,
    filters?: { vehicleType?: string; vehicleBrandId?: string; categoryId?: string; productId?: string }
) {
    const from = new Date(fromIso);
    const to = new Date(toIso);

    const productWhere: any = {};
    if (filters?.vehicleType && filters.vehicleType !== 'ALL') productWhere.vehicleType = filters.vehicleType;
    if (filters?.vehicleBrandId && filters.vehicleBrandId !== 'ALL') productWhere.vehicleBrandId = filters.vehicleBrandId;
    if (filters?.categoryId && filters.categoryId !== 'ALL') productWhere.categoryId = filters.categoryId;
    if (filters?.productId && filters.productId !== 'ALL') productWhere.id = filters.productId;

    const hasProductFilter = Object.keys(productWhere).length > 0;

    const durationMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - durationMs - 1);
    const prevTo = new Date(from.getTime() - 1);

    const [sales, prevSales] = await Promise.all([
        prisma.sale.findMany({
            where: {
                createdAt: { gte: from, lte: to },
                ...(hasProductFilter ? { items: { some: { product: productWhere } } } : {}),
            },
            include: {
                items: { include: { product: { include: { category: true } } } },
            },
            orderBy: { createdAt: 'asc' },
        }),
        prisma.sale.findMany({
            where: {
                createdAt: { gte: prevFrom, lte: prevTo },
                ...(hasProductFilter ? { items: { some: { product: productWhere } } } : {}),
            },
            include: { items: { include: { product: true } } },
        }),
    ]);

    function matchesFilter(item: { productId: string; product: { vehicleType: string; vehicleBrandId: string | null; categoryId: string } }) {
        if (!hasProductFilter) return true;
        return (
            (!filters?.vehicleType || filters.vehicleType === 'ALL' || item.product.vehicleType === filters.vehicleType) &&
            (!filters?.vehicleBrandId || filters.vehicleBrandId === 'ALL' || item.product.vehicleBrandId === filters.vehicleBrandId) &&
            (!filters?.categoryId || filters.categoryId === 'ALL' || item.product.categoryId === filters.categoryId) &&
            (!filters?.productId || filters.productId === 'ALL' || item.productId === filters.productId)
        );
    }

    function sumFiltered(saleList: typeof prevSales) {
        let rev = 0;
        const orderIds = new Set<string>();
        for (const sale of saleList) {
            for (const item of sale.items) {
                if (matchesFilter(item as any)) {
                    rev += Number(item.lineTotal);
                    orderIds.add(sale.id);
                }
            }
        }
        return { revenue: rev, orderCount: orderIds.size };
    }

    const prevStats = sumFiltered(prevSales);

    let revenue = 0;
    let cost = 0;
    let discountTotal = 0;
    const categoryMap = new Map<string, { name: string; revenue: number; orders: Set<string> }>();
    const dayMap = new Map<string, { revenue: number; profit: number }>();
    const orderIds = new Set<string>();

    for (const sale of sales) {
        const dayKey = sale.createdAt.toISOString().slice(0, 10);
        const dayEntry = dayMap.get(dayKey) ?? { revenue: 0, profit: 0 };

        for (const item of sale.items) {
            if (!matchesFilter(item as any)) continue;

            const lineRevenue = Number(item.lineTotal);
            const lineCost = Number(item.product.costPrice) * item.qty;
            revenue += lineRevenue;
            cost += lineCost;
            dayEntry.revenue += lineRevenue;
            dayEntry.profit += lineRevenue - lineCost;
            orderIds.add(sale.id);

            const catName = item.product.category.name;
            const catEntry = categoryMap.get(catName) ?? { name: catName, revenue: 0, orders: new Set<string>() };
            catEntry.revenue += lineRevenue;
            catEntry.orders.add(sale.id);
            categoryMap.set(catName, catEntry);
        }
        dayMap.set(dayKey, dayEntry);
        if (!hasProductFilter) discountTotal += Number(sale.discount);
    }

    const profit = revenue - cost;
    const orderCount = orderIds.size;

    const revenueChangePct = prevStats.revenue > 0 ? ((revenue - prevStats.revenue) / prevStats.revenue) * 100 : revenue > 0 ? 100 : 0;
    const ordersChangePct = prevStats.orderCount > 0 ? ((orderCount - prevStats.orderCount) / prevStats.orderCount) * 100 : orderCount > 0 ? 100 : 0;

    const revenueByCategory = Array.from(categoryMap.values())
        .map((c) => ({ name: c.name, revenue: c.revenue, orders: c.orders.size }))
        .sort((a, b) => b.revenue - a.revenue);

    const trend = Array.from(dayMap.entries())
        .map(([date, v]) => ({ date, revenue: Number(v.revenue.toFixed(2)), profit: Number(v.profit.toFixed(2)) }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        from: from.toISOString(),
        to: to.toISOString(),
        revenue,
        orderCount,
        cost,
        profit,
        discountTotal,
        revenueChangePct,
        ordersChangePct,
        revenueByCategory,
        trend,
    };
}