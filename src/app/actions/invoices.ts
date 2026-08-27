'use server';
import { prisma } from '@/lib/prisma';

import { serializePrisma } from '@/lib/serializePrisma';

export async function getInvoices() {
    const invoices = await prisma.sale.findMany({
        include: { items: true, customer: true, user: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
    });
    return serializePrisma(invoices);
}