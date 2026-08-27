'use server';
import { prisma } from '@/lib/prisma';
import { Product } from '@prisma/client';

import { serializePrisma } from '@/lib/serializePrisma';

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

function getRange(period: Period, refDate: Date = new Date()) {
    const start = new Date(refDate);
    const end = new Date(refDate);

    if (period === 'daily') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
        const day = start.getDay();
        const diffToMonday = (day + 6) % 7;
        start.setDate(start.getDate() - diffToMonday);
        start.setHours(0, 0, 0, 0);
        end.setTime(start.getTime());
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
    } else {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
    }
    return { start, end };
}

export async function getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todaySales, monthSales, lowStock, topProducts] = await Promise.all([
        prisma.sale.aggregate({ where: { createdAt: { gte: today } }, _sum: { total: true }, _count: true }),
        prisma.sale.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { total: true }, _count: true }),
        prisma.$queryRaw<Product[]>`SELECT * FROM "Product" WHERE "stockQty" <= "lowStockAt" LIMIT 10`,
        prisma.saleItem.groupBy({
            by: ['productId'],
            _sum: { qty: true, lineTotal: true },
            orderBy: { _sum: { qty: 'desc' } },
            take: 5,
            where: { sale: { createdAt: { gte: monthStart } } },
        }),
    ]);

    const productIds = topProducts.map((t) => t.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const topWithNames = topProducts.map((t) => ({
        product: products.find((p) => p.id === t.productId),
        qty: t._sum.qty ?? 0,
        revenue: Number(t._sum.lineTotal ?? 0),
    }));

    const monthSaleItems = await prisma.saleItem.findMany({
        where: { sale: { createdAt: { gte: monthStart } } },
        include: { product: true },
    });
    const profit = monthSaleItems.reduce(
        (sum, i) => sum + (Number(i.unitPrice) - Number(i.product.costPrice)) * i.qty,
        0
    );

    return serializePrisma({
        todayTotal: Number(todaySales._sum.total ?? 0),
        todayCount: todaySales._count,
        monthTotal: Number(monthSales._sum.total ?? 0),
        monthCount: monthSales._count,
        monthProfit: profit,
        lowStock,
        topProducts: topWithNames,
    });
}

export async function getPeriodReport(period: Period, refDateIso?: string) {
    const refDate = refDateIso ? new Date(refDateIso) : new Date();
    const { start, end } = getRange(period, refDate);

    const sales = await prisma.sale.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { items: { include: { product: true } }, customer: true, user: true },
        orderBy: { createdAt: 'desc' },
    });

    let revenue = 0;
    let cost = 0;
    let discountTotal = 0;
    const productMap = new Map<string, { name: string; qty: number; revenue: number; cost: number }>();

    for (const sale of sales) {
        revenue += Number(sale.total);
        discountTotal += Number(sale.discount);
        for (const item of sale.items) {
            const lineRevenue = Number(item.lineTotal);
            const lineCost = Number(item.product.costPrice) * item.qty;
            cost += lineCost;

            const existing = productMap.get(item.productId) ?? { name: item.product.name, qty: 0, revenue: 0, cost: 0 };
            existing.qty += item.qty;
            existing.revenue += lineRevenue;
            existing.cost += lineCost;
            productMap.set(item.productId, existing);
        }
    }

    const profit = revenue - cost;
    const productBreakdown = Array.from(productMap.values())
        .map((p) => ({ ...p, profit: p.revenue - p.cost }))
        .sort((a, b) => b.qty - a.qty);

    return serializePrisma({
        period,
        rangeStart: start.toISOString(),
        rangeEnd: end.toISOString(),
        orderCount: sales.length,
        revenue,
        cost,
        profit,
        discountTotal,
        productBreakdown,
        orders: sales.map((s) => ({
            id: s.id,
            invoiceNo: s.invoiceNo,
            customerName: s.customer?.name ?? 'Walk-in',
            cashierName: s.user.name,
            total: Number(s.total),
            discount: Number(s.discount),
            itemCount: s.items.length,
            createdAt: s.createdAt.toISOString(),
        })),
    });
}