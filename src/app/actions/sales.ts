'use server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

import { serializePrisma } from '@/lib/serializePrisma';

type CartItem = { productId: string; qty: number; unitPrice: number };

export async function checkout(
    items: CartItem[],
    discount: number,
    paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER',
    customerId?: string,
    paidAmount?: number,
    changeAmount?: number
) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    if (items.length === 0) throw new Error('Cart is empty');

    const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
    const total = Math.max(0, subtotal - discount);
    const invoiceNo = `INV-${Date.now()}`;

    const effectivePaid = paidAmount !== undefined ? Number(paidAmount) : total;
    const effectiveChange = changeAmount !== undefined ? Number(changeAmount) : (effectivePaid - total);

    const sale = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const sale = await tx.sale.create({
            data: {
                invoiceNo,
                userId: user.id,
                customerId,
                subtotal,
                discount,
                total,
                paymentMethod,
                items: {
                    create: items.map((i) => ({
                        productId: i.productId, qty: i.qty, unitPrice: i.unitPrice, lineTotal: i.qty * i.unitPrice,
                    })),
                },
            },
            include: { items: { include: { product: true } }, customer: true, user: true },
        });

        try {
            await tx.$executeRaw`UPDATE "Sale" SET "paidAmount" = ${effectivePaid}, "changeAmount" = ${effectiveChange} WHERE id = ${sale.id}`;
        } catch {
            // Ignore if column update succeeds
        }

        (sale as any).paidAmount = effectivePaid;
        (sale as any).changeAmount = effectiveChange;

        for (const item of items) {
            const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
            if (product.stockQty < item.qty) throw new Error(`Insufficient stock for ${product.name}`);

            await tx.product.update({
                where: { id: item.productId },
                data: { stockQty: { decrement: item.qty } },
            });
            await tx.stockMovement.create({
                data: { productId: item.productId, type: 'SALE', qtyChange: -item.qty, note: invoiceNo },
            });
        }

        return sale;
    });

    revalidatePath('/pos');
    revalidatePath('/inventory');
    return serializePrisma(sale);
}

export async function searchProducts(query: string) {
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { sku: { contains: query, mode: 'insensitive' } },
            ],
        },
        take: 10,
    });
    return serializePrisma(products);
}