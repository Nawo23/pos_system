'use server';
import { prisma } from '@/lib/prisma';

import { serializePrisma } from '@/lib/serializePrisma';

export async function getTransactions() {
    const transactions = await prisma.stockMovement.findMany({
        include: { product: true, supplier: true },
        orderBy: { createdAt: 'desc' },
        take: 300,
    });
    return serializePrisma(transactions);
}